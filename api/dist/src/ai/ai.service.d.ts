import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
export declare class AIService {
    private prisma;
    private gemini;
    constructor(prisma: PrismaService, gemini: GeminiService);
    getDailyBriefing(tenantId: string, _userId: string): Promise<any>;
    analyzeContact(contactId: string, tenantId: string, _userId: string): Promise<unknown>;
    scoreDeal(opportunityId: string, tenantId: string): Promise<{
        error: string;
        score?: undefined;
        label?: undefined;
        factors?: undefined;
        opportunityId?: undefined;
    } | {
        score: number;
        label: string;
        factors: string[];
        opportunityId: string;
        error?: undefined;
    }>;
    getForecast(tenantId: string): Promise<{
        totalPipeline: number;
        weightedForecast: number;
        pessimistic: number;
        realistic: number;
        optimistic: number;
        dealCount: number;
    }>;
}
