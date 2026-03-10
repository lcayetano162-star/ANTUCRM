import { PrismaService } from '../prisma/prisma.service';
import { BulkUpdateQuotaDto } from './dto/quota.dto';
export declare class QuotasService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getQuotas(tenantId: string, year: number): Promise<{
        companyQuotas: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.QuotaType;
            userId: string | null;
            period: import(".prisma/client").$Enums.QuotaPeriod;
            amount: number;
            currency: string;
            year: number;
        })[];
        userQuotas: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.QuotaType;
            userId: string | null;
            period: import(".prisma/client").$Enums.QuotaPeriod;
            amount: number;
            currency: string;
            year: number;
        })[];
        users: {
            role: {
                name: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        }[];
    }>;
    saveQuotas(tenantId: string, payload: BulkUpdateQuotaDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getPerformance(tenantId: string, userId: string, role: string, year: number, periodStr?: string): Promise<{
        pacing: string;
        targetQuota: number;
        totalWon: number;
        forecast: number;
        forecastPercentage: string;
        winRate: string;
        averageTicket: string;
        salesOpsConfig: any;
    }>;
    getSalesOpsConfig(tenantId: string, year: number): Promise<{
        seller: {
            weeklyVisits: number;
            weeklyCalls: number;
            newOpps: number;
            speedToLead: number;
            followUpRate: number;
        };
        manager: {
            pipelineHealth: number;
            coachingSessions: number;
            forecastAccuracy: number;
            teamQuota: number;
        };
    }>;
    saveSalesOpsConfig(tenantId: string, payload: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
