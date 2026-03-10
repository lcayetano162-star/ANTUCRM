import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto, ConfigureWhatsAppDto, WebhookPayloadDto } from './dto/send-message.dto';
export declare class WhatsAppController {
    private readonly whatsAppService;
    constructor(whatsAppService: WhatsAppService);
    getConfig(tenantId: string): Promise<{
        configured: boolean;
        config?: undefined;
    } | {
        configured: boolean;
        config: {
            id: string;
            phoneNumberId: string;
            businessAccountId: string;
            isActive: boolean;
            isVerified: boolean;
            connectedAt: Date;
            messagesSentToday: number;
            messagesSentDate: string;
            createdAt: Date;
        };
    }>;
    configure(dto: ConfigureWhatsAppDto, tenantId: string): Promise<{
        success: boolean;
        config: {
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
        };
    }>;
    disconnect(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendMessage(dto: SendMessageDto, tenantId: string, user: any): Promise<{
        success: boolean;
        data: {
            messageId: string;
            waMessageId: any;
        };
    }>;
    getMessages(contactId: string, page: string, limit: string, tenantId: string): Promise<{
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
    verifyWebhook(mode: string, token: string, challenge: string): Promise<string | {
        statusCode: number;
    }>;
    receiveWebhook(payload: WebhookPayloadDto, signature: string): Promise<{
        received: boolean;
    }>;
    getTemplates(tenantId: string): Promise<{
        data: any;
    }>;
    private get prisma();
}
