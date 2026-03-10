"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiProvider {
    constructor(apiKey) {
        this.id = 'GEMINI';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async generateResponse(prompt, options = {}) {
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
                promptTokensCount: 0,
                completionTokensCount: 0,
                totalTokensCount: 0,
            },
            model: 'gemini-1.5-flash'
        };
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.provider.js.map