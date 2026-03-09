import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AIInsightActionSchema = z.object({
  label: z.string(),
  route: z.string().optional(),
  params: z.record(z.any()).optional(),
});

export const AIInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['CRITICAL_ALERT', 'FOLLOW_UP', 'OPPORTUNITY', 'ENGAGEMENT', 'RISK']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  title: z.string(),
  description: z.string(),
  action: AIInsightActionSchema,
});

export class AIInsightDto extends createZodDto(AIInsightSchema) {}

export const ContactScoringSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(z.object({
    name: z.string(),
    weight: z.number(),
    contribution: z.number(),
  })),
  explanation: z.string(),
});

export class ContactScoringDto extends createZodDto(ContactScoringSchema) {}

export const NextBestActionSchema = z.object({
  action: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'WAIT']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  reason: z.string(),
  suggestedTime: z.string().optional(),
  suggestedMessage: z.string().optional(),
});

export class NextBestActionDto extends createZodDto(NextBestActionSchema) {}
