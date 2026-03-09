import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AIService } from './ai.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai')
export class AIController {
  constructor(private readonly service: AIService) {}

  @Get('briefing')
  getDailyBriefing(@CurrentTenant() tenantId: string, @CurrentUser('id') userId: string) {
    return this.service.getDailyBriefing(tenantId, userId);
  }

  @Get('contacts/:id/analyze')
  analyzeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.analyzeContact(id, tenantId, userId);
  }

  @Get('opportunities/:id/score')
  scoreDeal(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.scoreDeal(id, tenantId);
  }

  @Get('forecast')
  getForecast(@CurrentTenant() tenantId: string) {
    return this.service.getForecast(tenantId);
  }
}
