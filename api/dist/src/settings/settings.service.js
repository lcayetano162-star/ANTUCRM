"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.DEFAULT_TENANT_SETTINGS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DEFAULT_TENANT_SETTINGS = {
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
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true, name: true, id: true },
        });
        const saved = tenant?.settings || {};
        return { ...exports.DEFAULT_TENANT_SETTINGS, ...saved };
    }
    async updateSettings(tenantId, updates) {
        const current = await this.getSettings(tenantId);
        const allowed = Object.keys(exports.DEFAULT_TENANT_SETTINGS);
        const clean = {};
        for (const key of allowed) {
            if (key in updates) {
                if (key === 'fiscalStartMonth') {
                    const v = Number(updates[key]);
                    if (isNaN(v) || v < 1 || v > 12)
                        continue;
                    clean[key] = v;
                }
                else if (key === 'taxRate') {
                    const v = Number(updates[key]);
                    if (isNaN(v) || v < 0 || v > 1)
                        continue;
                    clean[key] = v;
                }
                else if (key === 'enabledModules') {
                    clean[key] = { ...current.enabledModules, ...updates[key] };
                }
                else {
                    clean[key] = updates[key];
                }
            }
        }
        const merged = { ...current, ...clean };
        await this.prisma.tenant.update({ where: { id: tenantId }, data: { settings: merged } });
        return merged;
    }
    async getEnabledModules(tenantId) {
        const settings = await this.getSettings(tenantId);
        return settings.enabledModules;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map