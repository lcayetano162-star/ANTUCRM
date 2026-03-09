import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  tenantId: z.string().uuid('Tenant ID inválido'),
  roleId: z.string().uuid('Role ID inválido').optional(),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
