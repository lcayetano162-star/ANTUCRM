import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/types/auth.types';
export declare class DashboardAIService {
    private readonly gemini;
    private readonly prisma;
    private readonly logger;
    constructor(gemini: GeminiService, prisma: PrismaService);
    generateInsights(tenantId: string, userId: string, userRole: UserRole): Promise<any[]>;
    private getDefaultInsights;
    private getRoleBasedWhereClause;
}
