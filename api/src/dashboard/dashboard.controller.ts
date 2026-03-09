import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardAIService } from './dashboard-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '../auth/types/auth.types';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly aiService: DashboardAIService,
  ) { }

  @Get('sales')
  @ApiOperation({ summary: 'Obtener dashboard de ventas' })
  @ApiResponse({ status: 200, description: 'Dashboard obtenido exitosamente' })
  async getSalesDashboard(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query('period') period: string = 'month',
    @Query('userId') queryUserId?: string,
  ) {
    const targetUserId = queryUserId || userId;
    return this.dashboardService.getSalesDashboard(tenantId, targetUserId, userRole, period);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Obtener insights de IA para el dashboard' })
  @ApiResponse({ status: 200, description: 'Insights obtenidos exitosamente' })
  async getAIInsights(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.aiService.generateInsights(tenantId, userId, userRole);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs del dashboard' })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  async getKPIs(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query('period') period: string = 'month',
  ) {
    return this.dashboardService.getKPIs(tenantId, userId, userRole, period);
  }

  @Get('team')
  @ApiOperation({ summary: 'Obtener miembros del equipo (vendedores)' })
  @ApiResponse({ status: 200, description: 'Equipo obtenido exitosamente' })
  async getTeam(
    @CurrentTenant() tenantId: string,
  ) {
    return this.dashboardService.getTeamMembers(tenantId);
  }
}
