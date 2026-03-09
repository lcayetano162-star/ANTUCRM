import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export class CreateCompanyDto extends createZodDto(CreateCompanySchema) {}
export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
