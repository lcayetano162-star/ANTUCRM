import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteractionDto, ChannelType, DirectionType } from './dto/create-interaction.dto';

export interface AIInsight {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;
  summary: string;
  topics: string[];
  intent?: string;
  urgency?: 'low' | 'medium' | 'high';
  keywords?: string[];
  suggested_action?: string;
}

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInteractionDto, tenantId: string, userId: string) {
    // Calcular thread_depth si hay parent
    let threadDepth = 0;
    if (data.parentId) {
      const parent = await this.prisma.interaction.findUnique({
        where: { id: data.parentId },
        select: { threadDepth: true }
      });
      if (parent) {
        threadDepth = (parent.threadDepth || 0) + 1;
      }
    }

    const interaction = await this.prisma.interaction.create({
      data: {
        tenantId,
        userId,
        clientId: data.clientId,
        contactId: data.contactId,
        opportunityId: data.opportunityId,
        type: data.channel as any,
        direction: data.direction,
        subject: data.subject,
        body: data.content,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        ccAddresses: data.ccAddresses,
        bccAddresses: data.bccAddresses,
        provider: data.provider || 'system',
        externalId: data.externalId,
        threadId: data.threadId,
        metadata: data.metadata || {},
        parentId: data.parentId,
        threadDepth,
        isPrivate: data.isPrivate || false,
        status: 'pending',
        aiStatus: 'pending',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Procesar IA en background (no bloqueante)
    this.processAI(interaction).catch(err => 
      this.logger.error('Error processing AI:', err)
    );

    this.logger.log(`[Timeline] ${data.channel} ${data.direction}: ${interaction.id}`);
    return interaction;
  }

  async findByClient(tenantId: string, clientId: string, options: {
    channels?: ChannelType[];
    limit?: number;
    offset?: number;
    includePrivate?: boolean;
  } = {}) {
    const { channels, limit = 50, offset = 0, includePrivate = false } = options;

    const where: any = {
      tenantId,
      clientId,
    };

    if (!includePrivate) {
      where.isPrivate = false;
    }

    if (channels?.length) {
      where.type = { in: channels };
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    return interactions;
  }

  async getThread(tenantId: string, threadId: string) {
    return this.prisma.interaction.findMany({
      where: { tenantId, threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async search(tenantId: string, searchTerm: string, clientId?: string) {
    const where: any = {
      tenantId,
      body: { contains: searchTerm, mode: 'insensitive' },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.interaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getSummary(tenantId: string, clientId: string) {
    const interactions = await this.prisma.interaction.findMany({
      where: {
        tenantId,
        clientId,
        isPrivate: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { aiInsight: true, createdAt: true },
    });

    const total = await this.prisma.interaction.count({
      where: {
        tenantId,
        clientId,
        isPrivate: false,
      },
    });

    const lastInteraction = interactions[0];

    const aiInsight = lastInteraction?.aiInsight as any;
    return {
      total,
      lastInteraction: lastInteraction?.createdAt || null,
      sentiment: aiInsight?.sentiment || null,
      aiSummary: aiInsight?.summary || null,
    };
  }

  async updateStatus(externalId: string, status: string, eventData?: any) {
    const timestampField = this.getTimestampField(status);
    
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    await this.prisma.interaction.updateMany({
      where: { externalId },
      data: updateData,
    });

    // Registrar evento
    const interaction = await this.prisma.interaction.findFirst({
      where: { externalId },
      select: { id: true, tenantId: true },
    });

    if (interaction) {
      await this.prisma.interactionEvent.create({
        data: {
          interactionId: interaction.id,
          tenantId: interaction.tenantId,
          eventType: status,
          eventData: eventData || {},
          provider: eventData?.provider || 'unknown',
        },
      });
    }
  }

  async updateAIInsight(interactionId: string, insight: AIInsight) {
    return this.prisma.interaction.update({
      where: { id: interactionId },
      data: {
        aiInsight: insight as any,
        aiStatus: 'completed',
        aiProcessedAt: new Date(),
      },
    });
  }

  private getTimestampField(status: string): string | null {
    const map: Record<string, string> = {
      'sent': 'sentAt',
      'delivered': 'deliveredAt',
      'read': 'readAt',
      'replied': 'repliedAt',
    };
    return map[status] || null;
  }

  private async processAI(interaction: any): Promise<void> {
    // Placeholder - integrar con AIService
    // const analysis = await this.aiService.analyzeInteraction(interaction);
    // await this.updateAIInsight(interaction.id, analysis);
  }
}
