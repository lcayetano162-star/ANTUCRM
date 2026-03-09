// ============================================
// TIPOS PARA GESTIÓN DE CRÉDITO Y COBROS
// Módulo de Cuentas por Cobrar - CRM ANTÜ
// ============================================

// --------------------------------------------
// ESTADOS DE SOLICITUD DE CRÉDITO
// --------------------------------------------
export type CreditRequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'CONDITIONAL'
  | 'REJECTED'
  | 'EXPIRED';

// --------------------------------------------
// ESTADOS DE LÍNEA DE CRÉDITO
// --------------------------------------------
export type CreditLineStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXHAUSTED';

// --------------------------------------------
// NIVELES DE RIESGO IA
// --------------------------------------------
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// --------------------------------------------
// ESTADOS DE CUENTAS POR COBRAR
// --------------------------------------------
export type ReceivableStatus =
  | 'PENDING'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'IN_COLLECTION'
  | 'PAYMENT_AGREEMENT'
  | 'PAID'
  | 'WRITTEN_OFF';

// --------------------------------------------
// TIPOS DE ACCIÓN DE COBRO
// --------------------------------------------
export type CollectionActionType =
  | 'EMAIL'
  | 'EMAIL_REMINDER'
  | 'PHONE_CALL'
  | 'SMS'
  | 'VISIT'
  | 'FORMAL_LETTER'
  | 'LEGAL_NOTICE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_AGREEMENT'
  | 'NOTE';

// --------------------------------------------
// SOLICITUD DE CRÉDITO
// --------------------------------------------
export interface CreditRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerRNC: string;
  requestedAmount: number;
  requestedBy: string;
  requestedById: string;
  requestDate: string;
  reason: string;
  opportunityId?: string;
  status: CreditRequestStatus;

  // Análisis IA
  aiScore: number;
  riskLevel: RiskLevel;
  aiFactors: AIFactor[];
  aiRecommendation: string;

  // Documentación
  documents: CreditDocument[];

  // Decisión
  approvedAmount?: number;
  approvedBy?: string;
  approvedById?: string;
  approvalDate?: string;
  conditions?: string[];
  rejectionReason?: string;
  comments?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------
// FACTORES DE ANÁLISIS IA
// --------------------------------------------
export interface AIFactor {
  category: 'PAYMENT_HISTORY' | 'FINANCIAL' | 'BEHAVIOR' | 'SECTOR';
  score: number;
  maxScore: number;
  description: string;
  positive: boolean;
}

// --------------------------------------------
// DOCUMENTOS DE CRÉDITO
// --------------------------------------------
export interface CreditDocument {
  id: string;
  type: 'RNC' | 'FINANCIAL_STATEMENTS' | 'COMMERCIAL_REFERENCES' | 'GUARANTEE' | 'APPLICATION_FORM' | 'OTHER';
  name: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
}

// --------------------------------------------
// LÍNEA DE CRÉDITO APROBADA
// --------------------------------------------
export interface CreditLine {
  id: string;
  customerId: string;
  customerName: string;
  customerRNC: string;

  // Límites
  approvedAmount: number;
  usedAmount: number;
  availableAmount: number;

  // Términos
  paymentTerms: number; // días
  interestRate?: number;

  // Estado
  status: CreditLineStatus;

  // Historial
  approvedBy: string;
  approvedDate: string;
  lastReviewDate: string;
  nextReviewDate: string;

  // Métricas
  currentDSO: number;
  totalInvoices: number;
  paidInvoices: number;
  lateInvoices: number;

  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------
// CUENTA POR COBRAR
// --------------------------------------------
export interface Receivable {
  id: string;
  invoiceId: string;
  invoiceNumber: string;

  // Cliente
  customerId: string;
  customerName: string;
  customerRNC: string;
  customerPhone?: string;
  customerEmail?: string;

  // Montos
  amount: number;
  balance: number;
  paidAmount: number;

  // Fechas
  issueDate: string;
  dueDate: string;
  daysOverdue: number;

  // Estado
  status: ReceivableStatus;

  // Predicción IA
  aiPrediction: AIPrediction;

  // Relaciones
  creditLineId?: string;
  opportunityId?: string;
  sellerId: string;
  sellerName: string;

  // Gestión
  collectionActions: CollectionAction[];
  paymentAgreement?: PaymentAgreement;

  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------
// PREDICCIÓN IA DE PAGO
// --------------------------------------------
export interface AIPrediction {
  paymentProbability: number;
  estimatedPaymentDate?: string;
  confidence: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  recommendedAction: string;
  escalationLevel: 'STANDARD' | 'MODERATE' | 'AGGRESSIVE' | 'URGENT';
}

// --------------------------------------------
// ACCIÓN DE COBRO
// --------------------------------------------
export interface CollectionAction {
  id: string;
  type: CollectionActionType;
  date: string;
  description: string;
  result?: string;
  nextAction?: string;
  nextActionDate?: string;
  performedBy: string;
  performedById: string;
}

// --------------------------------------------
// ACUERDO DE PAGO
// --------------------------------------------
export interface PaymentAgreement {
  id: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  firstPaymentDate: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  status: 'ACTIVE' | 'COMPLETED' | 'BROKEN';
  createdAt: string;
}

// --------------------------------------------
// RESUMEN DE CARTERA
// --------------------------------------------
export interface PortfolioSummary {
  totalPortfolio: number;
  totalOverdue: number;
  overduePercentage: number;
  averageDSO: number;
  collectionEffectiveness: number; // CEI

  // Distribución por edad
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    daysOver90: number;
  };

  // Conteos
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  invoicesDueToday: number;
  highRiskInvoices: number;
}

// --------------------------------------------
// PAGO REGISTRADO
// --------------------------------------------
export interface Payment {
  id: string;
  receivableId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CHECK' | 'TRANSFER' | 'DEPOSIT' | 'CARD';
  reference?: string;
  bankAccount?: string;
  registeredBy: string;
  registeredAt: string;
}

// --------------------------------------------
// CONFIGURACIÓN DE ESTRATEGIA DE COBRO
// --------------------------------------------
export interface CollectionStrategy {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  isDefault: boolean;

  // Acciones automatizadas
  actions: StrategyAction[];

  // Personalización IA
  optimizeTiming: boolean;
  adjustTone: boolean;
  prioritizeChannel: boolean;
  pauseOnManualResponse: boolean;
}

export interface StrategyAction {
  day: number; // negativo = antes del vencimiento
  type: CollectionActionType;
  channel: 'EMAIL' | 'SMS' | 'PHONE' | 'VISIT' | 'LETTER';
  template?: string;
  tone: 'FRIENDLY' | 'PROFESSIONAL' | 'FIRM' | 'URGENT';
  condition?: string;
}

// --------------------------------------------
// PROYECCIÓN DE FLUJO DE CAJA
// --------------------------------------------
export interface CashForecast {
  period: string;
  startDate: string;
  endDate: string;

  // Proyección
  estimatedCollections: number;
  confirmedPayments: number;
  probablePayments: number;
  possiblePayments: number;

  // Incertidumbre
  confidenceInterval: number;

  // Comparación
  expectedAmount: number;
  variance: number;
  variancePercentage: number;
}

// --------------------------------------------
// ALERTA IA
// --------------------------------------------
export interface AIAlert {
  id: string;
  type: 'HIGH_RISK' | 'DUE_TODAY' | 'PAYMENT_EXPECTED' | 'PATTERN_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  receivableId?: string;
  customerId?: string;
  createdAt: string;
  read: boolean;
}
