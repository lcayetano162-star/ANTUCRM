export declare enum ChannelType {
    EMAIL = "EMAIL",
    WHATSAPP = "WHATSAPP",
    SMS = "SMS",
    CALL = "CALL",
    NOTE = "NOTE",
    MEETING = "MEETING"
}
export declare enum DirectionType {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND",
    INTERNAL = "INTERNAL"
}
export declare class CreateInteractionDto {
    clientId?: string;
    contactId?: string;
    opportunityId?: string;
    channel: ChannelType;
    direction?: DirectionType;
    subject?: string;
    content: string;
    fromAddress: string;
    toAddress: string;
    ccAddresses?: string[];
    bccAddresses?: string[];
    provider?: string;
    externalId?: string;
    threadId?: string;
    metadata?: Record<string, any>;
    parentId?: string;
    isPrivate?: boolean;
}
export declare class SearchInteractionDto {
    q: string;
    clientId?: string;
}
export declare class TimelineQueryDto {
    channels?: string;
    limit?: string;
    offset?: string;
    includePrivate?: string;
}
