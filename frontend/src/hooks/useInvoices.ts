// ============================================
// ANTU CRM - Invoices Hook
// Hook para manejar facturación electrónica
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  Invoice,
  PendingInvoice,
  InvoiceStats,
  InvoiceItem,
  InvoiceCustomer,
  InvoiceIssuer,
  DGIIResponse,
  InventoryMovement,
  ReceivableAccount,
  InvoiceStatus,
} from '@/types/invoice';

// Datos mock del emisor (ANTÜ Solutions)
const MOCK_ISSUER: InvoiceIssuer = {
  rnc: '101-12345-6',
  name: 'ANTÜ SOLUTIONS SRL',
  tradeName: 'ANTÜ CRM',
  address: 'Av. Winston Churchill #456, Torre Empresarial, Santo Domingo',
  phone: '(809) 555-0100',
  email: 'facturacion@antu.com',
  economicActivity: 'Desarrollo de software y servicios tecnológicos',
};

// Cliente mock
const MOCK_CUSTOMER: InvoiceCustomer = {
  id: '1',
  rnc: '101-12345-6',
  name: 'CORPORACIÓN DOMINICANA DE IMPRESIÓN SRL',
  tradeName: 'CORDOMIMP',
  address: 'Av. Winston Churchill #123, Piantini, Santo Domingo',
  phone: '(809) 555-0200',
  email: 'facturacion@cordomimp.com',
  contactName: 'Juan Pérez',
};

// Facturas pendientes mock
const MOCK_PENDING_INVOICES: PendingInvoice[] = [
  {
    id: 'pend-1',
    opportunityId: 'opp-42',
    opportunityNumber: 'OPP-2026-0042',
    customer: MOCK_CUSTOMER,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        code: 'IMP001',
        description: 'HP LaserJet Pro M428fdw',
        quantity: 2,
        unitPrice: 45000,
        discount: 0,
        subtotal: 90000,
        itbis: 16200,
        total: 106200,
        stockAvailable: 5,
        isService: false,
      },
      {
        id: 'item-2',
        productId: 'serv-1',
        code: 'SERV001',
        description: 'Instalación y configuración',
        quantity: 1,
        unitPrice: 5200,
        discount: 0,
        subtotal: 5200,
        itbis: 936,
        total: 6136,
        isService: true,
      },
    ],
    estimatedTotal: 112336,
    currency: 'DOP',
    createdAt: new Date('2026-02-15T10:30:00'),
    sellerName: 'María González',
  },
  {
    id: 'pend-2',
    opportunityId: 'opp-45',
    opportunityNumber: 'OPP-2026-0045',
    customer: {
      ...MOCK_CUSTOMER,
      id: '2',
      rnc: '101-67890-1',
      name: 'GRUPO FINANCIERO DEL CARIBE SRL',
      tradeName: 'GFC',
    },
    items: [
      {
        id: 'item-3',
        productId: 'prod-2',
        code: 'IMP002',
        description: 'Canon imageRUNNER C3226i',
        quantity: 1,
        unitPrice: 85000,
        discount: 5000,
        subtotal: 80000,
        itbis: 14400,
        total: 94400,
        stockAvailable: 3,
        isService: false,
      },
      {
        id: 'item-4',
        productId: 'serv-2',
        code: 'SERV002',
        description: 'Mantenimiento anual',
        quantity: 1,
        unitPrice: 25000,
        discount: 0,
        subtotal: 25000,
        itbis: 4500,
        total: 29500,
        isService: true,
      },
    ],
    estimatedTotal: 123900,
    currency: 'DOP',
    createdAt: new Date('2026-02-15T14:20:00'),
    sellerName: 'Carlos Rodríguez',
  },
  {
    id: 'pend-3',
    opportunityId: 'opp-48',
    opportunityNumber: 'OPP-2026-0048',
    customer: {
      ...MOCK_CUSTOMER,
      id: '3',
      rnc: '101-11111-2',
      name: 'INDUSTRIAS ABC SRL',
    },
    items: [
      {
        id: 'item-5',
        productId: 'prod-3',
        code: 'IMP003',
        description: 'Toner HP 26A Negro',
        quantity: 10,
        unitPrice: 1280,
        discount: 0,
        subtotal: 12800,
        itbis: 2304,
        total: 15104,
        stockAvailable: 50,
        isService: false,
      },
    ],
    estimatedTotal: 15104,
    currency: 'DOP',
    createdAt: new Date('2026-02-15T16:45:00'),
    sellerName: 'Ana Martínez',
  },
];

// Facturas emitidas mock
const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    number: 'FACT-2026-0038',
    eNCF: 'E310000000038',
    series: 'E',
    tipoECF: '31',
    opportunityId: 'opp-38',
    opportunityNumber: 'OPP-2026-0038',
    customerId: '4',
    customer: {
      ...MOCK_CUSTOMER,
      id: '4',
      rnc: '101-22222-3',
      name: 'TECNOLOGÍAS DEL FUTURO SRL',
    },
    issuer: MOCK_ISSUER,
    items: [
      {
        id: 'item-6',
        productId: 'prod-1',
        code: 'IMP001',
        description: 'HP LaserJet Pro M428fdw',
        quantity: 1,
        unitPrice: 45000,
        discount: 0,
        subtotal: 45000,
        itbis: 8100,
        total: 53100,
        isService: false,
      },
    ],
    taxes: [{ type: 'ITBIS', rate: 18, amount: 8100, base: 45000 }],
    subtotal: 45000,
    discount: 0,
    taxTotal: 8100,
    total: 53100,
    totalInWords: 'CINCUENTA Y TRES MIL CIEN PESOS DOMINICANOS',
    paymentMethod: 'CREDIT_30',
    paymentMethodName: 'Crédito 30 días',
    creditDays: 30,
    dueDate: new Date('2026-03-17'),
    currency: 'DOP',
    exchangeRate: 1,
    issueDate: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15T09:00:00'),
    sentAt: new Date('2026-02-15T09:05:00'),
    approvedAt: new Date('2026-02-15T09:06:30'),
    status: 'APPROVED',
    dgiiResponse: {
      trackId: 'RD-20260215-00123450',
      eNCF: 'E310000000038',
      status: 'APPROVED',
      qrCode: 'https://ecf.dgii.gov.do/qr?trackId=RD-20260215-00123450',
      authorizationDate: new Date('2026-02-15T09:06:30'),
    },
    sellerName: 'María González',
    mode: 'DGII_ECF',
    createdBy: 'admin',
    sentBy: 'admin',
  },
  {
    id: 'inv-2',
    number: 'FACT-2026-0039',
    eNCF: 'E310000000039',
    series: 'E',
    tipoECF: '31',
    opportunityId: 'opp-39',
    opportunityNumber: 'OPP-2026-0039',
    customerId: '5',
    customer: {
      ...MOCK_CUSTOMER,
      id: '5',
      rnc: '101-33333-4',
      name: 'CONSTRUCTORA DEL NORTE SRL',
    },
    issuer: MOCK_ISSUER,
    items: [
      {
        id: 'item-7',
        productId: 'prod-4',
        code: 'IMP004',
        description: 'Epson EcoTank L6190',
        quantity: 3,
        unitPrice: 28000,
        discount: 2000,
        subtotal: 82000,
        itbis: 14760,
        total: 96760,
        isService: false,
      },
    ],
    taxes: [{ type: 'ITBIS', rate: 18, amount: 14760, base: 82000 }],
    subtotal: 82000,
    discount: 2000,
    taxTotal: 14760,
    total: 96760,
    totalInWords: 'NOVENTA Y SEIS MIL SETECIENTOS SESENTA PESOS DOMINICANOS',
    paymentMethod: 'CASH',
    paymentMethodName: 'Contado',
    dueDate: new Date('2026-02-15'),
    currency: 'DOP',
    exchangeRate: 1,
    issueDate: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15T10:15:00'),
    sentAt: new Date('2026-02-15T10:20:00'),
    approvedAt: new Date('2026-02-15T10:21:45'),
    status: 'APPROVED',
    dgiiResponse: {
      trackId: 'RD-20260215-00123451',
      eNCF: 'E310000000039',
      status: 'APPROVED',
      qrCode: 'https://ecf.dgii.gov.do/qr?trackId=RD-20260215-00123451',
      authorizationDate: new Date('2026-02-15T10:21:45'),
    },
    sellerName: 'Carlos Rodríguez',
    mode: 'DGII_ECF',
    createdBy: 'admin',
    sentBy: 'admin',
  },
  {
    id: 'inv-3',
    number: 'FACT-2026-0040',
    opportunityId: 'opp-40',
    opportunityNumber: 'OPP-2026-0040',
    customerId: '6',
    customer: {
      ...MOCK_CUSTOMER,
      id: '6',
      rnc: '101-44444-5',
      name: 'FARMACIA CENTRAL SRL',
    },
    issuer: MOCK_ISSUER,
    items: [
      {
        id: 'item-8',
        productId: 'serv-3',
        code: 'SERV003',
        description: 'Soporte técnico mensual',
        quantity: 1,
        unitPrice: 15000,
        discount: 0,
        subtotal: 15000,
        itbis: 2700,
        total: 17700,
        isService: true,
      },
    ],
    taxes: [{ type: 'ITBIS', rate: 18, amount: 2700, base: 15000 }],
    subtotal: 15000,
    discount: 0,
    taxTotal: 2700,
    total: 17700,
    totalInWords: 'DIECISIETE MIL SETECIENTOS PESOS DOMINICANOS',
    paymentMethod: 'CREDIT_15',
    paymentMethodName: 'Crédito 15 días',
    creditDays: 15,
    dueDate: new Date('2026-03-02'),
    currency: 'DOP',
    exchangeRate: 1,
    issueDate: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15T11:30:00'),
    status: 'DRAFT',
    sellerName: 'Juan Pérez',
    mode: 'DGII_ECF',
    createdBy: 'admin',
  },
];

// Movimientos de inventario mock
const MOCK_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    invoiceId: 'inv-1',
    productId: 'prod-1',
    productName: 'HP LaserJet Pro M428fdw',
    quantity: 1,
    stockBefore: 8,
    stockAfter: 7,
    location: 'Almacén Principal - Estante A-12',
    lotNumber: 'LOT-2026-001',
    movementDate: new Date('2026-02-15T09:06:30'),
    type: 'SALE',
  },
  {
    id: 'mov-2',
    invoiceId: 'inv-2',
    productId: 'prod-4',
    productName: 'Epson EcoTank L6190',
    quantity: 3,
    stockBefore: 12,
    stockAfter: 9,
    location: 'Almacén Principal - Estante B-05',
    lotNumber: 'LOT-2026-002',
    movementDate: new Date('2026-02-15T10:21:45'),
    type: 'SALE',
  },
];

// Cuentas por cobrar mock
const MOCK_RECEIVABLES: ReceivableAccount[] = [
  {
    id: 'rec-1',
    invoiceId: 'inv-1',
    invoiceNumber: 'FACT-2026-0038',
    customerId: '4',
    customerName: 'TECNOLOGÍAS DEL FUTURO SRL',
    customerRNC: '101-22222-3',
    originalAmount: 53100,
    paidAmount: 0,
    pendingAmount: 53100,
    issueDate: new Date('2026-02-15'),
    dueDate: new Date('2026-03-17'),
    daysOverdue: 0,
    status: 'PENDING',
    paymentMethod: 'Crédito 30 días',
    assignedTo: 'María López',
    reminderCount: 0,
  },
  {
    id: 'rec-2',
    invoiceId: 'inv-2',
    invoiceNumber: 'FACT-2026-0039',
    customerId: '5',
    customerName: 'CONSTRUCTORA DEL NORTE SRL',
    customerRNC: '101-33333-4',
    originalAmount: 96760,
    paidAmount: 96760,
    pendingAmount: 0,
    issueDate: new Date('2026-02-15'),
    dueDate: new Date('2026-02-15'),
    daysOverdue: 0,
    status: 'PAID',
    paymentMethod: 'Contado',
    reminderCount: 0,
  },
];

