export declare class SendEmailDto {
    to: string;
    subject: string;
    body: string;
    contactId?: string;
    fromName?: string;
    fromEmail?: string;
}
export declare class ConfigureEmailDto {
    smtpHost: string;
    smtpPort: string;
    smtpSecure?: boolean;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName?: string;
}
export declare class EmailWebhookDto {
    event: string;
    email: string;
    messageId?: string;
    data?: Record<string, any>;
}
