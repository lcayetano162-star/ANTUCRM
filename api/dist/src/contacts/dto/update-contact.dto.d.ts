import { z } from 'zod';
export declare const UpdateContactSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hasWhatsApp: z.ZodOptional<z.ZodBoolean>;
    jobTitle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isMainContact: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    companyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avatar: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    phone?: string;
    hasWhatsApp?: boolean;
    jobTitle?: string;
    isMainContact?: boolean;
    companyId?: string;
    assignedToId?: string;
    tagIds?: string[];
}, {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    phone?: string;
    hasWhatsApp?: boolean;
    jobTitle?: string;
    isMainContact?: boolean;
    companyId?: string;
    assignedToId?: string;
    tagIds?: string[];
}>;
declare const UpdateContactDto_base: import("nestjs-zod").ZodDto<{
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    phone?: string;
    hasWhatsApp?: boolean;
    jobTitle?: string;
    isMainContact?: boolean;
    companyId?: string;
    assignedToId?: string;
    tagIds?: string[];
}, z.ZodObjectDef<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hasWhatsApp: z.ZodOptional<z.ZodBoolean>;
    jobTitle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isMainContact: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    companyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avatar: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny>, {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
    phone?: string;
    hasWhatsApp?: boolean;
    jobTitle?: string;
    isMainContact?: boolean;
    companyId?: string;
    assignedToId?: string;
    tagIds?: string[];
}>;
export declare class UpdateContactDto extends UpdateContactDto_base {
}
export {};
