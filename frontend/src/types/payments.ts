// ============================================
// TIPOS PARA PASARELAS DE PAGO Y SUSCRIPCIONES
// CRM ANTÜ - Payment Gateway & Billing Module
// ============================================

// --------------------------------------------
// ESTADOS DE PASARELA
// --------------------------------------------
export type GatewayStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_SETUP' | 'ERROR';

// --------------------------------------------
// TIPOS DE PASARELA
// --------------------------------------------
export type GatewayType = 
  | 'AZUL'           // Banco Popular Dominicano
  | 'TPAGO'          // Banco Santa Cruz RD
  | 'DLOCAL'         // Dlocal Go - LATAM
  | 'MERCADOPAGO'    // MercadoPago
  | 'PAYPAL'         // PayPal
  | 'STRIPE'         // Stripe
  | 'SQUARE'         // Square
  | 'ADYEN'          // Adyen
  | 'AUTHORIZE'      // Authorize.net
  | 'BANK_TRANSFER'; // Transferencia bancaria

// --------------------------------------------
// REGIONES SOPORTADAS
// --------------------------------------------
export type SupportedRegion = 'DOMINICAN_REPUBLIC' | 'LATAM' | 'GLOBAL';

// --------------------------------------------
// MÉTODOS DE PAGO
// --------------------------------------------
export type PaymentMethod = 
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'WALLET'
  | 'CRYPTO';

// --------------------------------------------
// ESTADOS DE SUSCRIPCIÓN
// --------------------------------------------
export type SubscriptionStatus = 
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'UNPAID'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PENDING_CANCELLATION';

// --------------------------------------------
// ESTADOS DE TRANSACCIÓN
// --------------------------------------------
export type TransactionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DECLINED'
  | 'REFUNDED'
  | 'CHARGEBACK'
  | 'FAILED';

// --------------------------------------------
// PASARELA DE PAGO
// --------------------------------------------
export interface PaymentGateway {
  id: string;
  type: GatewayType;
  name: string;
  displayName: string;
  description: string;
  status: GatewayStatus;
  region: SupportedRegion;
  
  // Credenciales (encriptadas/mascaradas)
  credentials: GatewayCredentials;
  
  // Configuración
  config: GatewayConfig;
  
  // Comisiones
  commission: {
    percentage: number;
    fixedAmount: number;
    currency: string;
  };
  
  // Liquidación
  settlementDays: number; // T+X días
  
  // Métodos soportados
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  
  // Webhooks
  webhookUrls: {
    success: string;
    failure: string;
    webhook: string;
  };
  
  // Estadísticas
  stats?: GatewayStats;
  
  createdAt: string;
  updatedAt: string;
  lastTestDate?: string;
  lastTestResult?: boolean;
}

// --------------------------------------------
// CREDENCIALES DE PASARELA
// --------------------------------------------
export interface GatewayCredentials {
  merchantId?: string;
  apiKey?: string;
  secretKey?: string;
  authToken?: string;
  clientId?: string;
  clientSecret?: string;
  terminalId?: string;
  publicKey?: string;
  privateKey?: string;
  // Campos adicionales según pasarela
  [key: string]: string | undefined;
}

// --------------------------------------------
// CONFIGURACIÓN DE PASARELA
// --------------------------------------------
export interface GatewayConfig {
  mode: 'PRODUCTION' | 'SANDBOX';
  autoCapture: boolean;
  captureDelayHours?: number;
  require3DS: boolean;
  minAmountFor3DS?: number;
  allowRefunds: boolean;
  maxRefundDays: number;
  // Configuración específica por pasarela
  dlocalCountries?: string[]; // Para Dlocal
  paypalWebhookId?: string;
  stripeWebhookSecret?: string;
}

// --------------------------------------------
// ESTADÍSTICAS DE PASARELA
// --------------------------------------------
export interface GatewayStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  avgResponseTime: number; // ms
  last24hTransactions: number;
  last24hAmount: number;
}

// --------------------------------------------
// SUSCRIPCIÓN
// --------------------------------------------
export interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantAdminEmail: string;
  
  // Plan
  planId: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  
  // Estado
  status: SubscriptionStatus;
  
  // Fechas
  startDate: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  cancelledAt?: string;
  
  // Método de pago
  paymentMethod: SavedPaymentMethod;
  backupPaymentMethod?: SavedPaymentMethod;
  
  // Configuración de billing
  billingConfig: {
    autoRenew: boolean;
    sendReminders: boolean;
    retryAttempts: number;
    retryIntervalDays: number;
  };
  
  // Historial
  paymentHistory: PaymentRecord[];
  
  // Descuentos
  discount?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    description: string;
    validUntil?: string;
  };
  
  // Notas internas
  internalNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------
