import { PrismaService } from '../prisma/prisma.service';
export declare class InvoicingService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, page?: number, limit?: number, status?: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
            _count: {
                items: number;
                payments: number;
            };
            createdBy: {
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
            notes: string | null;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            contactId: string;
            createdById: string;
            total: number;
            dueDate: Date | null;
            paidAt: Date | null;
            subtotal: number;
            ncfType: import(".prisma/client").$Enums.NcfType;
            ncfSequence: string | null;
            issueDate: Date;
            taxAmount: number;
            paidAmount: number;
            balance: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        stats: {
            totalInvoiced: number;
            totalPaid: number;
            totalBalance: number;
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
            taxRate: number;
            invoiceId: string;
        })[];
        payments: {
            id: string;
            notes: string | null;
            method: string;
            amount: number;
            paidAt: Date;
            reference: string | null;
            invoiceId: string;
        }[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        contactId: string;
        createdById: string;
        total: number;
        dueDate: Date | null;
        paidAt: Date | null;
        subtotal: number;
        ncfType: import(".prisma/client").$Enums.NcfType;
        ncfSequence: string | null;
        issueDate: Date;
        taxAmount: number;
        paidAmount: number;
        balance: number;
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
            taxRate: number;
            invoiceId: string;
        }[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        contactId: string;
        createdById: string;
        total: number;
        dueDate: Date | null;
        paidAt: Date | null;
        subtotal: number;
        ncfType: import(".prisma/client").$Enums.NcfType;
        ncfSequence: string | null;
        issueDate: Date;
        taxAmount: number;
        paidAmount: number;
        balance: number;
    }>;
    registerPayment(id: string, tenantId: string, dto: any): Promise<{
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
            taxRate: number;
            invoiceId: string;
        })[];
        payments: {
            id: string;
            notes: string | null;
            method: string;
            amount: number;
            paidAt: Date;
            reference: string | null;
            invoiceId: string;
        }[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        contactId: string;
        createdById: string;
        total: number;
        dueDate: Date | null;
        paidAt: Date | null;
        subtotal: number;
        ncfType: import(".prisma/client").$Enums.NcfType;
        ncfSequence: string | null;
        issueDate: Date;
        taxAmount: number;
        paidAmount: number;
        balance: number;
    }>;
    voidInvoice(id: string, tenantId: string): Promise<{
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        contactId: string;
        createdById: string;
        total: number;
        dueDate: Date | null;
        paidAt: Date | null;
        subtotal: number;
        ncfType: import(".prisma/client").$Enums.NcfType;
        ncfSequence: string | null;
        issueDate: Date;
        taxAmount: number;
        paidAmount: number;
        balance: number;
    }>;
}
