import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { GovService } from './gov.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('gov')
export class GovController {
  constructor(private readonly service: GovService) {}

  @Get('stats')
  getStats(@CurrentTenant() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':govId/checklist/:itemId')
  updateChecklistItem(
    @Param('govId', ParseUUIDPipe) govId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.updateChecklistItem(govId, itemId, tenantId, dto);
  }
}
