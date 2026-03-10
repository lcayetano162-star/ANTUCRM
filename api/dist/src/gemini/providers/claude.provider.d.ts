import { AIProvider, AIResponse } from './ai-provider.interface';
export declare class ClaudeProvider implements AIProvider {
    private readonly apiKey;
    private readonly modelName;
    id: string;
    private readonly baseUrl;
    constructor(apiKey: string, modelName: string);
    generateResponse(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<AIResponse>;
}
