import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Default settings shape for new/clean tenants
export const DEFAULT_TENANT_SETTINGS = {
  fiscalStartMonth: 1,
  currency: 'DOP',
  language: 'es',
  timezone: 'America/Santo_Domingo',
  taxRate: 0.18,
  invoicePrefix: 'INV',
  quotePrefix: 'QT',
  defaultPaymentTerms: 30,
  companyLegalName: '',
  companyTaxId: '',
  enabledModules: {
    inventory: true, invoicing: true, cpq: true,
    service_desk: true, marketing: true, whatsapp: true,
    gov: false, ai: true,
  },
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true, id: true },
    });
    const saved = (tenant?.settings as any) || {};
    // Merge defaults with saved so new fields always have a value
    return { ...DEFAULT_TENANT_SETTINGS, ...saved };
  }

  async updateSettings(tenantId: string, updates: Record<string, any>) {
    const current = await this.getSettings(tenantId);
    // Only update known keys (whitelist)
    const allowed = Object.keys(DEFAULT_TENANT_SETTINGS);
    const clean: Record<string, any> = {};
    for (const key of allowed) {
      if (key in updates) {
        if (key === 'fiscalStartMonth') {
          const v = Number(updates[key]);
          if (isNaN(v) || v < 1 || v > 12) continue;
          clean[key] = v;
        } else if (key === 'taxRate') {
          const v = Number(updates[key]);
          if (isNaN(v) || v < 0 || v > 1) continue;
          clean[key] = v;
        } else if (key === 'enabledModules') {
          clean[key] = { ...current.enabledModules, ...updates[key] };
        } else {
          clean[key] = updates[key];
        }
      }
    }
    const merged = { ...current, ...clean };
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { settings: merged } });
    return merged;
  }

  async getEnabledModules(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    return settings.enabledModules;
  }
}
