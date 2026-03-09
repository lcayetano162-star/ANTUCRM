import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { BulkImportService } from '../contacts/services/bulk-import.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImportController],
  providers: [BulkImportService],
})
export class ImportModule {}
