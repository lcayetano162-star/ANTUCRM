import { Module } from '@nestjs/common';
import { QuotesController, MpsController } from './cpq.controller';
import { CpqService } from './cpq.service';

@Module({
  controllers: [QuotesController, MpsController],
  providers: [CpqService],
  exports: [CpqService],
})
export class CpqModule {}
