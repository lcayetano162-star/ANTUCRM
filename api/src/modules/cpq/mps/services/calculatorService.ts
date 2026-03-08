import { MPSItem, MPSGridTotals, MPSFinancialSummary, MPSQuoteInput, MPSQuoteResult, MPSConfig } from '../types';

const DEFAULT_CONFIG: MPSConfig = {
  bwCostPerPage: 8,
  colorCostPerPage: 45,
  defaultInterestRate: 0.012,
  defaultFinancingMonths: 36,
  marginTargets: {
    list: 0.35,
    distributor: 0.25,
    special: 0.15
  }
};

export class MPSCalculatorService {
  private config: MPSConfig;

  constructor(config?: Partial<MPSConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): MPSConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MPSConfig>): MPSConfig {
    this.config = { ...this.config, ...newConfig };
    return { ...this.config };
  }

  resetConfig(): MPSConfig {
    this.config = { ...DEFAULT_CONFIG };
    return { ...this.config };
  }

  /**
   * PMT financial formula: calculates monthly payment for a loan
   * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  private pmt(principal: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) return principal / months;
    const factor = Math.pow(1 + monthlyRate, months);
    return principal * (monthlyRate * factor) / (factor - 1);
  }

  calculateItem(item: MPSItem): MPSItem & { monthlyRevenueBW: number; monthlyRevenueColor: number; monthlyRevenueTotal: number; monthlyPayment?: number } {
    const monthlyRevenueBW = item.monthlyVolumeBW * this.config.bwCostPerPage * item.copies;
    const monthlyRevenueColor = item.isColor ? item.monthlyVolumeColor * this.config.colorCostPerPage * item.copies : 0;
    const monthlyRevenueTotal = monthlyRevenueBW + monthlyRevenueColor;

    let monthlyPayment: number | undefined;
    if (item.businessMode === 'arriendo' && item.financingMonths && item.interestRate !== undefined) {
      // Equipment cost placeholder based on model (simplified)
      const equipmentCost = 1000000; // Base cost, would come from DB in full implementation
      monthlyPayment = this.pmt(equipmentCost * item.copies, item.interestRate / 100, item.financingMonths);
    }

    return {
      ...item,
      monthlyRevenueBW,
      monthlyRevenueColor,
      monthlyRevenueTotal,
      monthlyPayment
    };
  }

  calculateGridTotals(items: MPSItem[]): MPSGridTotals {
    return {
      totalMachines: items.reduce((sum, i) => sum + i.copies, 0),
      totalMonthlyVolumesBW: items.reduce((sum, i) => sum + i.monthlyVolumeBW * i.copies, 0),
      totalMonthlyVolumesColor: items.reduce((sum, i) => sum + (i.isColor ? i.monthlyVolumeColor * i.copies : 0), 0),
      totalMonthlyRevenue: items.reduce((sum, i) => sum + (i.monthlyVolumeBW * this.config.bwCostPerPage * i.copies) + (i.isColor ? i.monthlyVolumeColor * this.config.colorCostPerPage * i.copies : 0), 0),
      totalAnnualRevenue: items.reduce((sum, i) => sum + ((i.monthlyVolumeBW * this.config.bwCostPerPage * i.copies) + (i.isColor ? i.monthlyVolumeColor * this.config.colorCostPerPage * i.copies : 0)) * 12, 0)
    };
  }

  calculateFinancialSummary(items: MPSItem[], gridTotals: MPSGridTotals): MPSFinancialSummary {
    const priceLevel = items[0]?.priceLevel || 'list';
    const marginTarget = this.config.marginTargets[priceLevel] || this.config.marginTargets.list;

    const totalEquipmentCost = items.reduce((sum, i) => sum + (1000000 * i.copies), 0); // Simplified
    const financingMonths = items[0]?.financingMonths || this.config.defaultFinancingMonths;
    const interestRate = items[0]?.interestRate || this.config.defaultInterestRate;

    const monthlyPayment = items.some(i => i.businessMode === 'arriendo')
      ? this.pmt(totalEquipmentCost, interestRate / 100, financingMonths)
      : 0;

    const totalServiceCost = gridTotals.totalMonthlyRevenue * financingMonths;
    const totalProjectCost = (monthlyPayment * financingMonths) + totalServiceCost;
    const marginAmount = totalProjectCost * marginTarget;

    return {
      totalEquipmentCost,
      monthlyPayment,
      totalServiceCost,
      totalProjectCost,
      marginAmount,
      marginPercentage: marginTarget * 100
    };
  }

  calculateQuote(input: MPSQuoteInput): MPSQuoteResult {
    const gridTotals = this.calculateGridTotals(input.items);
    const financialSummary = this.calculateFinancialSummary(input.items, gridTotals);

    return {
      items: input.items,
      gridTotals,
      financialSummary,
      generatedAt: new Date().toISOString()
    };
  }

  recalculateQuote(input: MPSQuoteInput & { overrides?: Partial<MPSConfig> }): MPSQuoteResult {
    if (input.overrides) {
      const tempService = new MPSCalculatorService({ ...this.config, ...input.overrides });
      return tempService.calculateQuote(input);
    }
    return this.calculateQuote(input);
  }
}

export const mpsCalculatorService = new MPSCalculatorService();
