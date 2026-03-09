import axios from 'axios';
import { AIProvider, AIResponse } from './ai-provider.interface';

export class ClaudeProvider implements AIProvider {
    id = 'ANTHROPIC';
    private readonly baseUrl = 'https://api.anthropic.com/v1';

    constructor(private readonly apiKey: string, private readonly modelName: string) { }

    async generateResponse(
        prompt: string,
        options: { systemPrompt?: string; temperature?: number; maxTokens?: number } = {}
    ): Promise<AIResponse> {
        const response = await axios.post(
            `${this.baseUrl}/messages`,
            {
                model: this.modelName,
                max_tokens: options.maxTokens || 2048,
                messages: [{ role: 'user', content: prompt }],
                system: options.systemPrompt,
                temperature: options.temperature || 0.5,
            },
            {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );

        const data = response.data;

        return {
            text: data.content[0].text,
            usage: {
                promptTokensCount: data.usage.input_tokens,
                completionTokensCount: data.usage.output_tokens,
                totalTokensCount: data.usage.input_tokens + data.usage.output_tokens,
            },
            model: this.modelName
        };
    }
}
