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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CompaniesService = class CompaniesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, search) {
        const where = { tenantId };
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
    async findOne(id, tenantId) {
        const company = await this.prisma.company.findFirst({
            where: { id, tenantId },
            include: {
                contacts: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true, jobTitle: true, status: true },
                },
            },
        });
        if (!company)
            throw new common_1.NotFoundException('Empresa no encontrada');
        return company;
    }
    async create(tenantId, dto) {
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
    async update(id, tenantId, dto) {
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
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        await this.prisma.company.delete({ where: { id } });
        return { message: 'Empresa eliminada' };
    }
    async getStats(tenantId) {
        const total = await this.prisma.company.count({ where: { tenantId } });
        const byIndustry = await this.prisma.company.groupBy({
            by: ['industry'],
            where: { tenantId, industry: { not: null } },
            _count: true,
        });
        return { total, byIndustry };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map