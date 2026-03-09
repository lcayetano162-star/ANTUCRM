import { Controller, Get, Post, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { QuotasService } from './quotas.service';
import { BulkUpdateQuotaDto } from './dto/quota.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('quotas')
export class QuotasController {
    constructor(private readonly quotasService: QuotasService) { }

    @Get()
    getQuotas(
        @Req() req: any,
        @Query('year') yearStr: string,
    ) {
        const role = req.user.role?.name || req.user.role;
        const allowedRoles = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'];
        if (!allowedRoles.includes(role)) {
            throw new ForbiddenException('No tienes permisos para ver cuotas.');
        }
        const tenantId = req.user.tenantId;
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getQuotas(tenantId, year);
    }

    @Post('save')
    saveQuotas(
        @Req() req: any,
        @Body() dto: BulkUpdateQuotaDto,
    ) {
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new ForbiddenException('No tienes permisos para guardar cuotas.');
        }
        const tenantId = req.user.tenantId;
        return this.quotasService.saveQuotas(tenantId, dto);
    }

    @Get('performance')
    async getPerformance(
        @Req() req: any,
        @Query('year') yearStr: string,
        @Query('period') period?: string,
        @Query('userId') queryUserId?: string,
    ) {
        const tenantId = req.user.tenantId;
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role?.name || req.user.role || 'USER';

        const isManager = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'].includes(requestingUserRole);

        let targetUserId = requestingUserId;
        let targetRole = requestingUserRole;

        // Si se solicita un usuario específico y es manager, permitimos el cambio
        if (queryUserId && isManager) {
            targetUserId = queryUserId;
            // Si el manager está viendo a otro, asumimos que quiere ver sus métricas de vendedor
            // a menos que sea el mismo
            if (targetUserId !== requestingUserId) {
                targetRole = 'SALES_REP';
            }
        }

        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getPerformance(tenantId, targetUserId, targetRole, year, period);
    }

    @Get('sales-ops')
    getSalesOpsConfig(
        @Req() req: any,
        @Query('year') yearStr: string,
    ) {
        const tenantId = req.user.tenantId;
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new ForbiddenException('No tienes permisos.');
        }
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getSalesOpsConfig(tenantId, year);
    }

    @Post('sales-ops')
    saveSalesOpsConfig(
        @Req() req: any,
        @Body() payload: any,
    ) {
        const tenantId = req.user.tenantId;
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new ForbiddenException('No tienes permisos para guardar configuración de Sales Ops.');
        }
        return this.quotasService.saveSalesOpsConfig(tenantId, payload);
    }
}
