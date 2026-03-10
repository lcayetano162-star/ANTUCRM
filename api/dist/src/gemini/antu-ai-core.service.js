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
var AntuAICore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntuAICore = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_provider_1 = require("./providers/gemini.provider");
const openai_compatible_provider_1 = require("./providers/openai-compatible.provider");
const claude_provider_1 = require("./providers/claude.provider");
const encryption_service_1 = require("../common/services/encryption.service");
let AntuAICore = AntuAICore_1 = class AntuAICore {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AntuAICore_1.name);
        this.providers = new Map();
        this.activeProviderId = null;
    }
    async onModuleInit() {
        await this.refreshProviders();
    }
    async refreshProviders() {
        this.logger.log('Refrescando Antü AI Core Providers...');
        const configs = await this.prisma.aIProviderConfig.findMany();
        this.providers.clear();
        this.activeProviderId = null;
        for (const config of configs) {
            try {
                const decryptedKey = encryption_service_1.EncryptionService.decrypt(config.apiKey);
                let provider;
                switch (config.id) {
                    case 'GEMINI':
                        provider = new gemini_provider_1.GeminiProvider(decryptedKey);
                        break;
                    case 'OPENAI':
                    case 'KIMI':
                        provider = new openai_compatible_provider_1.OpenAICompatibleProvider(config.id, decryptedKey, config.modelName, config.baseUrl || undefined);
                        break;
                    case 'ANTHROPIC':
                        provider = new claude_provider_1.ClaudeProvider(decryptedKey, config.modelName);
                        break;
                    default:
                        this.logger.error(`Proveedor ${config.id} no soportado.`);
                        continue;
                }
                this.providers.set(config.id, provider);
                if (config.isActive)
                    this.activeProviderId = config.id;
            }
            catch (e) {
                this.logger.error(`Error inicializando IA ${config.id}: ${e.message}`);
            }
        }
        if (this.providers.size === 0 && process.env.GEMINI_API_KEY) {
            this.logger.log('No providers in DB, using GEMINI_API_KEY from env as fallback.');
            const provider = new gemini_provider_1.GeminiProvider(process.env.GEMINI_API_KEY);
            this.providers.set('GEMINI', provider);
            this.activeProviderId = 'GEMINI';
        }
        this.logger.log(`Antü AI Core listo. Activo: ${this.activeProviderId || 'Ninguno'}`);
    }
    async generateAnalysis(tenantId, promptKey, dataPayload, userId) {
        if (!this.activeProviderId || !this.providers.has(this.activeProviderId)) {
            throw new Error('No hay una IA activa en el sistema.');
        }
        const provider = this.providers.get(this.activeProviderId);
        let template = await this.prisma.promptTemplate.findUnique({ where: { id: promptKey } });
        if (!template && promptKey === 'LEGACY_CHAT') {
            template = {
                id: 'LEGACY_CHAT',
                systemPrompt: 'Eres Antü, un asistente experto en CRM. Responde de forma concisa y profesional.',
                userPrompt: '{{DATA}}'
            };
        }
        if (!template)
            throw new common_1.NotFoundException('Template de prompt no encontrado');
        const finalUserPrompt = (template.userPrompt || '').replace('{{DATA}}', JSON.stringify(dataPayload));
        const response = await provider.generateResponse(finalUserPrompt, {
            systemPrompt: template.systemPrompt || ''
        });
        await this.prisma.aIUsageLog.create({
            data: {
                tenantId,
                provider: this.activeProviderId,
                model: response.model,
                promptTokens: response.usage.promptTokensCount,
                completionTokens: response.usage.completionTokensCount,
                totalTokens: response.usage.totalTokensCount,
                estimatedCost: this.calculateEstimatedCost(response),
                action: promptKey,
                metadata: { userId }
            }
        });
        return response;
    }
    async detectGlobalAnomalies() {
        const healthData = await this.prisma.tenant.findMany({
            include: {
                subscription: true,
                _count: { select: { users: true } }
            }
        });
        const template = await this.prisma.promptTemplate.findUnique({ where: { id: 'ANOMALY_DETECTION' } });
        if (!template)
            return 'Configura el prompt detector de anomalías.';
        const response = await this.generateAnalysis('GLOBAL', 'ANOMALY_DETECTION', healthData, 'SUPER_ADMIN');
        return response.text;
    }
    calculateEstimatedCost(response) {
        if (this.activeProviderId === 'OPENAI')
            return response.usage.totalTokensCount * 0.00003;
        if (this.activeProviderId === 'ANTHROPIC')
            return response.usage.totalTokensCount * 0.000015;
        return 0;
    }
};
exports.AntuAICore = AntuAICore;
exports.AntuAICore = AntuAICore = AntuAICore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AntuAICore);
//# sourceMappingURL=antu-ai-core.service.js.map