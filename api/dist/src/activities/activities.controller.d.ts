import { ActivitiesService } from './activities.service';
import { CreateActivityDto, ActivityQueryDto, CreateTaskDto, UpdateTaskDto } from './dto/activity.dto';
export declare class ActivitiesController {
    private readonly service;
    constructor(service: ActivitiesService);
    findAll(tenantId: string, query: ActivityQueryDto): Promise<{
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
                avatar: string;
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
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTimeline(tenantId: string, contactId?: string, opportunityId?: string): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
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
    })[]>;
    create(tenantId: string, userId: string, dto: CreateActivityDto): Promise<{
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
    }>;
}
export declare class TasksController {
    private readonly service;
    constructor(service: ActivitiesService);
    findAll(tenantId: string, userId?: string): Promise<{
        pending: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            contactId: string | null;
            assignedToId: string;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            completedAt: Date | null;
        })[];
        inProgress: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            contactId: string | null;
            assignedToId: string;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            completedAt: Date | null;
        })[];
        completed: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            contactId: string | null;
            assignedToId: string;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            completedAt: Date | null;
        })[];
    }>;
    create(tenantId: string, dto: CreateTaskDto): Promise<{
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
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        contactId: string | null;
        assignedToId: string;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
    update(id: string, tenantId: string, dto: UpdateTaskDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        contactId: string | null;
        assignedToId: string;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        contactId: string | null;
        assignedToId: string;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        completedAt: Date | null;
    }>;
}
