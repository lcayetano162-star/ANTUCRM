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
exports.QuotasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotasService = class QuotasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getQuotas(tenantId, year) {
        const quotas = await this.prisma.quota.findMany({
            where: { tenantId, year },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
        });
        const companyQuotas = quotas.filter((q) => q.type === 'COMPANY');
        const userQuotas = quotas.filter((q) => q.type === 'USER');
        const users = await this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true }
        });
        return { companyQuotas, userQuotas, users };
    }
    async saveQuotas(tenantId, payload) {
        const { quotas } = payload;
        const companySums = {};
        const userSums = {};
        for (const q of quotas) {
            const key = `${q.year}-${q.period}`;
            if (q.type === 'COMPANY') {
                companySums[key] = (companySums[key] || 0) + Number(q.amount);
            }
            else {
                userSums[key] = (userSums[key] || 0) + Number(q.amount);
            }
        }
        for (const key of Object.keys(companySums)) {
            const cAmount = companySums[key];
            const uAmount = userSums[key] || 0;
            if (uAmount > cAmount) {
                throw new common_1.BadRequestException(`Para el periodo ${key}, la suma asignada a los vendedores (${uAmount}) excede la cuota de la empresa (${cAmount}).`);
            }
        }
        await this.prisma.$transaction(async (tx) => {
            if (quotas.length > 0) {
                const year = quotas[0].year;
                await tx.quota.deleteMany({
                    where: { tenantId, year }
                });
            }
            const createData = quotas.map((q) => ({
                tenantId,
                userId: q.userId || null,
                year: q.year,
                period: q.period,
                type: q.type,
                amount: Number(q.amount),
                currency: q.currency || 'USD',
            }));
            await tx.quota.createMany({ data: createData });
        });
        return { success: true, message: 'Cuotas actualizadas sincronizadas correctamente.' };
    }
    async getPerformance(tenantId, userId, role, year, periodStr) {
        let startDate = new Date(year, 0, 1);
        let endDate = new Date(year, 11, 31, 23, 59, 59);
        if (periodStr && periodStr !== 'ANNUAL') {
        }
        const userRoleFilter = (role === 'ADMIN' || role === 'MANAGER') ? {} : { assignedToId: userId };
        const opportunities = await this.prisma.opportunity.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate, lte: endDate },
                status: { in: ['WON', 'LOST'] },
                ...userRoleFilter
            }
        });
        const pipeline = await this.prisma.opportunity.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'OPEN',
                ...userRoleFilter
            }
        });
        const totalWon = opportunities.filter((o) => o.status === 'WON').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
        const totalPipeline = pipeline.reduce((acc, curr) => acc + (Number(curr.value || 0) * (curr.probability || 0) / 100), 0);
        const countWon = opportunities.filter((o) => o.status === 'WON').length;
        const quotas = await this.prisma.quota.findMany({
            where: { tenantId, year, period: 'ANNUAL' }
        });
        let targetQuota = 0;
        if (role === 'ADMIN' || role === 'MANAGER') {
            targetQuota = quotas.find((q) => q.type === 'COMPANY')?.amount || 0;
        }
        else {
            targetQuota = quotas.find((q) => q.type === 'USER' && q.userId === userId)?.amount || 0;
        }
        const pacing = targetQuota > 0 ? (totalWon / targetQuota) * 100 : 0;
        const forecastPercentage = targetQuota > 0 ? ((totalWon + totalPipeline) / targetQuota) * 100 : 0;
        const winRate = opportunities.length > 0 ? (countWon / opportunities.length) * 100 : 0;
        const averageTicket = countWon > 0 ? totalWon / countWon : 0;
        let salesOpsConfig = null;
        if (role === 'ADMIN' || role === 'MANAGER' || role === 'SALES_MANAGER') {
            const mKPI = await this.prisma.managerKPI.findFirst({
                where: { tenantId, managerId: userId, year }
            });
            if (mKPI) {
                const teamUserIds = await this.prisma.user.findMany({
                    where: { tenantId, isActive: true, managerId: userId },
                    select: { id: true },
                });
                const teamIds = teamUserIds.map(u => u.id);
                const [activeOpps, activeOppsWithActivity] = await Promise.all([
                    this.prisma.opportunity.count({ where: { tenantId, status: 'OPEN', assignedToId: { in: teamIds } } }),
                    this.prisma.opportunity.count({
                        where: {
                            tenantId, status: 'OPEN', assignedToId: { in: teamIds },
                            activities: { some: { createdAt: { gte: new Date(Date.now() - 14 * 86400000) } } },
                        },
                    }),
                ]);
                const coachingSessions = await this.prisma.activity.count({
                    where: {
                        tenantId, createdById: userId, type: { in: ['MEETING', 'CALL'] },
                        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
                    },
                });
                const pipelineHealthActual = activeOpps > 0 ? Math.round((activeOppsWithActivity / activeOpps) * 100) : 0;
                salesOpsConfig = {
                    role: 'manager',
                    metrics: {
                        pipelineHealth: { actual: pipelineHealthActual, target: mKPI.pipelineHealthTarget, percent: Math.min(100, Math.round(pipelineHealthActual / mKPI.pipelineHealthTarget * 100)) },
                        coaching: { actual: coachingSessions, target: mKPI.coachingSessions, percent: Math.min(100, Math.round(coachingSessions / mKPI.coachingSessions * 100)) },
                        forecastAccuracy: { actual: Math.round(Math.abs(100 - forecastPercentage)), target: mKPI.forecastAccuracyMax, percent: Math.abs(100 - forecastPercentage) <= mKPI.forecastAccuracyMax ? 100 : Math.round(mKPI.forecastAccuracyMax / Math.abs(100 - forecastPercentage) * 100) },
                        teamQuota: { actual: Math.round(pacing), target: mKPI.teamQuotaAttainment, percent: Math.min(100, Math.round(pacing / mKPI.teamQuotaAttainment * 100)) }
                    }
                };
            }
        }
        else {
            const sGoal = await this.prisma.activityGoal.findFirst({
                where: { tenantId, userId, year }
            });
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const last30Start = new Date(Date.now() - 30 * 86400000);
            const [visitCount, callCount, newOppCount, recentContacts, totalContacts] = await Promise.all([
                this.prisma.activity.count({
                    where: { tenantId, createdById: userId, type: 'MEETING', createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                this.prisma.activity.count({
                    where: { tenantId, createdById: userId, type: 'CALL', createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                this.prisma.opportunity.count({
                    where: { tenantId, assignedToId: userId, createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                this.prisma.contact.count({
                    where: { tenantId, assignedToId: userId, activities: { some: { createdAt: { gte: last30Start } } } },
                }),
                this.prisma.contact.count({ where: { tenantId, assignedToId: userId, deletedAt: null } }),
            ]);
            const speedActivities = await this.prisma.activity.findMany({
                where: { tenantId, createdById: userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
                include: { contact: { select: { createdAt: true } } },
                take: 20,
            });
            let avgSpeedToLead = 0;
            if (speedActivities.length > 0) {
                const diffs = speedActivities
                    .filter(a => a.contact)
                    .map(a => (a.createdAt.getTime() - a.contact.createdAt.getTime()) / 60000);
                avgSpeedToLead = diffs.length > 0 ? Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length) : 0;
            }
            const followUpRate = totalContacts > 0 ? Math.round((recentContacts / totalContacts) * 100) : 0;
            salesOpsConfig = {
                role: 'seller',
                metrics: {
                    visits: { actual: visitCount, target: sGoal.weeklyVisitsTarget, percent: Math.min(100, Math.round(visitCount / sGoal.weeklyVisitsTarget * 100)) },
                    calls: { actual: callCount, target: sGoal.weeklyCallsTarget, percent: Math.min(100, Math.round(callCount / sGoal.weeklyCallsTarget * 100)) },
                    newOpps: { actual: newOppCount, target: sGoal.newOppsTarget, percent: Math.min(100, Math.round(newOppCount / sGoal.newOppsTarget * 100)) },
                    speedToLead: { actual: avgSpeedToLead, target: sGoal.speedToLeadMinutes, percent: avgSpeedToLead <= sGoal.speedToLeadMinutes ? 100 : Math.round(sGoal.speedToLeadMinutes / avgSpeedToLead * 100) },
                    followUp: { actual: followUpRate, target: sGoal.followUpRatePercent, percent: Math.min(100, Math.round(followUpRate / sGoal.followUpRatePercent * 100)) }
                }
            };
        }
        return {
            pacing: pacing.toFixed(2),
            targetQuota,
            totalWon,
            forecast: (totalWon + totalPipeline),
            forecastPercentage: forecastPercentage.toFixed(2),
            winRate: winRate.toFixed(2),
            averageTicket: averageTicket.toFixed(2),
            salesOpsConfig
        };
    }
    async getSalesOpsConfig(tenantId, year) {
        const firstSellerGoal = await this.prisma.activityGoal.findFirst({
            where: { tenantId, year, period: 'ANNUAL' }
        });
        const firstManagerGoal = await this.prisma.managerKPI.findFirst({
            where: { tenantId, year, period: 'ANNUAL' }
        });
        return {
            seller: {
                weeklyVisits: firstSellerGoal?.weeklyVisitsTarget || 10,
                weeklyCalls: firstSellerGoal?.weeklyCallsTarget || 80,
                newOpps: firstSellerGoal?.newOppsTarget || 5,
                speedToLead: firstSellerGoal?.speedToLeadMinutes || 60,
                followUpRate: firstSellerGoal?.followUpRatePercent || 95
            },
            manager: {
                pipelineHealth: firstManagerGoal?.pipelineHealthTarget || 85,
                coachingSessions: firstManagerGoal?.coachingSessions || 4,
                forecastAccuracy: firstManagerGoal?.forecastAccuracyMax || 10,
                teamQuota: firstManagerGoal?.teamQuotaAttainment || 100
            }
        };
    }
    async saveSalesOpsConfig(tenantId, payload) {
        const { year, period = 'ANNUAL', seller, manager } = payload;
        const users = await this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            include: { role: true }
        });
        const sellers = users.filter(u => u.role?.name === 'SALES_REP' || u.roleId === 'SALES_REP');
        const managers = users.filter(u => ['SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN'].includes(u.role?.name || u.roleId || ''));
        await this.prisma.$transaction(async (tx) => {
            for (const s of sellers) {
                await tx.activityGoal.upsert({
                    where: {
                        tenantId_userId_year_period: { tenantId, userId: s.id, year, period }
                    },
                    update: {
                        weeklyVisitsTarget: seller.weeklyVisits,
                        weeklyCallsTarget: seller.weeklyCalls,
                        newOppsTarget: seller.newOpps,
                        speedToLeadMinutes: seller.speedToLead,
                        followUpRatePercent: seller.followUpRate
                    },
                    create: {
                        tenantId,
                        userId: s.id,
                        year,
                        period,
                        weeklyVisitsTarget: seller.weeklyVisits,
                        weeklyCallsTarget: seller.weeklyCalls,
                        newOppsTarget: seller.newOpps,
                        speedToLeadMinutes: seller.speedToLead,
                        followUpRatePercent: seller.followUpRate
                    }
                });
            }
            for (const m of managers) {
                await tx.managerKPI.upsert({
                    where: {
                        tenantId_managerId_year_period: { tenantId, managerId: m.id, year, period }
                    },
                    update: {
                        pipelineHealthTarget: manager.pipelineHealth,
                        coachingSessions: manager.coachingSessions,
                        forecastAccuracyMax: manager.forecastAccuracy,
                        teamQuotaAttainment: manager.teamQuota
                    },
                    create: {
                        tenantId,
                        managerId: m.id,
                        year,
                        period,
                        pipelineHealthTarget: manager.pipelineHealth,
                        coachingSessions: manager.coachingSessions,
                        forecastAccuracyMax: manager.forecastAccuracy,
                        teamQuotaAttainment: manager.teamQuota
                    }
                });
            }
        });
        return { success: true, message: 'Sales Ops metadata successfully propagated to all agents' };
    }
};
exports.QuotasService = QuotasService;
exports.QuotasService = QuotasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotasService);
//# sourceMappingURL=quotas.service.js.map