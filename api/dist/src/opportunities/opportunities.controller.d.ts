import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityQueryDto } from './dto/opportunity.dto';
export declare class OpportunitiesController {
    private readonly service;
    constructor(service: OpportunitiesService);
    findAll(tenantId: string, query: OpportunityQueryDto): Promise<{
        data: ({
            contact: {
                company: {
                    name: string;
                    id: string;
                };
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            activities: {
                description: string;
                id: string;
                createdAt: Date;
                tenantId: string;
                type: import(".prisma/client").$Enums.ActivityType;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                contactId: string | null;
                opportunityId: string | null;
                createdById: string;
            }[];
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            value: number | null;
            status: import(".prisma/client").$Enums.OpportunityStatus;
            probability: number | null;
            contactId: string;
            assignedToId: string | null;
            stage: import(".prisma/client").$Enums.OpportunityStage;
            expectedCloseDate: Date | null;
            actualCloseDate: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPipeline(tenantId: string): Promise<{
        stage: string;
        opportunities: ({
            contact: {
                company: {
                    name: string;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            value: number | null;
            status: import(".prisma/client").$Enums.OpportunityStatus;
            probability: number | null;
            contactId: string;
            assignedToId: string | null;
            stage: import(".prisma/client").$Enums.OpportunityStage;
            expectedCloseDate: Date | null;
            actualCloseDate: Date | null;
        })[];
        count: number;
        totalValue: number;
    }[]>;
    getStats(tenantId: string): Promise<{
        total: number;
        won: number;
        lost: number;
        open: number;
        winRate: number;
        pipelineValue: number;
        avgProbability: number;
    }>;
    findOne(id: string, tenantId: string): Promise<{
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
            tags: {
                name: string;
                id: string;
                createdAt: Date;
                tenantId: string;
                color: string;
            }[];
        } & {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            avatar: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.ContactStatus;
            phone: string | null;
            hasWhatsApp: boolean;
            jobTitle: string | null;
            isMainContact: boolean;
            score: number | null;
            deletedAt: Date | null;
            companyId: string | null;
            assignedToId: string | null;
        };
        activities: ({
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string;
            id: string;
            createdAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            createdById: string;
        })[];
        assignedTo: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
    create(tenantId: string, userId: string, dto: CreateOpportunityDto): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
    update(id: string, tenantId: string, dto: UpdateOpportunityDto): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
    moveStage(id: string, tenantId: string, stage: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
    close(id: string, tenantId: string, status: 'WON' | 'LOST'): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        value: number | null;
        status: import(".prisma/client").$Enums.OpportunityStatus;
        probability: number | null;
        contactId: string;
        assignedToId: string | null;
        stage: import(".prisma/client").$Enums.OpportunityStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
    }>;
}
