import { AIProvider, AIResponse } from './ai-provider.interface';
export declare class OpenAICompatibleProvider implements AIProvider {
    readonly id: string;
    private readonly apiKey;
    private readonly modelName;
    private readonly baseUrl;
    constructor(id: string, apiKey: string, modelName: string, baseUrl?: string);
    generateResponse(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<AIResponse>;
}
