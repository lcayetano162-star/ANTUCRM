import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, WebhookPayloadDto } from './dto/send-message.dto';
export declare class WhatsAppService {
    private readonly prisma;
    private readonly httpService;
    private readonly logger;
    private readonly apiVersion;
    private readonly apiBase;
    constructor(prisma: PrismaService, httpService: HttpService);
    getConfig(tenantId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        accessToken: string;
        phoneNumberId: string;
        businessAccountId: string | null;
        appSecret: string | null;
        webhookVerifyToken: string | null;
        isVerified: boolean;
        messagesSentToday: number;
        messagesSentDate: string | null;
        connectedAt: Date | null;
    }>;
    configure(tenantId: string, data: {
        phoneNumberId: string;
        businessAccountId?: string;
        accessToken: string;
        appSecret?: string;
        webhookVerifyToken?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        accessToken: string;
        phoneNumberId: string;
        businessAccountId: string | null;
        appSecret: string | null;
        webhookVerifyToken: string | null;
        isVerified: boolean;
        messagesSentToday: number;
        messagesSentDate: string | null;
        connectedAt: Date | null;
    }>;
    disconnect(tenantId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        accessToken: string;
        phoneNumberId: string;
        businessAccountId: string | null;
        appSecret: string | null;
        webhookVerifyToken: string | null;
        isVerified: boolean;
        messagesSentToday: number;
        messagesSentDate: string | null;
        connectedAt: Date | null;
    }>;
    sendMessage(tenantId: string, userId: string, data: SendMessageDto): Promise<{
        messageId: string;
        waMessageId: any;
    }>;
    getMessages(tenantId: string, options: {
        contactId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.WhatsAppStatus;
            contactId: string | null;
            phone: string;
            deletedAt: Date | null;
            body: string;
            sentAt: Date;
            messageId: string | null;
            direction: import(".prisma/client").$Enums.WhatsAppMessageDirection;
            deliveredAt: Date | null;
            readAt: Date | null;
            mediaUrl: string | null;
            messageType: string;
            senderName: string | null;
            errorCode: string | null;
            errorMessage: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getConversations(tenantId: string): Promise<{
        data: ({
            contact: {
                company: {
                    name: string;
                    description: string | null;
                    id: string;
                    email: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    tenantId: string;
                    phone: string | null;
                    industry: string | null;
                    website: string | null;
                    address: string | null;
                    city: string | null;
                    country: string | null;
                    taxId: string | null;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.WhatsAppStatus;
            contactId: string | null;
            phone: string;
            deletedAt: Date | null;
            body: string;
            sentAt: Date;
            messageId: string | null;
            direction: import(".prisma/client").$Enums.WhatsAppMessageDirection;
            deliveredAt: Date | null;
            readAt: Date | null;
            mediaUrl: string | null;
            messageType: string;
            senderName: string | null;
            errorCode: string | null;
            errorMessage: string | null;
        })[];
    }>;
    processWebhook(payload: WebhookPayloadDto, signature?: string): Promise<void>;
    verifyWebhook(token: string, challenge: string, mode: string): Promise<string>;
    private processInboundMessage;
    private processStatusUpdate;
    private formatPhoneNumber;
    private checkRateLimit;
    private incrementRateLimit;
    private parseWhatsAppError;
    private buildTemplateComponents;
}
