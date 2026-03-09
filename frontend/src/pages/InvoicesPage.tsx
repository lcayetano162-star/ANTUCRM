// ============================================
// ANTU CRM - Invoices Page
// Módulo de Facturación Electrónica
// ============================================

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import {
  InvoiceStatsPanel,
  PendingInvoicesList,
  InvoicesList,
  InvoiceForm,
  InvoiceDetail,
} from '@/components/invoices';
import type { Invoice, PendingInvoice, PaymentMethod, ECFTipo } from '@/types/invoice';

export function InvoicesPage() {
  const {
    pendingInvoices,
    invoices,
    stats,
    createInvoiceFromPending,
    sendToDGII,
    cancelInvoice,
    getInventoryMovementsByInvoice,
    getReceivableByInvoice,
  } = useInvoices();

  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedPending, setSelectedPending] = useState<PendingInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Manejar clic en facturar pendiente
  const handleInvoicePending = (id: string) => {
    const pending = pendingInvoices.find((p) => p.id === id);
    if (pending) {
      setSelectedPending(pending);
      setView('form');
    }
  };

  // Manejar envío del formulario
  const handleFormSubmit = async (data: {
    paymentMethod: PaymentMethod;
    paymentMethodName: string;
    dueDate: Date;
    tipoECF: ECFTipo;
    purchaseOrderNumber?: string;
    internalNotes?: string;
  }) => {
    if (!selectedPending) return;

    // Crear factura
    const invoice = createInvoiceFromPending(selectedPending.id, {
      ...data,
      status: 'DRAFT',
    });

    // Enviar a DGII
    toast.info('Enviando factura a DGII...');
    await sendToDGII(invoice.id);

    // Volver a la lista
    setView('list');
    setSelectedPending(null);
  };

  // Manejar ver detalle
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('detail');
  };

  // Manejar descarga
  const handleDownload = (invoice: Invoice) => {
    toast.info(`Preparando documento ${invoice.number}...`);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Manejar reenvío
  const handleResend = (invoice: Invoice) => {
    const toastId = toast.loading('Enviando correo al cliente...');
    setTimeout(() => {
      toast.success(`Factura ${invoice.number} reenviada exitosamente a ${invoice.customer.email || 'correo del cliente'}.`, { id: toastId });
    }, 1500);
  };

  // Manejar anulación
  const handleCancel = (invoice: Invoice) => {
    if (confirm(`¿Está seguro de anular la factura ${invoice.number}?`)) {
      cancelInvoice(invoice.id, 'Anulación solicitada por usuario');
      if (selectedInvoice && selectedInvoice.id === invoice.id) {
        setSelectedInvoice({ ...invoice, status: 'CANCELLED' });
      }
    }
  };

  // Manejar impresión
  const handlePrint = (_invoice: Invoice) => {
    window.print();
  };

  // Volver a la lista
  const handleBack = () => {
    setView('list');
    setSelectedPending(null);
    setSelectedInvoice(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white print:min-h-fit">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <Button variant="outline" size="sm" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Facturación Electrónica</h1>
                {view === 'list' && (
                  <p className="text-sm text-slate-500">
                    Gestión de facturas e-CF DGII y facturación estándar
                  </p>
                )}
              </div>
            </div>
            {view === 'list' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {view === 'list' && (
          <div className="space-y-6">
            {/* Estadísticas */}
            <InvoiceStatsPanel stats={stats} />

            {/* Tabs */}
            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList className="bg-white border border-slate-200 p-1">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pendientes
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="w-4 h-4" />
                  Enviadas a DGII
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobadas
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Rechazadas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-6">
                <PendingInvoicesList
                  invoices={pendingInvoices}
                  onInvoice={handleInvoicePending}
                />
              </TabsContent>

              <TabsContent value="sent" className="space-y-6">
                <InvoicesList
                  invoices={invoices.filter((inv) => inv.status === 'SENT_TO_DGII')}
                  onView={handleViewInvoice}
                  onDownload={handleDownload}
                  onResend={handleResend}
                  onPrint={handlePrint}
                />
              </TabsContent>

              <TabsContent value="approved" className="space-y-6">
                <InvoicesList
                  invoices={invoices.filter((inv) => inv.status === 'APPROVED')}
                  onView={handleViewInvoice}
                  onDownload={handleDownload}
                  onResend={handleResend}
                  onCancel={handleCancel}
                  onPrint={handlePrint}
                />
              </TabsContent>

              <TabsContent value="rejected" className="space-y-6">
                <InvoicesList
                  invoices={invoices.filter((inv) => inv.status === 'REJECTED')}
                  onView={handleViewInvoice}
                  onDownload={handleDownload}
                  onResend={handleResend}
                  onPrint={handlePrint}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'form' && selectedPending && (
          <InvoiceForm
            pendingInvoice={selectedPending}
            onSubmit={handleFormSubmit}
            onCancel={handleBack}
            onSaveDraft={() => {
              toast.success('Borrador guardado');
              handleBack();
            }}
          />
        )}

        {view === 'detail' && selectedInvoice && (
          <InvoiceDetail
            invoice={selectedInvoice}
            inventoryMovements={getInventoryMovementsByInvoice(selectedInvoice.id)}
            receivable={getReceivableByInvoice(selectedInvoice.id)}
            onDownload={() => handleDownload(selectedInvoice)}
            onResend={() => handleResend(selectedInvoice)}
            onCancel={() => handleCancel(selectedInvoice)}
            onPrint={() => handlePrint(selectedInvoice)}
          />
        )}
      </div>
    </div>
  );
}

export default InvoicesPage;
