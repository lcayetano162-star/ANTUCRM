import { Module, Global } from '@nestjs/common';
import { AntuAICore } from './antu-ai-core.service';
import { GeminiService } from './gemini.service';
import { SuperAdminAIController } from './super-admin-ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Global()
@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [SuperAdminAIController],
  providers: [AntuAICore, GeminiService],
  exports: [AntuAICore, GeminiService],
})
export class AIModule { }
