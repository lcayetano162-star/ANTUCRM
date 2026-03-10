import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
declare const LoginDto_base: import("nestjs-zod").ZodDto<{
    email?: string;
    password?: string;
}, z.ZodObjectDef<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    email?: string;
    password?: string;
}>;
export declare class LoginDto extends LoginDto_base {
}
export {};
