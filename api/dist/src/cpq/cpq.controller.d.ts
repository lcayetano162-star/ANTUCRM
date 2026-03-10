import { CpqService } from './cpq.service';
export declare class QuotesController {
    private readonly service;
    constructor(service: CpqService);
    findAll(tenantId: string, page?: string, limit?: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
            opportunity: {
                name: string;
                id: string;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
            items: {
                description: string;
                id: string;
                sortOrder: number;
                unitPrice: number;
                quantity: number;
                productId: string | null;
                subtotal: number;
                discount: number;
                quoteId: string;
            }[];
        } & {
            number: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            notes: string | null;
            status: import(".prisma/client").$Enums.QuoteStatus;
            contactId: string;
            opportunityId: string | null;
            createdById: string;
            title: string;
            total: number;
            validUntil: Date | null;
            subtotal: number;
            discount: number;
            tax: number;
            terms: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, tenantId: string): Promise<{
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
        opportunity: {
            name: string;
            id: string;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        items: ({
            product: {
                name: string;
                id: string;
                sku: string;
            };
        } & {
            description: string;
            id: string;
            sortOrder: number;
            unitPrice: number;
            quantity: number;
            productId: string | null;
            subtotal: number;
            discount: number;
            quoteId: string;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.QuoteStatus;
        contactId: string;
        opportunityId: string | null;
        createdById: string;
        title: string;
        total: number;
        validUntil: Date | null;
        subtotal: number;
        discount: number;
        tax: number;
        terms: string | null;
    }>;
    create(tenantId: string, userId: string, dto: any): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        };
        items: {
            description: string;
            id: string;
            sortOrder: number;
            unitPrice: number;
            quantity: number;
            productId: string | null;
            subtotal: number;
            discount: number;
            quoteId: string;
        }[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.QuoteStatus;
        contactId: string;
        opportunityId: string | null;
        createdById: string;
        title: string;
        total: number;
        validUntil: Date | null;
        subtotal: number;
        discount: number;
        tax: number;
        terms: string | null;
    }>;
    updateStatus(id: string, tenantId: string, status: string): Promise<{
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
        opportunity: {
            name: string;
            id: string;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        items: ({
            product: {
                name: string;
                id: string;
                sku: string;
            };
        } & {
            description: string;
            id: string;
            sortOrder: number;
            unitPrice: number;
            quantity: number;
            productId: string | null;
            subtotal: number;
            discount: number;
            quoteId: string;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.QuoteStatus;
        contactId: string;
        opportunityId: string | null;
        createdById: string;
        title: string;
        total: number;
        validUntil: Date | null;
        subtotal: number;
        discount: number;
        tax: number;
        terms: string | null;
    }>;
}
export declare class MpsController {
    private readonly service;
    constructor(service: CpqService);
    findAll(tenantId: string, page?: string, limit?: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
            approvedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            number: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.MpsStatus;
            contactId: string;
            opportunityId: string | null;
            createdById: string;
            equipmentModel: string | null;
            monthlyVolumeBW: number;
            monthlyVolumeColor: number;
            equipmentCost: number;
            interestRate: number;
            termMonths: number;
            monthlyPayment: number;
            costPerPageBW: number;
            costPerPageColor: number;
            monthlyClickBW: number;
            monthlyClickColor: number;
            includesService: boolean;
            includesSupplies: boolean;
            serviceMonthly: number;
            totalMonthly: number;
            approvalNotes: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(tenantId: string, userId: string, dto: any): Promise<{
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.MpsStatus;
        contactId: string;
        opportunityId: string | null;
        createdById: string;
        equipmentModel: string | null;
        monthlyVolumeBW: number;
        monthlyVolumeColor: number;
        equipmentCost: number;
        interestRate: number;
        termMonths: number;
        monthlyPayment: number;
        costPerPageBW: number;
        costPerPageColor: number;
        monthlyClickBW: number;
        monthlyClickColor: number;
        includesService: boolean;
        includesSupplies: boolean;
        serviceMonthly: number;
        totalMonthly: number;
        approvalNotes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    approve(id: string, tenantId: string, userId: string, approved: boolean, notes?: string): Promise<{
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.MpsStatus;
        contactId: string;
        opportunityId: string | null;
        createdById: string;
        equipmentModel: string | null;
        monthlyVolumeBW: number;
        monthlyVolumeColor: number;
        equipmentCost: number;
        interestRate: number;
        termMonths: number;
        monthlyPayment: number;
        costPerPageBW: number;
        costPerPageColor: number;
        monthlyClickBW: number;
        monthlyClickColor: number;
        includesService: boolean;
        includesSupplies: boolean;
        serviceMonthly: number;
        totalMonthly: number;
        approvalNotes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
}
