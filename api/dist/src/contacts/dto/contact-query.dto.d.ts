import { z } from 'zod';
export declare const ContactQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    industry: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignedToId: z.ZodOptional<z.ZodString>;
    isMainContact: z.ZodOptional<z.ZodBoolean>;
    sortBy: z.ZodOptional<z.ZodEnum<["firstName", "lastName", "createdAt", "updatedAt", "score"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    focus: z.ZodOptional<z.ZodEnum<["CRITICAL", "FOLLOW_UP", "OPPORTUNITY", "ENGAGEMENT", "RISK"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    search?: string;
    isMainContact?: boolean;
    assignedToId?: string;
    industry?: string;
    limit?: number;
    page?: number;
    tagIds?: string[];
    sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "score";
    sortOrder?: "asc" | "desc";
    focus?: "CRITICAL" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK";
}, {
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    search?: string;
    isMainContact?: boolean;
    assignedToId?: string;
    industry?: string;
    limit?: number;
    page?: number;
    tagIds?: string[];
    sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "score";
    sortOrder?: "asc" | "desc";
    focus?: "CRITICAL" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK";
}>;
declare const ContactQueryDto_base: import("nestjs-zod").ZodDto<{
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    search?: string;
    isMainContact?: boolean;
    assignedToId?: string;
    industry?: string;
    limit?: number;
    page?: number;
    tagIds?: string[];
    sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "score";
    sortOrder?: "asc" | "desc";
    focus?: "CRITICAL" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK";
}, z.ZodObjectDef<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    industry: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignedToId: z.ZodOptional<z.ZodString>;
    isMainContact: z.ZodOptional<z.ZodBoolean>;
    sortBy: z.ZodOptional<z.ZodEnum<["firstName", "lastName", "createdAt", "updatedAt", "score"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    focus: z.ZodOptional<z.ZodEnum<["CRITICAL", "FOLLOW_UP", "OPPORTUNITY", "ENGAGEMENT", "RISK"]>>;
}, "strip", z.ZodTypeAny>, {
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    search?: string;
    isMainContact?: boolean;
    assignedToId?: string;
    industry?: string;
    limit?: number;
    page?: number;
    tagIds?: string[];
    sortBy?: "firstName" | "lastName" | "createdAt" | "updatedAt" | "score";
    sortOrder?: "asc" | "desc";
    focus?: "CRITICAL" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK";
}>;
export declare class ContactQueryDto extends ContactQueryDto_base {
}
export {};
