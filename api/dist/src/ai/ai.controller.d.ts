import { AIService } from './ai.service';
export declare class AIController {
    private readonly service;
    constructor(service: AIService);
    getDailyBriefing(tenantId: string, userId: string): Promise<any>;
    analyzeContact(id: string, tenantId: string, userId: string): Promise<unknown>;
    scoreDeal(id: string, tenantId: string): Promise<{
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
