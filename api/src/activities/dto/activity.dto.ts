import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP', 'SYSTEM']),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

export const ActivityQuerySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP', 'SYSTEM']).optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  contactId: z.string().uuid().optional(),
  assignedToId: z.string().uuid(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export class CreateActivityDto extends createZodDto(CreateActivitySchema) {}
export class ActivityQueryDto extends createZodDto(ActivityQuerySchema) {}
export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}
