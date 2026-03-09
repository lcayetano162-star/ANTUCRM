import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GOV_TEMPLATES: Record<string, { item: string; category: string; isMandatory: boolean }[]> = {
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

@Injectable()
export class GovService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.govOpportunity.findMany({
      where: { tenantId },
      include: {
        opportunity: { select: { id: true, name: true, stage: true, value: true } },
        checklist: true,
      },
      orderBy: { submissionDeadline: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const gov = await this.prisma.govOpportunity.findFirst({
      where: { id, tenantId },
      include: {
        opportunity: { include: { contact: true } },
        checklist: { orderBy: [{ isMandatory: 'desc' }, { category: 'asc' }] },
      },
    });
    if (!gov) throw new NotFoundException('Licitación no encontrada');
    return gov;
  }

  async create(tenantId: string, dto: any) {
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

    // Auto-load checklist template
    const templates = GOV_TEMPLATES[dto.govType] || GOV_TEMPLATES.default;
    await this.prisma.govChecklist.createMany({
      data: templates.map(t => ({ ...t, govOpportunityId: govOpp.id })),
    });

    return this.findOne(govOpp.id, tenantId);
  }

  async updateChecklistItem(govId: string, itemId: string, tenantId: string, dto: any) {
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

  async getStats(tenantId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 3600000);

    const [total, expiringSoon, pending] = await Promise.all([
      this.prisma.govOpportunity.count({ where: { tenantId } }),
      this.prisma.govOpportunity.count({ where: { tenantId, submissionDeadline: { gte: now, lte: soon } } }),
      this.prisma.govChecklist.count({ where: { govOpportunity: { tenantId }, status: 'PENDING', isMandatory: true } }),
    ]);

    return { total, expiringSoon, pendingMandatoryDocs: pending };
  }
}
