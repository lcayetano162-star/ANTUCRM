import { z } from 'zod';
export declare const CreateContactSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    hasWhatsApp: z.ZodDefault<z.ZodBoolean>;
    jobTitle: z.ZodOptional<z.ZodString>;
    isMainContact: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    companyId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avatar: z.ZodOptional<z.ZodString>;
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
declare const CreateContactDto_base: import("nestjs-zod").ZodDto<{
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
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    hasWhatsApp: z.ZodDefault<z.ZodBoolean>;
    jobTitle: z.ZodOptional<z.ZodString>;
    isMainContact: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
    companyId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avatar: z.ZodOptional<z.ZodString>;
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
export declare class CreateContactDto extends CreateContactDto_base {
}
export {};
