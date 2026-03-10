"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContactDto = exports.UpdateContactSchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.UpdateContactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    lastName: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
    email: zod_1.z.string().email('Email inválido').optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    hasWhatsApp: zod_1.z.boolean().optional(),
    jobTitle: zod_1.z.string().optional().nullable(),
    isMainContact: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
    companyId: zod_1.z.string().uuid('ID de empresa inválido').optional().nullable(),
    assignedToId: zod_1.z.string().uuid('ID de usuario inválido').optional(),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    avatar: zod_1.z.string().url('URL de avatar inválida').optional().nullable(),
});
class UpdateContactDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateContactSchema) {
}
exports.UpdateContactDto = UpdateContactDto;
//# sourceMappingURL=update-contact.dto.js.map