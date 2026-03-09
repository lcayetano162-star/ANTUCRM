import { Module } from '@nestjs/common';
import { ServiceDeskController } from './service-desk.controller';
import { ServiceDeskService } from './service-desk.service';

@Module({
  controllers: [ServiceDeskController],
  providers: [ServiceDeskService],
  exports: [ServiceDeskService],
})
export class ServiceDeskModule {}
