import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async findCampaigns(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.campaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneCampaign(id: string, tenantId: string) {
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
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async createCampaign(tenantId: string, userId: string, dto: any) {
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

  async updateCampaign(id: string, tenantId: string, dto: any) {
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

  async addRecipients(campaignId: string, tenantId: string, contactIds: string[]) {
    await this.findOneCampaign(campaignId, tenantId);
    const data = contactIds.map((contactId) => ({ campaignId, contactId }));
    await this.prisma.campaignRecipient.createMany({ data });
    return { added: contactIds.length };
  }

  async getStats(tenantId: string) {
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
}
