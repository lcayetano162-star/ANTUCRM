import { Response } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto, ConfigureEmailDto, EmailWebhookDto } from './dto/send-email.dto';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    getConfig(tenantId: string): Promise<{
        configured: boolean;
        config?: undefined;
    } | {
        configured: boolean;
        config: {
            id: string;
            smtpHost: string;
            smtpPort: number;
            smtpSecure: boolean;
            smtpUser: string;
            fromEmail: string;
            fromName: string;
            isActive: boolean;
            createdAt: Date;
        };
    }>;
    configure(dto: ConfigureEmailDto, tenantId: string): Promise<{
        success: boolean;
        config: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            smtpHost: string;
            smtpPort: number;
            smtpSecure: boolean;
            smtpUser: string;
            smtpPassword: string;
            fromEmail: string;
            fromName: string;
        };
    }>;
    sendEmail(dto: SendEmailDto, tenantId: string, user: any): Promise<{
        success: boolean;
        messageId: string;
        emailMessageId: string;
    }>;
    getMessages(contactId: string, page: string, limit: string, tenantId: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
            sentBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            contactId: string | null;
            fromEmail: string;
            subject: string;
            body: string;
            toEmail: string;
            openedAt: Date | null;
            clickedAt: Date | null;
            trackingId: string;
            sentAt: Date;
            sentById: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        last30Days: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.EmailMessageGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
    }>;
    trackOpen(trackingId: string, res: Response): Promise<void>;
    receiveInbound(payload: EmailWebhookDto, signature: string): Promise<{
        received: boolean;
    }>;
}
