import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryAIService } from './inventory-ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../gemini/gemini.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryAIService],
  exports: [InventoryService, InventoryAIService],
})
export class InventoryModule { }
