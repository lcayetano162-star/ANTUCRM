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
exports.GovService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const GOV_TEMPLATES = {
    LICITACION_PUBLICA: [
        { item: 'Registro Mercantil vigente', category: 'Legal', isMandatory: true },
        { item: 'RNC al día (DGII)', category: 'Fiscal', isMandatory: true },
        { item: 'Certificación de la TSS', category: 'Laboral', isMandatory: true },
        { item: 'Propuesta técnica', category: 'Técnico', isMandatory: true },
        { item: 'Propuesta económica sellada', category: 'Económico', isMandatory: true },
        { item: 'Garantía de seriedad de oferta', category: 'Garantía', isMandatory: true },
        { item: 'Balance general auditado', category: 'Financiero', isMandatory: true },
        { item: 'Declaración jurada de no inhabilitación', category: 'Legal', isMandatory: true },
    ],
    COMPRA_MENOR: [
        { item: 'RNC al día (DGII)', category: 'Fiscal', isMandatory: true },
        { item: 'Cotización formal', category: 'Económico', isMandatory: true },
        { item: 'Certificación de la TSS', category: 'Laboral', isMandatory: false },
    ],
    default: [
        { item: 'RNC al día (DGII)', category: 'Fiscal', isMandatory: true },
        { item: 'Registro Mercantil vigente', category: 'Legal', isMandatory: true },
        { item: 'Propuesta técnica', category: 'Técnico', isMandatory: true },
        { item: 'Propuesta económica', category: 'Económico', isMandatory: true },
    ],
};
let GovService = class GovService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.govOpportunity.findMany({
            where: { tenantId },
            include: {
                opportunity: { select: { id: true, name: true, stage: true, value: true } },
                checklist: true,
            },
            orderBy: { submissionDeadline: 'asc' },
        });
    }
    async findOne(id, tenantId) {
        const gov = await this.prisma.govOpportunity.findFirst({
            where: { id, tenantId },
            include: {
                opportunity: { include: { contact: true } },
                checklist: { orderBy: [{ isMandatory: 'desc' }, { category: 'asc' }] },
            },
        });
        if (!gov)
            throw new common_1.NotFoundException('Licitación no encontrada');
        return gov;
    }
    async create(tenantId, dto) {
        const govOpp = await this.prisma.govOpportunity.create({
            data: {
                opportunityId: dto.opportunityId,
                govType: dto.govType,
                processId: dto.processId,
                submissionDeadline: dto.submissionDeadline ? new Date(dto.submissionDeadline) : undefined,
                estimatedBudget: dto.estimatedBudget,
                institution: dto.institution,
                portalUrl: dto.portalUrl,
                notes: dto.notes,
                tenantId,
            },
        });
        const templates = GOV_TEMPLATES[dto.govType] || GOV_TEMPLATES.default;
        await this.prisma.govChecklist.createMany({
            data: templates.map(t => ({ ...t, govOpportunityId: govOpp.id })),
        });
        return this.findOne(govOpp.id, tenantId);
    }
    async updateChecklistItem(govId, itemId, tenantId, dto) {
        await this.findOne(govId, tenantId);
        return this.prisma.govChecklist.update({
            where: { id: itemId },
            data: {
                status: dto.status,
                fileUrl: dto.fileUrl,
                notes: dto.notes,
                verifiedAt: dto.status === 'VERIFIED' ? new Date() : undefined,
            },
        });
    }
    async getStats(tenantId) {
        const now = new Date();
        const soon = new Date(now.getTime() + 48 * 3600000);
        const [total, expiringSoon, pending] = await Promise.all([
            this.prisma.govOpportunity.count({ where: { tenantId } }),
            this.prisma.govOpportunity.count({ where: { tenantId, submissionDeadline: { gte: now, lte: soon } } }),
            this.prisma.govChecklist.count({ where: { govOpportunity: { tenantId }, status: 'PENDING', isMandatory: true } }),
        ]);
        return { total, expiringSoon, pendingMandatoryDocs: pending };
    }
};
exports.GovService = GovService;
exports.GovService = GovService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovService);
//# sourceMappingURL=gov.service.js.map