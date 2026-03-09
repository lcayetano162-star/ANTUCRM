import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('invoices')
export class InvoicingController {
  constructor(private readonly service: InvoicingService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(tenantId, Number(page) || 1, Number(limit) || 20, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.create(tenantId, userId, dto);
  }

  @Post(':id/payments')
  registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.registerPayment(id, tenantId, dto);
  }

  @Patch(':id/void')
  void(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.voidInvoice(id, tenantId);
  }
}
