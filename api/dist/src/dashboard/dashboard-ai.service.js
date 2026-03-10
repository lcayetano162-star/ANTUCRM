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
var DashboardAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardAIService = void 0;
const common_1 = require("@nestjs/common");
const gemini_service_1 = require("../gemini/gemini.service");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_types_1 = require("../auth/types/auth.types");
let DashboardAIService = DashboardAIService_1 = class DashboardAIService {
    constructor(gemini, prisma) {
        this.gemini = gemini;
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardAIService_1.name);
    }
    async generateInsights(tenantId, userId, userRole) {
        try {
            if (!this.gemini.isAvailable()) {
                return this.getDefaultInsights();
            }
            const whereClause = this.getRoleBasedWhereClause(userId, userRole);
            const [recentOpportunities, recentActivities, contactsWithoutActivity,] = await Promise.all([
                this.prisma.opportunity.findMany({
                    where: { tenantId, ...whereClause },
                    orderBy: { updatedAt: 'desc' },
                    take: 20,
                    include: {
                        contact: { select: { firstName: true, lastName: true } },
                    },
                }),
                this.prisma.activity.findMany({
                    where: { tenantId, ...whereClause },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                }),
                this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        ...whereClause,
                        activities: { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                    },
                    take: 10,
                }),
            ]);
            const prompt = `Analiza estos datos de CRM y genera 3-5 insights accionables:

Oportunidades recientes: ${JSON.stringify(recentOpportunities)}
Actividades recientes: ${JSON.stringify(recentActivities)}
Contactos sin actividad (30 días): ${contactsWithoutActivity.length}

Genera insights en formato JSON con esta estructura:
[{
  "type": "CRITICAL_ALERT" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "title": "string",
  "description": "string",
  "action": { "label": "string", "route": "string" }
}]`;
            const insights = await this.gemini.generateStructured(prompt, {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
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
            this.logger.error('Error generando insights', error);
            return this.getDefaultInsights();
        }
    }
    getDefaultInsights() {
        return [
            {
                type: 'ENGAGEMENT',
                priority: 'MEDIUM',
                title: 'Bienvenido a ANTU CRM',
                description: 'Los insights de IA aparecerán aquí cuando haya más datos.',
                action: { label: 'Ver tutorial', route: '/help' },
            },
        ];
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
exports.DashboardAIService = DashboardAIService;
exports.DashboardAIService = DashboardAIService = DashboardAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        prisma_service_1.PrismaService])
], DashboardAIService);
//# sourceMappingURL=dashboard-ai.service.js.map