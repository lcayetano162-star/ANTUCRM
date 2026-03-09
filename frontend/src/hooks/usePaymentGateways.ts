import { useState, useCallback, useMemo } from 'react';
import type {
  PaymentGateway,
  Subscription,
  PaymentRecord,
  BillingSettings,
  Transaction,
  FraudAlert,
  FinancialReport,
  GatewayStatus,
  SubscriptionStatus,
} from '@/types/payments';

// ============================================
// MOCK DATA - PASARELAS DE PAGO
// ============================================
const MOCK_GATEWAYS: PaymentGateway[] = [
  {
    id: 'GW-001',
    type: 'AZUL',
    name: 'Azul',
    displayName: 'Azul (Banco Popular Dominicano)',
    description: 'Pasarela líder en República Dominicana',
    status: 'ACTIVE',
    region: 'DOMINICAN_REPUBLIC',
    credentials: {
      merchantId: '1234567890',
      authKey: '***************************',
      authToken: '***************************',
      terminalId: 'TERM001',
    },
    config: {
      mode: 'PRODUCTION',
      autoCapture: true,
      require3DS: true,
      minAmountFor3DS: 5000,
      allowRefunds: true,
      maxRefundDays: 90,
    },
    commission: {
      percentage: 3.5,
      fixedAmount: 10,
      currency: 'DOP',
    },
    settlementDays: 1,
    supportedMethods: ['CREDIT_CARD', 'DEBIT_CARD'],
    supportedCurrencies: ['DOP', 'USD'],
    webhookUrls: {
      success: 'https://crm.antu.com/payments/azul/success',
      failure: 'https://crm.antu.com/payments/azul/failure',
      webhook: 'https://crm.antu.com/webhooks/azul',
    },
    stats: {
      totalTransactions: 1245,
      totalAmount: 2850000,
      successRate: 96.8,
      avgResponseTime: 850,
      last24hTransactions: 45,
      last24hAmount: 98500,
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
    lastTestDate: '2026-02-19T15:30:00Z',
    lastTestResult: true,
  },
  {
    id: 'GW-002',
    type: 'TPAGO',
    name: 'Tpago',
    displayName: 'Tpago (Banco Santa Cruz)',
    description: 'Pasarela alternativa en República Dominicana',
    status: 'ACTIVE',
    region: 'DOMINICAN_REPUBLIC',
    credentials: {
      merchantId: '9876543210',
      apiKey: '***************************',
    },
    config: {
      mode: 'PRODUCTION',
      autoCapture: true,
      require3DS: true,
      minAmountFor3DS: 3000,
      allowRefunds: true,
      maxRefundDays: 60,
    },
    commission: {
      percentage: 3.8,
      fixedAmount: 15,
      currency: 'DOP',
    },
    settlementDays: 2,
    supportedMethods: ['CREDIT_CARD', 'DEBIT_CARD'],
    supportedCurrencies: ['DOP', 'USD'],
    webhookUrls: {
      success: 'https://crm.antu.com/payments/tpago/success',
      failure: 'https://crm.antu.com/payments/tpago/failure',
      webhook: 'https://crm.antu.com/webhooks/tpago',
    },
    stats: {
      totalTransactions: 312,
      totalAmount: 680000,
      successRate: 94.2,
      avgResponseTime: 920,
      last24hTransactions: 12,
      last24hAmount: 28000,
    },
    createdAt: '2025-03-10T14:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
    lastTestDate: '2026-02-18T10:00:00Z',
    lastTestResult: true,
  },
  {
    id: 'GW-003',
    type: 'DLOCAL',
    name: 'Dlocal Go',
    displayName: 'Dlocal Go (LATAM)',
    description: 'Pagos locales en 20+ países de Latinoamérica',
    status: 'ACTIVE',
    region: 'LATAM',
    credentials: {
      apiKey: '***************************',
      secretKey: '***************************',
    },
    config: {
      mode: 'PRODUCTION',
      autoCapture: true,
      require3DS: false,
      allowRefunds: true,
      maxRefundDays: 30,
      dlocalCountries: ['MX', 'CO', 'CL', 'PE', 'AR', 'UY', 'EC', 'BR'],
    },
    commission: {
      percentage: 5.0,
      fixedAmount: 0,
      currency: 'USD',
    },
    settlementDays: 3,
    supportedMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'WALLET'],
    supportedCurrencies: ['MXN', 'COP', 'CLP', 'PEN', 'ARS', 'UYU', 'USD'],
    webhookUrls: {
      success: 'https://crm.antu.com/payments/dlocal/success',
      failure: 'https://crm.antu.com/payments/dlocal/failure',
      webhook: 'https://crm.antu.com/webhooks/dlocal',
    },
    stats: {
      totalTransactions: 89,
      totalAmount: 125000,
      successRate: 91.5,
      avgResponseTime: 1200,
      last24hTransactions: 8,
      last24hAmount: 22000,
    },
    createdAt: '2025-06-20T09:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
    lastTestDate: '2026-02-15T11:00:00Z',
    lastTestResult: true,
  },
  {
    id: 'GW-004',
    type: 'PAYPAL',
    name: 'PayPal',
    displayName: 'PayPal Business Pro',
    description: 'Pagos globales con suscripciones recurrentes y protección al vendedor',
    status: 'ACTIVE',
    region: 'GLOBAL',
    credentials: {
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '***************************',
      clientSecret: import.meta.env.VITE_PAYPAL_SECRET_KEY || '***************************',
    },
    config: {
      mode: 'PRODUCTION',
      autoCapture: true,
      require3DS: false,
      allowRefunds: true,
      maxRefundDays: 180,
      paypalWebhookId: 'WH-ANTU-CRM-2026',
    },
    commission: {
      percentage: 3.49,
      fixedAmount: 0.49,
      currency: 'USD',
    },
    settlementDays: 1,
    supportedMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'WALLET'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'DOP'],
    webhookUrls: {
      success: `${window.location.origin}/payments/paypal/success`,
      failure: `${window.location.origin}/payments/paypal/failure`,
      webhook: `${window.location.origin}/webhooks/paypal`,
    },
    stats: {
      totalTransactions: 1560,
      totalAmount: 950000,
      successRate: 98.5,
      avgResponseTime: 450,
      last24hTransactions: 15,
      last24hAmount: 45000,
    },
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: new Date().toISOString(),
    lastTestDate: new Date().toISOString(),
    lastTestResult: true,
  },
  {
    id: 'GW-005',
    type: 'STRIPE',
    name: 'Stripe',
    displayName: 'Stripe',
    description: 'Pagos globales con tarjetas, SEPA, Apple Pay, Google Pay',
    status: 'ACTIVE',
    region: 'GLOBAL',
    credentials: {
      secretKey: '***************************',
      publicKey: 'pk_test_***************************',
    },
    config: {
      mode: 'PRODUCTION',
      autoCapture: true,
      require3DS: true,
      minAmountFor3DS: 1000,
      allowRefunds: true,
      maxRefundDays: 365,
      stripeWebhookSecret: 'whsec_***************************',
    },
    commission: {
      percentage: 2.9,
      fixedAmount: 0.30,
      currency: 'USD',
    },
    settlementDays: 2,
    supportedMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'WALLET'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF'],
    webhookUrls: {
      success: 'https://crm.antu.com/payments/stripe/success',
      failure: 'https://crm.antu.com/payments/stripe/failure',
      webhook: 'https://crm.antu.com/webhooks/stripe',
    },
    stats: {
      totalTransactions: 423,
      totalAmount: 210000,
      successRate: 97.4,
      avgResponseTime: 580,
      last24hTransactions: 18,
      last24hAmount: 12500,
    },
    createdAt: '2025-01-20T08:00:00Z',
    updatedAt: '2026-02-19T09:00:00Z',
    lastTestDate: '2026-02-19T09:00:00Z',
    lastTestResult: true,
  },
  {
    id: 'GW-006',
    type: 'BANK_TRANSFER',
    name: 'Transferencia Bancaria',
    displayName: 'Transferencia Bancaria RD',
    description: 'Pagos por transferencia bancaria (conciliación manual)',
    status: 'INACTIVE',
    region: 'DOMINICAN_REPUBLIC',
    credentials: {},
    config: {
      mode: 'PRODUCTION',
      autoCapture: false,
      require3DS: false,
      allowRefunds: false,
      maxRefundDays: 0,
    },
    commission: {
      percentage: 0,
      fixedAmount: 0,
      currency: 'DOP',
    },
    settlementDays: 0,
    supportedMethods: ['BANK_TRANSFER'],
    supportedCurrencies: ['DOP', 'USD'],
    webhookUrls: {
      success: '',
      failure: '',
      webhook: '',
    },
    createdAt: '2025-04-15T10:00:00Z',
    updatedAt: '2025-04-15T10:00:00Z',
  },
];

