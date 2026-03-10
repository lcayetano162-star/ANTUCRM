"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("../gemini/gemini.service");
const client_1 = require("@prisma/client");
const briefingCache = new Map();
let AIService = class AIService {
    constructor(prisma, gemini) {
        this.prisma = prisma;
        this.gemini = gemini;
    }
    async getDailyBriefing(tenantId, _userId) {
        const cached = briefingCache.get(tenantId);
        if (cached && Date.now() - cached.ts < 30 * 60 * 1000)
            return cached.data;
        const [openOpps, todayTasks, criticalTickets] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: { tenantId, stage: { not: client_1.OpportunityStage.CLOSED } },
                orderBy: { value: 'desc' },
                take: 10,
                select: { name: true, stage: true, value: true, expectedCloseDate: true },
            }),
            this.prisma.task.findMany({
                where: {
                    tenantId,
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                    dueDate: { lte: new Date(Date.now() + 86400000) },
                },
                select: { title: true, priority: true, dueDate: true },
                take: 10,
            }),
            this.prisma.serviceTicket.findMany({
                where: { tenantId, priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } },
                select: { ticketNumber: true, title: true, slaDeadline: true },
                take: 5,
            }),
        ]);
        const prompt = `Eres el asistente ejecutivo de ANTÜ CRM. Genera un briefing ejecutivo diario conciso en español.
Datos:
- Oportunidades abiertas: ${JSON.stringify(openOpps)}
- Tareas urgentes: ${JSON.stringify(todayTasks)}
- Tickets críticos: ${JSON.stringify(criticalTickets)}
Responde SOLO con JSON válido:
{"greeting":"mensaje motivacional","keyAlerts":[],"topOpportunities":[],"todayFocus":[],"riskItems":[]}`;
        let result;
        if (this.gemini.isAvailable()) {
            result = await this.gemini.generateStructured(prompt, {}, { tenantId });
        }
        else {
            result = {
                greeting: 'Buenos días. Aquí tienes el resumen del día.',
                keyAlerts: criticalTickets.map(t => `Ticket crítico: ${t.ticketNumber}`),
                topOpportunities: openOpps.slice(0, 3).map(o => `${o.name} - ${o.stage} - $${o.value}`),
                todayFocus: todayTasks.slice(0, 3).map(t => t.title),
                riskItems: [],
            };
        }
        briefingCache.set(tenantId, { data: result, ts: Date.now() });
        return result;
    }
    async analyzeContact(contactId, tenantId, _userId) {
        const contact = await this.prisma.contact.findFirst({
            where: { id: contactId, tenantId },
            include: {
                activities: { orderBy: { createdAt: 'desc' }, take: 10 },
                opportunities: { orderBy: { createdAt: 'desc' }, take: 5 },
                company: true,
            },
        });
        if (!contact)
            return { error: 'Contacto no encontrado' };
        const prompt = `Analiza este contacto CRM y da recomendaciones en español.
Contacto: ${contact.firstName} ${contact.lastName}, ${contact.jobTitle || 'N/A'}
Empresa: ${contact.company?.name || 'Sin empresa'}
Actividades: ${contact.activities.length}
Oportunidades: ${contact.opportunities.map(o => `${o.name} (${o.stage})`).join(', ')}
Responde SOLO con JSON:
{"score":50,"label":"Tibio","summary":"","nextActions":[],"risks":[],"opportunities":[]}`;
        if (this.gemini.isAvailable()) {
            return this.gemini.generateStructured(prompt, {}, { tenantId });
        }
        return {
            score: 50,
            label: 'Tibio',
            summary: `${contact.firstName} ${contact.lastName} tiene ${contact.activities.length} actividades registradas.`,
            nextActions: ['Programar seguimiento', 'Actualizar información de contacto'],
            risks: [],
            opportunities: contact.opportunities.map(o => o.name),
        };
    }
    async scoreDeal(opportunityId, tenantId) {
        const opp = await this.prisma.opportunity.findFirst({
            where: { id: opportunityId, tenantId },
            include: {
                activities: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
        if (!opp)
            return { error: 'Oportunidad no encontrada' };
        let score = 0;
        const factors = [];
        const stageScores = {
            LEAD: 5, QUALIFICATION: 10, PROPOSAL: 20, NEGOTIATION: 28, CLOSED: 15,
        };
        score += stageScores[opp.stage] || 10;
        factors.push(`Etapa: ${opp.stage}`);
        if (opp.probability) {
            score += Math.round(opp.probability * 0.25);
            factors.push(`Probabilidad: ${opp.probability}%`);
        }
        if (opp.activities.length > 0) {
            const daysSince = (Date.now() - opp.activities[0].createdAt.getTime()) / 86400000;
            if (daysSince < 3) {
                score += 20;
                factors.push('Actividad reciente (<3 días)');
            }
            else if (daysSince < 7) {
                score += 15;
                factors.push('Actividad reciente (<7 días)');
            }
            else if (daysSince < 14) {
                score += 10;
                factors.push('Actividad reciente (<14 días)');
            }
            else {
                factors.push(`Sin actividad hace ${Math.round(daysSince)} días`);
            }
        }
        if (opp.expectedCloseDate) {
            const daysToClose = (opp.expectedCloseDate.getTime() - Date.now()) / 86400000;
            if (daysToClose > 0 && daysToClose <= 30) {
                score += 15;
                factors.push('Cierre próximo (<30 días)');
            }
            else if (daysToClose > 30 && daysToClose <= 90) {
                score += 10;
                factors.push('Cierre en 30-90 días');
            }
            else if (daysToClose < 0) {
                factors.push('Fecha de cierre vencida');
            }
        }
        if (opp.value && opp.value > 10000) {
            score += 10;
            factors.push('Alto valor');
        }
        score = Math.min(100, Math.max(0, score));
        const label = score >= 70 ? 'Caliente' : score >= 45 ? 'Tibio' : score >= 20 ? 'Frío' : 'Perdido';
        return { score, label, factors, opportunityId };
    }
    async getForecast(tenantId) {
        const opps = await this.prisma.opportunity.findMany({
            where: { tenantId, stage: { not: client_1.OpportunityStage.CLOSED } },
            select: { value: true, probability: true, stage: true, expectedCloseDate: true },
        });
        const totalPipeline = opps.reduce((sum, o) => sum + (o.value || 0), 0);
        const weighted = opps.reduce((sum, o) => sum + (o.value || 0) * ((o.probability || 50) / 100), 0);
        return {
            totalPipeline,
            weightedForecast: Math.round(weighted),
            pessimistic: Math.round(weighted * 0.6),
            realistic: Math.round(weighted),
            optimistic: Math.round(weighted * 1.4),
            dealCount: opps.length,
        };
    }
};
exports.AIService = AIService;
exports.AIService = AIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], AIService);
//# sourceMappingURL=ai.service.js.map