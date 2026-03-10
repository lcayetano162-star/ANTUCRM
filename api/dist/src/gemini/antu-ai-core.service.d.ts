import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIResponse } from './providers/ai-provider.interface';
export declare class AntuAICore implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private providers;
    private activeProviderId;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    refreshProviders(): Promise<void>;
    generateAnalysis(tenantId: string, promptKey: string, dataPayload: any, userId: string): Promise<AIResponse>;
    detectGlobalAnomalies(): Promise<string>;
    private calculateEstimatedCost;
}
