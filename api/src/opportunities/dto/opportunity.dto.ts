import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateOpportunitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED']).default('LEAD'),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  contactId: z.string().uuid(),
  assignedToId: z.string().uuid().optional(),
});

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial().extend({
  status: z.enum(['OPEN', 'WON', 'LOST', 'CLOSED']).optional(),
  actualCloseDate: z.string().datetime().optional(),
});

export const OpportunityQuerySchema = z.object({
  stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED']).optional(),
  status: z.enum(['OPEN', 'WON', 'LOST', 'CLOSED']).optional(),
  assignedToId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export class CreateOpportunityDto extends createZodDto(CreateOpportunitySchema) {}
export class UpdateOpportunityDto extends createZodDto(UpdateOpportunitySchema) {}
export class OpportunityQueryDto extends createZodDto(OpportunityQuerySchema) {}
