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
exports.ServiceDeskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const SLA_HOURS = {
    LOW: 72, MEDIUM: 24, HIGH: 8, CRITICAL: 2,
};
let ServiceDeskService = class ServiceDeskService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTickets(tenantId, page = 1, limit = 20, status, priority) {
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        const [data, total] = await Promise.all([
            this.prisma.serviceTicket.findMany({
                where, skip, take: limit,
                include: {
                    contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    assignedTo: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { workOrders: true } },
                },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.serviceTicket.count({ where }),
        ]);
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async findOneTicket(id, tenantId) {
        const ticket = await this.prisma.serviceTicket.findFirst({
            where: { id, tenantId },
            include: {
                contact: true,
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                workOrders: {
                    include: {
                        tech: { select: { id: true, firstName: true, lastName: true } },
                        parts: { include: { product: { select: { id: true, name: true, sku: true } } } },
                    },
                },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket no encontrado');
        return ticket;
    }
    async createTicket(tenantId, userId, dto) {
        const count = await this.prisma.serviceTicket.count({ where: { tenantId } });
        const now = new Date();
        const ticketNumber = `TKT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
        const slaHours = SLA_HOURS[dto.priority || 'MEDIUM'];
        const slaDeadline = new Date(now.getTime() + slaHours * 3600000);
        return this.prisma.serviceTicket.create({
            data: {
                ...dto,
                ticketNumber,
                tenantId,
                createdById: userId,
                slaDeadline,
            },
            include: {
                contact: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async updateTicket(id, tenantId, dto) {
        await this.findOneTicket(id, tenantId);
        const data = { ...dto };
        if (dto.status === 'RESOLVED')
            data.resolvedAt = new Date();
        if (dto.status === 'CLOSED')
            data.closedAt = new Date();
        return this.prisma.serviceTicket.update({ where: { id }, data });
    }
    async createWorkOrder(ticketId, tenantId, dto) {
        const ticket = await this.findOneTicket(ticketId, tenantId);
        const count = await this.prisma.serviceWorkOrder.count({ where: { tenantId } });
        const now = new Date();
        const woNumber = `WO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.serviceWorkOrder.create({
            data: { ...dto, woNumber, tenantId, ticketId },
        });
    }
    async updateWorkOrder(id, tenantId, dto) {
        const wo = await this.prisma.serviceWorkOrder.findFirst({ where: { id, tenantId } });
        if (!wo)
            throw new common_1.NotFoundException('Orden de trabajo no encontrada');
        const data = { ...dto };
        if (dto.status === 'ON_SITE' && !wo.startedAt)
            data.startedAt = new Date();
        if (dto.status === 'COMPLETED')
            data.completedAt = new Date();
        return this.prisma.serviceWorkOrder.update({ where: { id }, data });
    }
    async addPart(woId, tenantId, dto) {
        const wo = await this.prisma.serviceWorkOrder.findFirst({ where: { id: woId, tenantId } });
        if (!wo)
            throw new common_1.NotFoundException('Orden de trabajo no encontrada');
        await this.prisma.inventoryMovement.create({
            data: {
                type: 'OUT',
                quantity: dto.quantity,
                reason: `Consumo WO ${wo.woNumber}`,
                reference: wo.woNumber,
                tenantId,
                productId: dto.productId,
            },
        });
        await this.prisma.product.update({
            where: { id: dto.productId },
            data: { stockQuantity: { decrement: dto.quantity } },
        });
        return this.prisma.serviceWoPart.create({
            data: { workOrderId: woId, ...dto },
            include: { product: { select: { id: true, name: true, sku: true } } },
        });
    }
    async getKpis(tenantId) {
        const [total, open, resolved, critical] = await Promise.all([
            this.prisma.serviceTicket.count({ where: { tenantId } }),
            this.prisma.serviceTicket.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            this.prisma.serviceTicket.count({ where: { tenantId, status: 'RESOLVED' } }),
            this.prisma.serviceTicket.count({ where: { tenantId, priority: 'CRITICAL', status: { not: 'CLOSED' } } }),
        ]);
        const slaBreached = await this.prisma.serviceTicket.count({
            where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] }, slaDeadline: { lt: new Date() } },
        });
        return { total, open, resolved, critical, slaBreached, slaCompliance: total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100 };
    }
};
exports.ServiceDeskService = ServiceDeskService;
exports.ServiceDeskService = ServiceDeskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiceDeskService);
//# sourceMappingURL=service-desk.service.js.map