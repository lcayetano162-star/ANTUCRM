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
var ContactsAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsAIService = void 0;
const common_1 = require("@nestjs/common");
const gemini_service_1 = require("../../gemini/gemini.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_types_1 = require("../../auth/types/auth.types");
let ContactsAIService = ContactsAIService_1 = class ContactsAIService {
    constructor(gemini, prisma) {
        this.gemini = gemini;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ContactsAIService_1.name);
    }
    async generateDashboardInsights(tenantId, userId, userRole, focus) {
        try {
            if (!this.gemini.isAvailable()) {
                return this.getDefaultInsights();
            }
            const whereClause = this.getRoleBasedWhereClause(userId, userRole);
            const [contactsWithoutActivity, contactsWithPendingTasks, highValueOpportunities, recentContacts,] = await Promise.all([
                this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        ...whereClause,
                        activities: { none: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
                        status: { in: ['ACTIVE', 'CUSTOMER'] },
                    },
                    take: 5,
                    include: {
                        company: { select: { name: true } },
                        opportunities: { where: { status: { not: 'CLOSED' } } },
                    },
                }),
                this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        ...whereClause,
                        tasks: { some: { status: { in: ['PENDING', 'IN_PROGRESS'] } } },
                    },
                    take: 5,
                    include: {
                        tasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } },
                    },
                }),
                this.prisma.opportunity.findMany({
                    where: {
                        tenantId,
                        ...whereClause,
                        status: { notIn: ['WON', 'LOST', 'CLOSED'] },
                        value: { gte: 10000 },
                    },
                    take: 5,
                    include: { contact: { select: { firstName: true, lastName: true } } },
                }),
                this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        ...whereClause,
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                    take: 5,
                }),
            ]);
            const prompt = `Genera insights accionables para el dashboard de clientes basado en estos datos:

Contactos sin actividad (14 días): ${contactsWithoutActivity.length}
Detalle: ${JSON.stringify(contactsWithoutActivity.map(c => ({ name: `${c.firstName} ${c.lastName}`, company: c.company?.name })))}

Contactos con tareas pendientes: ${contactsWithPendingTasks.length}

Oportunidades de alto valor: ${highValueOpportunities.length}
Detalle: ${JSON.stringify(highValueOpportunities.map(o => ({ name: o.name, value: o.value, contact: `${o.contact?.firstName} ${o.contact?.lastName}` })))}

Contactos nuevos (7 días): ${recentContacts.length}

${focus ? `Enfoque solicitado: ${focus}` : ''}

Genera 3-5 insights en formato JSON con esta estructura:
[{
  "id": "uuid",
  "type": "CRITICAL_ALERT" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "title": "string (máx 50 chars)",
  "description": "string (máx 150 chars)",
  "action": { "label": "string", "route": "string" }
}]

Los insights deben ser específicos, accionables y relevantes para vendedores.`;
            const insights = await this.gemini.generateStructured(prompt, {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: 'string',
                        type: 'string',
                        priority: 'string',
                        title: 'string',
                        description: 'string',
                        action: 'object',
                    },
                },
            });
            return insights;
        }
        catch (error) {
            this.logger.error('Error generando insights del dashboard', error);
            return this.getDefaultInsights();
        }
    }
    async generateContactInsights(tenantId, contactId) {
        try {
            if (!this.gemini.isAvailable()) {
                return [];
            }
            const contact = await this.prisma.contact.findFirst({
                where: { id: contactId, tenantId },
                include: {
                    activities: { orderBy: { createdAt: 'desc' }, take: 10 },
                    opportunities: true,
                    tasks: true,
                    company: true,
                },
            });
            if (!contact) {
                return [];
            }
            const prompt = `Analiza este contacto de CRM y genera insights:

Nombre: ${contact.firstName} ${contact.lastName}
Empresa: ${contact.company?.name || 'N/A'}
Estado: ${contact.status}
Actividades recientes: ${contact.activities.length}
Oportunidades: ${contact.opportunities.length}
Tareas: ${contact.tasks.length}

Historial de actividades: ${JSON.stringify(contact.activities.map(a => ({ type: a.type, date: a.createdAt, description: a.description })))}

Genera 2-3 insights específicos para este contacto en formato JSON:
[{
  "id": "uuid",
  "type": "CRITICAL_ALERT" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "title": "string",
  "description": "string",
  "action": { "label": "string" }
}]`;
            return await this.gemini.generateStructured(prompt, {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: 'string',
                        type: 'string',
                        priority: 'string',
                        title: 'string',
                        description: 'string',
                        action: 'object',
                    },
                },
            });
        }
        catch (error) {
            this.logger.error('Error generando insights del contacto', error);
            return [];
        }
    }
    async scoreContact(tenantId, contactId) {
        try {
            if (!this.gemini.isAvailable()) {
                return this.getDefaultScoring();
            }
            const contact = await this.prisma.contact.findFirst({
                where: { id: contactId, tenantId },
                include: {
                    activities: true,
                    opportunities: true,
                    tasks: true,
                    company: true,
                },
            });
            if (!contact) {
                throw new Error('Contacto no encontrado');
            }
            const prompt = `Evalúa el potencial de este contacto de CRM y asigna un score:

Nombre: ${contact.firstName} ${contact.lastName}
Empresa: ${contact.company?.name || 'N/A'}
Industria: ${contact.company?.industry || 'N/A'}
Estado: ${contact.status}
Es contacto principal: ${contact.isMainContact}
Total actividades: ${contact.activities.length}
Total oportunidades: ${contact.opportunities.length}
Valor total oportunidades: ${contact.opportunities.reduce((sum, o) => sum + (Number(o.value) || 0), 0)}
Tareas completadas: ${contact.tasks.filter(t => t.status === 'COMPLETED').length}
Tareas pendientes: ${contact.tasks.filter(t => t.status !== 'COMPLETED').length}

Genera un scoring en formato JSON:
{
  "score": number (0-100),
  "factors": [
    { "name": "string", "weight": number, "contribution": number }
  ],
  "explanation": "string (explicación breve del score)"
}`;
            return await this.gemini.generateStructured(prompt, {
                score: 'number',
                factors: 'array',
                explanation: 'string',
            });
        }
        catch (error) {
            this.logger.error('Error calculando score del contacto', error);
            return this.getDefaultScoring();
        }
    }
    async getNextBestAction(tenantId, contactId) {
        try {
            if (!this.gemini.isAvailable()) {
                return this.getDefaultNextAction();
            }
            const contact = await this.prisma.contact.findFirst({
                where: { id: contactId, tenantId },
                include: {
                    activities: { orderBy: { createdAt: 'desc' }, take: 5 },
                    opportunities: { where: { status: { not: 'CLOSED' } } },
                    tasks: { where: { status: { not: 'COMPLETED' } } },
                },
            });
            if (!contact) {
                throw new Error('Contacto no encontrado');
            }
            const lastActivity = contact.activities[0];
            const daysSinceLastActivity = lastActivity
                ? Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : 999;
            const prompt = `Recomienda la siguiente mejor acción para este contacto:

Nombre: ${contact.firstName} ${contact.lastName}
Email: ${contact.email || 'N/A'}
Teléfono: ${contact.phone || 'N/A'}
WhatsApp: ${contact.hasWhatsApp ? 'Sí' : 'No'}
Días desde última actividad: ${daysSinceLastActivity}
Última actividad: ${lastActivity?.type || 'Ninguna'}
Oportunidades abiertas: ${contact.opportunities.length}
Tareas pendientes: ${contact.tasks.length}

Genera una recomendación en formato JSON:
{
  "action": "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "WAIT",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reason": "string (breve explicación)",
  "suggestedTime": "string (ej: 'Mañana a las 10:00 AM')",
  "suggestedMessage": "string (mensaje sugerido)"
}`;
            return await this.gemini.generateStructured(prompt, {
                action: 'string',
                priority: 'string',
                reason: 'string',
                suggestedTime: 'string',
                suggestedMessage: 'string',
            });
        }
        catch (error) {
            this.logger.error('Error obteniendo next best action', error);
            return this.getDefaultNextAction();
        }
    }
    async getContactHealthScore(tenantId, contactId) {
        try {
            const contact = await this.prisma.contact.findFirst({
                where: { id: contactId, tenantId },
                include: {
                    activities: { orderBy: { createdAt: 'desc' }, take: 30 },
                    opportunities: true,
                },
            });
            if (!contact) {
                throw new Error('Contacto no encontrado');
            }
            const activities = contact.activities;
            const now = Date.now();
            const lastActivity = activities[0];
            const daysSinceLastActivity = lastActivity
                ? Math.floor((now - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : 999;
            const activitiesLast30Days = activities.filter(a => (now - a.createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 30).length;
            const activityFrequency = Math.min(activitiesLast30Days / 4, 5) * 20;
            const activityTypes = new Set(activities.map(a => a.type)).size;
            const engagement = Math.min(activityTypes / 5, 1) * 100;
            const responseTime = Math.max(0, 100 - daysSinceLastActivity * 5);
            const lastActivityScore = Math.max(0, 100 - daysSinceLastActivity * 3);
            const overall = Math.round((engagement * 0.3) +
                (responseTime * 0.2) +
                (activityFrequency * 0.3) +
                (lastActivityScore * 0.2));
            const activitiesPrevious30Days = activities.filter(a => {
                const daysAgo = (now - a.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo > 30 && daysAgo <= 60;
            }).length;
            let trend = 'STABLE';
            if (activitiesLast30Days > activitiesPrevious30Days * 1.2) {
                trend = 'IMPROVING';
            }
            else if (activitiesLast30Days < activitiesPrevious30Days * 0.8) {
                trend = 'DECLINING';
            }
            return {
                overall,
                engagement: Math.round(engagement),
                responseTime: Math.round(responseTime),
                activityFrequency: Math.round(activityFrequency),
                lastActivity: Math.round(lastActivityScore),
                trend,
            };
        }
        catch (error) {
            this.logger.error('Error calculando health score', error);
            return {
                overall: 50,
                engagement: 50,
                responseTime: 50,
                activityFrequency: 50,
                lastActivity: 50,
                trend: 'STABLE',
            };
        }
    }
    getDefaultInsights() {
        return [
            {
                id: 'default-1',
                type: 'ENGAGEMENT',
                priority: 'MEDIUM',
                title: 'Bienvenido a ANTU CRM',
                description: 'Los insights de IA aparecerán aquí cuando haya más datos de contactos.',
                action: { label: 'Ver tutorial', route: '/help' },
            },
        ];
    }
    getDefaultScoring() {
        return {
            score: 50,
            factors: [
                { name: 'Actividad reciente', weight: 0.3, contribution: 15 },
                { name: 'Oportunidades', weight: 0.4, contribution: 20 },
                { name: 'Engagement', weight: 0.3, contribution: 15 },
            ],
            explanation: 'Score inicial. Se actualizará con más datos.',
        };
    }
    getDefaultNextAction() {
        return {
            action: 'EMAIL',
            priority: 'MEDIUM',
            reason: 'Iniciar comunicación con el contacto',
            suggestedTime: 'En los próximos 2 días',
            suggestedMessage: 'Hola, me gustaría conocer más sobre tus necesidades.',
        };
    }
    getRoleBasedWhereClause(userId, userRole) {
        switch (userRole) {
            case auth_types_1.UserRole.USER:
                return { assignedToId: userId };
            case auth_types_1.UserRole.MANAGER:
                return {
                    OR: [
                        { assignedToId: userId },
                        { assignedTo: { managerId: userId } },
                    ],
                };
            case auth_types_1.UserRole.ADMIN:
            default:
                return {};
        }
    }
};
exports.ContactsAIService = ContactsAIService;
exports.ContactsAIService = ContactsAIService = ContactsAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        prisma_service_1.PrismaService])
], ContactsAIService);
//# sourceMappingURL=contacts-ai.service.js.map