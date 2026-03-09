import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto, SearchInteractionDto, TimelineQueryDto } from './dto/create-interaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('api/v1/interactions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async create(
    @Body() dto: CreateInteractionDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const interaction = await this.interactionsService.create(dto, tenantId, user.userId);
    return {
      success: true,
      data: interaction,
    };
  }

  @Get('timeline/:clientId')
  async getTimeline(
    @Param('clientId') clientId: string,
    @Query() query: TimelineQueryDto,
    @CurrentTenant() tenantId: string,
  ) {
    const channels = query.channels 
      ? query.channels.split(',').map(c => c.trim().toUpperCase()) as any[]
      : undefined;

    const timeline = await this.interactionsService.findByClient(
      tenantId,
      clientId,
      {
        channels,
        limit: parseInt(query.limit || '50'),
        offset: parseInt(query.offset || '0'),
        includePrivate: query.includePrivate === 'true',
      }
    );

    return {
      success: true,
      data: timeline,
      pagination: {
        limit: parseInt(query.limit || '50'),
        offset: parseInt(query.offset || '0'),
        hasMore: timeline.length === parseInt(query.limit || '50'),
      },
    };
  }

  @Get('thread/:threadId')
  async getThread(
    @Param('threadId') threadId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const thread = await this.interactionsService.getThread(tenantId, threadId);
    return {
      success: true,
      data: thread,
    };
  }

  @Post('search')
  async search(
    @Body() dto: SearchInteractionDto,
    @CurrentTenant() tenantId: string,
  ) {
    if (!dto.q || dto.q.length < 3) {
      return {
        success: false,
        error: 'Search term must be at least 3 characters',
      };
    }

    const results = await this.interactionsService.search(
      tenantId,
      dto.q,
      dto.clientId,
    );

    return {
      success: true,
      data: results,
      count: results.length,
    };
  }

  @Get('summary/:clientId')
  async getSummary(
    @Param('clientId') clientId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const summary = await this.interactionsService.getSummary(tenantId, clientId);
    return {
      success: true,
      data: summary,
    };
  }

  @Post('note')
  async createNote(
    @Body() dto: { clientId: string; content: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ) {
    if (!dto.clientId || !dto.content) {
      return {
        success: false,
        error: 'clientId and content are required',
      };
    }

    const note = await this.interactionsService.create({
      clientId: dto.clientId,
      channel: 'NOTE' as any,
      direction: 'INTERNAL' as any,
      content: dto.content,
      fromAddress: user.email,
      toAddress: 'internal',
      isPrivate: true,
    }, tenantId, user.userId);

    return {
      success: true,
      data: note,
    };
  }
}
