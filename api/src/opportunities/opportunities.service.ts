import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityQueryDto } from './dto/opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: OpportunityQueryDto) {
    const { stage, status, assignedToId, contactId, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (contactId) where.contactId = contactId;
    if (search) where.name = { contains: search };

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

  async getPipeline(tenantId: string) {
    const stages = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'];

    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const opps = await this.prisma.opportunity.findMany({
          where: { tenantId, stage: stage as any, status: 'OPEN' },
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
      }),
    );

    return pipeline;
  }

  async findOne(id: string, tenantId: string) {
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

    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada');
    return opportunity;
  }

  async create(tenantId: string, userId: string, dto: CreateOpportunityDto) {
    // Verify contact belongs to tenant
    const contact = await this.prisma.contact.findFirst({ where: { id: dto.contactId, tenantId } });
    if (!contact) throw new NotFoundException('Contacto no encontrado');

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

  async update(id: string, tenantId: string, dto: UpdateOpportunityDto) {
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

  async moveStage(id: string, tenantId: string, stage: string) {
    await this.findOne(id, tenantId);
    return this.prisma.opportunity.update({
      where: { id },
      data: { stage: stage as any },
    });
  }

  async close(id: string, tenantId: string, status: 'WON' | 'LOST') {
    await this.findOne(id, tenantId);
    return this.prisma.opportunity.update({
      where: { id },
      data: { status, stage: 'CLOSED', actualCloseDate: new Date() },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.opportunity.delete({ where: { id } });
  }

  async getStats(tenantId: string) {
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
}
