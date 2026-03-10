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
exports.InvoicingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const TAX_RATE = 0.18;
let InvoicingService = class InvoicingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where, skip, take: limit,
                include: {
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { items: true, payments: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.invoice.count({ where }),
        ]);
        const stats = await this.prisma.invoice.aggregate({
            where: { tenantId },
            _sum: { total: true, balance: true, paidAmount: true },
        });
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            stats: {
                totalInvoiced: stats._sum.total || 0,
                totalPaid: stats._sum.paidAmount || 0,
                totalBalance: stats._sum.balance || 0,
            },
        };
    }
    async findOne(id, tenantId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: {
                contact: true,
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                items: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { sortOrder: 'asc' } },
                payments: { orderBy: { paidAt: 'desc' } },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Factura no encontrada');
        return invoice;
    }
    async create(tenantId, userId, dto) {
        const { items = [], ncfType, contactId, dueDate, notes } = dto;
        if (!['B01', 'B02', 'B14', 'B15', 'B16'].includes(ncfType)) {
            throw new common_1.BadRequestException('Tipo NCF inválido');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new common_1.BadRequestException('La factura debe tener al menos un ítem');
        }
        for (const item of items) {
            if (!item.quantity || item.quantity <= 0 || item.quantity > 999999) {
                throw new common_1.BadRequestException('Cantidad inválida en ítem');
            }
            if (!item.unitPrice || item.unitPrice < 0 || item.unitPrice > 9999999) {
                throw new common_1.BadRequestException('Precio unitario inválido');
            }
            if (item.discount !== undefined && (item.discount < 0 || item.discount > 100)) {
                throw new common_1.BadRequestException('Descuento debe estar entre 0 y 100');
            }
        }
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100)), 0);
        const taxAmount = subtotal * TAX_RATE;
        const total = subtotal + taxAmount;
        const count = await this.prisma.invoice.count({ where: { tenantId } });
        const number = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.invoice.create({
            data: {
                number,
                ncfType,
                contactId,
                tenantId,
                createdById: userId,
                notes,
                subtotal: Math.round(subtotal * 100) / 100,
                taxAmount: Math.round(taxAmount * 100) / 100,
                total: Math.round(total * 100) / 100,
                balance: Math.round(total * 100) / 100,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                items: {
                    create: items.map((item, i) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount || 0,
                        taxRate: TAX_RATE,
                        subtotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
                        sortOrder: i,
                        productId: item.productId || undefined,
                    })),
                },
            },
            include: {
                items: true,
                contact: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async registerPayment(id, tenantId, dto) {
        const invoice = await this.findOne(id, tenantId);
        if (['PAID', 'VOID', 'CANCELLED'].includes(invoice.status)) {
            throw new common_1.BadRequestException('No se puede registrar pago en esta factura');
        }
        const { amount, method, reference, notes } = dto;
        const newPaid = invoice.paidAmount + amount;
        const newBalance = invoice.total - newPaid;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';
        await this.prisma.$transaction([
            this.prisma.invoicePayment.create({
                data: { invoiceId: id, amount, method, reference, notes },
            }),
            this.prisma.invoice.update({
                where: { id },
                data: {
                    paidAmount: newPaid,
                    balance: Math.max(0, newBalance),
                    status: newStatus,
                    paidAt: newBalance <= 0 ? new Date() : undefined,
                },
            }),
        ]);
        return this.findOne(id, tenantId);
    }
    async voidInvoice(id, tenantId) {
        const invoice = await this.findOne(id, tenantId);
        if (invoice.status === 'PAID')
            throw new common_1.BadRequestException('No se puede anular una factura pagada');
        return this.prisma.invoice.update({ where: { id }, data: { status: 'VOID' } });
    }
};
exports.InvoicingService = InvoicingService;
exports.InvoicingService = InvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicingService);
//# sourceMappingURL=invoicing.service.js.map