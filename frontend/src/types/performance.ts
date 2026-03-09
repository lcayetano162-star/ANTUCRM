// ============================================
// ANTU CRM - Performance Module Types
// Tipos para el módulo Mi Desempeño
// ============================================

export type UserRole = 'SALES_REP' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN' | 'SALES_MANAGER' | 'TENANT_ADMIN';

export interface PerformancePeriod {
  month: number;
  year: number;
  monthName: string;
}

export interface QuotaData {
  target: number;
  achieved: number;
  percentage: number;
  remaining: number;
  projected: number;
  projectedPercentage: number;
}

export interface MonthlyPerformance {
  period: string;
  month: number;
  year: number;
  target: number;
  achieved: number;
  percentage: number;
}

export interface ActivityMetrics {
  calls: { current: number; target: number; percentage: number };
  meetings: { current: number; target: number; percentage: number };
  emails: { current: number; target: number; percentage: number };
  visits: { current: number; target: number; percentage: number };
  opportunitiesCreated: { current: number; target: number; percentage: number; value: number };
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  quota: number;
  achieved: number;
  percentage: number;
  activitiesPercentage: number;
  trend: 'up' | 'down' | 'stable';
  pipeline: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: Date;
  earned: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  target: number;
  deadline: Date;
  completed: boolean;
}

export interface AIInsight {
  type: 'recommendation' | 'alert' | 'trend' | 'opportunity';
  title: string;
  description: string;
  action?: string;
  actionLink?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface PerformanceData {
  userId: string;
  userName: string;
  userRole: UserRole;
  period: PerformancePeriod;
  quota: QuotaData;
  annualQuota: {
    target: number;
    ytd: number;
    percentage: number;
    quarterly: { q: number; percentage: number }[];
  };
  historical: MonthlyPerformance[];
  activities: ActivityMetrics;
  badges: Badge[];
  challenges: Challenge[];
  insights: AIInsight[];
  trends: TrendAnalysis[];
  teamRanking?: {
    position: number;
    total: number;
    topPerformer: string;
    average: number;
  };
  salesOpsConfig?: {
    role: 'seller' | 'manager';
    metrics: any;
  };
}

export interface ManagerViewData {
  teamMembers: TeamMember[];
  teamTotal: {
    quota: number;
    achieved: number;
    percentage: number;
  };
  filters: {
    territories: string[];
    regions: string[];
  };
}
