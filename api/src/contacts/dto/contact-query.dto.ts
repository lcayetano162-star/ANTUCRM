import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ContactQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
  industry: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  assignedToId: z.string().uuid().optional(),
  isMainContact: z.coerce.boolean().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt', 'score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  focus: z.enum(['CRITICAL', 'FOLLOW_UP', 'OPPORTUNITY', 'ENGAGEMENT', 'RISK']).optional(),
});

export class ContactQueryDto extends createZodDto(ContactQuerySchema) {}
