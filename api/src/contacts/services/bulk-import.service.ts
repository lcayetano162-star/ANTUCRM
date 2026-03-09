import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ImportContactRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string; // company name string, will be linked or created
  hasWhatsApp?: boolean;
  [key: string]: any;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

const BATCH_SIZE = 50;

@Injectable()
export class BulkImportService {
  constructor(private prisma: PrismaService) {}

  async importContacts(
    tenantId: string,
    userId: string,
    rows: ImportContactRow[],
  ): Promise<ImportResult> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('El archivo de importacion esta vacio');
    }
    if (rows.length > 5000) {
      throw new BadRequestException('Maximo 5000 registros por importacion');
    }

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    // Build company name -> id cache
    const companyCache = new Map<string, string>();
    const uniqueCompanyNames = [
      ...new Set(rows.map((r) => r.company).filter(Boolean)),
    ] as string[];
    for (const name of uniqueCompanyNames) {
      const existing = await this.prisma.company.findFirst({
        where: { tenantId, name },
      });
      if (existing) {
        companyCache.set(name, existing.id);
      } else {
        const created = await this.prisma.company.create({
          data: { name, tenantId },
        });
        companyCache.set(name, created.id);
      }
    }

    // Get existing emails to skip duplicates
    const inputEmails = rows.map((r) => r.email).filter(Boolean) as string[];
    const existingEmails = await this.prisma.contact.findMany({
      where: { tenantId, email: { in: inputEmails } },
      select: { email: true },
    });
    const existingEmailSet = new Set(existingEmails.map((c) => c.email));

    // Process in batches
    for (
      let batchStart = 0;
      batchStart < rows.length;
      batchStart += BATCH_SIZE
    ) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
      const toCreate: any[] = [];

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

        if (row.email) existingEmailSet.add(row.email);
      }

      if (toCreate.length > 0) {
        await this.prisma.contact.createMany({ data: toCreate });
        result.imported += toCreate.length;
      }
    }

    return result;
  }

  async importOpportunities(
    tenantId: string,
    userId: string,
    rows: any[],
  ): Promise<ImportResult> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('El archivo de importacion esta vacio');
    }
    if (rows.length > 2000) {
      throw new BadRequestException(
        'Maximo 2000 oportunidades por importacion',
      );
    }

    const result: ImportResult = {
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

    // Build contact cache by email for linking
    const inputContactEmails = rows
      .map((r) => r.contactEmail)
      .filter(Boolean) as string[];
    const contactCache = new Map<string, string>();
    if (inputContactEmails.length > 0) {
      const foundContacts = await this.prisma.contact.findMany({
        where: { tenantId, email: { in: inputContactEmails } },
        select: { id: true, email: true },
      });
      for (const c of foundContacts) {
        if (c.email) contactCache.set(c.email, c.id);
      }
    }

    // Fallback: get any existing contact for the tenant to satisfy the required FK
    let fallbackContactId: string | null = null;
    const fallbackContact = await this.prisma.contact.findFirst({
      where: { tenantId },
      select: { id: true },
    });
    if (fallbackContact) fallbackContactId = fallbackContact.id;

    for (
      let batchStart = 0;
      batchStart < rows.length;
      batchStart += BATCH_SIZE
    ) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
      const toCreate: any[] = [];

      for (let i = 0; i < batch.length; i++) {
        const rowIdx = batchStart + i + 1;
        const row = batch[i];

        if (!row.name) {
          result.errors.push({ row: rowIdx, reason: 'name es requerido' });
          result.skipped++;
          continue;
        }

        // Resolve contactId: from contactEmail field, or row.contactId directly, or fallback
        const resolvedContactId =
          (row.contactEmail && contactCache.get(row.contactEmail)) ||
          row.contactId ||
          fallbackContactId;

        if (!resolvedContactId) {
          result.errors.push({
            row: rowIdx,
            reason:
              'No se encontro un contacto valido. Proporcione contactEmail o contactId.',
          });
          result.skipped++;
          continue;
        }

        const stageRaw =
          row.stage && typeof row.stage === 'string'
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
}
