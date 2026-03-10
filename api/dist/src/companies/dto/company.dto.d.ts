import { z } from 'zod';
export declare const CreateCompanySchema: z.ZodObject<{
    name: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}>;
export declare const UpdateCompanySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}>;
declare const CreateCompanyDto_base: import("nestjs-zod").ZodDto<{
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}, z.ZodObjectDef<{
    name: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}>;
export declare class CreateCompanyDto extends CreateCompanyDto_base {
}
declare const UpdateCompanyDto_base: import("nestjs-zod").ZodDto<{
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}, z.ZodObjectDef<{
    name: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny>, {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
}>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
}
export {};
