import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { SendMessageDto, WebhookPayloadDto } from './dto/send-message.dto';

class WhatsAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false,
    public originalError?: any,
  ) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiVersion = 'v18.0';
  private readonly apiBase = `https://graph.facebook.com/v18.0`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async getConfig(tenantId: string) {
    return this.prisma.whatsappConfig.findUnique({
      where: { tenantId },
    });
  }

  async configure(tenantId: string, data: {
    phoneNumberId: string;
    businessAccountId?: string;
    accessToken: string;
    appSecret?: string;
    webhookVerifyToken?: string;
  }) {
    // Verificar que el token funciona
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiBase}/${data.phoneNumberId}?access_token=${data.accessToken}`)
      );
      
      if (!response.data) {
        throw new HttpException('Invalid WhatsApp credentials', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException('Could not connect to WhatsApp API', HttpStatus.BAD_REQUEST);
    }

    // Guardar configuración
    return this.prisma.whatsappConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId,
        accessToken: data.accessToken,
        appSecret: data.appSecret,
        webhookVerifyToken: data.webhookVerifyToken,
        isActive: true,
        isVerified: true,
        connectedAt: new Date(),
      },
      update: {
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId,
        accessToken: data.accessToken,
        appSecret: data.appSecret,
        webhookVerifyToken: data.webhookVerifyToken,
        isActive: true,
        isVerified: true,
        updatedAt: new Date(),
      },
    });
  }

  async disconnect(tenantId: string) {
    return this.prisma.whatsappConfig.update({
      where: { tenantId },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async sendMessage(tenantId: string, userId: string, data: SendMessageDto) {
    const config = await this.getConfig(tenantId);
    if (!config || !config.isActive) {
      throw new HttpException('WhatsApp not configured for this tenant', HttpStatus.BAD_REQUEST);
    }

    // Verificar rate limits
    await this.checkRateLimit(tenantId, config);

    // Validar número
    const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
    if (!formattedPhone) {
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    }

    // Crear registro en BD
    const messageRecord = await this.prisma.whatsappMessage.create({
      data: {
        tenantId,
        contactId: data.contactId,
        phone: formattedPhone,
        direction: 'OUTBOUND',
        body: data.message,
        status: 'SENT',
        messageType: data.templateName ? 'template' : 'text',
      },
    });

    try {
      // Preparar payload
      let payload: any;
      if (data.templateName) {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: data.templateName,
            language: { code: 'es' },
            components: this.buildTemplateComponents(data.templateParams),
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: data.message, preview_url: true },
        };
      }

      // Enviar a WhatsApp API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBase}/${config.phoneNumberId}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const waMessageId = response.data.messages?.[0]?.id;

      // Actualizar con éxito
      await this.prisma.whatsappMessage.update({
        where: { id: messageRecord.id },
        data: {
          messageId: waMessageId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Incrementar rate limit
      await this.incrementRateLimit(tenantId);

      return { messageId: messageRecord.id, waMessageId };

    } catch (error: any) {
      const whatsappError = this.parseWhatsAppError(error);

      await this.prisma.whatsappMessage.update({
        where: { id: messageRecord.id },
        data: {
          status: 'FAILED',
          errorCode: whatsappError.code,
          errorMessage: whatsappError.message,
        },
      });

      throw new HttpException(
        whatsappError.message,
        whatsappError.isRetryable ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getMessages(tenantId: string, options: {
    contactId?: string;
    page?: number;
    limit?: number;
  }) {
    const { contactId, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };
    if (contactId) {
      where.contactId = contactId;
    }

    const [messages, total] = await Promise.all([
      this.prisma.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.whatsappMessage.count({ where }),
    ]);

    return {
      data: messages,
      pagination: { page, limit, total },
    };
  }

  async getConversations(tenantId: string) {
    const messages = await this.prisma.whatsappMessage.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['phone'],
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
      },
    });

    return { data: messages };
  }

  async processWebhook(payload: WebhookPayloadDto, signature?: string) {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await this.processInboundMessage(change.value, message);
          }
        }
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await this.processStatusUpdate(status);
          }
        }
      }
    }
  }

  async verifyWebhook(token: string, challenge: string, mode: string) {
    if (mode !== 'subscribe') {
      return null;
    }

    const config = await this.prisma.whatsappConfig.findFirst({
      where: { webhookVerifyToken: token, isActive: true },
    });

    if (!config) {
      return null;
    }

    this.logger.log(`Webhook verified for tenant: ${config.tenantId}`);
    return challenge;
  }

  private async processInboundMessage(value: any, message: any) {
    const phoneNumberId = value.metadata.phone_number_id;
    const from = message.from;
    const name = value.contacts?.[0]?.profile?.name || 'Unknown';

    const config = await this.prisma.whatsappConfig.findFirst({
      where: { phoneNumberId },
    });

    if (!config) return;

    // Buscar o crear contacto
    let contact = await this.prisma.contact.findFirst({
      where: { tenantId: config.tenantId, phone: from },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          tenantId: config.tenantId,
          firstName: name,
          phone: from,
          source: 'whatsapp',
        },
      });
    }

    let content = '';
    let messageType = message.type;

    if (message.text) content = message.text.body;
    else if (message.image) content = message.image.caption || 'Image received';
    else if (message.document) content = `Document: ${message.document.filename}`;

    await this.prisma.whatsappMessage.create({
      data: {
        tenantId: config.tenantId,
        contactId: contact.id,
        messageId: message.id,
        phone: from,
        direction: 'INBOUND',
        messageType,
        body: content,
        status: 'DELIVERED',
        senderName: name,
        createdAt: new Date(parseInt(message.timestamp) * 1000),
      },
    });
  }

  private async processStatusUpdate(status: any) {
    const updateData: any = { status: status.status.toUpperCase() };

    if (status.status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status.status === 'read') {
      updateData.readAt = new Date();
    }

    await this.prisma.whatsappMessage.updateMany({
      where: { messageId: status.id },
      data: updateData,
    });
  }

  private formatPhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return null;
    return cleaned;
  }

  private async checkRateLimit(tenantId: string, config: any) {
    const today = new Date().toISOString().split('T')[0];
    
    if (config.messagesSentDate !== today) {
      await this.prisma.whatsappConfig.update({
        where: { tenantId },
        data: { messagesSentToday: 0, messagesSentDate: today },
      });
      return;
    }

    if ((config.messagesSentToday || 0) >= 1000) {
      throw new HttpException('Daily rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async incrementRateLimit(tenantId: string) {
    await this.prisma.whatsappConfig.update({
      where: { tenantId },
      data: { messagesSentToday: { increment: 1 } },
    });
  }

  private parseWhatsAppError(error: any): WhatsAppError {
    const response = error.response?.data;
    const errorCode = response?.error?.code || error.code || 'UNKNOWN';
    const errorMessage = response?.error?.message || error.message || 'Unknown error';

    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'RATE_LIMIT', 80007];
    const isRetryable = retryableCodes.some(code => 
      errorCode.toString().includes(code.toString())
    );

    return new WhatsAppError(errorMessage, errorCode, isRetryable, error);
  }

  private buildTemplateComponents(params?: Record<string, any>): any[] {
    if (!params) return [];
    return [{
      type: 'body',
      parameters: Object.entries(params).map(([key, value]) => ({
        type: 'text',
        text: String(value),
      })),
    }];
  }
}
