import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token requerido'),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
