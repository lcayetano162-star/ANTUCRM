import { PrismaService } from '../prisma/prisma.service';
export declare const DEFAULT_TENANT_SETTINGS: {
    fiscalStartMonth: number;
    currency: string;
    language: string;
    timezone: string;
    taxRate: number;
    invoicePrefix: string;
    quotePrefix: string;
    defaultPaymentTerms: number;
    companyLegalName: string;
    companyTaxId: string;
    enabledModules: {
        inventory: boolean;
        invoicing: boolean;
        cpq: boolean;
        service_desk: boolean;
        marketing: boolean;
        whatsapp: boolean;
        gov: boolean;
        ai: boolean;
    };
};
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(tenantId: string): Promise<any>;
    updateSettings(tenantId: string, updates: Record<string, any>): Promise<any>;
    getEnabledModules(tenantId: string): Promise<any>;
}
