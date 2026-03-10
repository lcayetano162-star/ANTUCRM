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
var InventoryAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAIService = void 0;
const common_1 = require("@nestjs/common");
const gemini_service_1 = require("../gemini/gemini.service");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryAIService = InventoryAIService_1 = class InventoryAIService {
    constructor(gemini, prisma) {
        this.gemini = gemini;
        this.prisma = prisma;
        this.logger = new common_1.Logger(InventoryAIService_1.name);
    }
    async predictDemand(tenantId) {
        try {
            if (!this.gemini.isAvailable()) {
                return [];
            }
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
                if (product.movements.length < 10)
                    continue;
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
                        ...prediction,
                    });
                }
                catch (e) {
                    this.logger.warn(`Error prediciendo demanda para ${product.name}`);
                }
            }
            return predictions;
        }
        catch (error) {
            this.logger.error('Error en predictDemand', error);
            return [];
        }
    }
    async optimizeLocation(tenantId, productId) {
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
        }
        catch (error) {
            this.logger.error('Error en optimizeLocation', error);
            return { error: 'Error al optimizar ubicación' };
        }
    }
    async detectAnomalies(tenantId) {
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
        }
        catch (error) {
            this.logger.error('Error en detectAnomalies', error);
            return [];
        }
    }
};
exports.InventoryAIService = InventoryAIService;
exports.InventoryAIService = InventoryAIService = InventoryAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        prisma_service_1.PrismaService])
], InventoryAIService);
//# sourceMappingURL=inventory-ai.service.js.map