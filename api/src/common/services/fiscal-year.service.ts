/**
 * Enterprise Fiscal Year Engine for Antü CRM
 * Architect: Antigravity AI Core
 * 
 * Lógica base de cálculo para fechas de aislamiento fiscal
 */

import { Tenant } from '@prisma/client';

export interface FiscalYearBoundaries {
    startDate: Date;
    endDate: Date;
    fiscalYear: string;
}

export class FiscalYearEngine {
    /**
     * Calcula los límites del año fiscal según los settings del Tenant.
     * Si el tenant no tiene mes de inicio, asume Enero (1).
     */
    static getFiscalYearBoundaries(tenant: Tenant, referenceDate: Date = new Date()): FiscalYearBoundaries {
        // 1. Extraer configuración de offset (ej. si el año fiscal inicia en Julio = 7)
        // Se asume que tenant.settings es un JSON parseado o que contiene 'fiscalStartMonth'
        const settings = (tenant.settings as any) || {};
        const startMonth = settings.fiscalStartMonth ? parseInt(settings.fiscalStartMonth, 10) : 1;

        const currentMonth = referenceDate.getMonth() + 1; // getMonth es 0-indexed
        let fiscalYearBase = referenceDate.getFullYear();

        // 2. Lógica de Offset de Año
        // Si estamos en un mes anterior al inicio fiscal, en realidad pertenecemos al año fiscal "anterior"
        // Ejemplo: Inicia en Julio (7). Estamos en Marzo (3) 2026. Pertenece al Fiscal 2025.
        if (currentMonth < startMonth) {
            fiscalYearBase -= 1;
        }

        // 3. Crear límites exactos en UTC para evitar saltos de zona horaria
        const startDate = new Date(Date.UTC(fiscalYearBase, startMonth - 1, 1, 0, 0, 0, 0));

        // EndDate = StartDate + 1 año - 1 milisegundo (ej. hasta Jun 30, 23:59:59.999)
        const endDate = new Date(Date.UTC(fiscalYearBase + 1, startMonth - 1, 1, 0, 0, 0, 0));
        endDate.setTime(endDate.getTime() - 1);

        return {
            startDate,
            endDate,
            fiscalYear: `FY${fiscalYearBase}`
        };
    }

    /**
     * Genera el filtro Prisma inyectable globalmente
     */
    static getPrismaFiscalFilter(tenant: Tenant, referenceDate: Date = new Date(), dateField: string = 'createdAt') {
        const { startDate, endDate } = this.getFiscalYearBoundaries(tenant, referenceDate);

        return {
            [dateField]: {
                gte: startDate,
                lte: endDate
            }
        };
    }
}
