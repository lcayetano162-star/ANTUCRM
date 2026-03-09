import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CreditStatus } from '@/components/credit/CreditBadge';

export type { CreditStatus };

// ============================================
// TIPOS PARA CRÉDITO DE CLIENTE
// ============================================
export interface CustomerCredit {
  customerId: string;
  customerName: string;
  rnc: string;
  status: CreditStatus;

  // Línea de crédito
  limit: number;
  used: number;
  available: number;

  // Solicitud
  requestId?: string;
  requestedAmount?: number;
  requestedAt?: string;
  requestedBy?: string;

  // Aprobación
  approvedAmount?: number;
  approvedAt?: string;
  approvedBy?: string;
  expiresAt?: string;

  // Condiciones
  paymentTerms: number; // días
  requiresGuarantee: boolean;
  conditions?: string[];

  // Score IA
  aiScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  // Historial
  lastUsedAt?: string;
  totalOperations: number;
  onTimePayments: number;
  latePayments: number;
}

// ============================================
// MOCK DATA - CRÉDITOS DE CLIENTES
// ============================================
const MOCK_CUSTOMER_CREDITS: CustomerCredit[] = [
  {
    customerId: 'CLI-001',
    customerName: 'Corporación Dominicana de Impresión',
    rnc: '101-12345-6',
    status: 'APPROVED',
    limit: 500000,
    used: 0,
    available: 500000,
    requestId: 'SOL-2026-0089',
    requestedAmount: 500000,
    requestedAt: '2026-02-20',
    requestedBy: 'María González',
    approvedAmount: 500000,
    approvedAt: '2026-02-23',
    approvedBy: 'Carlos Méndez',
    expiresAt: '2026-08-23',
    paymentTerms: 30,
    requiresGuarantee: false,
    aiScore: 82,
    riskLevel: 'LOW',
    totalOperations: 0,
    onTimePayments: 0,
    latePayments: 0,
  },
  {
    customerId: 'CLI-002',
    customerName: 'Grupo Financiero XYZ',
    rnc: '102-56789-0',
    status: 'APPROVED',
    limit: 1200000,
    used: 450000,
    available: 750000,
    requestId: 'SOL-2026-0056',
    requestedAmount: 1200000,
    requestedAt: '2026-01-15',
    requestedBy: 'Juan Pérez',
    approvedAmount: 1200000,
    approvedAt: '2026-01-18',
    approvedBy: 'Carlos Méndez',
    expiresAt: '2026-07-18',
    paymentTerms: 30,
    requiresGuarantee: false,
    aiScore: 92,
    riskLevel: 'LOW',
    lastUsedAt: '2026-02-15',
    totalOperations: 8,
    onTimePayments: 8,
    latePayments: 0,
  },
  {
    customerId: 'CLI-003',
    customerName: 'Industrias ABC',
    rnc: '103-11111-2',
    status: 'PENDING',
    limit: 0,
    used: 0,
    available: 0,
    requestId: 'SOL-2026-0095',
    requestedAmount: 50000,
    requestedAt: '2026-02-18',
    requestedBy: 'Carlos Rodríguez',
    paymentTerms: 30,
    requiresGuarantee: false,
    aiScore: 45,
    riskLevel: 'HIGH',
    totalOperations: 0,
    onTimePayments: 0,
    latePayments: 0,
  },
  {
    customerId: 'CLI-004',
    customerName: 'Editorial Nacional',
    rnc: '104-33333-4',
    status: 'APPROVED',
    limit: 300000,
    used: 275000,
    available: 25000,
    requestId: 'SOL-2025-0042',
    requestedAmount: 300000,
    requestedAt: '2025-11-20',
    requestedBy: 'Ana López',
    approvedAmount: 300000,
    approvedAt: '2025-11-23',
    approvedBy: 'Pedro Martínez',
    expiresAt: '2026-05-23',
    paymentTerms: 45,
    requiresGuarantee: true,
    conditions: ['Garantía de pagaré para montos >$200K'],
    aiScore: 68,
    riskLevel: 'MEDIUM',
    lastUsedAt: '2026-02-10',
    totalOperations: 12,
    onTimePayments: 10,
    latePayments: 2,
  },
  {
    customerId: 'CLI-005',
    customerName: 'Imprenta Central',
    rnc: '105-44444-5',
    status: 'NONE',
    limit: 0,
    used: 0,
    available: 0,
    paymentTerms: 0,
    requiresGuarantee: false,
    totalOperations: 0,
    onTimePayments: 0,
    latePayments: 0,
  },
  {
    customerId: 'CLI-006',
    customerName: 'Publicidad Moderna SA',
    rnc: '106-55555-6',
    status: 'SUSPENDED',
    limit: 100000,
    used: 100000,
    available: 0,
    requestId: 'SOL-2025-0078',
    requestedAmount: 100000,
    requestedAt: '2025-08-10',
    approvedAmount: 100000,
    approvedAt: '2025-08-12',
    paymentTerms: 30,
    requiresGuarantee: false,
    lastUsedAt: '2025-12-15',
    totalOperations: 5,
    onTimePayments: 3,
    latePayments: 2,
  },
];

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useCustomerCredit() {
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [loading, setLoading] = useState(true);

  // Persistence Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('antu_credits');
    if (saved) {
      setCredits(JSON.parse(saved));
    } else {
      setCredits(MOCK_CUSTOMER_CREDITS);
      localStorage.setItem('antu_credits', JSON.stringify(MOCK_CUSTOMER_CREDITS));
    }
    setLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('antu_credits', JSON.stringify(credits));
    }
  }, [credits, loading]);

  // ==========================================
  // GETTERS
  // ==========================================
  const getCreditByCustomerId = useCallback((customerId: string): CustomerCredit | undefined => {
    return credits.find(c => c.customerId === customerId);
  }, [credits]);

  const getCreditByRNC = useCallback((rnc: string): CustomerCredit | undefined => {
    return credits.find(c => c.rnc === rnc);
  }, [credits]);

  // ==========================================
  // VALIDACIÓN PARA OPORTUNIDADES
  // ==========================================
  const validateCreditForOpportunity = useCallback((
    customerId: string,
    opportunityAmount: number
  ): {
    canClose: boolean;
    status: CreditStatus;
    message: string;
    available: number;
    required: number;
    options: string[];
  } => {
    const credit = getCreditByCustomerId(customerId);

    if (!credit || credit.status === 'NONE') {
      return {
        canClose: false,
        status: 'NONE',
        message: 'Cliente sin línea de crédito. Debe solicitar crédito antes de cerrar a crédito.',
        available: 0,
        required: opportunityAmount,
        options: [
          'Solicitar crédito (3-5 días hábiles)',
          'Cambiar a pago contado',
          'Dividir operación (contado + crédito futuro)',
        ],
      };
    }

    if (credit.status === 'PENDING') {
      return {
        canClose: false,
        status: 'PENDING',
        message: `Crédito en evaluación. Solicitud #${credit.requestId} en proceso.`,
        available: 0,
        required: opportunityAmount,
        options: [
          'Esperar aprobación del crédito',
          'Cambiar a pago contado',
          'Contactar a analista para priorizar',
        ],
      };
    }

    if (credit.status === 'REJECTED') {
      return {
        canClose: false,
        status: 'REJECTED',
        message: 'Crédito rechazado. El cliente no califica para línea de crédito.',
        available: 0,
        required: opportunityAmount,
        options: [
          'Cambiar a pago contado',
          'Solicitar reevaluación (con documentación adicional)',
          'Propuesta de pago anticipado',
        ],
      };
    }

    if (credit.status === 'SUSPENDED') {
      return {
        canClose: false,
        status: 'SUSPENDED',
        message: 'Crédito suspendido por mora o incumplimiento.',
        available: 0,
        required: opportunityAmount,
        options: [
          'Regularizar deudas pendientes',
          'Cambiar a pago contado',
          'Contactar cobranza para acuerdo',
        ],
      };
    }

    if (credit.status === 'EXHAUSTED') {
      return {
        canClose: false,
        status: 'EXHAUSTED',
        message: `Crédito agotado. Límite: ${formatCurrency(credit.limit)} | Utilizado: ${formatCurrency(credit.used)}`,
        available: 0,
        required: opportunityAmount,
        options: [
          'Solicitar aumento de línea',
          'Cambiar a pago contado',
          'Esperar liberación de crédito (pagos pendientes)',
        ],
      };
    }

    // Verificar si el monto excede el disponible
    if (opportunityAmount > credit.available) {
      return {
        canClose: false,
        status: credit.status,
        message: `Monto de oportunidad (${formatCurrency(opportunityAmount)}) excede crédito disponible (${formatCurrency(credit.available)})`,
        available: credit.available,
        required: opportunityAmount,
        options: [
          `Solicitar aumento de ${formatCurrency(opportunityAmount - credit.available)}`,
          'Reducir monto de oportunidad',
          'Dividir en facturas parciales',
          'Cambiar parte a contado',
        ],
      };
    }

    // Todo OK
    return {
      canClose: true,
      status: credit.status,
      message: `✅ Crédito suficiente. Disponible: ${formatCurrency(credit.available)} | Requerido: ${formatCurrency(opportunityAmount)}`,
      available: credit.available,
      required: opportunityAmount,
      options: [],
    };
  }, [getCreditByCustomerId]);

  // ==========================================
  // SOLICITUD DE CRÉDITO
  // ==========================================
  const requestCredit = useCallback((
    customerId: string,
    customerName: string,
    rnc: string,
    amount: number,
    requestedBy: string,
    _reason?: string
  ): CustomerCredit => {
    const newRequestId = `SOL-${new Date().getFullYear()}-${String(credits.length + 1).padStart(4, '0')}`;

    const newCredit: CustomerCredit = {
      customerId,
      customerName,
      rnc,
      status: 'PENDING',
      limit: 0,
      used: 0,
      available: 0,
      requestId: newRequestId,
      requestedAmount: amount,
      requestedAt: new Date().toISOString().split('T')[0],
      requestedBy,
      paymentTerms: 30,
      requiresGuarantee: amount > 300000,
      totalOperations: 0,
      onTimePayments: 0,
      latePayments: 0,
    };

    setCredits(prev => [...prev, newCredit]);
    return newCredit;
  }, [credits.length]);

  // ==========================================
  // ACTUALIZAR CRÉDITO (desde CxC)
  // ==========================================
  const approveCredit = useCallback((
    customerId: string,
    approvedAmount: number,
    approvedBy: string,
    conditions?: string[]
  ) => {
    setCredits(prev => prev.map(c => {
      if (c.customerId === customerId) {
        return {
          ...c,
          status: conditions && conditions.length > 0 ? 'CONDITIONAL' : 'APPROVED',
          limit: approvedAmount,
          available: approvedAmount,
          approvedAmount,
          approvedAt: new Date().toISOString().split('T')[0],
          approvedBy,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses
          conditions,
        };
      }
      return c;
    }));
  }, []);

  // ==========================================
  // COMPROMETER CRÉDITO (al cerrar oportunidad)
  // ==========================================
  const commitCredit = useCallback((customerId: string, amount: number) => {
    setCredits(prev => prev.map(c => {
      if (c.customerId === customerId) {
        const newUsed = c.used + amount;
        const newAvailable = c.limit - newUsed;
        return {
          ...c,
          used: newUsed,
          available: Math.max(0, newAvailable),
          status: newAvailable <= 0 ? 'EXHAUSTED' : c.status,
          lastUsedAt: new Date().toISOString().split('T')[0],
          totalOperations: c.totalOperations + 1,
        };
      }
      return c;
    }));
  }, []);

  // ==========================================
  // LIBERAR CRÉDITO (al recibir pago)
  // ==========================================
  const releaseCredit = useCallback((customerId: string, amount: number) => {
    setCredits(prev => prev.map(c => {
      if (c.customerId === customerId) {
        const newUsed = Math.max(0, c.used - amount);
        const newAvailable = c.limit - newUsed;
        return {
          ...c,
          used: newUsed,
          available: newAvailable,
          status: c.status === 'EXHAUSTED' && newAvailable > 0 ? 'APPROVED' : c.status,
          onTimePayments: c.onTimePayments + 1,
        };
      }
      return c;
    }));
  }, []);

  // ==========================================
  // SUSPENDER CRÉDITO (por mora)
  // ==========================================
  const suspendCredit = useCallback((customerId: string, _reason: string) => {
    setCredits(prev => prev.map(c => {
      if (c.customerId === customerId) {
        return {
          ...c,
          status: 'SUSPENDED',
          latePayments: c.latePayments + 1,
        };
      }
      return c;
    }));
  }, []);

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================
  const stats = useMemo(() => {
    return {
      total: credits.length,
      approved: credits.filter(c => c.status === 'APPROVED').length,
      pending: credits.filter(c => c.status === 'PENDING').length,
      rejected: credits.filter(c => c.status === 'REJECTED').length,
      none: credits.filter(c => c.status === 'NONE').length,
      totalLimit: credits.reduce((sum, c) => sum + c.limit, 0),
      totalUsed: credits.reduce((sum, c) => sum + c.used, 0),
      totalAvailable: credits.reduce((sum, c) => sum + c.available, 0),
    };
  }, [credits]);

  return {
    credits,
    stats,
    getCreditByCustomerId,
    getCreditByRNC,
    validateCreditForOpportunity,
    requestCredit,
    approveCredit,
    commitCredit,
    releaseCredit,
    suspendCredit,
  };
}

// Helper
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
