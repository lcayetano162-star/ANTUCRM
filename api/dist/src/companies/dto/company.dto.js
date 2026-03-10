"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCompanyDto = exports.CreateCompanyDto = exports.UpdateCompanySchema = exports.CreateCompanySchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.CreateCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    industry: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.UpdateCompanySchema = exports.CreateCompanySchema.partial();
class CreateCompanyDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateCompanySchema) {
}
exports.CreateCompanyDto = CreateCompanyDto;
class UpdateCompanyDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateCompanySchema) {
}
exports.UpdateCompanyDto = UpdateCompanyDto;
//# sourceMappingURL=company.dto.js.map