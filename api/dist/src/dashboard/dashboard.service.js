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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_types_1 = require("../auth/types/auth.types");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSalesDashboard(tenantId, userId, userRole, period) {
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
    async getKPIs(tenantId, userId, userRole, period) {
        const whereClause = this.getRoleBasedWhereClause(userId, userRole);
        const [totalRevenue, totalDeals, newContacts, activeOpportunities,] = await Promise.all([
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
    async getRecentActivities(tenantId, userId, userRole) {
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
    async getTopOpportunities(tenantId, userId, userRole) {
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
    async getSalesTrend(tenantId, userId, userRole, period) {
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
        const grouped = opportunities.reduce((acc, opp) => {
            const month = opp.createdAt.toISOString().slice(0, 7);
            if (!acc[month]) {
                acc[month] = { month, value: 0, count: 0 };
            }
            acc[month].value += Number(opp.value || 0);
            acc[month].count += 1;
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
    }
    async getFunnelData(tenantId, userId, userRole) {
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
    async getTopVendedores(tenantId, period) {
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
        const enriched = await Promise.all(topSellers.map(async (s) => {
            if (!s.assignedToId)
                return null;
            const user = await this.prisma.user.findUnique({
                where: { id: s.assignedToId },
                select: { firstName: true, lastName: true },
            });
            return {
                name: user ? `${user.firstName} ${user.lastName}` : 'Desconocido',
                value: s._sum.value || 0,
                percentage: 100,
            };
        }));
        return enriched.filter(e => e !== null);
    }
    async getTeamMembers(tenantId) {
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
            phone: '',
            role: 'Vendedor',
            active: true,
            joinDate: u.createdAt.toISOString(),
        }));
    }
    getRoleBasedWhereClause(userId, userRole) {
        switch (userRole) {
            case auth_types_1.UserRole.USER:
                return { assignedToId: userId };
            case auth_types_1.UserRole.MANAGER:
                return {
                    OR: [
                        { assignedToId: userId },
                        { assignedTo: { managerId: userId } },
                    ],
                };
            case auth_types_1.UserRole.ADMIN:
            default:
                return {};
        }
    }
    getPeriodStartDate(period) {
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map