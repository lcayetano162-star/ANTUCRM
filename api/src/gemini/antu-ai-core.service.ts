import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider, AIResponse } from './providers/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class AntuAICore implements OnModuleInit {
    private readonly logger = new Logger(AntuAICore.name);
    private providers: Map<string, AIProvider> = new Map();
    private activeProviderId: string | null = null;

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.refreshProviders();
    }

    /**
     * Recarga los proveedores de IA desde la DB (Cambiando el "Cerebro" en caliente)
     */
    async refreshProviders() {
        this.logger.log('Refrescando Antü AI Core Providers...');
        const configs = await this.prisma.aIProviderConfig.findMany();

        this.providers.clear();
        this.activeProviderId = null;

        for (const config of configs) {
            try {
                const decryptedKey = EncryptionService.decrypt(config.apiKey);
                let provider: AIProvider;

                switch (config.id) {
                    case 'GEMINI':
                        provider = new GeminiProvider(decryptedKey);
                        break;
                    case 'OPENAI':
                    case 'KIMI':
                        provider = new OpenAICompatibleProvider(
                            config.id,
                            decryptedKey,
                            (config as any).modelName,
                            (config as any).baseUrl || undefined
                        );
                        break;
                    case 'ANTHROPIC':
                        provider = new ClaudeProvider(decryptedKey, (config as any).modelName);
                        break;
                    default:
                        this.logger.error(`Proveedor ${config.id} no soportado.`);
                        continue;
                }

                this.providers.set(config.id, provider);
                if (config.isActive) this.activeProviderId = config.id;
            } catch (e) {
                this.logger.error(`Error inicializando IA ${config.id}: ${e.message}`);
            }
        }
        if (this.providers.size === 0 && process.env.GEMINI_API_KEY) {
            this.logger.log('No providers in DB, using GEMINI_API_KEY from env as fallback.');
            const provider = new GeminiProvider(process.env.GEMINI_API_KEY);
            this.providers.set('GEMINI', provider);
            this.activeProviderId = 'GEMINI';
        }
        this.logger.log(`Antü AI Core listo. Activo: ${this.activeProviderId || 'Ninguno'}`);
    }

    /**
     * Generación de respuestas unificada (Abstracción Total)
     */
    async generateAnalysis(
        tenantId: string,
        promptKey: string,
        dataPayload: any,
        userId: string
    ): Promise<AIResponse> {
        if (!this.activeProviderId || !this.providers.has(this.activeProviderId)) {
            throw new Error('No hay una IA activa en el sistema.');
        }

        const provider = this.providers.get(this.activeProviderId)!;

        // 1. Obtener el Prompt Maestro de la DB (Prompt Registry)
        let template = await this.prisma.promptTemplate.findUnique({ where: { id: promptKey } });

        if (!template && promptKey === 'LEGACY_CHAT') {
            template = {
                id: 'LEGACY_CHAT',
                systemPrompt: 'Eres Antü, un asistente experto en CRM. Responde de forma concisa y profesional.',
                userPrompt: '{{DATA}}'
            } as any;
        }

        if (!template) throw new NotFoundException('Template de prompt no encontrado');

        // 2. Preparar el prompt con los datos del tenant
        const finalUserPrompt = ((template as any).userPrompt || '').replace('{{DATA}}', JSON.stringify(dataPayload));

        // 3. Ejecutar llamada al LLM
        const response = await provider.generateResponse(finalUserPrompt, {
            systemPrompt: (template as any).systemPrompt || ''
        });

        // 4. Trackear consumo (Token Tracker & Finance)
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
            } as any
        });

        return response;
    }

    /**
     * Executive Manager (Asistente del Super Admin)
     */
    async detectGlobalAnomalies() {
        // Aquí analizamos todos los tenants para el Super Admin
        const healthData = await this.prisma.tenant.findMany({
            include: {
                subscription: true,
                _count: { select: { users: true } }
            }
        });

        const template = await this.prisma.promptTemplate.findUnique({ where: { id: 'ANOMALY_DETECTION' } });
        if (!template) return 'Configura el prompt detector de anomalías.';

        const response = await this.generateAnalysis(
            'GLOBAL',
            'ANOMALY_DETECTION',
            healthData,
            'SUPER_ADMIN'
        );

        return response.text;
    }

    private calculateEstimatedCost(response: AIResponse): number {
        // Tarifas estimadas (en producción esto se lee de AIProviderConfig)
        if (this.activeProviderId === 'OPENAI') return response.usage.totalTokensCount * 0.00003;
        if (this.activeProviderId === 'ANTHROPIC') return response.usage.totalTokensCount * 0.000015;
        return 0; // Gemini Flash es gratis en muchos tiers
    }
}
