import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';

// Módulos de la aplicación
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { AIModule } from './gemini/gemini.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContactsModule } from './contacts/contacts.module';
import { InventoryModule } from './inventory/inventory.module';
import { BillingModule } from './billing/billing.module';
import { QuotasModule } from './quotas/quotas.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { ActivitiesModule } from './activities/activities.module';
import { CpqModule } from './cpq/cpq.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { ServiceDeskModule } from './service-desk/service-desk.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { CompaniesModule } from './companies/companies.module';
import { MarketingModule } from './marketing/marketing.module';
import { EmailModule } from './email/email.module';
import { GovModule } from './gov/gov.module';
import { InteractionsModule } from './interactions/interactions.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AITenantModule } from './ai/ai.module';
import { ImportModule } from './import/import.module';
import { SettingsModule } from './settings/settings.module';

// Guards y middlewares
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting global: 100 req / 60s por IP (endpoints de auth tienen su propio guard más estricto)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Módulos core
    PrismaModule,
    AuthModule,
    HealthModule,
    AuditModule,
    AIModule,

    // Módulos de negocio
    DashboardModule,
    ContactsModule,
    InventoryModule,
    BillingModule,
    QuotasModule,
    OpportunitiesModule,
    ActivitiesModule,
    CpqModule,
    InvoicingModule,
    ServiceDeskModule,
    SuperAdminModule,
    CompaniesModule,
    MarketingModule,
    EmailModule,
    GovModule,
    InteractionsModule,
    WhatsAppModule,
    AITenantModule,
    ImportModule,
    SettingsModule,
  ],
  providers: [
    // Pipes globales
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },

    // Guards globales
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },

    // Interceptores globales
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule { }
