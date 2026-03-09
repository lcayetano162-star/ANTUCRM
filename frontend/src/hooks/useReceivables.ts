import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
const DUMMY_PDF_DATA = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKCjIgMCBvYmoKPDwvVHlwZSAvUGFnZXMgL0tpZHMgWzMgMCBSXSAvQ291bnQgMT4+CmVuZG9iagoKMyAwIG9vYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9SZXNvdXJjZXMgPDw+PiAvQ29udGVudHMgNCAwIFI+PgplbmRvYmoKCjQgMCBvYmoKPDwvTGVuZ3RoIDIxPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3MDAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAppbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTA3IDAwMDAwbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNSAvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoyODIKJSVFT0Y=';

import type {
  CreditRequest,
  CreditLine,
  Receivable,
  PortfolioSummary,
  AIAlert,
  CollectionAction,
  CreditRequestStatus,
  ReceivableStatus,
  CashForecast,
} from '@/types/receivables';

// ============================================
// MOCK DATA - SOLICITUDES DE CRÉDITO
// ============================================
const MOCK_CREDIT_REQUESTS: CreditRequest[] = [
  {
    id: 'CR-001',
    customerId: 'C001',
    customerName: 'Corporación Dominicana de Impresión',
    customerRNC: '101-12345-6',
    requestedAmount: 500000,
    requestedBy: 'Juan Pérez',
    requestedById: 'V001',
    requestDate: '2026-02-15',
    reason: 'Renovación de flota de equipos (Opp. #0042)',
    status: 'PENDING',
    aiScore: 78,
    riskLevel: 'MEDIUM',
    aiFactors: [
      { category: 'PAYMENT_HISTORY', score: 85, maxScore: 100, description: '3 años de historial, pagos puntuales 95% del tiempo', positive: true },
      { category: 'FINANCIAL', score: 75, maxScore: 100, description: 'Crecimiento sostenido en compras (+15% anual)', positive: true },
      { category: 'BEHAVIOR', score: 80, maxScore: 100, description: 'DSO promedio: 28 días (vs 35 sector)', positive: true },
      { category: 'SECTOR', score: 70, maxScore: 100, description: 'Sector gráfico con alta rotación de capital', positive: false },
    ],
    aiRecommendation: 'Aprobar con condiciones. El cliente tiene historial sólido pero el monto representa 40% de su volumen anual. Sugerir: Límite inicial: $400,000 (80% del solicitado), Revisión a 6 meses si historial positivo, Garantía de pagaré para montos >$300K',
    documents: [
      { id: 'D001', type: 'RNC', name: 'RNC_Actualizado.pdf', uploadedAt: '2026-02-15', uploadedBy: 'Juan Pérez', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D002', type: 'FINANCIAL_STATEMENTS', name: 'Estados_2024-2025.pdf', uploadedAt: '2026-02-15', uploadedBy: 'Juan Pérez', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D003', type: 'COMMERCIAL_REFERENCES', name: 'Referencias_Proveedores.pdf', uploadedAt: '2026-02-15', uploadedBy: 'Juan Pérez', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D004', type: 'APPLICATION_FORM', name: 'Solicitud_Credito_Firmada.pdf', uploadedAt: '2026-02-15', uploadedBy: 'Juan Pérez', verified: true, url: DUMMY_PDF_DATA },
    ],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'CR-002',
    customerId: 'C002',
    customerName: 'Grupo Financiero XYZ',
    customerRNC: '102-56789-0',
    requestedAmount: 1200000,
    requestedBy: 'María González',
    requestedById: 'V002',
    requestDate: '2026-02-14',
    reason: 'Expansión de operaciones de impresión',
    status: 'IN_REVIEW',
    aiScore: 92,
    riskLevel: 'LOW',
    aiFactors: [
      { category: 'PAYMENT_HISTORY', score: 95, maxScore: 100, description: '5 años sin retrasos, pagos anticipados frecuentes', positive: true },
      { category: 'FINANCIAL', score: 90, maxScore: 100, description: 'Fortaleza financiera demostrada, ratios saludables', positive: true },
      { category: 'BEHAVIOR', score: 88, maxScore: 100, description: 'Cliente estratégico, comunicación proactiva', positive: true },
      { category: 'SECTOR', score: 95, maxScore: 100, description: 'Sector financiero estable y regulado', positive: true },
    ],
    aiRecommendation: 'Aprobación recomendada sin condiciones. Cliente de bajo riesgo con excelente historial. El monto está dentro del 25% de su volumen anual.',
    documents: [
      { id: 'D005', type: 'RNC', name: 'RNC_XYZ.pdf', uploadedAt: '2026-02-14', uploadedBy: 'María González', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D006', type: 'FINANCIAL_STATEMENTS', name: 'Estados_Auditados.pdf', uploadedAt: '2026-02-14', uploadedBy: 'María González', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D007', type: 'APPLICATION_FORM', name: 'Solicitud_XYZ.pdf', uploadedAt: '2026-02-14', uploadedBy: 'María González', verified: true, url: DUMMY_PDF_DATA },
    ],
    createdAt: '2026-02-14T14:30:00Z',
    updatedAt: '2026-02-16T09:00:00Z',
  },
  {
    id: 'CR-003',
    customerId: 'C003',
    customerName: 'Industrias ABC',
    customerRNC: '103-11111-2',
    requestedAmount: 50000,
    requestedBy: 'Carlos Rodríguez',
    requestedById: 'V003',
    requestDate: '2026-02-13',
    reason: 'Compra de insumos de impresión',
    status: 'PENDING',
    aiScore: 45,
    riskLevel: 'HIGH',
    aiFactors: [
      { category: 'PAYMENT_HISTORY', score: 40, maxScore: 100, description: 'Retrasos frecuentes, último pago 15 días tarde', positive: false },
      { category: 'FINANCIAL', score: 50, maxScore: 100, description: 'Estados financieros muestran deterioro', positive: false },
      { category: 'BEHAVIOR', score: 45, maxScore: 100, description: 'Cambio frecuente de contacto financiero', positive: false },
      { category: 'SECTOR', score: 45, maxScore: 100, description: 'Sector industrial en contracción', positive: false },
    ],
    aiRecommendation: 'Recomendación: Rechazar o aprobar monto reducido ($25,000) con garantía. El historial de pagos muestra deterioro significativo.',
    documents: [
      { id: 'D008', type: 'RNC', name: 'RNC_ABC.pdf', uploadedAt: '2026-02-13', uploadedBy: 'Carlos Rodríguez', verified: true, url: DUMMY_PDF_DATA },
      { id: 'D009', type: 'APPLICATION_FORM', name: 'Solicitud_ABC.pdf', uploadedAt: '2026-02-13', uploadedBy: 'Carlos Rodríguez', verified: false, url: DUMMY_PDF_DATA },
    ],
    createdAt: '2026-02-13T11:00:00Z',
    updatedAt: '2026-02-13T11:00:00Z',
  },
];

// ============================================
// MOCK DATA - LÍNEAS DE CRÉDITO
// ============================================
const MOCK_CREDIT_LINES: CreditLine[] = [
  {
    id: 'CL-001',
    customerId: 'C002',
    customerName: 'Grupo Financiero XYZ',
    customerRNC: '102-56789-0',
    approvedAmount: 1200000,
    usedAmount: 450000,
    availableAmount: 750000,
    paymentTerms: 30,
    interestRate: 0,
    status: 'ACTIVE',
    approvedBy: 'María López',
    approvedDate: '2026-01-15',
    lastReviewDate: '2026-01-15',
    nextReviewDate: '2026-07-15',
    currentDSO: 22,
    totalInvoices: 24,
    paidInvoices: 23,
    lateInvoices: 1,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: 'CL-002',
    customerId: 'C004',
    customerName: 'Editorial Nacional',
    customerRNC: '104-33333-4',
    approvedAmount: 300000,
    usedAmount: 275000,
    availableAmount: 25000,
    paymentTerms: 45,
    interestRate: 1.5,
    status: 'ACTIVE',
    approvedBy: 'Pedro Martínez',
    approvedDate: '2025-11-20',
    lastReviewDate: '2026-01-20',
    nextReviewDate: '2026-04-20',
    currentDSO: 38,
    totalInvoices: 18,
    paidInvoices: 15,
    lateInvoices: 3,
    createdAt: '2025-11-20T09:00:00Z',
    updatedAt: '2026-02-18T16:00:00Z',
  },
];

// ============================================
// MOCK DATA - CUENTAS POR COBRAR
// ============================================
const MOCK_RECEIVABLES: Receivable[] = [
  {
    id: 'REC-001',
    invoiceId: 'INV-038',
    invoiceNumber: 'FACT-2026-0038',
    customerId: 'C005',
    customerName: 'Corporación XYZ',
    customerRNC: '102-98765-4',
    customerPhone: '809-555-0123',
    customerEmail: 'cobros@corpxyz.com',
    amount: 125000,
    balance: 125000,
    paidAmount: 0,
    issueDate: '2026-01-15',
    dueDate: '2026-02-15',
    daysOverdue: 5,
    status: 'OVERDUE',
    aiPrediction: {
      paymentProbability: 25,
      confidence: 78,
      riskLevel: 'HIGH',
      riskFactors: [
        'Cliente no ha abierto emails de recordatorio (3 enviados)',
        'Deterioro en pagos recientes (último: 15 días tarde)',
        'Sector en contracción (-8% actividad reportada)',
        'Cambio de contacto financiero (nuevo, sin historial)',
      ],
      recommendedAction: 'Llamada directa al CFO hoy. Si no paga en 3 días: visita presencial.',
      escalationLevel: 'AGGRESSIVE',
    },
    sellerId: 'V001',
    sellerName: 'Juan Pérez',
    collectionActions: [
      { id: 'CA001', type: 'EMAIL', date: '2026-01-15', description: 'Factura enviada', result: 'Email abierto en 2 horas', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA002', type: 'EMAIL_REMINDER', date: '2026-02-10', description: 'Recordatorio de vencimiento', result: 'No abierto', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA003', type: 'EMAIL_REMINDER', date: '2026-02-15', description: 'Factura vencida', result: 'No abierto', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA004', type: 'PHONE_CALL', date: '2026-02-18', description: 'Llamada de seguimiento', result: 'Sin respuesta', performedBy: 'Ana Cobros', performedById: 'COL001' },
      { id: 'CA005', type: 'PHONE_CALL', date: '2026-02-20', description: 'Segunda llamada', result: 'Contacto: "Pagará esta semana"', performedBy: 'Ana Cobros', performedById: 'COL001' },
    ],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-20T16:00:00Z',
  },
  {
    id: 'REC-002',
    invoiceId: 'INV-042',
    invoiceNumber: 'FACT-2026-0042',
    customerId: 'C002',
    customerName: 'Grupo Financiero XYZ',
    customerRNC: '102-56789-0',
    customerPhone: '809-555-0456',
    customerEmail: 'pagos@grupoxyz.com',
    amount: 85000,
    balance: 85000,
    paidAmount: 0,
    issueDate: '2026-02-20',
    dueDate: '2026-02-20',
    daysOverdue: 0,
    status: 'DUE_TODAY',
    aiPrediction: {
      paymentProbability: 85,
      estimatedPaymentDate: '2026-02-21',
      confidence: 92,
      riskLevel: 'LOW',
      riskFactors: [
        'Historial de pagos puntuales',
        'Cliente de bajo riesgo (Score 92)',
      ],
      recommendedAction: 'No requiere acción agresiva. Email de cortesía si no paga en 48h.',
      escalationLevel: 'STANDARD',
    },
    creditLineId: 'CL-001',
    sellerId: 'V002',
    sellerName: 'María González',
    collectionActions: [
      { id: 'CA006', type: 'EMAIL', date: '2026-02-20', description: 'Factura enviada', result: 'Email abierto', performedBy: 'Sistema', performedById: 'SYSTEM' },
    ],
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 'REC-003',
    invoiceId: 'INV-045',
    invoiceNumber: 'FACT-2026-0045',
    customerId: 'C001',
    customerName: 'Corporación Dominicana de Impresión',
    customerRNC: '101-12345-6',
    customerPhone: '809-555-0789',
    customerEmail: 'finanzas@cdimpresion.com',
    amount: 45000,
    balance: 45000,
    paidAmount: 0,
    issueDate: '2026-02-19',
    dueDate: '2026-02-21',
    daysOverdue: -1,
    status: 'PENDING',
    aiPrediction: {
      paymentProbability: 75,
      estimatedPaymentDate: '2026-02-22',
      confidence: 80,
      riskLevel: 'MEDIUM',
      riskFactors: [
        'Historial de pagos mayormente puntuales',
        'DSO promedio de 28 días',
      ],
      recommendedAction: 'Monitorear. Email recordatorio si no paga en fecha.',
      escalationLevel: 'STANDARD',
    },
    sellerId: 'V001',
    sellerName: 'Juan Pérez',
    collectionActions: [
      { id: 'CA007', type: 'EMAIL', date: '2026-02-19', description: 'Factura enviada', result: 'Email abierto', performedBy: 'Sistema', performedById: 'SYSTEM' },
    ],
    createdAt: '2026-02-19T14:00:00Z',
    updatedAt: '2026-02-19T14:00:00Z',
  },
  {
    id: 'REC-004',
    invoiceId: 'INV-030',
    invoiceNumber: 'FACT-2026-0030',
    customerId: 'C006',
    customerName: 'Imprenta Central',
    customerRNC: '105-44444-5',
    customerPhone: '809-555-0321',
    customerEmail: 'admin@imprentacentral.com',
    amount: 180000,
    balance: 180000,
    paidAmount: 0,
    issueDate: '2025-12-15',
    dueDate: '2026-01-15',
    daysOverdue: 36,
    status: 'IN_COLLECTION',
    aiPrediction: {
      paymentProbability: 15,
      confidence: 85,
      riskLevel: 'CRITICAL',
      riskFactors: [
        'Factura vencida más de 30 días',
        'Múltiples promesas de pago incumplidas',
        'No responde llamadas ni emails',
        'Deterioro financiero reportado',
      ],
      recommendedAction: 'Visita presencial urgente. Considerar suspensión de servicios y cobro judicial.',
      escalationLevel: 'URGENT',
    },
    sellerId: 'V003',
    sellerName: 'Carlos Rodríguez',
    collectionActions: [
      { id: 'CA008', type: 'EMAIL', date: '2025-12-15', description: 'Factura enviada', result: 'Entregada', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA009', type: 'EMAIL_REMINDER', date: '2026-01-10', description: 'Recordatorio', result: 'Sin respuesta', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA010', type: 'PHONE_CALL', date: '2026-01-16', description: 'Llamada vencida', result: 'Promesa: 20/01', performedBy: 'Ana Cobros', performedById: 'COL001' },
      { id: 'CA011', type: 'PHONE_CALL', date: '2026-01-21', description: 'Seguimiento', result: 'Promesa: 25/01', performedBy: 'Ana Cobros', performedById: 'COL001' },
      { id: 'CA012', type: 'PHONE_CALL', date: '2026-01-26', description: 'Tercera llamada', result: 'Sin respuesta', performedBy: 'Ana Cobros', performedById: 'COL001' },
      { id: 'CA013', type: 'FORMAL_LETTER', date: '2026-02-01', description: 'Carta formal de cobro', result: 'Enviada', performedBy: 'Sistema', performedById: 'SYSTEM' },
      { id: 'CA014', type: 'VISIT', date: '2026-02-10', description: 'Visita presencial', result: 'No localizado', performedBy: 'Ana Cobros', performedById: 'COL001' },
    ],
    createdAt: '2025-12-15T10:00:00Z',
    updatedAt: '2026-02-10T15:00:00Z',
  },
  {
    id: 'REC-005',
    invoiceId: 'INV-050',
    invoiceNumber: 'FACT-2026-0050',
    customerId: 'C007',
    customerName: 'Publicidad Moderna SA',
    customerRNC: '106-55555-6',
    customerPhone: '809-555-0654',
    customerEmail: 'pagos@pubmoderna.com',
    amount: 65000,
    balance: 32500,
    paidAmount: 32500,
    issueDate: '2026-02-01',
    dueDate: '2026-03-01',
    daysOverdue: -9,
    status: 'PENDING',
    aiPrediction: {
      paymentProbability: 95,
      estimatedPaymentDate: '2026-02-28',
      confidence: 90,
      riskLevel: 'LOW',
      riskFactors: [
        'Cliente nuevo con referencias excelentes',
        'Primer pago realizado puntualmente (50%)',
      ],
      recommendedAction: 'No requiere acción. Confirmar recepción de segunda cuota.',
      escalationLevel: 'STANDARD',
    },
    paymentAgreement: {
      id: 'PA001',
      totalAmount: 65000,
      installments: 2,
      installmentAmount: 32500,
      firstPaymentDate: '2026-02-15',
      frequency: 'MONTHLY',
      status: 'ACTIVE',
      createdAt: '2026-02-01T10:00:00Z',
    },
    sellerId: 'V002',
    sellerName: 'María González',
    collectionActions: [
      { id: 'CA015', type: 'PAYMENT_AGREEMENT', date: '2026-02-01', description: 'Acuerdo de pago a 2 cuotas', result: 'Aprobado', performedBy: 'María González', performedById: 'V002' },
      { id: 'CA016', type: 'PAYMENT_RECEIVED', date: '2026-02-15', description: 'Primera cuota recibida', result: '$32,500 pagado', performedBy: 'Sistema', performedById: 'SYSTEM' },
    ],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
];

// ============================================
// MOCK DATA - ALERTAS IA
// ============================================
const MOCK_AI_ALERTS: AIAlert[] = [
  {
    id: 'ALERT-001',
    type: 'HIGH_RISK',
    severity: 'CRITICAL',
    title: '5 facturas con alta probabilidad de impago (>70%)',
    description: 'Clientes: Corp. XYZ, Industrias ABC, Imprenta Central requieren atención urgente.',
    createdAt: '2026-02-20T08:00:00Z',
    read: false,
  },
  {
    id: 'ALERT-002',
    type: 'DUE_TODAY',
    severity: 'HIGH',
    title: '12 facturas vencen HOY',
    description: 'Valor total: $450,000 DOP. Priorizar contacto con clientes.',
    createdAt: '2026-02-20T07:00:00Z',
    read: false,
  },
  {
    id: 'ALERT-003',
    type: 'PAYMENT_EXPECTED',
    severity: 'LOW',
    title: '8 clientes pagarán ANTES del vencimiento según IA',
    description: 'No requieren acción agresiva. Monitorear normalmente.',
    createdAt: '2026-02-20T06:00:00Z',
    read: true,
  },
  {
    id: 'ALERT-004',
    type: 'PATTERN_CHANGE',
    severity: 'MEDIUM',
    title: 'Cambio de patrón de pago detectado - Editorial Nacional',
    description: 'DSO aumentó de 28 a 38 días en los últimos 3 meses.',
    customerId: 'C004',
    createdAt: '2026-02-19T15:00:00Z',
    read: false,
  },
];

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useReceivables() {
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [creditLines] = useState<CreditLine[]>(MOCK_CREDIT_LINES);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Persistence Initial Load
  useEffect(() => {
    try {
      const savedRequests = localStorage.getItem('antu_credit_requests');
      const savedReceivables = localStorage.getItem('antu_receivables');
      const savedAlerts = localStorage.getItem('antu_alerts');

      if (savedRequests && savedRequests !== '[]') {
        setCreditRequests(JSON.parse(savedRequests));
      } else {
        setCreditRequests(MOCK_CREDIT_REQUESTS);
        localStorage.setItem('antu_credit_requests', JSON.stringify(MOCK_CREDIT_REQUESTS));
      }

      if (savedReceivables && savedReceivables !== '[]') {
        setReceivables(JSON.parse(savedReceivables));
      } else {
        setReceivables(MOCK_RECEIVABLES);
        localStorage.setItem('antu_receivables', JSON.stringify(MOCK_RECEIVABLES));
      }

      if (savedAlerts && savedAlerts !== '[]') {
        setAlerts(JSON.parse(savedAlerts));
      } else {
        setAlerts(MOCK_AI_ALERTS);
        localStorage.setItem('antu_alerts', JSON.stringify(MOCK_AI_ALERTS));
      }
    } catch (e) {
      console.error("Failed to load receivables from localStorage", e);
      setCreditRequests(MOCK_CREDIT_REQUESTS);
      setReceivables(MOCK_RECEIVABLES);
      setAlerts(MOCK_AI_ALERTS);
    }
    setLoading(false);
  }, []);

  // Sync state to localStorage whenever it changes as a fallback, 
  // but we will also do it synchronously in the actions
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('antu_credit_requests', JSON.stringify(creditRequests));
      localStorage.setItem('antu_receivables', JSON.stringify(receivables));
      localStorage.setItem('antu_alerts', JSON.stringify(alerts));
    }
  }, [creditRequests, receivables, alerts, loading]);

  // ==========================================
  // PORTFOLIO SUMMARY
  // ==========================================
  const portfolioSummary = useMemo((): PortfolioSummary => {
    const totalPortfolio = receivables.reduce((sum, r) => sum + r.balance, 0);
    const totalOverdue = receivables
      .filter(r => r.daysOverdue > 0)
      .reduce((sum, r) => sum + r.balance, 0);

    const current = receivables
      .filter(r => r.daysOverdue <= 0)
      .reduce((sum, r) => sum + r.balance, 0);
    const days1to30 = receivables
      .filter(r => r.daysOverdue > 0 && r.daysOverdue <= 30)
      .reduce((sum, r) => sum + r.balance, 0);
    const days31to60 = receivables
      .filter(r => r.daysOverdue > 30 && r.daysOverdue <= 60)
      .reduce((sum, r) => sum + r.balance, 0);
    const days61to90 = receivables
      .filter(r => r.daysOverdue > 60 && r.daysOverdue <= 90)
      .reduce((sum, r) => sum + r.balance, 0);
    const daysOver90 = receivables
      .filter(r => r.daysOverdue > 90)
      .reduce((sum, r) => sum + r.balance, 0);

    const totalInvoices = receivables.length;
    const pendingInvoices = receivables.filter(r => r.status === 'PENDING').length;
    const overdueInvoices = receivables.filter(r => r.status === 'OVERDUE' || r.status === 'IN_COLLECTION').length;
    const invoicesDueToday = receivables.filter(r => r.status === 'DUE_TODAY').length;
    const highRiskInvoices = receivables.filter(r => r.aiPrediction.riskLevel === 'HIGH' || r.aiPrediction.riskLevel === 'CRITICAL').length;

    // Calcular DSO promedio ponderado
    const totalAmount = receivables.reduce((sum, r) => sum + r.amount, 0);
    const weightedDSO = receivables.reduce((sum, r) => sum + (r.daysOverdue > 0 ? r.daysOverdue : 0) * r.amount, 0) / totalAmount;

    // Calcular CEI (Collection Effectiveness Index) - simulado
    const collectionEffectiveness = 87;

    return {
      totalPortfolio,
      totalOverdue,
      overduePercentage: totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0,
      averageDSO: Math.round(weightedDSO),
      collectionEffectiveness,
      aging: {
        current,
        days1to30,
        days31to60,
        days61to90,
        daysOver90,
      },
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      invoicesDueToday,
      highRiskInvoices,
    };
  }, [receivables]);

  // ==========================================
  // CASH FORECAST
  // ==========================================
  const cashForecast = useMemo((): CashForecast[] => {
    return [
      {
        period: 'Semana 1 (20-27 Feb)',
        startDate: '2026-02-20',
        endDate: '2026-02-27',
        estimatedCollections: 2100000,
        confirmedPayments: 800000,
        probablePayments: 900000,
        possiblePayments: 400000,
        confidenceInterval: 5,
        expectedAmount: 2200000,
        variance: -100000,
        variancePercentage: -4.5,
      },
      {
        period: 'Semana 2 (28-06 Mar)',
        startDate: '2026-02-28',
        endDate: '2026-03-06',
        estimatedCollections: 1800000,
        confirmedPayments: 500000,
        probablePayments: 800000,
        possiblePayments: 500000,
        confidenceInterval: 8,
        expectedAmount: 1900000,
        variance: -100000,
        variancePercentage: -5.3,
      },
      {
        period: 'Semana 3 (07-13 Mar)',
        startDate: '2026-03-07',
        endDate: '2026-03-13',
        estimatedCollections: 1500000,
        confirmedPayments: 300000,
        probablePayments: 700000,
        possiblePayments: 500000,
        confidenceInterval: 12,
        expectedAmount: 1650000,
        variance: -150000,
        variancePercentage: -9.1,
      },
      {
        period: 'Semana 4 (14-20 Mar)',
        startDate: '2026-03-14',
        endDate: '2026-03-20',
        estimatedCollections: 1200000,
        confirmedPayments: 200000,
        probablePayments: 500000,
        possiblePayments: 500000,
        confidenceInterval: 15,
        expectedAmount: 1450000,
        variance: -250000,
        variancePercentage: -17.2,
      },
    ];
  }, []);

  // ==========================================
  // CREDIT REQUEST FUNCTIONS
  // ==========================================
  const approveCreditRequest = useCallback((requestId: string, approvedAmount: number, conditions?: string[], comments?: string) => {
    setCreditRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: (conditions && conditions.length > 0 ? 'CONDITIONAL' : 'APPROVED') as CreditRequestStatus,
            approvedAmount,
            conditions,
            comments,
            approvedBy: 'María López',
            approvedById: 'U001',
            approvalDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString(),
          };
        }
        return req;
      });
      localStorage.setItem('antu_credit_requests', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const rejectCreditRequest = useCallback((requestId: string, reason: string) => {
    setCreditRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'REJECTED' as CreditRequestStatus,
            rejectionReason: reason,
            approvedBy: 'María López',
            approvedById: 'U001',
            approvalDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString(),
          };
        }
        return req;
      });
      localStorage.setItem('antu_credit_requests', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addCreditRequest = useCallback((request: CreditRequest) => {
    setCreditRequests(prev => {
      const updated = [request, ...prev];
      try {
        localStorage.setItem('antu_credit_requests', JSON.stringify(updated));
      } catch (e) {
        console.error("Critical: LocalStorage quota exceeded. Documents might be too large for mock environment.", e);
        toast.error("La solicitud es demasiado pesada para el almacenamiento local (muchos PDFs). Se guardó en memoria pero podría no persistir tras recargar.");
      }
      return updated;
    });
  }, []);

  const startReview = useCallback((requestId: string) => {
    setCreditRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'IN_REVIEW' as CreditRequestStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return req;
      });
      localStorage.setItem('antu_credit_requests', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ==========================================
  // COLLECTION ACTIONS
  // ==========================================
  const addCollectionAction = useCallback((receivableId: string, action: Omit<CollectionAction, 'id' | 'date'>) => {
    const newAction: CollectionAction = {
      ...action,
      id: `CA-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    setReceivables(prev => prev.map(rec => {
      if (rec.id === receivableId) {
        return {
          ...rec,
          collectionActions: [...rec.collectionActions, newAction],
          updatedAt: new Date().toISOString(),
        };
      }
      return rec;
    }));
  }, []);

  const addReceivable = useCallback((receivable: any) => {
    const newReceivable = {
      ...receivable,
      id: `REC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionActions: receivable.collectionActions || [],
      aiPrediction: receivable.aiPrediction || {
        paymentProbability: 80,
        confidence: 90,
        riskLevel: 'LOW',
        recommendedAction: 'Monitorear pago',
        escalationLevel: 'STANDARD'
      }
    };

    setReceivables(prev => [newReceivable, ...prev]);
    return newReceivable;
  }, []);

  const registerPayment = useCallback((receivableId: string, amount: number, method: string, reference?: string) => {
    setReceivables(prev => prev.map(rec => {
      if (rec.id === receivableId) {
        const newPaidAmount = rec.paidAmount + amount;
        const newBalance = rec.amount - newPaidAmount;
        const isPaid = newBalance <= 0;

        const paymentAction: CollectionAction = {
          id: `CA-${Date.now()}`,
          type: 'PAYMENT_RECEIVED',
          date: new Date().toISOString().split('T')[0],
          description: `Pago recibido: ${amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`,
          result: `Método: ${method}${reference ? `, Ref: ${reference}` : ''}`,
          performedBy: 'Sistema',
          performedById: 'SYSTEM',
        };

        return {
          ...rec,
          paidAmount: newPaidAmount,
          balance: Math.max(0, newBalance),
          status: isPaid ? 'PAID' : rec.status,
          collectionActions: [...rec.collectionActions, paymentAction],
          updatedAt: new Date().toISOString(),
        };
      }
      return rec;
    }));
  }, []);

  // ==========================================
  // ALERTS
  // ==========================================
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, read: true };
      }
      return alert;
    }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // ==========================================
  // FILTERS
  // ==========================================
  const getCreditRequestsByStatus = useCallback((status: CreditRequestStatus | 'ALL') => {
    if (status === 'ALL') return creditRequests;
    return creditRequests.filter(req => req.status === status);
  }, [creditRequests]);

  const getReceivablesByStatus = useCallback((status: ReceivableStatus | 'ALL') => {
    if (status === 'ALL') return receivables;
    return receivables.filter(rec => rec.status === status);
  }, [receivables]);

  const getHighRiskReceivables = useCallback(() => {
    return receivables.filter(rec =>
      rec.aiPrediction.riskLevel === 'HIGH' ||
      rec.aiPrediction.riskLevel === 'CRITICAL'
    );
  }, [receivables]);

  const getReceivablesDueToday = useCallback(() => {
    return receivables.filter(rec => rec.status === 'DUE_TODAY');
  }, [receivables]);

  return {
    // Data
    creditRequests,
    creditLines,
    receivables,
    alerts,
    portfolioSummary,
    cashForecast,

    // Credit request functions
    approveCreditRequest,
    rejectCreditRequest,
    addCreditRequest,
    startReview,

    // Collection functions
    addCollectionAction,
    addReceivable,
    registerPayment,

    // Alert functions
    markAlertAsRead,
    dismissAlert,

    // Filters
    getCreditRequestsByStatus,
    getReceivablesByStatus,
    getHighRiskReceivables,
    getReceivablesDueToday,
  };
}
