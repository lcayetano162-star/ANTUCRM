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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getInventory(tenantId, page, limit) {
        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where: { tenantId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: true,
                    batches: {
                        where: { status: 'ACTIVE' },
                        orderBy: { expiryDate: 'asc' },
                    },
                },
            }),
            this.prisma.product.count({ where: { tenantId } }),
        ]);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAlerts(tenantId) {
        const [lowStock, expiringSoon, outOfStock] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    tenantId,
                    stockQuantity: { lte: 10, gt: 0 },
                },
                take: 10,
            }),
            this.prisma.productBatch.findMany({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                },
                include: { product: true },
                take: 10,
            }),
            this.prisma.product.findMany({
                where: {
                    tenantId,
                    stockQuantity: 0,
                },
                take: 10,
            }),
        ]);
        return {
            lowStock,
            expiringSoon,
            outOfStock,
            totalAlerts: lowStock.length + expiringSoon.length + outOfStock.length,
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map