// ============================================
// MOCK DATA - SUSCRIPCIONES
// ============================================
const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'SUB-001',
    tenantId: 'T001',
    tenantName: 'Corporación Dominicana de Impresión',
    tenantAdminEmail: 'admin@cdimpresion.com',
    planId: 'PLAN-ENT',
    planName: 'Enterprise',
    planPrice: 25000,
    planCurrency: 'DOP',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2025-01-15',
    currentPeriodStart: '2026-02-15',
    currentPeriodEnd: '2026-03-15',
    nextBillingDate: '2026-03-01',
    paymentMethod: {
      id: 'PM-001',
      type: 'CREDIT_CARD',
      gateway: 'AZUL',
      cardBrand: 'visa',
      cardLast4: '7890',
      cardExpiryMonth: '12',
      cardExpiryYear: '28',
      cardHolderName: 'Juan Pérez',
      token: 'tok_visa_7890',
      isDefault: true,
      isValid: true,
      createdAt: '2025-01-15T10:00:00Z',
    },
    billingConfig: {
      autoRenew: true,
      sendReminders: true,
      retryAttempts: 3,
      retryIntervalDays: 3,
    },
    paymentHistory: [
      {
        id: 'PAY-001',
        subscriptionId: 'SUB-001',
        invoiceId: 'INV-001',
        invoiceNumber: 'E310000000042',
        amount: 25000,
        currency: 'DOP',
        taxAmount: 4500,
        discountAmount: 0,
        totalAmount: 29500,
        billingDate: '2026-02-15',
        dueDate: '2026-02-15',
        paidAt: '2026-02-15T10:05:00Z',
        status: 'APPROVED',
        gateway: 'AZUL',
        gatewayTransactionId: 'AZL-20260215-001',
        authCode: '123456',
        paymentMethod: { type: 'CREDIT_CARD', last4: '7890', brand: 'visa' },
        fiscalInvoice: {
          type: 'eCF',
          number: 'E310000000042',
          xmlUrl: '/invoices/E310000000042.xml',
          pdfUrl: '/invoices/E310000000042.pdf',
        },
        retryCount: 0,
        createdAt: '2026-02-15T10:00:00Z',
      },
      {
        id: 'PAY-002',
        subscriptionId: 'SUB-001',
        invoiceId: 'INV-002',
        invoiceNumber: 'E310000000038',
        amount: 25000,
        currency: 'DOP',
        taxAmount: 4500,
        discountAmount: 0,
        totalAmount: 29500,
        billingDate: '2026-01-15',
        dueDate: '2026-01-15',
        paidAt: '2026-01-15T09:30:00Z',
        status: 'APPROVED',
        gateway: 'AZUL',
        gatewayTransactionId: 'AZL-20260115-001',
        authCode: '234567',
        paymentMethod: { type: 'CREDIT_CARD', last4: '7890', brand: 'visa' },
        fiscalInvoice: {
          type: 'eCF',
          number: 'E310000000038',
        },
        retryCount: 0,
        createdAt: '2026-01-15T09:00:00Z',
      },
    ],
    internalNotes: 'Cliente siempre paga puntual. Ofrecer descuento anual para mejorar cash flow.',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-02-15T10:05:00Z',
  },
  {
    id: 'SUB-002',
    tenantId: 'T002',
    tenantName: 'Grupo Financiero XYZ',
    tenantAdminEmail: 'admin@grupoxyz.com',
    planId: 'PLAN-BUS',
    planName: 'Business',
    planPrice: 12000,
    planCurrency: 'DOP',
    billingCycle: 'MONTHLY',
    status: 'PAST_DUE',
    startDate: '2025-06-01',
    currentPeriodStart: '2026-02-01',
    currentPeriodEnd: '2026-03-01',
    nextBillingDate: '2026-03-01',
    paymentMethod: {
      id: 'PM-002',
      type: 'CREDIT_CARD',
      gateway: 'TPAGO',
      cardBrand: 'mastercard',
      cardLast4: '1234',
      cardExpiryMonth: '08',
      cardExpiryYear: '25',
      cardHolderName: 'María González',
      token: 'tok_mc_1234',
      isDefault: true,
      isValid: false,
      expiresAt: '2025-08-31',
      createdAt: '2025-06-01T14:00:00Z',
    },
    billingConfig: {
      autoRenew: true,
      sendReminders: true,
      retryAttempts: 3,
      retryIntervalDays: 3,
    },
    paymentHistory: [
      {
        id: 'PAY-003',
        subscriptionId: 'SUB-002',
        invoiceId: 'INV-003',
        invoiceNumber: 'E310000000045',
        amount: 12000,
        currency: 'DOP',
        taxAmount: 2160,
        discountAmount: 0,
        totalAmount: 14160,
        billingDate: '2026-02-01',
        dueDate: '2026-02-01',
        status: 'FAILED',
        gateway: 'TPAGO',
        paymentMethod: { type: 'CREDIT_CARD', last4: '1234', brand: 'mastercard' },
        retryCount: 3,
        lastRetryDate: '2026-02-07',
        failureReason: 'Tarjeta vencida',
        createdAt: '2026-02-01T08:00:00Z',
      },
    ],
    createdAt: '2025-06-01T14:00:00Z',
    updatedAt: '2026-02-07T16:00:00Z',
  },
  {
    id: 'SUB-003',
    tenantId: 'T003',
    tenantName: 'Industrias ABC',
    tenantAdminEmail: 'admin@indabc.com',
    planId: 'PLAN-STR',
    planName: 'Starter',
    planPrice: 5000,
    planCurrency: 'DOP',
    billingCycle: 'MONTHLY',
    status: 'SUSPENDED',
    startDate: '2025-03-10',
    currentPeriodStart: '2026-01-10',
    currentPeriodEnd: '2026-02-10',
    nextBillingDate: '2026-02-10',
    cancelledAt: '2026-02-10',
    paymentMethod: {
      id: 'PM-003',
      type: 'CREDIT_CARD',
      gateway: 'AZUL',
      cardBrand: 'visa',
      cardLast4: '5555',
      cardExpiryMonth: '03',
      cardExpiryYear: '26',
      cardHolderName: 'Carlos Rodríguez',
      token: 'tok_visa_5555',
      isDefault: true,
      isValid: true,
      createdAt: '2025-03-10T11:00:00Z',
    },
    billingConfig: {
      autoRenew: true,
      sendReminders: true,
      retryAttempts: 3,
      retryIntervalDays: 3,
    },
    paymentHistory: [
      {
        id: 'PAY-004',
        subscriptionId: 'SUB-003',
        invoiceId: 'INV-004',
        invoiceNumber: 'E310000000050',
        amount: 5000,
        currency: 'DOP',
        taxAmount: 900,
        discountAmount: 0,
        totalAmount: 5900,
        billingDate: '2026-01-10',
        dueDate: '2026-01-10',
        status: 'FAILED',
        gateway: 'AZUL',
        paymentMethod: { type: 'CREDIT_CARD', last4: '5555', brand: 'visa' },
        retryCount: 3,
        lastRetryDate: '2026-01-16',
        failureReason: 'Fondos insuficientes',
        createdAt: '2026-01-10T08:00:00Z',
      },
    ],
    createdAt: '2025-03-10T11:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'SUB-004',
    tenantId: 'T004',
    tenantName: 'Startup XYZ',
    tenantAdminEmail: 'admin@startupxyz.com',
    planId: 'PLAN-BUS',
    planName: 'Business',
    planPrice: 12000,
    planCurrency: 'DOP',
    billingCycle: 'MONTHLY',
    status: 'TRIAL',
    startDate: '2026-02-15',
    trialEndDate: '2026-03-01',
    currentPeriodStart: '2026-02-15',
    currentPeriodEnd: '2026-03-01',
    nextBillingDate: '2026-03-01',
    billingConfig: {
      autoRenew: true,
      sendReminders: true,
      retryAttempts: 3,
      retryIntervalDays: 3,
    },
    paymentMethod: {
      id: 'PM-004',
      type: 'CREDIT_CARD',
      gateway: 'AZUL',
      token: 'tok_pending',
      isDefault: true,
      isValid: false,
      createdAt: '2026-02-15T09:00:00Z',
    },
    paymentHistory: [],
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
];

