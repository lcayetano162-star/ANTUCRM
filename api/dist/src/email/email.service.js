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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async getConfig(tenantId) {
        return this.prisma.emailConfig.findUnique({
            where: { tenantId },
        });
    }
    async configure(tenantId, data) {
        const isValid = await this.verifySmtpConfig({
            smtpHost: data.smtpHost,
            smtpPort: parseInt(data.smtpPort),
            smtpSecure: data.smtpSecure ?? true,
            smtpUser: data.smtpUser,
            smtpPassword: data.smtpPassword,
        });
        if (!isValid.ok) {
            throw new common_1.HttpException(`Invalid SMTP configuration: ${isValid.error}`, common_1.HttpStatus.BAD_REQUEST);
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
    async sendEmail(tenantId, userId, data) {
        const config = await this.getConfig(tenantId);
        if (!config || !config.isActive) {
            throw new common_1.HttpException('Email not configured for this tenant', common_1.HttpStatus.BAD_REQUEST);
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
            await this.createInteraction(tenantId, userId, data, emailRecord.id);
            return {
                success: true,
                messageId: emailRecord.id,
                emailMessageId: result.messageId,
            };
        }
        catch (error) {
            this.logger.error('Error sending email:', error);
            throw new common_1.HttpException(`Failed to send email: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEmails(tenantId, options) {
        const { contactId, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const where = { tenantId };
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
    async getStats(tenantId) {
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
    async trackOpen(trackingId) {
        const email = await this.prisma.emailMessage.findUnique({
            where: { trackingId },
        });
        if (email && !email.openedAt) {
            await this.prisma.emailMessage.update({
                where: { id: email.id },
                data: { openedAt: new Date() },
            });
        }
        return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    }
    async processInboundWebhook(data, signature) {
        this.logger.log('Processing inbound email webhook');
    }
    async createInteraction(tenantId, userId, data, emailId) {
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
        }
        catch (error) {
            this.logger.error('Error creating interaction:', error);
        }
    }
    async verifySmtpConfig(config) {
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
        }
        catch (error) {
            return { ok: false, error: error.message };
        }
    }
    textToHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }
    cleanTextForStorage(text) {
        return text.replace(/<[^>]*>/g, '').trim();
    }
    generateTrackingId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map