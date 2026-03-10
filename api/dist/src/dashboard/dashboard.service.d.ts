import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/types/auth.types';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSalesDashboard(tenantId: string, userId: string, userRole: UserRole, period: string): Promise<{
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
    getKPIs(tenantId: string, userId: string, userRole: UserRole, period: string): Promise<{
        totalRevenue: number;
        totalDeals: number;
        newContacts: number;
        activeOpportunities: number;
    }>;
    private getRecentActivities;
    private getTopOpportunities;
    private getSalesTrend;
    private getFunnelData;
    private getTopVendedores;
    getTeamMembers(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        active: boolean;
        joinDate: string;
    }[]>;
    private getRoleBasedWhereClause;
    private getPeriodStartDate;
}
