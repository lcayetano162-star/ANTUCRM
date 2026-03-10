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
exports.MarketingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MarketingService = class MarketingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findCampaigns(tenantId, status) {
        const where = { tenantId };
        if (status)
            where.status = status;
        return this.prisma.campaign.findMany({
            where,
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { recipients: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneCampaign(id, tenantId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id, tenantId },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                recipients: {
                    include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
                    take: 100,
                },
            },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaña no encontrada');
        return campaign;
    }
    async createCampaign(tenantId, userId, dto) {
        return this.prisma.campaign.create({
            data: {
                name: dto.name,
                subject: dto.subject,
                body: dto.body,
                channel: dto.channel || 'EMAIL',
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
                tenantId,
                createdById: userId,
            },
        });
    }
    async updateCampaign(id, tenantId, dto) {
        await this.findOneCampaign(id, tenantId);
        return this.prisma.campaign.update({
            where: { id },
            data: {
                name: dto.name,
                subject: dto.subject,
                body: dto.body,
                status: dto.status,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            },
        });
    }
    async addRecipients(campaignId, tenantId, contactIds) {
        await this.findOneCampaign(campaignId, tenantId);
        const data = contactIds.map((contactId) => ({ campaignId, contactId }));
        await this.prisma.campaignRecipient.createMany({ data });
        return { added: contactIds.length };
    }
    async getStats(tenantId) {
        const [total, active, completed] = await Promise.all([
            this.prisma.campaign.count({ where: { tenantId } }),
            this.prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.campaign.count({ where: { tenantId, status: 'COMPLETED' } }),
        ]);
        const sentAgg = await this.prisma.campaign.aggregate({
            where: { tenantId },
            _sum: { sentCount: true, openCount: true, clickCount: true },
        });
        return {
            total,
            active,
            completed,
            totalSent: sentAgg._sum.sentCount || 0,
            totalOpened: sentAgg._sum.openCount || 0,
            totalClicked: sentAgg._sum.clickCount || 0,
        };
    }
};
exports.MarketingService = MarketingService;
exports.MarketingService = MarketingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketingService);
//# sourceMappingURL=marketing.service.js.map