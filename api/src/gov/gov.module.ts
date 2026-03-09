import { Module } from '@nestjs/common';
import { GovController } from './gov.controller';
import { GovService } from './gov.service';

@Module({
  controllers: [GovController],
  providers: [GovService],
  exports: [GovService],
})
export class GovModule {}
