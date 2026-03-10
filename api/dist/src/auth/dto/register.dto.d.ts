import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    tenantId: z.ZodString;
    roleId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
    roleId?: string;
    password?: string;
}, {
    email?: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
    roleId?: string;
    password?: string;
}>;
declare const RegisterDto_base: import("nestjs-zod").ZodDto<{
    email?: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
    roleId?: string;
    password?: string;
}, z.ZodObjectDef<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    tenantId: z.ZodString;
    roleId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    email?: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
    roleId?: string;
    password?: string;
}>;
export declare class RegisterDto extends RegisterDto_base {
}
export {};