// ============================================
// MOCK DATA - CONFIGURACIÓN DE BILLING
// ============================================
const MOCK_BILLING_SETTINGS: BillingSettings = {
  defaultBillingCycle: 'MONTHLY',
  defaultBillingDay: 1,
  gracePeriodDays: 3,
  retryAttempts: 3,
  retryIntervalDays: 3,
  actionAfterFailedRetries: 'SUSPEND',
  notifications: {
    reminderBeforeDays: 3,
    sendOnBillingDay: true,
    sendOnSuccess: true,
    sendOnFailure: true,
    sendOnSuspension: true,
  },
  emailTemplates: {
    reminder: 'reminder_template_v1',
    invoice: 'invoice_template_v1',
    success: 'success_template_v1',
    failure: 'failure_template_v1',
    suspension: 'suspension_template_v1',
  },
  taxConfig: [
    {
      country: 'República Dominicana',
      countryCode: 'DO',
      taxName: 'ITBIS',
      taxRate: 18,
      requiresElectronicInvoice: true,
      invoiceFormat: 'eCF',
      retentionRules: {
        applies: true,
        percentage: 30,
        description: 'Retención ITBIS para proveedores formales',
      },
    },
    {
      country: 'México',
      countryCode: 'MX',
      taxName: 'IVA',
      taxRate: 16,
      requiresElectronicInvoice: true,
      invoiceFormat: 'CFDI',
      retentionRules: {
        applies: true,
        percentage: 10,
        description: 'ISR 10% + IVA 10.67% para honorarios',
      },
    },
    {
      country: 'Colombia',
      countryCode: 'CO',
      taxName: 'IVA',
      taxRate: 19,
      requiresElectronicInvoice: true,
      invoiceFormat: 'DIAN',
    },
  ],
  fiscalBilling: {
    enabled: true,
    autoGenerateECF: true,
    storeXmlYears: 10,
  },
};

