import { Injectable, Logger } from '@nestjs/common';
import { AntuAICore } from './antu-ai-core.service';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly core: AntuAICore) { }

  /**
   * Mantiene compatibilidad con el código antiguo pero redirige al Antü AI Core
   */
  async generateText(prompt: string, options: any = {}) {
    this.logger.debug('Redirigiendo llamada legacy a Antü AI Core');

    // Si no se especifica promptKey, usamos uno genérico
    const response = await this.core.generateAnalysis(
      options.tenantId || 'SYSTEM',
      'LEGACY_CHAT',
      { prompt },
      'LEGACY_USER'
    );

    return {
      text: response.text,
      usage: {
        totalTokens: response.usage.totalTokensCount
      }
    };
  }

  async generateStructured<T>(prompt: string, schema: any, options: any = {}): Promise<T> {
    const response = await this.generateText(prompt, options);

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]) as T;
  }

  isAvailable(): boolean {
    return true; // AntuAICore gestiona la disponibilidad internamente
  }
}
