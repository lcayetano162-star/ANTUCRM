"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ActivitiesService = class ActivitiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, query) {
        const { type, contactId, opportunityId, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (type)
            where.type = type;
        if (contactId)
            where.contactId = contactId;
        if (opportunityId)
            where.opportunityId = opportunityId;
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
    async create(tenantId, userId, dto) {
        return this.prisma.activity.create({
            data: {
                type: dto.type,
                description: dto.description,
                metadata: dto.metadata,
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
    async getTimeline(tenantId, contactId, opportunityId) {
        const where = { tenantId };
        if (contactId)
            where.contactId = contactId;
        if (opportunityId)
            where.opportunityId = opportunityId;
        return this.prisma.activity.findMany({
            where,
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async findTasks(tenantId, userId) {
        const where = { tenantId };
        if (userId)
            where.assignedToId = userId;
        const [pending, inProgress, completed] = await Promise.all([
            this.prisma.task.findMany({ where: { ...where, status: 'PENDING' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { dueDate: 'asc' } }),
            this.prisma.task.findMany({ where: { ...where, status: 'IN_PROGRESS' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { dueDate: 'asc' } }),
            this.prisma.task.findMany({ where: { ...where, status: 'COMPLETED' }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { updatedAt: 'desc' }, take: 20 }),
        ]);
        return { pending, inProgress, completed };
    }
    async createTask(tenantId, dto) {
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
    async updateTask(id, tenantId, dto) {
        const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
        if (!task)
            throw new common_1.NotFoundException('Tarea no encontrada');
        return this.prisma.task.update({
            where: { id },
            data: {
                ...dto,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
            },
        });
    }
    async deleteTask(id, tenantId) {
        const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
        if (!task)
            throw new common_1.NotFoundException('Tarea no encontrada');
        return this.prisma.task.delete({ where: { id } });
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map