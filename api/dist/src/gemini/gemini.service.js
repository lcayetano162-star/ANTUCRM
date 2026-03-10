"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const antu_ai_core_service_1 = require("./antu-ai-core.service");
let GeminiService = GeminiService_1 = class GeminiService {
    constructor(core) {
        this.core = core;
        this.logger = new common_1.Logger(GeminiService_1.name);
    }
    async generateText(prompt, options = {}) {
        this.logger.debug('Redirigiendo llamada legacy a Antü AI Core');
        const response = await this.core.generateAnalysis(options.tenantId || 'SYSTEM', 'LEGACY_CHAT', { prompt }, 'LEGACY_USER');
        return {
            text: response.text,
            usage: {
                totalTokens: response.usage.totalTokensCount
            }
        };
    }
    async generateStructured(prompt, schema, options = {}) {
        const response = await this.generateText(prompt, options);
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
    }
    isAvailable() {
        return true;
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [antu_ai_core_service_1.AntuAICore])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map