export function useInvoices() {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>(MOCK_PENDING_INVOICES);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [inventoryMovements] = useState<InventoryMovement[]>(MOCK_INVENTORY_MOVEMENTS);
  const [receivables] = useState<ReceivableAccount[]>(MOCK_RECEIVABLES);
  const [loading, setLoading] = useState(false);

  // Estadísticas
  const stats = useMemo<InvoiceStats>(() => {
    const today = new Date().toDateString();
    const approvedToday = invoices.filter(
      (inv) => inv.status === 'APPROVED' && inv.approvedAt?.toDateString() === today
    ).length;
    const totalAmountToday = invoices
      .filter((inv) => inv.status === 'APPROVED' && inv.approvedAt?.toDateString() === today)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      pending: pendingInvoices.length,
      sentToDgii: invoices.filter((inv) => inv.status === 'SENT_TO_DGII').length,
      rejected: invoices.filter((inv) => inv.status === 'REJECTED').length,
      approvedToday,
      totalAmountToday,
    };
  }, [pendingInvoices, invoices]);

  // Crear factura pendiente desde oportunidad ganada
  const createPendingInvoiceFromOpportunity = useCallback((opportunity: any) => {
    const newPending: PendingInvoice = {
      id: `pend-${Date.now()}`,
      opportunityId: opportunity.id,
      opportunityNumber: opportunity.id,
      customer: {
        id: opportunity.customerId,
        rnc: 'N/A',
        name: opportunity.company || opportunity.customerName,
        tradeName: opportunity.company || opportunity.customerName,
        address: 'N/A',
        phone: opportunity.contactPhone || 'N/A',
        email: opportunity.contactEmail || '',
        contactName: opportunity.contactName || '',
      },
      items: (opportunity.products || []).length > 0 ? opportunity.products.map((p: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: p.id,
        code: p.sku || 'SRV01',
        description: p.nombre || p.descripcion,
        quantity: p.cantidad || 1,
        unitPrice: p.precioUnitario || p.totalLinea,
        discount: p.descuento || 0,
        subtotal: p.subtotal || p.totalLinea,
        itbis: p.itbis || 0,
        total: p.totalLinea,
        stockAvailable: 0,
        isService: false
      })) : [{
        id: `item-${Date.now()}-1`,
        productId: 'gen-1',
        code: 'GEN01',
        description: opportunity.name,
        quantity: 1,
        unitPrice: opportunity.value,
        discount: 0,
        subtotal: opportunity.value,
        itbis: opportunity.value * 0.18,
        total: opportunity.value * 1.18,
        stockAvailable: 0,
        isService: true
      }],
      estimatedTotal: opportunity.value,
      currency: 'DOP',
      createdAt: new Date(),
      sellerName: opportunity.assignedTo || 'Sistema',
    };

    setPendingInvoices((prev) => [newPending, ...prev]);
    return newPending;
  }, []);

  // Crear factura desde pendiente
  const createInvoiceFromPending = useCallback(
    (pendingId: string, invoiceData: Partial<Invoice>): Invoice => {
      const pending = pendingInvoices.find((p) => p.id === pendingId);
      if (!pending) throw new Error('Factura pendiente no encontrada');

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        number: `FACT-2026-${String(invoices.length + 38).padStart(4, '0')}`,
        opportunityId: pending.opportunityId,
        opportunityNumber: pending.opportunityNumber,
        customerId: pending.customer.id,
        customer: pending.customer,
        issuer: MOCK_ISSUER,
        items: pending.items,
        taxes: [{ type: 'ITBIS', rate: 18, amount: pending.items.reduce((sum, item) => sum + item.itbis, 0), base: pending.items.reduce((sum, item) => sum + item.subtotal, 0) }],
        subtotal: pending.items.reduce((sum, item) => sum + item.subtotal, 0),
        discount: 0,
        taxTotal: pending.items.reduce((sum, item) => sum + item.itbis, 0),
        total: pending.items.reduce((sum, item) => sum + item.total, 0),
        totalInWords: '', // Se generaría automáticamente
        paymentMethod: invoiceData.paymentMethod || 'CASH',
        paymentMethodName: invoiceData.paymentMethodName || 'Contado',
        dueDate: invoiceData.dueDate || new Date(),
        currency: pending.currency,
        exchangeRate: 1,
        issueDate: new Date(),
        createdAt: new Date(),
        status: 'DRAFT',
        sellerName: pending.sellerName,
        mode: 'DGII_ECF',
        createdBy: 'admin',
        ...invoiceData,
      };

      setInvoices((prev) => [...prev, newInvoice]);
      setPendingInvoices((prev) => prev.filter((p) => p.id !== pendingId));

      toast.success('Factura creada exitosamente');
      return newInvoice;
    },
    [pendingInvoices, invoices.length]
  );

  // Enviar a DGII
  const sendToDGII = useCallback(
    async (invoiceId: string): Promise<DGIIResponse> => {
      setLoading(true);

      // Simular llamada a DGII
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResponse: DGIIResponse = {
        trackId: `RD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        eNCF: `E310000000${String(invoices.length + 38).padStart(3, '0')}`,
        status: 'APPROVED',
        qrCode: `https://ecf.dgii.gov.do/qr?trackId=RD-${Date.now()}`,
        authorizationDate: new Date(),
      };

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
              ...inv,
              status: 'APPROVED',
              eNCF: mockResponse.eNCF,
              dgiiResponse: mockResponse,
              sentAt: new Date(),
              approvedAt: new Date(),
            }
            : inv
        )
      );

      setLoading(false);
      toast.success('Factura aprobada por DGII');
      return mockResponse;
    },
    [invoices.length]
  );

  // Anular factura
  const cancelInvoice = useCallback(
    (invoiceId: string, reason: string) => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
              ...inv,
              status: 'CANCELLED',
              internalNotes: `${inv.internalNotes || ''}\nANULADA: ${reason}`,
            }
            : inv
        )
      );
      toast.success('Factura anulada exitosamente');
    },
    []
  );

  // Obtener facturas por estado
  const getInvoicesByStatus = useCallback(
    (status: InvoiceStatus) => {
      return invoices.filter((inv) => inv.status === status);
    },
    [invoices]
  );

  // Obtener movimientos de inventario por factura
  const getInventoryMovementsByInvoice = useCallback(
    (invoiceId: string) => {
      return inventoryMovements.filter((mov) => mov.invoiceId === invoiceId);
    },
    [inventoryMovements]
  );

  // Obtener cuenta por cobrar por factura
  const getReceivableByInvoice = useCallback(
    (invoiceId: string) => {
      return receivables.find((rec) => rec.invoiceId === invoiceId);
    },
    [receivables]
  );

  // Calcular totales
  const calculateTotals = useCallback((items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.itbis, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return { subtotal, discount, taxTotal, total };
  }, []);

  // Formatear número a palabras (simplificado)
  const numberToWords = useCallback((amount: number): string => {
    // Implementación simplificada - en producción usaría una librería
    return `${amount.toLocaleString('es-DO')} PESOS DOMINICANOS`;
  }, []);

  return {
    pendingInvoices,
    invoices,
    inventoryMovements,
    receivables,
    stats,
    loading,
    createPendingInvoiceFromOpportunity,
    createInvoiceFromPending,
    sendToDGII,
    cancelInvoice,
    getInvoicesByStatus,
    getInventoryMovementsByInvoice,
    getReceivableByInvoice,
    calculateTotals,
    numberToWords,
  };
}

export default useInvoices;
