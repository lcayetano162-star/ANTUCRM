// ============================================
// ANTU CRM - Customer Types with AI
// Tipos de clientes con inteligencia artificial
// ============================================

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED';
export type CustomerType = 'COMPANY' | 'INDIVIDUAL';
export type CustomerSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type PaymentBehavior = 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'POOR';

export interface HealthScore {
  overall: number; // 0-100
  financial: number; // 0-100
  engagement: number; // 0-100
  relational: number; // 0-100
  lastUpdated: Date;
  nextUpdate: Date;
}

export interface HealthScoreDetail {
  category: 'financial' | 'engagement' | 'relational';
  score: number;
  weight: number;
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
}

export interface AIInsight {
  id: string;
  type: 'BUYING_MOMENT' | 'RISK' | 'OPPORTUNITY' | 'ALERT' | 'RECOMMENDATION';
  title: string;
  description: string;
  probability?: number;
  confidence: number; // 0-100
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ProductRecommendation {
  id: string;
  productCode: string;
  productName: string;
  matchScore: number; // 0-100
  reason: string;
  potentialValue: number;
  currency: string;
  similarCustomers: string[];
}

export interface ChurnPrediction {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number; // 0-100
  factors: {
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE';
    weight: number;
  }[];
  protectiveFactors: string[];
  riskFactors: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}

export interface HiddenOpportunity {
  id: string;
  type: 'CROSS_SELL' | 'UP_SELL' | 'EXPANSION' | 'RENEWAL';
  title: string;
  description: string;
  potentialValue: number;
  currency: string;
  probability: number;
  reasoning: string;
  suggestedApproach: string;
  detectedAt: Date;
}

export interface SentimentAnalysis {
  overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number; // -100 to 100
  intent?: string;
  keywords: string[];
  nextSteps: string[];
  analyzedAt: Date;
}

export interface CommunicationEvent {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'NOTE';
  direction: 'INBOUND' | 'OUTBOUND';
  title: string;
  content?: string;
  duration?: number; // minutes
  timestamp: Date;
  sentiment?: SentimentAnalysis;
  aiSummary?: string;
  aiInsights?: string[];
  attachments?: string[];
}

export interface Customer {
  id: string;
  // Basic Info
  name: string;
  legalName?: string;
  rnc?: string; // RNC para República Dominicana
  taxId?: string;
  type: CustomerType;
  status: CustomerStatus;
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Address
  address?: string;
  city?: string;
  country: string;
  
  // Business Info
  industry?: string;
  size?: CustomerSize;
  employeeCount?: number;
  annualRevenue?: number;
  
  // AI Data
  healthScore?: HealthScore;
  healthScoreDetails?: HealthScoreDetail[];
  aiInsights: AIInsight[];
  productRecommendations: ProductRecommendation[];
  churnPrediction?: ChurnPrediction;
  hiddenOpportunities: HiddenOpportunity[];
  
  // Financial
  creditLine?: number;
  creditLineCurrency?: string;
  creditLineStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentBehavior?: PaymentBehavior;
  averagePaymentDays?: number;
  totalPurchases?: number;
  
  // Relationships
  assignedTo: string;
  assignedToName?: string;
  contacts: Contact[];
  
  // Communication
  lastContactDate?: Date;
  nextScheduledContact?: Date;
  communicationHistory: CommunicationEvent[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source?: string;
  tags?: string[];
  notes?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position?: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  linkedIn?: string;
  createdAt: Date;
}

export interface CustomerFilter {
  status?: CustomerStatus[];
  type?: CustomerType[];
  size?: CustomerSize[];
  industry?: string[];
  assignedTo?: string;
  country?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
  churnRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hasOpportunities?: boolean;
  searchQuery?: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  prospects: number;
  churned: number;
  avgHealthScore: number;
  highRiskCount: number;
  opportunitiesCount: number;
  totalPipeline: number;
}

// AI Copilot Types
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: {
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }[];
}

export interface CopilotContext {
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  activityType?: string;
  goal?: string;
}

// Enrichment Types
export interface EnrichmentData {
  source: string;
  field: string;
  value: string;
  confidence: number;
  verified: boolean;
}

export interface CustomerEnrichmentResult {
  customerId: string;
  enrichedFields: EnrichmentData[];
  suggestions: string[];
  competitors?: string[];
  news?: string[];
  similarCompanies?: string[];
}
