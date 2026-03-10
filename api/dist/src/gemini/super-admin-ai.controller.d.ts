import { PrismaService } from '../prisma/prisma.service';
import { AntuAICore } from './antu-ai-core.service';
export declare class SuperAdminAIController {
    private readonly prisma;
    private readonly aiCore;
    constructor(prisma: PrismaService, aiCore: AntuAICore);
    getProviders(user: any): Promise<any[]>;
    updateProvider(user: any, id: string, body: any): Promise<{
        apiKey: string;
        id: string;
        isActive: boolean;
    }>;
    getPrompts(user: any): Promise<{
        id: string;
    }[]>;
    updatePrompt(user: any, id: string, body: any): Promise<{
        id: string;
    }>;
    getUsage(user: any, tenantId?: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
    }[]>;
    executiveAnalysis(user: any): Promise<{
        analysis: string;
    }>;
}
