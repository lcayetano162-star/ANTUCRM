import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TAX_RATE = 0.18; // ITBIS República Dominicana

@Injectable()
export class InvoicingService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (status) where.status = status;

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

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return invoice;
  }

  async create(tenantId: string, userId: string, dto: any) {
    const { items = [], ncfType, contactId, dueDate, notes } = dto;

    if (!['B01', 'B02', 'B14', 'B15', 'B16'].includes(ncfType)) {
      throw new BadRequestException('Tipo NCF inválido');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('La factura debe tener al menos un ítem');
    }

    // Validar cada ítem para prevenir datos maliciosos
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0 || item.quantity > 999999) {
        throw new BadRequestException('Cantidad inválida en ítem');
      }
      if (!item.unitPrice || item.unitPrice < 0 || item.unitPrice > 9999999) {
        throw new BadRequestException('Precio unitario inválido');
      }
      if (item.discount !== undefined && (item.discount < 0 || item.discount > 100)) {
        throw new BadRequestException('Descuento debe estar entre 0 y 100');
      }
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100)), 0);
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
          create: items.map((item: any, i: number) => ({
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

  async registerPayment(id: string, tenantId: string, dto: any) {
    const invoice = await this.findOne(id, tenantId);
    if (['PAID', 'VOID', 'CANCELLED'].includes(invoice.status)) {
      throw new BadRequestException('No se puede registrar pago en esta factura');
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
          status: newStatus as any,
          paidAt: newBalance <= 0 ? new Date() : undefined,
        },
      }),
    ]);

    return this.findOne(id, tenantId);
  }

  async voidInvoice(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.status === 'PAID') throw new BadRequestException('No se puede anular una factura pagada');
    return this.prisma.invoice.update({ where: { id }, data: { status: 'VOID' } });
  }
}
