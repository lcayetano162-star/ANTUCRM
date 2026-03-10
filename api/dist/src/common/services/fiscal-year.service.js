"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalYearEngine = void 0;
class FiscalYearEngine {
    static getFiscalYearBoundaries(tenant, referenceDate = new Date()) {
        const settings = tenant.settings || {};
        const startMonth = settings.fiscalStartMonth ? parseInt(settings.fiscalStartMonth, 10) : 1;
        const currentMonth = referenceDate.getMonth() + 1;
        let fiscalYearBase = referenceDate.getFullYear();
        if (currentMonth < startMonth) {
            fiscalYearBase -= 1;
        }
        const startDate = new Date(Date.UTC(fiscalYearBase, startMonth - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(fiscalYearBase + 1, startMonth - 1, 1, 0, 0, 0, 0));
        endDate.setTime(endDate.getTime() - 1);
        return {
            startDate,
            endDate,
            fiscalYear: `FY${fiscalYearBase}`
        };
    }
    static getPrismaFiscalFilter(tenant, referenceDate = new Date(), dateField = 'createdAt') {
        const { startDate, endDate } = this.getFiscalYearBoundaries(tenant, referenceDate);
        return {
            [dateField]: {
                gte: startDate,
                lte: endDate
            }
        };
    }
}
exports.FiscalYearEngine = FiscalYearEngine;
//# sourceMappingURL=fiscal-year.service.js.map