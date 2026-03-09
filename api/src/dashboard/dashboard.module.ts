import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAIService } from './dashboard-ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../gemini/gemini.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardAIService],
  exports: [DashboardService, DashboardAIService],
})
export class DashboardModule { }
