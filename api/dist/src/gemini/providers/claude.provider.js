"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
const axios_1 = require("axios");
class ClaudeProvider {
    constructor(apiKey, modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.id = 'ANTHROPIC';
        this.baseUrl = 'https://api.anthropic.com/v1';
    }
    async generateResponse(prompt, options = {}) {
        const response = await axios_1.default.post(`${this.baseUrl}/messages`, {
            model: this.modelName,
            max_tokens: options.maxTokens || 2048,
            messages: [{ role: 'user', content: prompt }],
            system: options.systemPrompt,
            temperature: options.temperature || 0.5,
        }, {
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });
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
exports.ClaudeProvider = ClaudeProvider;
//# sourceMappingURL=claude.provider.js.map