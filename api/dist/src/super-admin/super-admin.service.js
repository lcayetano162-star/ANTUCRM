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
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SuperAdminService = class SuperAdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllTenants(search) {
        const where = {};
        if (search)
            where.OR = [{ name: { contains: search } }, { slug: { contains: search } }];
        return this.prisma.tenant.findMany({
            where,
            include: {
                _count: { select: { users: true, contacts: true, opportunities: true } },
                subscription: { include: { plan: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        isActive: true,
                        lastLoginAt: true,
                    },
                    take: 20,
                },
                subscription: { include: { plan: true } },
                _count: { select: { users: true, contacts: true, opportunities: true, activities: true } },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant no encontrado');
        return tenant;
    }
    async createTenant(dto) {
        const DEFAULT_SETTINGS = {
            fiscalStartMonth: dto.fiscalStartMonth ?? 1,
            currency: dto.currency ?? 'DOP',
            language: dto.language ?? 'es',
            timezone: dto.timezone ?? 'America/Santo_Domingo',
            taxRate: dto.taxRate ?? 0.18,
            invoicePrefix: 'INV',
            quotePrefix: 'QT',
            mpsPrefix: 'MPS',
            ticketPrefix: 'TKT',
            defaultPaymentTerms: dto.defaultPaymentTerms ?? 30,
            companyLegalName: dto.companyLegalName ?? dto.name,
            companyTaxId: dto.companyTaxId ?? '',
            enabledModules: {
                inventory: true,
                invoicing: true,
                cpq: true,
                service_desk: true,
                marketing: true,
                whatsapp: true,
                gov: false,
                ai: true,
            },
        };
        const plan = await this.prisma.plan.findFirst({ orderBy: { priceMonthly: 'asc' } });
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.name,
                    slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    isActive: true,
                    settings: DEFAULT_SETTINGS,
                },
            });
            if (plan) {
                const now = new Date();
                const renewal = new Date(now);
                renewal.setDate(renewal.getDate() + 30);
                await tx.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        planId: plan.id,
                        status: 'ACTIVE',
                        billingCycle: 'MONTHLY',
                        nextPaymentDate: renewal,
                        lastPaymentDate: now,
                    },
                });
            }
            const bcrypt = require('bcrypt');
            const rawPassword = dto.adminPassword || `Antu${Math.random().toString(36).slice(2, 8).toUpperCase()}!`;
            const passwordHash = await bcrypt.hash(rawPassword, 12);
            const adminUser = await tx.user.create({
                data: {
                    firstName: dto.adminFirstName ?? 'Admin',
                    lastName: dto.adminLastName ?? tenant.name,
                    email: dto.adminEmail ?? `admin@${tenant.slug}.antu.app`,
                    passwordHash,
                    tenantId: tenant.id,
                    isActive: true,
                },
            });
            return { tenant, adminUser, rawPassword: dto.adminPassword ? undefined : rawPassword };
        });
        return {
            tenant: result.tenant,
            admin: {
                id: result.adminUser.id,
                email: result.adminUser.email,
                temporaryPassword: result.rawPassword,
            },
            message: 'Tenant creado con éxito. Guarda la contraseña temporal del admin.',
        };
    }
    async updateTenant(id, dto) {
        await this.findOneTenant(id);
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.settings !== undefined) {
            const existing = await this.prisma.tenant.findUnique({ where: { id }, select: { settings: true } });
            data.settings = { ...(existing?.settings || {}), ...dto.settings };
        }
        return this.prisma.tenant.update({ where: { id }, data });
    }
    async updateTenantSettings(id, settings) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id }, select: { settings: true } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant no encontrado');
        const merged = { ...(tenant.settings || {}), ...settings };
        return this.prisma.tenant.update({ where: { id }, data: { settings: merged } });
    }
    async suspendTenant(id) {
        await this.findOneTenant(id);
        return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
    }
    async activateTenant(id) {
        await this.findOneTenant(id);
        return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
    }
    async findAllPlans() {
        return this.prisma.plan.findMany({
            include: { _count: { select: { subscriptions: true } } },
            orderBy: { priceMonthly: 'asc' },
        });
    }
    async createPlan(dto) {
        return this.prisma.plan.create({
            data: {
                code: dto.code,
                priceMonthly: dto.priceMonthly ?? 0,
                priceYearly: dto.priceYearly ?? 0,
                maxUsers: dto.maxUsers ?? 5,
                maxAdmins: dto.maxAdmins ?? 1,
                maxStorage: dto.maxStorage ?? 10,
            },
        });
    }
    async updatePlan(id, dto) {
        return this.prisma.plan.update({
            where: { id },
            data: {
                code: dto.code,
                priceMonthly: dto.priceMonthly,
                priceYearly: dto.priceYearly,
                maxUsers: dto.maxUsers,
                maxAdmins: dto.maxAdmins,
                maxStorage: dto.maxStorage,
            },
        });
    }
    async getTenantUsers(tenantId) {
        return this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                isActive: true, lastLoginAt: true, createdAt: true,
                role: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createTenantUser(tenantId, dto) {
        const bcrypt = require('bcrypt');
        const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
        if (existing)
            throw new Error('Email ya registrado');
        const rawPassword = dto.password || `User${Math.random().toString(36).slice(2, 6).toUpperCase()}!`;
        const passwordHash = await bcrypt.hash(rawPassword, 12);
        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                passwordHash,
                tenantId,
                isActive: true,
                roleId: dto.roleId || null,
            },
        });
        const { passwordHash: _, ...safeUser } = user;
        return { ...safeUser, temporaryPassword: dto.password ? undefined : rawPassword };
    }
    async deactivateTenantUser(userId, tenantId) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    }
    async getPlatformStats() {
        const [totalTenants, activeTenants, totalUsers, totalContacts] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { isActive: true } }),
            this.prisma.user.count(),
            this.prisma.contact.count(),
        ]);
        const recentTenants = await this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { subscription: { include: { plan: true } } },
        });
        return { totalTenants, activeTenants, totalUsers, totalContacts, recentTenants };
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map