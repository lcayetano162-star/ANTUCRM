import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('marketing/campaigns')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  @Get('stats')
  getStats(@CurrentTenant() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('status') status?: string) {
    return this.service.findCampaigns(tenantId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOneCampaign(id, tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.service.createCampaign(tenantId, userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: any,
  ) {
    return this.service.updateCampaign(id, tenantId, dto);
  }

  @Post(':id/recipients')
  addRecipients(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body('contactIds') contactIds: string[],
  ) {
    return this.service.addRecipients(id, tenantId, contactIds);
  }
}
