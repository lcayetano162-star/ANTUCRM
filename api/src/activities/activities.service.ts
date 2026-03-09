import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto, ActivityQueryDto, CreateTaskDto, UpdateTaskDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  // ─── ACTIVITIES ────────────────────────────────────────────────

  async findAll(tenantId: string, query: ActivityQueryDto) {
    const { type, contactId, opportunityId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (type) where.type = type;
    if (contactId) where.contactId = contactId;
    if (opportunityId) where.opportunityId = opportunityId;

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          opportunity: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(tenantId: string, userId: string, dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        type: dto.type,
        description: dto.description,
        metadata: dto.metadata as any,
        contactId: dto.contactId,
        opportunityId: dto.opportunityId,
        tenantId,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getTimeline(tenantId: string, contactId?: string, opportunityId?: string) {
    const where: any = { tenantId };
    if (contactId) where.contactId = contactId;
    if (opportunityId) where.opportunityId = opportunityId;

    return this.prisma.activity.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─── TASKS ────────────────────────────────────────────────────

  async findTasks(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.assignedToId = userId;

    const [pending, inProgress, completed] = await Promise.all([
      this.prisma.task.findMany({ where: { ...where, status: 'PENDING' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { dueDate: 'asc' } }),
      this.prisma.task.findMany({ where: { ...where, status: 'IN_PROGRESS' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { dueDate: 'asc' } }),
      this.prisma.task.findMany({ where: { ...where, status: 'COMPLETED' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { updatedAt: 'desc' }, take: 20 }),
    ]);

    return { pending, inProgress, completed };
  }

  async createTask(tenantId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        contactId: dto.contactId,
        assignedToId: dto.assignedToId,
        tenantId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateTask(id: string, tenantId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async deleteTask(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return this.prisma.task.delete({ where: { id } });
  }
}
