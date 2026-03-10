import { QuotasService } from './quotas.service';
import { BulkUpdateQuotaDto } from './dto/quota.dto';
export declare class QuotasController {
    private readonly quotasService;
    constructor(quotasService: QuotasService);
    getQuotas(req: any, yearStr: string): Promise<{
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
    saveQuotas(req: any, dto: BulkUpdateQuotaDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getPerformance(req: any, yearStr: string, period?: string, queryUserId?: string): Promise<{
        pacing: string;
        targetQuota: number;
        totalWon: number;
        forecast: number;
        forecastPercentage: string;
        winRate: string;
        averageTicket: string;
        salesOpsConfig: any;
    }>;
    getSalesOpsConfig(req: any, yearStr: string): Promise<{
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
    saveSalesOpsConfig(req: any, payload: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
