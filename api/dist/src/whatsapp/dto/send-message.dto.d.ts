export declare class SendMessageDto {
    phoneNumber: string;
    message: string;
    contactId?: string;
    clientId?: string;
    opportunityId?: string;
    templateName?: string;
    templateParams?: Record<string, any>;
}
export declare class ConfigureWhatsAppDto {
    phoneNumberId: string;
    businessAccountId?: string;
    accessToken: string;
    appSecret?: string;
    webhookVerifyToken?: string;
}
export declare class WebhookPayloadDto {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    wa_id: string;
                    profile: {
                        name: string;
                    };
                }>;
                messages?: Array<{
                    id: string;
                    from: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    image?: {
                        id: string;
                        caption?: string;
                    };
                    document?: {
                        id: string;
                        filename: string;
                    };
                    context?: {
                        id: string;
                    };
                }>;
                statuses?: Array<{
                    id: string;
                    status: 'sent' | 'delivered' | 'read' | 'failed';
                    timestamp: string;
                    recipient_id: string;
                    conversation?: {
                        id: string;
                        category: string;
                        expiration_timestamp: string;
                    };
                    errors?: Array<{
                        code: number;
                        title: string;
                        message: string;
                    }>;
                }>;
            };
            field: string;
        }>;
    }>;
}
