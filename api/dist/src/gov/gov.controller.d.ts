import { GovService } from './gov.service';
export declare class GovController {
    private readonly service;
    constructor(service: GovService);
    getStats(tenantId: string): Promise<{
        total: number;
        expiringSoon: number;
        pendingMandatoryDocs: number;
    }>;
    findAll(tenantId: string): Promise<({
        opportunity: {
            name: string;
            id: string;
            value: number;
            stage: import(".prisma/client").$Enums.OpportunityStage;
        };
        checklist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import(".prisma/client").$Enums.GovChecklistStatus;
            category: string;
            isMandatory: boolean;
            govOpportunityId: string;
            item: string;
            fileUrl: string | null;
            verifiedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        opportunityId: string;
        govType: import(".prisma/client").$Enums.GovType;
        processId: string | null;
        submissionDeadline: Date | null;
        estimatedBudget: number | null;
        institution: string | null;
        portalUrl: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        opportunity: {
            contact: {
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
        };
        checklist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import(".prisma/client").$Enums.GovChecklistStatus;
            category: string;
            isMandatory: boolean;
            govOpportunityId: string;
            item: string;
            fileUrl: string | null;
            verifiedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        opportunityId: string;
        govType: import(".prisma/client").$Enums.GovType;
        processId: string | null;
        submissionDeadline: Date | null;
        estimatedBudget: number | null;
        institution: string | null;
        portalUrl: string | null;
    }>;
    create(tenantId: string, dto: any): Promise<{
        opportunity: {
            contact: {
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
        };
        checklist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import(".prisma/client").$Enums.GovChecklistStatus;
            category: string;
            isMandatory: boolean;
            govOpportunityId: string;
            item: string;
            fileUrl: string | null;
            verifiedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        opportunityId: string;
        govType: import(".prisma/client").$Enums.GovType;
        processId: string | null;
        submissionDeadline: Date | null;
        estimatedBudget: number | null;
        institution: string | null;
        portalUrl: string | null;
    }>;
    updateChecklistItem(govId: string, itemId: string, tenantId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.GovChecklistStatus;
        category: string;
        isMandatory: boolean;
        govOpportunityId: string;
        item: string;
        fileUrl: string | null;
        verifiedAt: Date | null;
    }>;
}
