import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuotaPeriod, QuotaType } from '@prisma/client';

export class CreateQuotaDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsInt()
    year: number;

    @IsEnum(QuotaPeriod)
    period: QuotaPeriod;

    @IsEnum(QuotaType)
    type: QuotaType;

    @IsNumber()
    amount: number;

    @IsString()
    currency: string;
}

export class BulkUpdateQuotaDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuotaDto)
    quotas: CreateQuotaDto[];
}