// ============================================
// MOCK DATA - TRANSACCIONES
// ============================================
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    subscriptionId: 'SUB-001',
    tenantId: 'T001',
    tenantName: 'Corporación Dominicana de Impresión',
    amount: 29500,
    currency: 'DOP',
    gateway: 'AZUL',
    gatewayTransactionId: 'AZL-20260215-001',
    paymentMethod: 'CREDIT_CARD',
    status: 'APPROVED',
    createdAt: '2026-02-15T10:00:00Z',
    processedAt: '2026-02-15T10:05:00Z',
    description: 'Suscripción Enterprise - Febrero 2026',
    gatewayResponse: {
      code: '00',
      message: 'Transacción aprobada',
      authCode: '123456',
      reference: 'REF-001',
    },
  },
  {
    id: 'TXN-002',
    subscriptionId: 'SUB-002',
    tenantId: 'T002',
    tenantName: 'Grupo Financiero XYZ',
    amount: 14160,
    currency: 'DOP',
    gateway: 'TPAGO',
    gatewayTransactionId: 'TPG-20260201-001',
    paymentMethod: 'CREDIT_CARD',
    status: 'DECLINED',
    createdAt: '2026-02-01T08:00:00Z',
    description: 'Suscripción Business - Febrero 2026',
    gatewayResponse: {
      code: '54',
      message: 'Tarjeta expirada',
    },
  },
];

