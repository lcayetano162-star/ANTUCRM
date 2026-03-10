import { QuotaPeriod, QuotaType } from '@prisma/client';
export declare class CreateQuotaDto {
    id?: string;
    userId?: string;
    year: number;
    period: QuotaPeriod;
    type: QuotaType;
    amount: number;
    currency: string;
}
export declare class BulkUpdateQuotaDto {
    quotas: CreateQuotaDto[];
}
