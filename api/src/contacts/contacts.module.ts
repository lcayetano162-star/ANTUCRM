import { Module } from '@nestjs/common';
import { ContactsController } from './controllers/contacts.controller';
import { ContactsService } from './services/contacts.service';
import { ContactsAIService } from './services/contacts-ai.service';
import { BulkImportService } from './services/bulk-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuditModule, ConfigModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsAIService, BulkImportService],
  exports: [ContactsService, ContactsAIService, BulkImportService],
})
export class ContactsModule { }
