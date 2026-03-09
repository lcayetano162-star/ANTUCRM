import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

  async getInventory(tenantId: string, page: number, limit: number) {
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

  async getAlerts(tenantId: string) {
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
}
