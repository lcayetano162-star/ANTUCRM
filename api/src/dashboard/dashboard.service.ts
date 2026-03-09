import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/types/auth.types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  async getSalesDashboard(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    period: string,
  ) {
    const [kpis, recentActivities, topOpportunities, salesTrend, funnel, topVendedores] = await Promise.all([
      this.getKPIs(tenantId, userId, userRole, period),
      this.getRecentActivities(tenantId, userId, userRole),
      this.getTopOpportunities(tenantId, userId, userRole),
      this.getSalesTrend(tenantId, userId, userRole, period),
      this.getFunnelData(tenantId, userId, userRole),
      this.getTopVendedores(tenantId, period),
    ]);

    return {
      kpis,
      recentActivities,
      topOpportunities,
      salesTrend,
      funnel,
      topVendedores,
      period,
    };
  }

  async getKPIs(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    period: string,
  ) {
    const whereClause = this.getRoleBasedWhereClause(userId, userRole);

    const [
      totalRevenue,
      totalDeals,
      newContacts,
      activeOpportunities,
    ] = await Promise.all([
      this.prisma.opportunity.aggregate({
        where: {
          tenantId,
          status: 'WON',
          ...whereClause,
        },
        _sum: { value: true },
      }),
      this.prisma.opportunity.count({
        where: {
          tenantId,
          status: 'WON',
          ...whereClause,
        },
      }),
      this.prisma.contact.count({
        where: {
          tenantId,
          createdAt: { gte: this.getPeriodStartDate(period) },
          ...whereClause,
        },
      }),
      this.prisma.opportunity.count({
        where: {
          tenantId,
          status: { notIn: ['WON', 'LOST', 'CLOSED'] },
          ...whereClause,
        },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum?.value || 0,
      totalDeals,
      newContacts,
      activeOpportunities,
    };
  }

  private async getRecentActivities(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const whereClause = this.getRoleBasedWhereClause(userId, userRole);

    return this.prisma.activity.findMany({
      where: { tenantId, ...whereClause },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private async getTopOpportunities(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const whereClause = this.getRoleBasedWhereClause(userId, userRole);

    return this.prisma.opportunity.findMany({
      where: {
        tenantId,
        status: { notIn: ['WON', 'LOST', 'CLOSED'] },
        ...whereClause,
      },
      orderBy: { value: 'desc' },
      take: 5,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: { select: { name: true } },
          },
        },
      },
    });
  }

  private async getSalesTrend(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    period: string,
  ) {
    const whereClause = this.getRoleBasedWhereClause(userId, userRole);
    const startDate = this.getPeriodStartDate(period);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        ...whereClause,
      },
      select: {
        createdAt: true,
        value: true,
        status: true,
      },
    });

    // Agrupar por mes
    const grouped = opportunities.reduce((acc, opp) => {
      const month = opp.createdAt.toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { month, value: 0, count: 0 };
      }
      acc[month].value += Number(opp.value || 0);
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; value: number; count: number }>);

    return Object.values(grouped).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }

  private async getFunnelData(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const whereClause = this.getRoleBasedWhereClause(userId, userRole);

    const counts = await this.prisma.opportunity.groupBy({
      by: ['stage'],
      where: { tenantId, ...whereClause },
      _count: { _all: true },
      _sum: { value: true },
    });

    return counts.map(c => ({
      stage: c.stage,
      count: c._count._all,
      value: c._sum.value || 0,
    }));
  }

  private async getTopVendedores(
    tenantId: string,
    period: string,
  ) {
    const startDate = this.getPeriodStartDate(period);

    const topSellers = await this.prisma.opportunity.groupBy({
      by: ['assignedToId'],
      where: {
        tenantId,
        status: 'WON',
        actualCloseDate: { gte: startDate },
      },
      _sum: { value: true },
      orderBy: { _sum: { value: 'desc' } },
      take: 5,
    });

    const enriched = await Promise.all(
      topSellers.map(async s => {
        if (!s.assignedToId) return null;
        const user = await this.prisma.user.findUnique({
          where: { id: s.assignedToId },
          select: { firstName: true, lastName: true },
        });
        return {
          name: user ? `${user.firstName} ${user.lastName}` : 'Desconocido',
          value: s._sum.value || 0,
          percentage: 100, // Por ahora fijo, debería calcularse contra metas reales
        };
      })
    );

    return enriched.filter(e => e !== null);
  }

  async getTeamMembers(tenantId: string) {
    console.log(`[DashboardService] getTeamMembers for tenant: ${tenantId}`);
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
      },
    });

    console.log(`[DashboardService] found ${users.length} users`);
    return users.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: '', // No hay teléfono en el modelo User actualmente
      role: 'Vendedor',
      active: true,
      joinDate: u.createdAt.toISOString(),
    }));
  }

  private getRoleBasedWhereClause(userId: string, userRole: UserRole): any {
    switch (userRole) {
      case UserRole.USER:
        return { assignedToId: userId };
      case UserRole.MANAGER:
        return {
          OR: [
            { assignedToId: userId },
            { assignedTo: { managerId: userId } },
          ],
        };
      case UserRole.ADMIN:
      default:
        return {};
    }
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }
}
