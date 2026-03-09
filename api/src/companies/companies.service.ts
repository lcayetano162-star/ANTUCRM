import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { taxId: { contains: search } },
      ];
    }
    const companies = await this.prisma.company.findMany({
      where,
      include: {
        _count: { select: { contacts: true } },
      },
      orderBy: { name: 'asc' },
    });
    return companies;
  }

  async findOne(id: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId },
      include: {
        contacts: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, jobTitle: true, status: true },
        },
      },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async create(tenantId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: dto.name,
        industry: dto.industry,
        website: dto.website || null,
        email: dto.email || null,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        taxId: dto.taxId,
        description: dto.description,
        tenantId,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCompanyDto) {
    await this.findOne(id, tenantId);
    return this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        industry: dto.industry,
        website: dto.website ?? undefined,
        email: dto.email ?? undefined,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        taxId: dto.taxId,
        description: dto.description,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.company.delete({ where: { id } });
    return { message: 'Empresa eliminada' };
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.company.count({ where: { tenantId } });
    const byIndustry = await this.prisma.company.groupBy({
      by: ['industry'],
      where: { tenantId, industry: { not: null } },
      _count: true,
    });
    return { total, byIndustry };
  }
}
