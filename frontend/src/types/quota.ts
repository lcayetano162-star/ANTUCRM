// ============================================
// ANTU CRM - Quota Configuration Types
// Tipos para configuración de cuotas y metas
// ============================================

export type FiscalYearType = 'CALENDAR' | 'CUSTOM';
export type PlanningPeriod = 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'CUSTOM';
export type AssignmentMethod = 'MANUAL' | 'PERCENTAGE' | 'HISTORICAL' | 'TERRITORY';
export type SellerLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'ELITE';

export interface FiscalYearConfig {
  type: FiscalYearType;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  year: number;
  label: string;
}

export interface RevenueType {
  id: string;
  name: string;
  percentage: number;
  amount: number;
}

export interface RegionDistribution {
  id: string;
  name: string;
  percentage: number;
  amount: number;
}

export interface CompanyGoal {
  totalRevenue: number;
  currency: string;
  revenueTypes: RevenueType[];
  regions: RegionDistribution[];
  activityBenchmarks: {
    callsPerMonth: number;
    meetingsPerMonth: number;
    opportunitiesPerMonth: number;
    conversionRateTarget: number;
  };
}

export interface TeamQuota {
  id: string;
  name: string;
  territory: string;
  percentageOfTotal: number;
  annualQuota: number;
  monthlyQuota: number;
  members: string[];
  managerName?: string;
  historicalPerformance?: number;
}

export interface SellerQuota {
  id: string;
  name: string;
  email: string;
  teamId: string;
  level: SellerLevel;
  percentageOfTeam: number;
  annualQuota: number;
  monthlyQuota: number;
  managerName?: string;
  profileImage?: string;
  startDate?: Date;
}

export interface MonthlyDistribution {
  month: number;
  monthName: string;
  percentageOfYear: number;
  teamAmounts: Record<string, number>;
}

export interface SpecialPeriod {
  id: string;
  name: string;
  startMonth: number;
  endMonth: number;
  objective: string;
  reward: string;
  targetPercentage?: number;
}

export interface ActivityMetric {
  id: string;
  name: string;
  key: string;
  levels: Record<SellerLevel, number>;
}

export interface QuotaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalAssigned: number;
  totalExpected: number;
  difference: number;
}

export interface QuotaConfig {
  fiscalYear: FiscalYearConfig;
  companyGoal: CompanyGoal;
  teams: TeamQuota[];
  sellers: SellerQuota[];
  monthlyDistribution: MonthlyDistribution[];
  specialPeriods: SpecialPeriod[];
  activityMetrics: ActivityMetric[];
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
}

export interface QuotaHistory {
  id: string;
  sellerId: string;
  period: string;
  quota: number;
  achieved: number;
  percentage: number;
}

export interface QuotaChangeLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH';
  entityType: 'COMPANY' | 'TEAM' | 'SELLER' | 'CONFIG';
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }>;
}
