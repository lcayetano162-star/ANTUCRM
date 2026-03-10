import { Tenant } from '@prisma/client';
export interface FiscalYearBoundaries {
    startDate: Date;
    endDate: Date;
    fiscalYear: string;
}
export declare class FiscalYearEngine {
    static getFiscalYearBoundaries(tenant: Tenant, referenceDate?: Date): FiscalYearBoundaries;
    static getPrismaFiscalFilter(tenant: Tenant, referenceDate?: Date, dateField?: string): {
        [dateField]: {
            gte: Date;
            lte: Date;
        };
    };
}
