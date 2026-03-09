import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener configuración del tenant' })
  getSettings(@CurrentTenant() tenantId: string) {
    return this.service.getSettings(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar configuración del tenant' })
  updateSettings(@CurrentTenant() tenantId: string, @Body() dto: Record<string, any>) {
    return this.service.updateSettings(tenantId, dto);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Obtener módulos habilitados del tenant' })
  getModules(@CurrentTenant() tenantId: string) {
    return this.service.getEnabledModules(tenantId);
  }
}
