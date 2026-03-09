import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendEmailDto, ConfigureEmailDto } from './dto/send-email.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    return this.prisma.emailConfig.findUnique({
      where: { tenantId },
    });
  }

  async configure(tenantId: string, data: ConfigureEmailDto) {
    // Verificar configuración SMTP
    const isValid = await this.verifySmtpConfig({
      smtpHost: data.smtpHost,
      smtpPort: parseInt(data.smtpPort),
      smtpSecure: data.smtpSecure ?? true,
      smtpUser: data.smtpUser,
      smtpPassword: data.smtpPassword,
    });

    if (!isValid.ok) {
      throw new HttpException(
        `Invalid SMTP configuration: ${isValid.error}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.emailConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        smtpHost: data.smtpHost,
        smtpPort: parseInt(data.smtpPort),
        smtpSecure: data.smtpSecure ?? true,
        smtpUser: data.smtpUser,
        smtpPassword: data.smtpPassword,
        fromEmail: data.fromEmail,
        fromName: data.fromName || data.fromEmail,
        isActive: true,
      },
      update: {
        smtpHost: data.smtpHost,
        smtpPort: parseInt(data.smtpPort),
        smtpSecure: data.smtpSecure ?? true,
        smtpUser: data.smtpUser,
        smtpPassword: data.smtpPassword,
        fromEmail: data.fromEmail,
        fromName: data.fromName || data.fromEmail,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  async sendEmail(tenantId: string, userId: string, data: SendEmailDto) {
    const config = await this.getConfig(tenantId);
    if (!config || !config.isActive) {
      throw new HttpException(
        'Email not configured for this tenant',
        HttpStatus.BAD_REQUEST,
      );
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    const htmlBody = this.textToHtml(data.body);
    const fromAddress = data.fromEmail || config.fromEmail;
    const fromName = data.fromName || config.fromName;

    try {
      const result = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: data.to,
        subject: data.subject,
        html: htmlBody,
        text: this.cleanTextForStorage(data.body),
      });

      // Guardar en BD
      const emailRecord = await this.prisma.emailMessage.create({
        data: {
          tenantId,
          sentById: userId,
          contactId: data.contactId,
          subject: data.subject,
          body: data.body,
          fromEmail: fromAddress,
          toEmail: data.to,
          status: 'SENT',
          trackingId: this.generateTrackingId(),
        },
      });

      // Crear interacción en timeline
      await this.createInteraction(tenantId, userId, data, emailRecord.id);

      return {
        success: true,
        messageId: emailRecord.id,
        emailMessageId: result.messageId,
      };
    } catch (error: any) {
      this.logger.error('Error sending email:', error);
      throw new HttpException(
        `Failed to send email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEmails(tenantId: string, options: {
    contactId?: string;
    page?: number;
    limit?: number;
  }) {
    const { contactId, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };
    if (contactId) {
      where.contactId = contactId;
    }

    const [emails, total] = await Promise.all([
      this.prisma.emailMessage.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          sentBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.emailMessage.count({ where }),
    ]);

    return {
      data: emails,
      pagination: { page, limit, total },
    };
  }

  async getStats(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.emailMessage.groupBy({
      by: ['status'],
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { status: true },
    });

    const total = await this.prisma.emailMessage.count({ where: { tenantId } });

    return {
      total,
      last30Days: result,
    };
  }

  async trackOpen(trackingId: string) {
    const email = await this.prisma.emailMessage.findUnique({
      where: { trackingId },
    });

    if (email && !email.openedAt) {
      await this.prisma.emailMessage.update({
        where: { id: email.id },
        data: { openedAt: new Date() },
      });
    }

    // Retornar una imagen pixel transparente
    return Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
  }

  async processInboundWebhook(data: any, signature?: string) {
    // Procesar email entrante (webhook de SendGrid, AWS SES, etc.)
    this.logger.log('Processing inbound email webhook');
    
    // Implementación específica según el provider
    // Este es un placeholder para la implementación real
  }

  private async createInteraction(
    tenantId: string,
    userId: string,
    data: SendEmailDto,
    emailId: string,
  ) {
    try {
      await this.prisma.interaction.create({
        data: {
          tenantId,
          userId,
          contactId: data.contactId,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: data.subject,
          body: data.body,
          toAddress: data.to,
          fromAddress: data.fromEmail || '',
          externalId: emailId,
          provider: 'smtp',
          status: 'sent',
        },
      });
    } catch (error) {
      this.logger.error('Error creating interaction:', error);
    }
  }

  private async verifySmtpConfig(config: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      await transporter.verify();
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  private textToHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  private cleanTextForStorage(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  private generateTrackingId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
