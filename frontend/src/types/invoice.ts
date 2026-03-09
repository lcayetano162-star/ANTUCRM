// ============================================
// ANTU CRM - Invoice Types
// Tipos para facturación electrónica e-CF DGII y estándar
// ============================================

export type InvoiceMode = 'DGII_ECF' | 'STANDARD' | 'CFDI' | 'DIAN';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'SENT_TO_DGII' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ECFTipo = '31' | '32' | '33' | '34' | '41' | '43' | '44' | '45' | '46' | '47';
export type PaymentMethod = 'CASH' | 'CREDIT_15' | 'CREDIT_30' | 'CREDIT_60' | 'CREDIT_90';

export interface InvoiceItem {
  id: string;
  productId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  itbis: number;
  total: number;
  stockAvailable?: number;
  isService: boolean;
  serialNumber?: string;
}

export interface InvoiceTax {
  type: 'ITBIS' | 'ISC' | 'CDT' | 'PROPINA' | 'OTRO';
  rate: number;
  amount: number;
  base: number;
}

export interface InvoiceCustomer {
  id: string;
  rnc: string;
  name: string;
  tradeName?: string;
  address: string;
  phone?: string;
  email?: string;
  contactName?: string;
}

export interface InvoiceIssuer {
  rnc: string;
  name: string;
  tradeName: string;
  address: string;
  phone: string;
  email: string;
  economicActivity: string;
}

export interface DGIIResponse {
  trackId: string;
  eNCF: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  message?: string;
  errorCode?: string;
  qrCode?: string;
  authorizationDate?: Date;
}

export interface Invoice {
  id: string;
  number: string;
  eNCF?: string;
  series?: string;
  tipoECF?: ECFTipo;
  
  // Relaciones
  opportunityId: string;
  opportunityNumber: string;
  customerId: string;
  customer: InvoiceCustomer;
  issuer: InvoiceIssuer;
  
  // Items y totales
  items: InvoiceItem[];
  taxes: InvoiceTax[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  total: number;
  totalInWords: string;
  
  // Condiciones
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  creditDays?: number;
  dueDate: Date;
  currency: string;
  exchangeRate: number;
  
  // Fechas
  issueDate: Date;
  createdAt: Date;
  sentAt?: Date;
  approvedAt?: Date;
  
  // Estado DGII
  status: InvoiceStatus;
  dgiiResponse?: DGIIResponse;
  
  // Referencias
  purchaseOrderNumber?: string;
  internalNotes?: string;
  sellerName: string;
  
  // Modo de facturación
  mode: InvoiceMode;
  
  // Tracking
  createdBy: string;
  sentBy?: string;
}

export interface PendingInvoice {
  id: string;
  opportunityId: string;
  opportunityNumber: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  estimatedTotal: number;
  currency: string;
  createdAt: Date;
  sellerName: string;
  notes?: string;
}

export interface InvoiceStats {
  pending: number;
  sentToDgii: number;
  approvedToday: number;
  rejected: number;
  totalAmountToday: number;
}

export interface InventoryMovement {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  location: string;
  lotNumber?: string;
  movementDate: Date;
  type: 'SALE' | 'RETURN' | 'ADJUSTMENT';
}

export interface ReceivableAccount {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerRNC: string;
  originalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  issueDate: Date;
  dueDate: Date;
  daysOverdue: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  paymentMethod: string;
  assignedTo?: string;
  lastReminderDate?: Date;
  reminderCount: number;
}

export interface InvoiceFilter {
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  sellerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  headerHtml: string;
  footerHtml: string;
  cssStyles: string;
  logoUrl?: string;
  primaryColor: string;
}
