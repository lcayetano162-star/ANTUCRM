import { AIProvider, AIResponse } from './ai-provider.interface';
export declare class GeminiProvider implements AIProvider {
    id: string;
    private genAI;
    constructor(apiKey: string);
    generateResponse(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<AIResponse>;
}