// MÉTODO DE PAGO GUARDADO
// --------------------------------------------
export interface SavedPaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT' | 'WALLET';
  gateway: GatewayType;
  
  // Para tarjetas
  cardBrand?: string; // visa, mastercard, amex
  cardLast4?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardHolderName?: string;
  
  // Para cuentas bancarias
  bankName?: string;
  accountLast4?: string;
  accountType?: 'CHECKING' | 'SAVINGS';
  
  // Para wallets
  walletType?: 'PAYPAL' | 'MERCADOPAGO';
  walletEmail?: string;
  
  // Token de la pasarela (nunca guardamos datos reales)
  token: string;
  
  // Estado
  isDefault: boolean;
  isValid: boolean;
  expiresAt?: string;
  
  createdAt: string;
}

// --------------------------------------------
// REGISTRO DE PAGO
// --------------------------------------------
export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  invoiceId: string;
  invoiceNumber: string;
  
  // Montos
  amount: number;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Fechas
  billingDate: string;
  dueDate: string;
  paidAt?: string;
  
  // Estado
  status: TransactionStatus;
  
  // Pasarela
  gateway: GatewayType;
  gatewayTransactionId?: string;
  authCode?: string;
  
  // Método usado
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  
  // Facturación fiscal
  fiscalInvoice?: {
    type: 'eCF' | 'CFDI' | 'ELECTRONIC';
    number: string;
    xmlUrl?: string;
    pdfUrl?: string;
  };
  
  // Reintentos
  retryCount: number;
  lastRetryDate?: string;
  failureReason?: string;
  
  createdAt: string;
}

// --------------------------------------------
// CONFIGURACIÓN GLOBAL DE BILLING
// --------------------------------------------
export interface BillingSettings {
  // Ciclo de facturación
  defaultBillingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  defaultBillingDay: number; // 1-28
  
  // Grace period
  gracePeriodDays: number;
  
  // Reintentos
  retryAttempts: number;
  retryIntervalDays: number;
  actionAfterFailedRetries: 'SUSPEND' | 'COLLECTION';
  
  // Notificaciones
  notifications: {
    reminderBeforeDays: number;
    sendOnBillingDay: boolean;
    sendOnSuccess: boolean;
    sendOnFailure: boolean;
    sendOnSuspension: boolean;
  };
  
  // Plantillas de email
  emailTemplates: {
    reminder: string;
    invoice: string;
    success: string;
    failure: string;
    suspension: string;
  };
  
  // Impuestos por país
  taxConfig: TaxConfig[];
  
  // Facturación fiscal
  fiscalBilling: {
    enabled: boolean;
    autoGenerateECF: boolean;
    storeXmlYears: number;
  };
}

// --------------------------------------------
// CONFIGURACIÓN DE IMPUESTOS
// --------------------------------------------
export interface TaxConfig {
  country: string;
  countryCode: string;
  taxName: string;
  taxRate: number;
  requiresElectronicInvoice: boolean;
  invoiceFormat: 'eCF' | 'CFDI' | 'DIAN' | 'ELECTRONIC';
  retentionRules?: {
    applies: boolean;
    percentage: number;
    description: string;
  };
}

// --------------------------------------------
// TRANSACCIÓN
// --------------------------------------------
export interface Transaction {
  id: string;
  subscriptionId?: string;
  tenantId?: string;
  tenantName?: string;
  
  // Monto
  amount: number;
  currency: string;
  
  // Pasarela
  gateway: GatewayType;
  gatewayTransactionId: string;
  
  // Método
  paymentMethod: PaymentMethod;
  
  // Estado
  status: TransactionStatus;
  
  // Fechas
  createdAt: string;
  processedAt?: string;
  
  // Detalles
  description: string;
  metadata?: Record<string, string>;
  
  // Respuesta de pasarela
  gatewayResponse?: {
    code: string;
    message: string;
    authCode?: string;
    reference?: string;
  };
}

// --------------------------------------------
// REPORTE FINANCIERO
// --------------------------------------------
export interface FinancialReport {
  period: {
    start: string;
    end: string;
  };
  
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalPending: number;
    totalFailed: number;
    collectionRate: number;
  };
  
  byGateway: {
    gateway: GatewayType;
    transactions: number;
    amount: number;
    commission: number;
    netAmount: number;
  }[];
  
  byStatus: {
    status: TransactionStatus;
    count: number;
    amount: number;
  }[];
  
  // Conciliación
  reconciliation: {
    expectedDeposits: number;
    confirmedDeposits: number;
    pendingDeposits: number;
  };
}

// --------------------------------------------
// ALERTA DE FRAUDE
// --------------------------------------------
export interface FraudAlert {
  id: string;
  transactionId: string;
  tenantId: string;
  tenantName: string;
  
  // Tipo de alerta
  type: 'VELOCITY' | 'AMOUNT' | 'LOCATION' | 'PATTERN' | 'MANUAL_REVIEW';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Descripción
  description: string;
  reason: string;
  
  // Estado
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE';
  
  // Acción tomada
  action?: 'BLOCKED' | 'ALLOWED' | 'REFUNDED';
  
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
