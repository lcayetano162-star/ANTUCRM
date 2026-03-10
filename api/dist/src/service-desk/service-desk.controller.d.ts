import { ServiceDeskService } from './service-desk.service';
export declare class ServiceDeskController {
    private readonly service;
    constructor(service: ServiceDeskService);
    getKpis(tenantId: string): Promise<{
        total: number;
        open: number;
        resolved: number;
        critical: number;
        slaBreached: number;
        slaCompliance: number;
    }>;
    findTickets(tenantId: string, page?: string, limit?: string, status?: string, priority?: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
                phone: string;
            };
            _count: {
                workOrders: number;
            };
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.TicketStatus;
            contactId: string;
            createdById: string;
            assignedToId: string | null;
            title: string;
            category: string | null;
            priority: import(".prisma/client").$Enums.TicketPriority;
            ticketNumber: string;
            slaDeadline: Date | null;
            resolvedAt: Date | null;
            closedAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOneTicket(id: string, tenantId: string): Promise<{
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
        workOrders: ({
            tech: {
                id: string;
                firstName: string;
                lastName: string;
            };
            parts: ({
                product: {
                    name: string;
                    id: string;
                    sku: string;
                };
            } & {
                id: string;
                createdAt: Date;
                unitCost: number;
                quantity: number;
                productId: string;
                workOrderId: string;
            })[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.WorkOrderStatus;
            completedAt: Date | null;
            ticketId: string;
            woNumber: string;
            techNotes: string | null;
            startedAt: Date | null;
            signatureData: string | null;
            techId: string | null;
        })[];
        createdBy: {
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
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        contactId: string;
        createdById: string;
        assignedToId: string | null;
        title: string;
        category: string | null;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
    }>;
    createTicket(tenantId: string, userId: string, dto: any): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        contactId: string;
        createdById: string;
        assignedToId: string | null;
        title: string;
        category: string | null;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
    }>;
    updateTicket(id: string, tenantId: string, dto: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        contactId: string;
        createdById: string;
        assignedToId: string | null;
        title: string;
        category: string | null;
        priority: import(".prisma/client").$Enums.TicketPriority;
        ticketNumber: string;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
    }>;
    createWorkOrder(ticketId: string, tenantId: string, dto: any): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        completedAt: Date | null;
        ticketId: string;
        woNumber: string;
        techNotes: string | null;
        startedAt: Date | null;
        signatureData: string | null;
        techId: string | null;
    }>;
    updateWorkOrder(id: string, tenantId: string, dto: any): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        completedAt: Date | null;
        ticketId: string;
        woNumber: string;
        techNotes: string | null;
        startedAt: Date | null;
        signatureData: string | null;
        techId: string | null;
    }>;
    addPart(woId: string, tenantId: string, dto: any): Promise<{
        product: {
            name: string;
            id: string;
            sku: string;
        };
    } & {
        id: string;
        createdAt: Date;
        unitCost: number;
        quantity: number;
        productId: string;
        workOrderId: string;
    }>;
}
