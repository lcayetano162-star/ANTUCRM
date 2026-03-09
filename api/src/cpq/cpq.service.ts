import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CpqService {
  constructor(private prisma: PrismaService) {}

  // ─── QUOTES ───────────────────────────────────────────────────

  async findQuotes(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where, skip, take: limit,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          opportunity: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneQuote(id: string, tenantId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        opportunity: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    return quote;
  }

  async createQuote(tenantId: string, userId: string, dto: any) {
    const { items = [], ...quoteData } = dto;
    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
    const discount = quoteData.discount || 0;
    const tax = quoteData.tax || 0;
    const total = subtotal - discount + tax;
    const count = await this.prisma.quote.count({ where: { tenantId } });
    const number = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.quote.create({
      data: {
        ...quoteData,
        number,
        tenantId,
        createdById: userId,
        subtotal,
        total,
        validUntil: quoteData.validUntil ? new Date(quoteData.validUntil) : undefined,
        items: { create: items.map((item: any, i: number) => ({ ...item, sortOrder: i })) },
      },
      include: { items: true, contact: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateQuoteStatus(id: string, tenantId: string, status: string) {
    await this.findOneQuote(id, tenantId);
    await this.prisma.quote.updateMany({ where: { id, tenantId }, data: { status: status as any } });
    return this.findOneQuote(id, tenantId);
  }

  // ─── MPS QUOTES ───────────────────────────────────────────────

  async findMpsQuotes(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.mpsQuote.findMany({
        where, skip, take: limit,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mpsQuote.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createMpsQuote(tenantId: string, userId: string, dto: any) {
    const count = await this.prisma.mpsQuote.count({ where: { tenantId } });
    const number = `MPS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // PMT Calculation
    const { equipmentCost, interestRate, termMonths, monthlyVolumeBW, monthlyVolumeColor, costPerPageBW, costPerPageColor, serviceMonthly = 0 } = dto;
    let monthlyPayment = 0;
    if (equipmentCost && interestRate && termMonths) {
      const r = interestRate / 100 / 12;
      monthlyPayment = r === 0
        ? equipmentCost / termMonths
        : equipmentCost * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    }
    const monthlyClickBW = (monthlyVolumeBW || 0) * (costPerPageBW || 0);
    const monthlyClickColor = (monthlyVolumeColor || 0) * (costPerPageColor || 0);
    const totalMonthly = monthlyPayment + monthlyClickBW + monthlyClickColor + serviceMonthly;

    return this.prisma.mpsQuote.create({
      data: {
        ...dto,
        number,
        tenantId,
        createdById: userId,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        monthlyClickBW: Math.round(monthlyClickBW * 100) / 100,
        monthlyClickColor: Math.round(monthlyClickColor * 100) / 100,
        totalMonthly: Math.round(totalMonthly * 100) / 100,
      },
    });
  }

  async approveMpsQuote(id: string, tenantId: string, userId: string, approved: boolean, notes?: string) {
    const quote = await this.prisma.mpsQuote.findFirst({ where: { id, tenantId } });
    if (!quote) throw new NotFoundException('Cotización MPS no encontrada');
    return this.prisma.mpsQuote.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approved ? userId : null,
        approvedAt: approved ? new Date() : null,
        approvalNotes: notes,
      },
    });
  }
}
