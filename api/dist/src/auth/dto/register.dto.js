"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    firstName: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    tenantId: zod_1.z.string().uuid('Tenant ID inválido'),
    roleId: zod_1.z.string().uuid('Role ID inválido').optional(),
});
class RegisterDto extends (0, nestjs_zod_1.createZodDto)(exports.RegisterSchema) {
}
exports.RegisterDto = RegisterDto;
//# sourceMappingURL=register.dto.js.map