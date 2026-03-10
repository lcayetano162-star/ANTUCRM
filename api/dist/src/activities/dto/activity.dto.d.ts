import { z } from 'zod';
export declare const CreateActivitySchema: z.ZodObject<{
    type: z.ZodEnum<["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "WHATSAPP", "SYSTEM"]>;
    description: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    contactId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    metadata?: Record<string, any>;
    contactId?: string;
    opportunityId?: string;
}, {
    description?: string;
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    metadata?: Record<string, any>;
    contactId?: string;
    opportunityId?: string;
}>;
export declare const ActivityQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "WHATSAPP", "SYSTEM"]>>;
    contactId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    contactId?: string;
    opportunityId?: string;
    limit?: number;
    page?: number;
}, {
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    contactId?: string;
    opportunityId?: string;
    limit?: number;
    page?: number;
}>;
export declare const CreateTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description?: string;
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}, {
    description?: string;
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}>;
export declare const UpdateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}, {
    description?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}>;
declare const CreateActivityDto_base: import("nestjs-zod").ZodDto<{
    description?: string;
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    metadata?: Record<string, any>;
    contactId?: string;
    opportunityId?: string;
}, z.ZodObjectDef<{
    type: z.ZodEnum<["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "WHATSAPP", "SYSTEM"]>;
    description: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    contactId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    description?: string;
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    metadata?: Record<string, any>;
    contactId?: string;
    opportunityId?: string;
}>;
export declare class CreateActivityDto extends CreateActivityDto_base {
}
declare const ActivityQueryDto_base: import("nestjs-zod").ZodDto<{
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    contactId?: string;
    opportunityId?: string;
    limit?: number;
    page?: number;
}, z.ZodObjectDef<{
    type: z.ZodOptional<z.ZodEnum<["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "WHATSAPP", "SYSTEM"]>>;
    contactId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    type?: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "WHATSAPP" | "SYSTEM";
    contactId?: string;
    opportunityId?: string;
    limit?: number;
    page?: number;
}>;
export declare class ActivityQueryDto extends ActivityQueryDto_base {
}
declare const CreateTaskDto_base: import("nestjs-zod").ZodDto<{
    description?: string;
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}, z.ZodObjectDef<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    description?: string;
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}>;
export declare class CreateTaskDto extends CreateTaskDto_base {
}
declare const UpdateTaskDto_base: import("nestjs-zod").ZodDto<{
    description?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}, z.ZodObjectDef<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny>, {
    description?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    contactId?: string;
    assignedToId?: string;
    title?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
}>;
export declare class UpdateTaskDto extends UpdateTaskDto_base {
}
export {};
