import { PrismaService } from '../prisma/prisma.service';
import { SendEmailDto, ConfigureEmailDto } from './dto/send-email.dto';
export declare class EmailService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getConfig(tenantId: string): Promise<{
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
    }>;
    configure(tenantId: string, data: ConfigureEmailDto): Promise<{
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
    }>;
    sendEmail(tenantId: string, userId: string, data: SendEmailDto): Promise<{
        success: boolean;
        messageId: string;
        emailMessageId: string;
    }>;
    getEmails(tenantId: string, options: {
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
    trackOpen(trackingId: string): Promise<Buffer<ArrayBuffer>>;
    processInboundWebhook(data: any, signature?: string): Promise<void>;
    private createInteraction;
    private verifySmtpConfig;
    private textToHtml;
    private cleanTextForStorage;
    private generateTrackingId;
}
