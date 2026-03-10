import { InteractionsService } from './interactions.service';
import { CreateInteractionDto, SearchInteractionDto, TimelineQueryDto } from './dto/create-interaction.dto';
export declare class InteractionsController {
    private readonly interactionsService;
    constructor(interactionsService: InteractionsService);
    create(dto: CreateInteractionDto, tenantId: string, user: any): Promise<{
        success: boolean;
        data: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            contact: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.InteractionType;
            status: string;
            userId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            subject: string | null;
            body: string | null;
            sentAt: Date | null;
            direction: string | null;
            duration: number | null;
            outcome: string | null;
            happenedAt: Date;
            clientId: string | null;
            fromAddress: string | null;
            toAddress: string | null;
            ccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            bccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string;
            externalId: string | null;
            threadId: string | null;
            parentId: string | null;
            threadDepth: number;
            isPrivate: boolean;
            aiInsight: import("@prisma/client/runtime/library").JsonValue | null;
            aiStatus: string;
            aiProcessedAt: Date | null;
            deliveredAt: Date | null;
            readAt: Date | null;
            repliedAt: Date | null;
        };
    }>;
    getTimeline(clientId: string, query: TimelineQueryDto, tenantId: string): Promise<{
        success: boolean;
        data: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            contact: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            opportunity: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.InteractionType;
            status: string;
            userId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            subject: string | null;
            body: string | null;
            sentAt: Date | null;
            direction: string | null;
            duration: number | null;
            outcome: string | null;
            happenedAt: Date;
            clientId: string | null;
            fromAddress: string | null;
            toAddress: string | null;
            ccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            bccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string;
            externalId: string | null;
            threadId: string | null;
            parentId: string | null;
            threadDepth: number;
            isPrivate: boolean;
            aiInsight: import("@prisma/client/runtime/library").JsonValue | null;
            aiStatus: string;
            aiProcessedAt: Date | null;
            deliveredAt: Date | null;
            readAt: Date | null;
            repliedAt: Date | null;
        })[];
        pagination: {
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    }>;
    getThread(threadId: string, tenantId: string): Promise<{
        success: boolean;
        data: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
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
            type: import(".prisma/client").$Enums.InteractionType;
            status: string;
            userId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            subject: string | null;
            body: string | null;
            sentAt: Date | null;
            direction: string | null;
            duration: number | null;
            outcome: string | null;
            happenedAt: Date;
            clientId: string | null;
            fromAddress: string | null;
            toAddress: string | null;
            ccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            bccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string;
            externalId: string | null;
            threadId: string | null;
            parentId: string | null;
            threadDepth: number;
            isPrivate: boolean;
            aiInsight: import("@prisma/client/runtime/library").JsonValue | null;
            aiStatus: string;
            aiProcessedAt: Date | null;
            deliveredAt: Date | null;
            readAt: Date | null;
            repliedAt: Date | null;
        })[];
    }>;
    search(dto: SearchInteractionDto, tenantId: string): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        count?: undefined;
    } | {
        success: boolean;
        data: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
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
            type: import(".prisma/client").$Enums.InteractionType;
            status: string;
            userId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            subject: string | null;
            body: string | null;
            sentAt: Date | null;
            direction: string | null;
            duration: number | null;
            outcome: string | null;
            happenedAt: Date;
            clientId: string | null;
            fromAddress: string | null;
            toAddress: string | null;
            ccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            bccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string;
            externalId: string | null;
            threadId: string | null;
            parentId: string | null;
            threadDepth: number;
            isPrivate: boolean;
            aiInsight: import("@prisma/client/runtime/library").JsonValue | null;
            aiStatus: string;
            aiProcessedAt: Date | null;
            deliveredAt: Date | null;
            readAt: Date | null;
            repliedAt: Date | null;
        })[];
        count: number;
        error?: undefined;
    }>;
    getSummary(clientId: string, tenantId: string): Promise<{
        success: boolean;
        data: {
            total: number;
            lastInteraction: Date;
            sentiment: any;
            aiSummary: any;
        };
    }>;
    createNote(dto: {
        clientId: string;
        content: string;
    }, tenantId: string, user: any): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            contact: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.InteractionType;
            status: string;
            userId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            subject: string | null;
            body: string | null;
            sentAt: Date | null;
            direction: string | null;
            duration: number | null;
            outcome: string | null;
            happenedAt: Date;
            clientId: string | null;
            fromAddress: string | null;
            toAddress: string | null;
            ccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            bccAddresses: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string;
            externalId: string | null;
            threadId: string | null;
            parentId: string | null;
            threadDepth: number;
            isPrivate: boolean;
            aiInsight: import("@prisma/client/runtime/library").JsonValue | null;
            aiStatus: string;
            aiProcessedAt: Date | null;
            deliveredAt: Date | null;
            readAt: Date | null;
            repliedAt: Date | null;
        };
        error?: undefined;
    }>;
}
