export interface AIResponse {
    text: string;
    usage: {
        promptTokensCount: number;
        completionTokensCount: number;
        totalTokensCount: number;
    };
    model: string;
}
export interface AIProvider {
    id: string;
    generateResponse(prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<AIResponse>;
}
