import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { CpqService } from './cpq.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('cpq/quotes')
export class QuotesController {
  constructor(private readonly service: CpqService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findQuotes(tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.findOneQuote(id, tenantId);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createQuote(tenantId, userId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body('status') status: string,
  ) {
    return this.service.updateQuoteStatus(id, tenantId, status);
  }
}

@Controller('cpq/mps')
export class MpsController {
  constructor(private readonly service: CpqService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findMpsQuotes(tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.service.createMpsQuote(tenantId, userId, dto);
  }

  @Patch(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('approved') approved: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.service.approveMpsQuote(id, tenantId, userId, approved, notes);
  }
}
