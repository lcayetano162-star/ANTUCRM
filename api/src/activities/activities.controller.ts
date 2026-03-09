import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, ActivityQueryDto, CreateTaskDto, UpdateTaskDto } from './dto/activity.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: ActivityQueryDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get('timeline')
  getTimeline(
    @CurrentTenant() tenantId: string,
    @Query('contactId') contactId?: string,
    @Query('opportunityId') opportunityId?: string,
  ) {
    return this.service.getTimeline(tenantId, contactId, opportunityId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.service.create(tenantId, userId, dto);
  }
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('userId') userId?: string) {
    return this.service.findTasks(tenantId, userId);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateTaskDto) {
    return this.service.createTask(tenantId, dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.updateTask(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.service.deleteTask(id, tenantId);
  }
}
