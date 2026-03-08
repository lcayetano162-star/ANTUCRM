export type PriceLevel = 'list' | 'distributor' | 'special';
export type BusinessMode = 'venta' | 'arriendo' | 'servicio';

export interface MPSItem {
  id: string;
  brand: string;
  model: string;
  ppm: number;
  isColor: boolean;
  monthlyVolumeBW: number;
  monthlyVolumeColor: number;
  copies: number;
  priceLevel: PriceLevel;
  businessMode: BusinessMode;
  financingMonths?: number;
  interestRate?: number;
}

export interface MPSGridTotals {
  totalMachines: number;
  totalMonthlyVolumesBW: number;
  totalMonthlyVolumesColor: number;
  totalMonthlyRevenue: number;
  totalAnnualRevenue: number;
}

export interface MPSFinancialSummary {
  totalEquipmentCost: number;
  monthlyPayment: number;
  totalServiceCost: number;
  totalProjectCost: number;
  marginAmount: number;
  marginPercentage: number;
}

export interface MPSQuoteInput {
  items: MPSItem[];
  businessMode: BusinessMode;
  priceLevel: PriceLevel;
  financingMonths?: number;
  interestRate?: number;
  opportunityId?: string;
  clientId?: string;
  notes?: string;
}

export interface MPSQuoteResult {
  items: MPSItem[];
  gridTotals: MPSGridTotals;
  financialSummary: MPSFinancialSummary;
  generatedAt: string;
}

export interface MPSQuoteResponse {
  success: boolean;
  data?: MPSQuoteResult;
  error?: string;
}

export interface MPSConfig {
  bwCostPerPage: number;
  colorCostPerPage: number;
  defaultInterestRate: number;
  defaultFinancingMonths: number;
  marginTargets: {
    list: number;
    distributor: number;
    special: number;
  };
}

export interface MPSPriceApprovalRequest {
  id: string;
  opportunityId: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  priceLevel: PriceLevel;
  justification: string;
  respondedBy?: string;
  respondedAt?: string;
  responseNotes?: string;
}
