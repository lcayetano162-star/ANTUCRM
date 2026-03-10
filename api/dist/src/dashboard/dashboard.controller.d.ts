import { DashboardService } from './dashboard.service';
import { DashboardAIService } from './dashboard-ai.service';
import { UserRole } from '../auth/types/auth.types';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly aiService;
    constructor(dashboardService: DashboardService, aiService: DashboardAIService);
    getSalesDashboard(tenantId: string, userId: string, userRole: UserRole, period?: string, queryUserId?: string): Promise<{
        kpis: {
            totalRevenue: number;
            totalDeals: number;
            newContacts: number;
            activeOpportunities: number;
        };
        recentActivities: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            description: string;
            id: string;
            createdAt: Date;
            tenantId: string;
            type: import(".prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            contactId: string | null;
            opportunityId: string | null;
            createdById: string;
        })[];
        topOpportunities: ({
            contact: {
                company: {
                    name: string;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            value: number | null;
            status: import(".prisma/client").$Enums.OpportunityStatus;
            probability: number | null;
            contactId: string;
            assignedToId: string | null;
            stage: import(".prisma/client").$Enums.OpportunityStage;
            expectedCloseDate: Date | null;
            actualCloseDate: Date | null;
        })[];
        salesTrend: {
            month: string;
            value: number;
            count: number;
        }[];
        funnel: {
            stage: import(".prisma/client").$Enums.OpportunityStage;
            count: number;
            value: number;
        }[];
        topVendedores: {
            name: string;
            value: number;
            percentage: number;
        }[];
        period: string;
    }>;
    getAIInsights(tenantId: string, userId: string, userRole: UserRole): Promise<any[]>;
    getKPIs(tenantId: string, userId: string, userRole: UserRole, period?: string): Promise<{
        totalRevenue: number;
        totalDeals: number;
        newContacts: number;
        activeOpportunities: number;
    }>;
    getTeam(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        active: boolean;
        joinDate: string;
    }[]>;
}
