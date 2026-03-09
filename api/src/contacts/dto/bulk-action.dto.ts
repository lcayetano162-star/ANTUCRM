import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const BulkActionSchema = z.object({
  action: z.enum(['ASSIGN', 'UPDATE_STATUS', 'ADD_TAGS', 'DELETE']),
  contactIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un contacto'),
  params: z.object({
    assignedToId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }).optional(),
});

export class BulkActionDto extends createZodDto(BulkActionSchema) {}
