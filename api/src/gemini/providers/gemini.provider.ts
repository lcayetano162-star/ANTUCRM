import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIResponse } from './ai-provider.interface';

export class GeminiProvider implements AIProvider {
    id = 'GEMINI';
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateResponse(
        prompt: string,
        options: { systemPrompt?: string; temperature?: number; maxTokens?: number } = {}
    ): Promise<AIResponse> {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: options.systemPrompt
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature || 0.4,
                maxOutputTokens: options.maxTokens || 2048,
            }
        });

        const response = await result.response;
        const text = response.text();

        return {
            text,
            usage: {
                promptTokensCount: 0, // Mocked for now as Gemini doesn't return count directly in simple call
                completionTokensCount: 0,
                totalTokensCount: 0,
            },
            model: 'gemini-1.5-flash'
        };
    }
}
