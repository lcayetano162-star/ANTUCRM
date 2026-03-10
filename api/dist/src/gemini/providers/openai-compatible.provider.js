"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleProvider = void 0;
const axios_1 = require("axios");
class OpenAICompatibleProvider {
    constructor(id, apiKey, modelName, baseUrl = 'https://api.openai.com/v1') {
        this.id = id;
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = baseUrl;
    }
    async generateResponse(prompt, options = {}) {
        const messages = [];
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
            model: this.modelName,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
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
exports.OpenAICompatibleProvider = OpenAICompatibleProvider;
//# sourceMappingURL=openai-compatible.provider.js.map