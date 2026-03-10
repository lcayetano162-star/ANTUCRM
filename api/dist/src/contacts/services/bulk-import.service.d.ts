import { PrismaService } from '../../prisma/prisma.service';
interface ImportContactRow {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    company?: string;
    hasWhatsApp?: boolean;
    [key: string]: any;
}
export interface ImportResult {
    total: number;
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        reason: string;
    }>;
}
export declare class BulkImportService {
    private prisma;
    constructor(prisma: PrismaService);
    importContacts(tenantId: string, userId: string, rows: ImportContactRow[]): Promise<ImportResult>;
    importOpportunities(tenantId: string, userId: string, rows: any[]): Promise<ImportResult>;
}
export {};
