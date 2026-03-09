import axios from 'axios';
import { AIProvider, AIResponse } from './ai-provider.interface';

export class OpenAICompatibleProvider implements AIProvider {
    constructor(
        public readonly id: string, // OPENAI o KIMI
        private readonly apiKey: string,
        private readonly modelName: string,
        private readonly baseUrl: string = 'https://api.openai.com/v1'
    ) { }

    async generateResponse(
        prompt: string,
        options: { systemPrompt?: string; temperature?: number; maxTokens?: number } = {}
    ): Promise<AIResponse> {
        const messages = [];
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await axios.post(
            `${this.baseUrl}/chat/completions`,
            {
                model: this.modelName,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2048,
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data;

        return {
            text: data.choices[0].message.content,
            usage: {
                promptTokensCount: data.usage.prompt_tokens,
                completionTokensCount: data.usage.completion_tokens,
                totalTokensCount: data.usage.total_tokens,
            },
            model: this.modelName
        };
    }
}
