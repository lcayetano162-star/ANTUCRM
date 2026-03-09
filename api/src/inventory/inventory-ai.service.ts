import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryAIService {
  private readonly logger = new Logger(InventoryAIService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
  ) { }

  async predictDemand(tenantId: string): Promise<any[]> {
    try {
      if (!this.gemini.isAvailable()) {
        return [];
      }

      // Obtener datos históricos
      const products = await this.prisma.product.findMany({
        where: { tenantId },
        include: {
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 90,
          },
        },
        take: 20,
      });

      const predictions = [];

      for (const product of products) {
        if (product.movements.length < 10) continue;

        const prompt = `Basándote en estos movimientos de inventario:
${JSON.stringify(product.movements)}

Predice la demanda para los próximos 30 días para el producto "${product.name}".

Responde con un objeto JSON:
{
  "predictedDemand": number,
  "confidence": number (0-1),
  "recommendedOrder": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

        try {
          const prediction = await this.gemini.generateStructured(prompt, {
            predictedDemand: 'number',
            confidence: 'number',
            recommendedOrder: 'number',
            riskLevel: 'string',
          });

          predictions.push({
            productId: product.id,
            productName: product.name,
            ...(prediction as any),
          });
        } catch (e) {
          this.logger.warn(`Error prediciendo demanda para ${product.name}`);
        }
      }

      return predictions;
    } catch (error) {
      this.logger.error('Error en predictDemand', error);
      return [];
    }
  }

  async optimizeLocation(tenantId: string, productId: string): Promise<any> {
    try {
      if (!this.gemini.isAvailable()) {
        return { recommendation: 'IA no disponible' };
      }

      const [product, warehouseMap] = await Promise.all([
        this.prisma.product.findFirst({
          where: { id: productId, tenantId },
          include: { movements: true },
        }),
        this.prisma.warehouseMap.findMany({ where: { tenantId } }),
      ]);

      if (!product) {
        return { error: 'Producto no encontrado' };
      }

      const prompt = `Optimiza la ubicación de este producto:

Producto: ${product.name}
Categoría: ${product.categoryId}
Movimientos recientes: ${product.movements.length}

Ubicaciones disponibles: ${JSON.stringify(warehouseMap)}

Responde con un objeto JSON:
{
  "recommendedZone": "string",
  "recommendedShelf": "string",
  "reasoning": "string",
  "efficiency": number (0-100)
}`;

      return await this.gemini.generateStructured(prompt, {
        recommendedZone: 'string',
        recommendedShelf: 'string',
        reasoning: 'string',
        efficiency: 'number',
      });
    } catch (error) {
      this.logger.error('Error en optimizeLocation', error);
      return { error: 'Error al optimizar ubicación' };
    }
  }

  async detectAnomalies(tenantId: string): Promise<any[]> {
    try {
      if (!this.gemini.isAvailable()) {
        return [];
      }

      const movements = await this.prisma.inventoryMovement.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: true },
      });

      const prompt = `Detecta anomalías en estos movimientos de inventario:
${JSON.stringify(movements)}

Responde con un array JSON de anomalías encontradas:
[{
  "type": "UNUSUAL_QUANTITY" | "NEGATIVE_STOCK" | "FREQUENCY_ANOMALY",
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "description": "string",
  "productId": "string"
}]`;

      return await this.gemini.generateStructured(prompt, {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: 'string',
            severity: 'string',
            description: 'string',
            productId: 'string',
          },
        },
      });
    } catch (error) {
      this.logger.error('Error en detectAnomalies', error);
      return [];
    }
  }
}
