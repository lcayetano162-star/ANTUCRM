import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ─── TENANTS ──────────────────────────────────────────────────

  async findAllTenants(search?: string) {
    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { slug: { contains: search } }];
    return this.prisma.tenant.findMany({
      where,
      include: {
        _count: { select: { users: true, contacts: true, opportunities: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTenant(id: string) {
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
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async createTenant(dto: any) {
    // Default settings con todos los campos requeridos
    const DEFAULT_SETTINGS = {
      fiscalStartMonth: dto.fiscalStartMonth ?? 1,  // 1=Enero, 7=Julio para fiscal año RD
      currency: dto.currency ?? 'DOP',
      language: dto.language ?? 'es',
      timezone: dto.timezone ?? 'America/Santo_Domingo',
      taxRate: dto.taxRate ?? 0.18,                // ITBIS RD
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

    // Buscar plan FREE o el más barato
    const plan = await this.prisma.plan.findFirst({ orderBy: { priceMonthly: 'asc' } });

    // Crear tenant + subscription + admin user en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
          isActive: true,
          settings: DEFAULT_SETTINGS,
        },
      });

      // 2. Crear suscripción si hay plan disponible
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

      // 3. Crear usuario admin por defecto
      const bcrypt = require('bcrypt');
      const rawPassword = dto.adminPassword || `Antu${Math.random().toString(36).slice(2,8).toUpperCase()}!`;
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
        temporaryPassword: result.rawPassword, // Solo se muestra una vez
      },
      message: 'Tenant creado con éxito. Guarda la contraseña temporal del admin.',
    };
  }

  async updateTenant(id: string, dto: any) {
    await this.findOneTenant(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.settings !== undefined) {
      // Merge with existing settings instead of replacing
      const existing = await this.prisma.tenant.findUnique({ where: { id }, select: { settings: true } });
      data.settings = { ...(existing?.settings as any || {}), ...dto.settings };
    }
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async updateTenantSettings(id: string, settings: Record<string, any>) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id }, select: { settings: true } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    const merged = { ...(tenant.settings as any || {}), ...settings };
    return this.prisma.tenant.update({ where: { id }, data: { settings: merged } });
  }

  async suspendTenant(id: string) {
    await this.findOneTenant(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async activateTenant(id: string) {
    await this.findOneTenant(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
  }

  // ─── PLANS ────────────────────────────────────────────────────

  async findAllPlans() {
    return this.prisma.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async createPlan(dto: any) {
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

  async updatePlan(id: string, dto: any) {
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

  // ─── TENANT USERS ─────────────────────────────────────────────

  async getTenantUsers(tenantId: string) {
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

  async createTenantUser(tenantId: string, dto: any) {
    const bcrypt = require('bcrypt');
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) throw new Error('Email ya registrado');
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
    const { passwordHash: _, ...safeUser } = user as any;
    return { ...safeUser, temporaryPassword: dto.password ? undefined : rawPassword };
  }

  async deactivateTenantUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  // ─── STATS / DASHBOARD ────────────────────────────────────────

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
}
