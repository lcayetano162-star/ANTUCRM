// ============================================
// ANTU CRM - Invoice Detail
// Detalle de factura con integraciones
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Building2,
  User,
  Package,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Download,
  Mail,
  RotateCcw,
  Warehouse,
  CreditCard,
  Printer
} from 'lucide-react';
import type { Invoice, InventoryMovement, ReceivableAccount } from '@/types/invoice';

interface InvoiceDetailProps {
  invoice: Invoice;
  inventoryMovements: InventoryMovement[];
  receivable?: ReceivableAccount;
  onDownload: () => void;
  onResend: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-600' },
  SENT_TO_DGII: { label: 'Enviada a DGII', color: 'bg-blue-100 text-blue-600' },
  APPROVED: { label: 'Aprobada por DGII', color: 'bg-emerald-100 text-emerald-600' },
  REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-600' },
  CANCELLED: { label: 'Anulada', color: 'bg-gray-100 text-gray-600' },
};

export function InvoiceDetail({
  invoice,
  inventoryMovements,
  receivable,
  onDownload,
  onResend,
  onCancel,
  onPrint
}: InvoiceDetailProps) {
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const status = statusConfig[invoice.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{invoice.number}</h1>
            <div className="flex items-center gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              {invoice.eNCF && (
                <Badge variant="outline" className="font-mono text-xs">
                  e-NCF: {invoice.eNCF}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          {onPrint && (
            <Button variant="outline" onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          )}
          <Button variant="outline" onClick={onDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" onClick={onResend} className="gap-2">
            <Mail className="w-4 h-4" />
            Reenviar
          </Button>
          {invoice.status === 'APPROVED' && onCancel && (
            <Button variant="destructive" onClick={onCancel} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Anular
            </Button>
          )}
        </div>
      </div>

      {/* Info DGII */}
      {invoice.dgiiResponse && (
        <Card className="border-emerald-200 bg-emerald-50 print:border-none print:shadow-none print:bg-transparent print:p-0">
          <CardContent className="p-4 print:p-0 print:py-4 border-b print:border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                <QrCode className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">
                    Factura Aprobada por DGII
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-emerald-600">Track ID</p>
                    <p className="text-sm font-mono text-emerald-800">{invoice.dgiiResponse.trackId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">e-NCF</p>
                    <p className="text-sm font-mono text-emerald-800">{invoice.dgiiResponse.eNCF}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">Fecha de Autorización</p>
                    <p className="text-sm text-emerald-800">
                      {formatDate(invoice.dgiiResponse.authorizationDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoice" className="space-y-6 print:space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1 print:hidden">
          <TabsTrigger value="invoice" className="gap-2">
            <FileText className="w-4 h-4" />
            Factura
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Warehouse className="w-4 h-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="receivable" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Cuenta por Cobrar
          </TabsTrigger>
        </TabsList>

        {/* Tab: Factura */}
        <TabsContent value="invoice" className="space-y-6 relative print:bg-transparent pb-10 print:pb-0 print:m-0 print:space-y-4">

          {/* Plantilla de Fondo de Factura para Imprimir */}
          <div className="absolute inset-0 pointer-events-none hidden print:block z-0" style={{
            minHeight: "100%",
            width: "100%",
            left: 0,
            top: 0,
            opacity: 0.8
          }}>
            <img src="/assets/images/invoice-bg.svg" alt="" className="w-full h-full object-cover" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:pt-40">
              {/* Emisor */}
              <Card className="border-slate-200 print:border-none print:shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4" />
                    Emisor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-slate-800">{invoice.issuer.name}</p>
                  <p className="text-sm text-slate-500">RNC: {invoice.issuer.rnc}</p>
                  <p className="text-sm text-slate-500">{invoice.issuer.address}</p>
                  <p className="text-sm text-slate-500">{invoice.issuer.phone}</p>
                </CardContent>
              </Card>

              {/* Receptor */}
              <Card className="border-slate-200 print:border-none print:shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    Receptor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-slate-800">{invoice.customer.name}</p>
                  <p className="text-sm text-slate-500">RNC: {invoice.customer.rnc}</p>
                  <p className="text-sm text-slate-500">{invoice.customer.address}</p>
                  {invoice.customer.contactName && (
                    <p className="text-sm text-slate-500">Contacto: {invoice.customer.contactName}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items */}
            <Card className="border-slate-200 print:border-none print:shadow-none">
              <CardHeader className="pb-3 print:hidden">
                <CardTitle className="text-sm">Items Facturados</CardTitle>
              </CardHeader>
              <CardContent className="print:p-0">
                <div className="border rounded-lg overflow-hidden print:border-none print:rounded-none">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Código</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Descripción</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Cant.</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Precio</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">ITBIS</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="py-3 px-4 text-sm font-mono">{item.code}</td>
                          <td className="py-3 px-4 text-sm">{item.description}</td>
                          <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            {formatCurrency(item.unitPrice, invoice.currency)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {formatCurrency(item.itbis, invoice.currency)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {formatCurrency(item.total, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="mt-8 flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Descuento</span>
                      <span className="font-medium">{formatCurrency(invoice.discount, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">ITBIS (18%)</span>
                      <span className="font-medium">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-800">TOTAL</span>
                        <span className="text-xl font-bold text-slate-800">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sello de ANTÜ CRM (opcional, visible solo impresión) */}
            <div className="hidden print:flex justify-end mt-10">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">Copia Autorizada</p>
                <div className="w-32 h-[1px] bg-slate-300 my-2 ml-auto"></div>
                <p className="text-xs text-slate-500">Emitido vía ANTÜ CRM</p>
              </div>
            </div>
          </div>

          {/* Footer en la impresión */}
          <div className="hidden print:block absolute bottom-[20px] left-0 w-[794px] text-center text-xs text-slate-400">
            <p className="px-10">Este documento es una representación impresa de un Comprobante Fiscal Electrónico (e-CF).</p>
            <p>Gracias por preferir a ANTÜ SOLUTIONS SRL.</p>
          </div>
        </TabsContent>

        {/* Tab: Inventario */}
        <TabsContent value="inventory" className="space-y-6 print:hidden">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4" />
                Movimientos de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryMovements.length > 0 ? (
                <div className="space-y-4">
                  {inventoryMovements.map((mov) => (
                    <div key={mov.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-slate-500" />
                          <span className="font-medium text-slate-700">{mov.productName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {mov.type === 'SALE' && 'Venta'}
                          {mov.type === 'RETURN' && 'Devolución'}
                          {mov.type === 'ADJUSTMENT' && 'Ajuste'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Stock Anterior</p>
                          <p className="font-medium">{mov.stockBefore} unidades</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Cantidad</p>
                          <p className="font-medium text-red-600">- {mov.quantity} unidades</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Stock Actual</p>
                          <p className="font-medium text-emerald-600">{mov.stockAfter} unidades</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        <p>Ubicación: {mov.location}</p>
                        {mov.lotNumber && <p>Lote: {mov.lotNumber}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay movimientos de inventario registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cuenta por Cobrar */}
        <TabsContent value="receivable" className="space-y-6 print:hidden">
          {receivable ? (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Cuenta por Cobrar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">Monto Original</p>
                    <p className="text-lg font-bold text-slate-700">
                      {formatCurrency(receivable.originalAmount, invoice.currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600">Pagado</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {formatCurrency(receivable.paidAmount, invoice.currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600">Pendiente</p>
                    <p className="text-lg font-bold text-amber-700">
                      {formatCurrency(receivable.pendingAmount, invoice.currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">Estado</p>
                    <Badge
                      variant={receivable.status === 'PAID' ? 'default' : receivable.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                    >
                      {receivable.status === 'PENDING' && 'Pendiente'}
                      {receivable.status === 'PARTIAL' && 'Parcial'}
                      {receivable.status === 'PAID' && 'Pagado'}
                      {receivable.status === 'OVERDUE' && 'Vencido'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha de Emisión</p>
                    <p className="font-medium">{formatDate(receivable.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha de Vencimiento</p>
                    <p className="font-medium">{formatDate(receivable.dueDate)}</p>
                  </div>
                </div>

                {receivable.status !== 'PAID' && (
                  <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-indigo-700">
                      Ir a <strong>Cuentas por Cobrar</strong> para gestionar cobros y registrar pagos
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No se ha generado cuenta por cobrar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InvoiceDetail;
