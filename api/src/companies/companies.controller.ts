import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.service.findAll(tenantId, search);
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
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateCompanyDto) {
    return this.service.create(tenantId, dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
