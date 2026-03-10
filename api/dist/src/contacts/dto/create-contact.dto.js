"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContactDto = exports.CreateContactSchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.CreateContactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: zod_1.z.string().email('Email inválido').optional(),
    phone: zod_1.z.string().optional(),
    hasWhatsApp: zod_1.z.boolean().default(false),
    jobTitle: zod_1.z.string().optional(),
    isMainContact: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).default('PROSPECT'),
    companyId: zod_1.z.string().uuid('ID de empresa inválido').optional(),
    assignedToId: zod_1.z.string().uuid('ID de usuario inválido').optional(),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    avatar: zod_1.z.string().url('URL de avatar inválida').optional(),
});
class CreateContactDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateContactSchema) {
}
exports.CreateContactDto = CreateContactDto;
//# sourceMappingURL=create-contact.dto.js.map