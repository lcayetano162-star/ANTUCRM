import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryAIService } from './inventory-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly aiService: InventoryAIService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Obtener inventario' })
  async getInventory(
    @CurrentTenant() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.inventoryService.getInventory(tenantId, page, limit);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Obtener alertas de inventario' })
  async getAlerts(@CurrentTenant() tenantId: string) {
    return this.inventoryService.getAlerts(tenantId);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Obtener predicciones de demanda' })
  async getPredictions(@CurrentTenant() tenantId: string) {
    return this.aiService.predictDemand(tenantId);
  }

  @Post(':id/optimize-location')
  @ApiOperation({ summary: 'Optimizar ubicación de producto' })
  async optimizeLocation(
    @CurrentTenant() tenantId: string,
    @Param('id') productId: string,
  ) {
    return this.aiService.optimizeLocation(tenantId, productId);
  }
}
