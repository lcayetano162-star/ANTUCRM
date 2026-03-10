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
exports.OpportunitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OpportunitiesService = class OpportunitiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, query) {
        const { stage, status, assignedToId, contactId, search, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (stage)
            where.stage = stage;
        if (status)
            where.status = status;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (contactId)
            where.contactId = contactId;
        if (search)
            where.name = { contains: search };
        const [data, total] = await Promise.all([
            this.prisma.opportunity.findMany({
                where,
                skip,
                take: limit,
                include: {
                    contact: { select: { id: true, firstName: true, lastName: true, email: true, company: { select: { id: true, name: true } } } },
                    assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    activities: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.opportunity.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getPipeline(tenantId) {
        const stages = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'];
        const pipeline = await Promise.all(stages.map(async (stage) => {
            const opps = await this.prisma.opportunity.findMany({
                where: { tenantId, stage: stage, status: 'OPEN' },
                include: {
                    contact: { select: { id: true, firstName: true, lastName: true, company: { select: { name: true } } } },
                    assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
            return {
                stage,
                opportunities: opps,
                count: opps.length,
                totalValue: opps.reduce((sum, o) => sum + (o.value || 0), 0),
            };
        }));
        return pipeline;
    }
    async findOne(id, tenantId) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: { id, tenantId },
            include: {
                contact: { include: { company: true, tags: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
                activities: {
                    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!opportunity)
            throw new common_1.NotFoundException('Oportunidad no encontrada');
        return opportunity;
    }
    async create(tenantId, userId, dto) {
        const contact = await this.prisma.contact.findFirst({ where: { id: dto.contactId, tenantId } });
        if (!contact)
            throw new common_1.NotFoundException('Contacto no encontrado');
        return this.prisma.opportunity.create({
            data: {
                name: dto.name,
                description: dto.description,
                stage: dto.stage,
                value: dto.value,
                probability: dto.probability,
                expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
                contactId: dto.contactId,
                assignedToId: dto.assignedToId,
                tenantId,
            },
            include: {
                contact: { select: { id: true, firstName: true, lastName: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async update(id, tenantId, dto) {
        await this.findOne(id, tenantId);
        return this.prisma.opportunity.update({
            where: { id },
            data: {
                ...dto,
                expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
                actualCloseDate: dto.actualCloseDate ? new Date(dto.actualCloseDate) : undefined,
            },
            include: {
                contact: { select: { id: true, firstName: true, lastName: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async moveStage(id, tenantId, stage) {
        await this.findOne(id, tenantId);
        return this.prisma.opportunity.update({
            where: { id },
            data: { stage: stage },
        });
    }
    async close(id, tenantId, status) {
        await this.findOne(id, tenantId);
        return this.prisma.opportunity.update({
            where: { id },
            data: { status, stage: 'CLOSED', actualCloseDate: new Date() },
        });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.opportunity.delete({ where: { id } });
    }
    async getStats(tenantId) {
        const [total, won, lost, pipeline] = await Promise.all([
            this.prisma.opportunity.count({ where: { tenantId } }),
            this.prisma.opportunity.count({ where: { tenantId, status: 'WON' } }),
            this.prisma.opportunity.count({ where: { tenantId, status: 'LOST' } }),
            this.prisma.opportunity.aggregate({
                where: { tenantId, status: 'OPEN' },
                _sum: { value: true },
                _avg: { probability: true },
            }),
        ]);
        const winRate = total > 0 ? Math.round((won / (won + lost || 1)) * 100) : 0;
        return {
            total,
            won,
            lost,
            open: total - won - lost,
            winRate,
            pipelineValue: pipeline._sum.value || 0,
            avgProbability: Math.round(pipeline._avg.probability || 0),
        };
    }
};
exports.OpportunitiesService = OpportunitiesService;
exports.OpportunitiesService = OpportunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpportunitiesService);
//# sourceMappingURL=opportunities.service.js.map