// ============================================
// MOCK DATA - ALERTAS DE FRAUDE
// ============================================
const MOCK_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'FRAUD-001',
    transactionId: 'TXN-003',
    tenantId: 'T005',
    tenantName: 'Cliente Sospechoso SA',
    type: 'VELOCITY',
    severity: 'HIGH',
    description: 'Múltiples intentos de pago en corto tiempo',
    reason: '5 transacciones en 10 minutos desde diferentes IPs',
    status: 'OPEN',
    createdAt: '2026-02-20T14:30:00Z',
  },
  {
    id: 'FRAUD-002',
    transactionId: 'TXN-004',
    tenantId: 'T006',
    tenantName: 'Empresa XYZ',
    type: 'AMOUNT',
    severity: 'MEDIUM',
    description: 'Monto inusualmente alto para el patrón del cliente',
    reason: 'Transacción de $50,000 vs promedio de $5,000',
    status: 'UNDER_REVIEW',
    action: 'BLOCKED',
    createdAt: '2026-02-19T11:00:00Z',
  },
];

// ============================================
// HOOK PRINCIPAL
// ============================================
export function usePaymentGateways() {
  const [gateways, setGateways] = useState<PaymentGateway[]>(MOCK_GATEWAYS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [billingSettings, setBillingSettings] = useState<BillingSettings>(MOCK_BILLING_SETTINGS);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(MOCK_FRAUD_ALERTS);

  // ==========================================
  // GATEWAY FUNCTIONS
  // ==========================================
  const updateGatewayStatus = useCallback((gatewayId: string, status: GatewayStatus) => {
    setGateways(prev => prev.map(gw => {
      if (gw.id === gatewayId) {
        return { ...gw, status, updatedAt: new Date().toISOString() };
      }
      return gw;
    }));
  }, []);

  const testGatewayConnection = useCallback((gatewayId: string) => {
    // Simular prueba de conexión
    setGateways(prev => prev.map(gw => {
      if (gw.id === gatewayId) {
        return {
          ...gw,
          lastTestDate: new Date().toISOString(),
          lastTestResult: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return gw;
    }));
    return true;
  }, []);

  // ==========================================
  // SUBSCRIPTION FUNCTIONS
  // ==========================================
  const updateSubscriptionStatus = useCallback((subscriptionId: string, status: SubscriptionStatus) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subscriptionId) {
        return { ...sub, status, updatedAt: new Date().toISOString() };
      }
      return sub;
    }));
  }, []);

  const cancelSubscription = useCallback((subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subscriptionId) {
        return {
          ...sub,
          status: 'PENDING_CANCELLATION',
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return sub;
    }));
  }, []);

  const addPaymentRecord = useCallback((subscriptionId: string, payment: PaymentRecord) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subscriptionId) {
        return {
          ...sub,
          paymentHistory: [payment, ...sub.paymentHistory],
          updatedAt: new Date().toISOString(),
        };
      }
      return sub;
    }));
  }, []);

  // ==========================================
  // FRAUD ALERT FUNCTIONS
  // ==========================================
  const resolveFraudAlert = useCallback((alertId: string, action: 'ALLOWED' | 'BLOCKED' | 'REFUNDED', resolvedBy: string) => {
    setFraudAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          status: 'RESOLVED',
          action,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        };
      }
      return alert;
    }));
  }, []);

  // ==========================================
  // BILLING SETTINGS
  // ==========================================
  const updateBillingSettings = useCallback((settings: Partial<BillingSettings>) => {
    setBillingSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // ==========================================
  // REPORTS
  // ==========================================
  const financialReport = useMemo((): FinancialReport => {
    const totalInvoiced = subscriptions.reduce((sum, sub) =>
      sum + sub.paymentHistory.reduce((s, p) => s + p.totalAmount, 0), 0
    );

    const totalCollected = subscriptions.reduce((sum, sub) =>
      sum + sub.paymentHistory.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.totalAmount, 0), 0
    );

    const totalPending = subscriptions.reduce((sum, sub) =>
      sum + sub.paymentHistory.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.totalAmount, 0), 0
    );

    const totalFailed = subscriptions.reduce((sum, sub) =>
      sum + sub.paymentHistory.filter(p => p.status === 'FAILED' || p.status === 'DECLINED').reduce((s, p) => s + p.totalAmount, 0), 0
    );

    // Por gateway
    const byGateway = gateways.filter(g => g.status === 'ACTIVE').map(gw => {
      const gwTransactions = transactions.filter(t => t.gateway === gw.type);
      const amount = gwTransactions.reduce((sum, t) => sum + t.amount, 0);
      const commission = amount * (gw.commission.percentage / 100) + (gwTransactions.length * gw.commission.fixedAmount);
      return {
        gateway: gw.type,
        transactions: gwTransactions.length,
        amount,
        commission,
        netAmount: amount - commission,
      };
    });

    return {
      period: {
        start: '2026-02-01',
        end: '2026-02-28',
      },
      summary: {
        totalInvoiced,
        totalCollected,
        totalPending,
        totalFailed,
        collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
      },
      byGateway,
      byStatus: [
        { status: 'APPROVED', count: transactions.filter(t => t.status === 'APPROVED').length, amount: transactions.filter(t => t.status === 'APPROVED').reduce((s, t) => s + t.amount, 0) },
        { status: 'DECLINED', count: transactions.filter(t => t.status === 'DECLINED').length, amount: transactions.filter(t => t.status === 'DECLINED').reduce((s, t) => s + t.amount, 0) },
        { status: 'PENDING', count: transactions.filter(t => t.status === 'PENDING').length, amount: transactions.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0) },
      ],
      reconciliation: {
        expectedDeposits: totalCollected,
        confirmedDeposits: totalCollected * 0.85,
        pendingDeposits: totalCollected * 0.15,
      },
    };
  }, [subscriptions, transactions, gateways]);

  // ==========================================
  // FILTERS
  // ==========================================
  const getSubscriptionsByStatus = useCallback((status: SubscriptionStatus | 'ALL') => {
    if (status === 'ALL') return subscriptions;
    return subscriptions.filter(sub => sub.status === status);
  }, [subscriptions]);

  const getGatewaysByRegion = useCallback((region: string) => {
    if (region === 'ALL') return gateways;
    return gateways.filter(gw => gw.region === region);
  }, [gateways]);

  const getActiveGateways = useCallback(() => {
    return gateways.filter(gw => gw.status === 'ACTIVE');
  }, [gateways]);

  return {
    // Data
    gateways,
    subscriptions,
    billingSettings,
    transactions,
    fraudAlerts,
    financialReport,

    // Gateway functions
    updateGatewayStatus,
    testGatewayConnection,

    // Subscription functions
    updateSubscriptionStatus,
    cancelSubscription,
    addPaymentRecord,

    // Fraud alert functions
    resolveFraudAlert,

    // Billing settings
    updateBillingSettings,

    // Filters
    getSubscriptionsByStatus,
    getGatewaysByRegion,
    getActiveGateways,
  };
}
