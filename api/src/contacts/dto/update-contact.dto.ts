import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateContactSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  hasWhatsApp: z.boolean().optional(),
  jobTitle: z.string().optional().nullable(),
  isMainContact: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
  companyId: z.string().uuid('ID de empresa inválido').optional().nullable(),
  assignedToId: z.string().uuid('ID de usuario inválido').optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  avatar: z.string().url('URL de avatar inválida').optional().nullable(),
});

export class UpdateContactDto extends createZodDto(UpdateContactSchema) {}
