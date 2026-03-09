import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ServiceDeskService } from './service-desk.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('service-desk')
export class ServiceDeskController {
  constructor(private readonly service: ServiceDeskService) {}

  @Get('kpis')
  getKpis(@CurrentTenant() tenantId: string) {
    return this.service.getKpis(tenantId);
  }

  @Get('tickets')
  findTickets(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.service.findTickets(tenantId, Number(page) || 1, Number(limit) || 20, status, priority);
  }

  @Get('tickets/:id')
  findOneTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOneTicket(id, tenantId);
  }

  @Post('tickets')
  createTicket(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.service.createTicket(tenantId, userId, dto);
  }

  @Patch('tickets/:id')
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.updateTicket(id, tenantId, dto);
  }

  @Post('tickets/:ticketId/work-orders')
  createWorkOrder(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.createWorkOrder(ticketId, tenantId, dto);
  }

  @Patch('work-orders/:id')
  updateWorkOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.updateWorkOrder(id, tenantId, dto);
  }

  @Post('work-orders/:woId/parts')
  addPart(
    @Param('woId', ParseUUIDPipe) woId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.addPart(woId, tenantId, dto);
  }
}
