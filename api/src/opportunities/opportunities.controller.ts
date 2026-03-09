import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityQueryDto } from './dto/opportunity.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: OpportunityQueryDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get('pipeline')
  getPipeline(@CurrentTenant() tenantId: string) {
    return this.service.getPipeline(tenantId);
  }

  @Get('stats')
  getStats(@CurrentTenant() tenantId: string) {
    return this.service.getStats(tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.service.create(tenantId, userId, dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.service.update(id, tenantId, dto);
  }

  @Patch(':id/stage')
  moveStage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body('stage') stage: string,
  ) {
    return this.service.moveStage(id, tenantId, stage);
  }

  @Patch(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body('status') status: 'WON' | 'LOST',
  ) {
    return this.service.close(id, tenantId, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
