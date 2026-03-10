import { z } from 'zod';
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
}, {
    refreshToken?: string;
}>;
declare const RefreshTokenDto_base: import("nestjs-zod").ZodDto<{
    refreshToken?: string;
}, z.ZodObjectDef<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    refreshToken?: string;
}>;
export declare class RefreshTokenDto extends RefreshTokenDto_base {
}
export {};
