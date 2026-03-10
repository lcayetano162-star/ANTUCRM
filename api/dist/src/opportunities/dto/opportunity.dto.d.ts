import { z } from 'zod';
export declare const CreateOpportunitySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stage: z.ZodDefault<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>;
    value: z.ZodOptional<z.ZodNumber>;
    probability: z.ZodOptional<z.ZodNumber>;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    contactId: z.ZodString;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    value?: number;
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
}, {
    name?: string;
    description?: string;
    value?: number;
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
}>;
export declare const UpdateOpportunitySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    stage: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>>;
    value: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    probability: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    expectedCloseDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["OPEN", "WON", "LOST", "CLOSED"]>>;
    actualCloseDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    value?: number;
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
    actualCloseDate?: string;
}, {
    name?: string;
    description?: string;
    value?: number;
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
    actualCloseDate?: string;
}>;
export declare const OpportunityQuerySchema: z.ZodObject<{
    stage: z.ZodOptional<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "WON", "LOST", "CLOSED"]>>;
    assignedToId: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    search?: string;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    limit?: number;
    page?: number;
}, {
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    search?: string;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    limit?: number;
    page?: number;
}>;
declare const CreateOpportunityDto_base: import("nestjs-zod").ZodDto<{
    name?: string;
    description?: string;
    value?: number;
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
}, z.ZodObjectDef<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stage: z.ZodDefault<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>;
    value: z.ZodOptional<z.ZodNumber>;
    probability: z.ZodOptional<z.ZodNumber>;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    contactId: z.ZodString;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    name?: string;
    description?: string;
    value?: number;
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
}>;
export declare class CreateOpportunityDto extends CreateOpportunityDto_base {
}
declare const UpdateOpportunityDto_base: import("nestjs-zod").ZodDto<{
    name?: string;
    description?: string;
    value?: number;
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
    actualCloseDate?: string;
}, z.ZodObjectDef<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    stage: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>>;
    value: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    probability: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    expectedCloseDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["OPEN", "WON", "LOST", "CLOSED"]>>;
    actualCloseDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    name?: string;
    description?: string;
    value?: number;
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    probability?: number;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    expectedCloseDate?: string;
    actualCloseDate?: string;
}>;
export declare class UpdateOpportunityDto extends UpdateOpportunityDto_base {
}
declare const OpportunityQueryDto_base: import("nestjs-zod").ZodDto<{
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    search?: string;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    limit?: number;
    page?: number;
}, z.ZodObjectDef<{
    stage: z.ZodOptional<z.ZodEnum<["LEAD", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED"]>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "WON", "LOST", "CLOSED"]>>;
    assignedToId: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: "WON" | "OPEN" | "LOST" | "CLOSED";
    search?: string;
    contactId?: string;
    assignedToId?: string;
    stage?: "CLOSED" | "LEAD" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION";
    limit?: number;
    page?: number;
}>;
export declare class OpportunityQueryDto extends OpportunityQueryDto_base {
}
export {};
