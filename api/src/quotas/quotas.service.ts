import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkUpdateQuotaDto, CreateQuotaDto } from './dto/quota.dto';
import { QuotaPeriod, QuotaType } from '@prisma/client';

@Injectable()
export class QuotasService {
    constructor(private readonly prisma: PrismaService) { }

    async getQuotas(tenantId: string, year: number) {
        const quotas = await this.prisma.quota.findMany({
            where: { tenantId, year },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
        });

        const companyQuotas = quotas.filter((q) => q.type === 'COMPANY');
        const userQuotas = quotas.filter((q) => q.type === 'USER');

        // Devolvemos la lista de usuarios para facilitar la UI en el frente
        const users = await this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true }
        });

        return { companyQuotas, userQuotas, users };
    }

    async saveQuotas(tenantId: string, payload: BulkUpdateQuotaDto) {
        const { quotas } = payload;

        // Aggregation Logic Validation (Top-Down & Bottom-Up)
        const companySums: Record<string, number> = {};
        const userSums: Record<string, number> = {};

        for (const q of quotas) {
            const key = `${q.year}-${q.period}`;
            if (q.type === 'COMPANY') {
                companySums[key] = (companySums[key] || 0) + Number(q.amount);
            } else {
                userSums[key] = (userSums[key] || 0) + Number(q.amount);
            }
        }

        for (const key of Object.keys(companySums)) {
            const cAmount = companySums[key];
            const uAmount = userSums[key] || 0;
            // Validar: La cuota de la empresa debe ser mayor o igual a la sumatoria de las cuotas individuales
            if (uAmount > cAmount) {
                throw new BadRequestException(
                    `Para el periodo ${key}, la suma asignada a los vendedores (${uAmount}) excede la cuota de la empresa (${cAmount}).`
                );
            }
        }

        // Transacción masiva
        await this.prisma.$transaction(async (tx) => {
            // Simplificación: eliminar cuotas del año en la DB para este payload y re-insertar
            // (asumiendo que frontend manda el año completo)
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

    async getPerformance(tenantId: string, userId: string, role: string, year: number, periodStr?: string) {
        // Definir period filters
        let startDate = new Date(year, 0, 1);
        let endDate = new Date(year, 11, 31, 23, 59, 59);

        if (periodStr && periodStr !== 'ANNUAL') {
            // logic to set start and end dates if needed. For now we just aggregate won opps for the year
        }

        // Filtros de RLS / Rol
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

        // Quota context
        const quotas = await this.prisma.quota.findMany({
            where: { tenantId, year, period: 'ANNUAL' }
        });

        let targetQuota = 0;
        if (role === 'ADMIN' || role === 'MANAGER') {
            targetQuota = quotas.find((q) => q.type === 'COMPANY')?.amount || 0;
        } else {
            targetQuota = quotas.find((q) => q.type === 'USER' && q.userId === userId)?.amount || 0;
        }

        const pacing = targetQuota > 0 ? (totalWon / targetQuota) * 100 : 0;
        const forecastPercentage = targetQuota > 0 ? ((totalWon + totalPipeline) / targetQuota) * 100 : 0;

        // KPIs
        const winRate = opportunities.length > 0 ? (countWon / opportunities.length) * 100 : 0;
        const averageTicket = countWon > 0 ? totalWon / countWon : 0;

        let salesOpsConfig = null;
        if (role === 'ADMIN' || role === 'MANAGER' || role === 'SALES_MANAGER') {
            const mKPI = await this.prisma.managerKPI.findFirst({
                where: { tenantId, managerId: userId, year }
            });
            if (mKPI) {
                // Calcular métricas reales para el manager
                const teamUserIds = await this.prisma.user.findMany({
                    where: { tenantId, isActive: true, managerId: userId },
                    select: { id: true },
                });
                const teamIds = teamUserIds.map(u => u.id);

                // Pipeline health: % de oportunidades activas con actividad en últimos 14 días
                const [activeOpps, activeOppsWithActivity] = await Promise.all([
                    this.prisma.opportunity.count({ where: { tenantId, status: 'OPEN', assignedToId: { in: teamIds } } }),
                    this.prisma.opportunity.count({
                        where: {
                            tenantId, status: 'OPEN', assignedToId: { in: teamIds },
                            activities: { some: { createdAt: { gte: new Date(Date.now() - 14 * 86400000) } } },
                        },
                    }),
                ]);

                // Coaching sessions: actividades de tipo MEETING/CALL del manager con su equipo en el mes
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
        } else {
            const sGoal = await this.prisma.activityGoal.findFirst({
                where: { tenantId, userId, year }
            });

            // Calcular métricas reales para el vendedor
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const last30Start = new Date(Date.now() - 30 * 86400000);

            const [visitCount, callCount, newOppCount, recentContacts, totalContacts] = await Promise.all([
                // VISIT no existe como ActivityType; se usa MEETING como equivalente de visita presencial
                this.prisma.activity.count({
                    where: { tenantId, createdById: userId, type: 'MEETING', createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                this.prisma.activity.count({
                    where: { tenantId, createdById: userId, type: 'CALL', createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                this.prisma.opportunity.count({
                    where: { tenantId, assignedToId: userId, createdAt: { gte: weekStart, lte: weekEnd } },
                }),
                // Follow-up rate: contactos asignados con actividad en los últimos 30 días vs total
                this.prisma.contact.count({
                    where: { tenantId, assignedToId: userId, activities: { some: { createdAt: { gte: last30Start } } } },
                }),
                this.prisma.contact.count({ where: { tenantId, assignedToId: userId, deletedAt: null } }),
            ]);

            // Speed to lead: promedio de minutos desde creación del contacto hasta primera actividad (últimos 7 días)
            const speedActivities = await this.prisma.activity.findMany({
                where: { tenantId, createdById: userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
                include: { contact: { select: { createdAt: true } } },
                take: 20,
            });
            let avgSpeedToLead = 0;
            if (speedActivities.length > 0) {
                const diffs = speedActivities
                    .filter(a => a.contact)
                    .map(a => (a.createdAt.getTime() - a.contact!.createdAt.getTime()) / 60000); // en minutos
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
            pacing: pacing.toFixed(2), // % completado
            targetQuota,
            totalWon,
            forecast: (totalWon + totalPipeline),     // Pipeline ponderado
            forecastPercentage: forecastPercentage.toFixed(2),
            winRate: winRate.toFixed(2),
            averageTicket: averageTicket.toFixed(2),
            salesOpsConfig
            // Cycle sale etc.
        };
    }

    async getSalesOpsConfig(tenantId: string, year: number) {
        // Obtenemos los goles por defecto para el primer usuario para rehidratar la UI global
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

    async saveSalesOpsConfig(tenantId: string, payload: any) {
        const { year, period = 'ANNUAL', seller, manager } = payload;

        // Obtain all Active users
        const users = await this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            include: { role: true }
        });

        const sellers = users.filter(u => u.role?.name === 'SALES_REP' || u.roleId === 'SALES_REP');
        // Note: roles could be enums or strings, considering our previous knowledge we treat as string/enum equivalent where possible.

        const managers = users.filter(u => ['SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN'].includes(u.role?.name || u.roleId || ''));

        await this.prisma.$transaction(async (tx) => {
            // Updating all sellers
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

            // Updating all managers
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
}
