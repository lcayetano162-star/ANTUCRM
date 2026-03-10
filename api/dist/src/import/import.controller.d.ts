import { BulkImportService } from '../contacts/services/bulk-import.service';
export declare class ImportController {
    private readonly bulkImport;
    constructor(bulkImport: BulkImportService);
    importContacts(tenantId: string, userId: string, rows: any[]): Promise<import("../contacts/services/bulk-import.service").ImportResult>;
    importOpportunities(tenantId: string, userId: string, rows: any[]): Promise<import("../contacts/services/bulk-import.service").ImportResult>;
}
