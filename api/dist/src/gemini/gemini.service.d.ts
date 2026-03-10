import { AntuAICore } from './antu-ai-core.service';
export declare class GeminiService {
    private readonly core;
    private readonly logger;
    constructor(core: AntuAICore);
    generateText(prompt: string, options?: any): Promise<{
        text: string;
        usage: {
            totalTokens: number;
        };
    }>;
    generateStructured<T>(prompt: string, schema: any, options?: any): Promise<T>;
    isAvailable(): boolean;
}
