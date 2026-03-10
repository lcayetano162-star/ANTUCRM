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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../prisma/prisma.service");
const rxjs_1 = require("rxjs");
class WhatsAppError extends Error {
    constructor(message, code, isRetryable = false, originalError) {
        super(message);
        this.code = code;
        this.isRetryable = isRetryable;
        this.originalError = originalError;
        this.name = 'WhatsAppError';
    }
}
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(prisma, httpService) {
        this.prisma = prisma;
        this.httpService = httpService;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
        this.apiVersion = 'v18.0';
        this.apiBase = `https://graph.facebook.com/v18.0`;
    }
    async getConfig(tenantId) {
        return this.prisma.whatsAppConfig.findUnique({
            where: { tenantId },
        });
    }
    async configure(tenantId, data) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.apiBase}/${data.phoneNumberId}?access_token=${data.accessToken}`));
            if (!response.data) {
                throw new common_1.HttpException('Invalid WhatsApp credentials', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        catch (error) {
            throw new common_1.HttpException('Could not connect to WhatsApp API', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.prisma.whatsAppConfig.upsert({
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
    async disconnect(tenantId) {
        return this.prisma.whatsAppConfig.update({
            where: { tenantId },
            data: { isActive: false, updatedAt: new Date() },
        });
    }
    async sendMessage(tenantId, userId, data) {
        const config = await this.getConfig(tenantId);
        if (!config || !config.isActive) {
            throw new common_1.HttpException('WhatsApp not configured for this tenant', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.checkRateLimit(tenantId, config);
        const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
        if (!formattedPhone) {
            throw new common_1.HttpException('Invalid phone number', common_1.HttpStatus.BAD_REQUEST);
        }
        const messageRecord = await this.prisma.whatsAppMessage.create({
            data: {
                tenantId,
                contactId: data.contactId,
                phone: formattedPhone,
                direction: 'OUTBOUND',
                body: data.message,
                status: 'SENT',
            },
        });
        try {
            let payload;
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
            }
            else {
                payload = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: formattedPhone,
                    type: 'text',
                    text: { body: data.message, preview_url: true },
                };
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiBase}/${config.phoneNumberId}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                },
            }));
            const waMessageId = response.data.messages?.[0]?.id;
            await this.prisma.whatsAppMessage.update({
                where: { id: messageRecord.id },
                data: {
                    messageId: waMessageId,
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
            await this.incrementRateLimit(tenantId);
            return { messageId: messageRecord.id, waMessageId };
        }
        catch (error) {
            const whatsappError = this.parseWhatsAppError(error);
            await this.prisma.whatsAppMessage.update({
                where: { id: messageRecord.id },
                data: {
                    status: 'FAILED',
                    errorCode: whatsappError.code,
                    errorMessage: whatsappError.message,
                },
            });
            throw new common_1.HttpException(whatsappError.message, whatsappError.isRetryable ? common_1.HttpStatus.TOO_MANY_REQUESTS : common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getMessages(tenantId, options) {
        const { contactId, page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        const where = { tenantId, deletedAt: null };
        if (contactId) {
            where.contactId = contactId;
        }
        const [messages, total] = await Promise.all([
            this.prisma.whatsAppMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    contact: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            this.prisma.whatsAppMessage.count({ where }),
        ]);
        return {
            data: messages,
            pagination: { page, limit, total },
        };
    }
    async getConversations(tenantId) {
        const messages = await this.prisma.whatsAppMessage.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            distinct: ['phone'],
            include: {
                contact: { select: { id: true, firstName: true, lastName: true, company: true } },
            },
        });
        return { data: messages };
    }
    async processWebhook(payload, signature) {
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
    async verifyWebhook(token, challenge, mode) {
        if (mode !== 'subscribe') {
            return null;
        }
        const config = await this.prisma.whatsAppConfig.findFirst({
            where: { webhookVerifyToken: token, isActive: true },
        });
        if (!config) {
            return null;
        }
        this.logger.log(`Webhook verified for tenant: ${config.tenantId}`);
        return challenge;
    }
    async processInboundMessage(value, message) {
        const phoneNumberId = value.metadata.phone_number_id;
        const from = message.from;
        const name = value.contacts?.[0]?.profile?.name || 'Unknown';
        const config = await this.prisma.whatsAppConfig.findFirst({
            where: { phoneNumberId },
        });
        if (!config)
            return;
        let contact = await this.prisma.contact.findFirst({
            where: { tenantId: config.tenantId, phone: from },
        });
        if (!contact) {
            const contactData = {
                tenantId: config.tenantId,
                firstName: name,
                phone: from,
                source: 'whatsapp',
            };
            contact = await this.prisma.contact.create({ data: contactData });
        }
        let content = '';
        let msgType = message.type;
        if (message.text)
            content = message.text.body;
        else if (message.image)
            content = message.image.caption || 'Image received';
        else if (message.document)
            content = `Document: ${message.document.filename}`;
        await this.prisma.whatsAppMessage.create({
            data: {
                tenantId: config.tenantId,
                contactId: contact.id,
                messageId: message.id,
                phone: from,
                direction: 'INBOUND',
                body: content,
                status: 'DELIVERED',
                senderName: name,
                createdAt: new Date(parseInt(message.timestamp) * 1000),
            },
        });
    }
    async processStatusUpdate(status) {
        const updateData = { status: status.status.toUpperCase() };
        if (status.status === 'delivered') {
            updateData.deliveredAt = new Date();
        }
        else if (status.status === 'read') {
            updateData.readAt = new Date();
        }
        await this.prisma.whatsAppMessage.updateMany({
            where: { messageId: status.id },
            data: updateData,
        });
    }
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10)
            return null;
        return cleaned;
    }
    async checkRateLimit(tenantId, config) {
        const today = new Date().toISOString().split('T')[0];
        if (config.messagesSentDate !== today) {
            await this.prisma.whatsAppConfig.update({
                where: { tenantId },
                data: { messagesSentToday: 0, messagesSentDate: today },
            });
            return;
        }
        if ((config.messagesSentToday || 0) >= 1000) {
            throw new common_1.HttpException('Daily rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    async incrementRateLimit(tenantId) {
        await this.prisma.whatsAppConfig.update({
            where: { tenantId },
            data: { messagesSentToday: { increment: 1 } },
        });
    }
    parseWhatsAppError(error) {
        const response = error.response?.data;
        const errorCode = response?.error?.code || error.code || 'UNKNOWN';
        const errorMessage = response?.error?.message || error.message || 'Unknown error';
        const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'RATE_LIMIT', 80007];
        const isRetryable = retryableCodes.some(code => errorCode.toString().includes(code.toString()));
        return new WhatsAppError(errorMessage, errorCode, isRetryable, error);
    }
    buildTemplateComponents(params) {
        if (!params)
            return [];
        return [{
                type: 'body',
                parameters: Object.entries(params).map(([key, value]) => ({
                    type: 'text',
                    text: String(value),
                })),
            }];
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        axios_1.HttpService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map