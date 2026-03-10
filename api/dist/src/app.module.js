"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const nestjs_zod_1 = require("nestjs-zod");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const audit_module_1 = require("./audit/audit.module");
const gemini_module_1 = require("./gemini/gemini.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const contacts_module_1 = require("./contacts/contacts.module");
const inventory_module_1 = require("./inventory/inventory.module");
const billing_module_1 = require("./billing/billing.module");
const quotas_module_1 = require("./quotas/quotas.module");
const opportunities_module_1 = require("./opportunities/opportunities.module");
const activities_module_1 = require("./activities/activities.module");
const cpq_module_1 = require("./cpq/cpq.module");
const invoicing_module_1 = require("./invoicing/invoicing.module");
const service_desk_module_1 = require("./service-desk/service-desk.module");
const super_admin_module_1 = require("./super-admin/super-admin.module");
const companies_module_1 = require("./companies/companies.module");
const marketing_module_1 = require("./marketing/marketing.module");
const email_module_1 = require("./email/email.module");
const gov_module_1 = require("./gov/gov.module");
const interactions_module_1 = require("./interactions/interactions.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const ai_module_1 = require("./ai/ai.module");
const import_module_1 = require("./import/import.module");
const settings_module_1 = require("./settings/settings.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("./common/guards/tenant.guard");
const subscription_guard_1 = require("./common/guards/subscription.guard");
const audit_interceptor_1 = require("./audit/audit.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            audit_module_1.AuditModule,
            gemini_module_1.AIModule,
            dashboard_module_1.DashboardModule,
            contacts_module_1.ContactsModule,
            inventory_module_1.InventoryModule,
            billing_module_1.BillingModule,
            quotas_module_1.QuotasModule,
            opportunities_module_1.OpportunitiesModule,
            activities_module_1.ActivitiesModule,
            cpq_module_1.CpqModule,
            invoicing_module_1.InvoicingModule,
            service_desk_module_1.ServiceDeskModule,
            super_admin_module_1.SuperAdminModule,
            companies_module_1.CompaniesModule,
            marketing_module_1.MarketingModule,
            email_module_1.EmailModule,
            gov_module_1.GovModule,
            interactions_module_1.InteractionsModule,
            whatsapp_module_1.WhatsAppModule,
            ai_module_1.AITenantModule,
            import_module_1.ImportModule,
            settings_module_1.SettingsModule,
        ],
        providers: [
            {
                provide: core_1.APP_PIPE,
                useClass: nestjs_zod_1.ZodValidationPipe,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: subscription_guard_1.SubscriptionGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_guard_1.TenantGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map