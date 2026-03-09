import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateContactSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  hasWhatsApp: z.boolean().default(false),
  jobTitle: z.string().optional(),
  isMainContact: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).default('PROSPECT'),
  companyId: z.string().uuid('ID de empresa inválido').optional(),
  assignedToId: z.string().uuid('ID de usuario inválido').optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  avatar: z.string().url('URL de avatar inválida').optional(),
});

export class CreateContactDto extends createZodDto(CreateContactSchema) {}
