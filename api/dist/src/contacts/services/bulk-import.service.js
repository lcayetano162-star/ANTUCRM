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
exports.BulkImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const BATCH_SIZE = 50;
let BulkImportService = class BulkImportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importContacts(tenantId, userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new common_1.BadRequestException('El archivo de importacion esta vacio');
        }
        if (rows.length > 5000) {
            throw new common_1.BadRequestException('Maximo 5000 registros por importacion');
        }
        const result = {
            total: rows.length,
            imported: 0,
            skipped: 0,
            errors: [],
        };
        const companyCache = new Map();
        const uniqueCompanyNames = [
            ...new Set(rows.map((r) => r.company).filter(Boolean)),
        ];
        for (const name of uniqueCompanyNames) {
            const existing = await this.prisma.company.findFirst({
                where: { tenantId, name },
            });
            if (existing) {
                companyCache.set(name, existing.id);
            }
            else {
                const created = await this.prisma.company.create({
                    data: { name, tenantId },
                });
                companyCache.set(name, created.id);
            }
        }
        const inputEmails = rows.map((r) => r.email).filter(Boolean);
        const existingEmails = await this.prisma.contact.findMany({
            where: { tenantId, email: { in: inputEmails } },
            select: { email: true },
        });
        const existingEmailSet = new Set(existingEmails.map((c) => c.email));
        for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
            const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
            const toCreate = [];
            for (let i = 0; i < batch.length; i++) {
                const rowIdx = batchStart + i + 1;
                const row = batch[i];
                if (!row.firstName || !row.lastName) {
                    result.errors.push({
                        row: rowIdx,
                        reason: 'firstName y lastName son requeridos',
                    });
                    result.skipped++;
                    continue;
                }
                if (row.email && existingEmailSet.has(row.email)) {
                    result.errors.push({
                        row: rowIdx,
                        reason: `Email duplicado: ${row.email}`,
                    });
                    result.skipped++;
                    continue;
                }
                const companyId = row.company
                    ? companyCache.get(row.company)
                    : undefined;
                toCreate.push({
                    firstName: String(row.firstName).trim().slice(0, 100),
                    lastName: String(row.lastName).trim().slice(0, 100),
                    email: row.email
                        ? String(row.email).trim().toLowerCase().slice(0, 200)
                        : null,
                    phone: row.phone ? String(row.phone).trim().slice(0, 30) : null,
                    jobTitle: row.jobTitle
                        ? String(row.jobTitle).trim().slice(0, 100)
                        : null,
                    hasWhatsApp: Boolean(row.hasWhatsApp),
                    companyId: companyId || null,
                    tenantId,
                    assignedToId: userId,
                    status: 'PROSPECT',
                });
                if (row.email)
                    existingEmailSet.add(row.email);
            }
            if (toCreate.length > 0) {
                await this.prisma.contact.createMany({ data: toCreate });
                result.imported += toCreate.length;
            }
        }
        return result;
    }
    async importOpportunities(tenantId, userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new common_1.BadRequestException('El archivo de importacion esta vacio');
        }
        if (rows.length > 2000) {
            throw new common_1.BadRequestException('Maximo 2000 oportunidades por importacion');
        }
        const result = {
            total: rows.length,
            imported: 0,
            skipped: 0,
            errors: [],
        };
        const validStages = [
            'LEAD',
            'QUALIFICATION',
            'PROPOSAL',
            'NEGOTIATION',
            'CLOSED',
        ];
        const inputContactEmails = rows
            .map((r) => r.contactEmail)
            .filter(Boolean);
        const contactCache = new Map();
        if (inputContactEmails.length > 0) {
            const foundContacts = await this.prisma.contact.findMany({
                where: { tenantId, email: { in: inputContactEmails } },
                select: { id: true, email: true },
            });
            for (const c of foundContacts) {
                if (c.email)
                    contactCache.set(c.email, c.id);
            }
        }
        let fallbackContactId = null;
        const fallbackContact = await this.prisma.contact.findFirst({
            where: { tenantId },
            select: { id: true },
        });
        if (fallbackContact)
            fallbackContactId = fallbackContact.id;
        for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
            const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
            const toCreate = [];
            for (let i = 0; i < batch.length; i++) {
                const rowIdx = batchStart + i + 1;
                const row = batch[i];
                if (!row.name) {
                    result.errors.push({ row: rowIdx, reason: 'name es requerido' });
                    result.skipped++;
                    continue;
                }
                const resolvedContactId = (row.contactEmail && contactCache.get(row.contactEmail)) ||
                    row.contactId ||
                    fallbackContactId;
                if (!resolvedContactId) {
                    result.errors.push({
                        row: rowIdx,
                        reason: 'No se encontro un contacto valido. Proporcione contactEmail o contactId.',
                    });
                    result.skipped++;
                    continue;
                }
                const stageRaw = row.stage && typeof row.stage === 'string'
                    ? row.stage.toUpperCase()
                    : 'LEAD';
                const stage = validStages.includes(stageRaw) ? stageRaw : 'LEAD';
                toCreate.push({
                    name: String(row.name).trim().slice(0, 200),
                    stage,
                    value: row.value ? Math.abs(Number(row.value)) : 0,
                    probability: row.probability
                        ? Math.min(100, Math.max(0, Number(row.probability)))
                        : 50,
                    description: row.description
                        ? String(row.description).trim().slice(0, 1000)
                        : null,
                    expectedCloseDate: row.expectedCloseDate
                        ? new Date(row.expectedCloseDate)
                        : null,
                    tenantId,
                    contactId: resolvedContactId,
                    assignedToId: userId,
                });
            }
            if (toCreate.length > 0) {
                await this.prisma.opportunity.createMany({ data: toCreate });
                result.imported += toCreate.length;
            }
        }
        return result;
    }
};
exports.BulkImportService = BulkImportService;
exports.BulkImportService = BulkImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BulkImportService);
//# sourceMappingURL=bulk-import.service.js.map