import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryAIService {
    private readonly gemini;
    private readonly prisma;
    private readonly logger;
    constructor(gemini: GeminiService, prisma: PrismaService);
    predictDemand(tenantId: string): Promise<any[]>;
    optimizeLocation(tenantId: string, productId: string): Promise<any>;
    detectAnomalies(tenantId: string): Promise<any[]>;
}
