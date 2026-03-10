import { z } from 'zod';
export declare const BulkActionSchema: z.ZodObject<{
    action: z.ZodEnum<["ASSIGN", "UPDATE_STATUS", "ADD_TAGS", "DELETE"]>;
    contactIds: z.ZodArray<z.ZodString, "many">;
    params: z.ZodOptional<z.ZodObject<{
        assignedToId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
        tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    }, {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    params?: {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    };
    action?: "DELETE" | "ASSIGN" | "UPDATE_STATUS" | "ADD_TAGS";
    contactIds?: string[];
}, {
    params?: {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    };
    action?: "DELETE" | "ASSIGN" | "UPDATE_STATUS" | "ADD_TAGS";
    contactIds?: string[];
}>;
declare const BulkActionDto_base: import("nestjs-zod").ZodDto<{
    params?: {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    };
    action?: "DELETE" | "ASSIGN" | "UPDATE_STATUS" | "ADD_TAGS";
    contactIds?: string[];
}, z.ZodObjectDef<{
    action: z.ZodEnum<["ASSIGN", "UPDATE_STATUS", "ADD_TAGS", "DELETE"]>;
    contactIds: z.ZodArray<z.ZodString, "many">;
    params: z.ZodOptional<z.ZodObject<{
        assignedToId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PROSPECT", "CUSTOMER", "CHURNED"]>>;
        tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    }, {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    }>>;
}, "strip", z.ZodTypeAny>, {
    params?: {
        status?: "ACTIVE" | "INACTIVE" | "PROSPECT" | "CUSTOMER" | "CHURNED";
        assignedToId?: string;
        tagIds?: string[];
    };
    action?: "DELETE" | "ASSIGN" | "UPDATE_STATUS" | "ADD_TAGS";
    contactIds?: string[];
}>;
export declare class BulkActionDto extends BulkActionDto_base {
}
export {};
