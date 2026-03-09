import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  ParseUUIDPipe, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/** Solo accesible por usuarios con rol ADMIN */
function assertAdmin(user: any) {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
    throw new ForbiddenException('Solo administradores pueden acceder a esta sección');
  }
}

@UseGuards(JwtAuthGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly service: SuperAdminService,
    private readonly authService: AuthService,
  ) {}

  // Platform stats
  @Get('stats')
  getStats(@CurrentUser() user: any) {
    assertAdmin(user);
    return this.service.getPlatformStats();
  }

  // Tenants
  @Get('tenants')
  findTenants(@CurrentUser() user: any, @Query('search') search?: string) {
    assertAdmin(user);
    return this.service.findAllTenants(search);
  }

  @Get('tenants/:id')
  findTenant(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    assertAdmin(user);
    return this.service.findOneTenant(id);
  }

  @Post('tenants')
  createTenant(@CurrentUser() user: any, @Body() dto: any) {
    assertAdmin(user);
    return this.service.createTenant(dto);
  }

  @Put('tenants/:id')
  updateTenant(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    assertAdmin(user);
    return this.service.updateTenant(id, dto);
  }

  @Patch('tenants/:id/settings')
  updateSettings(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    assertAdmin(user);
    return this.service.updateTenantSettings(id, dto);
  }

  @Patch('tenants/:id/suspend')
  suspendTenant(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    assertAdmin(user);
    return this.service.suspendTenant(id);
  }

  @Patch('tenants/:id/activate')
  activateTenant(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    assertAdmin(user);
    return this.service.activateTenant(id);
  }

  // Plans
  @Get('plans')
  findPlans(@CurrentUser() user: any) {
    assertAdmin(user);
    return this.service.findAllPlans();
  }

  @Post('plans')
  createPlan(@CurrentUser() user: any, @Body() dto: any) {
    assertAdmin(user);
    return this.service.createPlan(dto);
  }

  @Put('plans/:id')
  updatePlan(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    assertAdmin(user);
    return this.service.updatePlan(id, dto);
  }

  // Tenant Users
  @Get('tenants/:id/users')
  getTenantUsers(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    assertAdmin(user);
    return this.service.getTenantUsers(id);
  }

  @Post('tenants/:id/users')
  createTenantUser(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    assertAdmin(user);
    return this.service.createTenantUser(id, dto);
  }

  @Patch('tenants/:tenantId/users/:userId/deactivate')
  deactivateUser(
    @CurrentUser() user: any,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    assertAdmin(user);
    return this.service.deactivateTenantUser(userId, tenantId);
  }

  @Patch('tenants/:tenantId/users/:userId/reset-password')
  resetTenantUserPassword(
    @CurrentUser() user: any,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('newPassword') newPassword?: string,
  ) {
    assertAdmin(user);
    return this.authService.adminResetPassword(userId, tenantId, newPassword);
  }
}
