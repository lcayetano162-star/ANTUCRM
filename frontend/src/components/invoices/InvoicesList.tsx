// ============================================
// ANTU CRM - Invoices List
// Lista de facturas emitidas
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Download,
  Eye,
  RotateCcw,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Mail,
  Printer
} from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

interface InvoicesListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onResend: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: FileText },
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-600', icon: Clock },
  SENT_TO_DGII: { label: 'Enviada a DGII', color: 'bg-blue-100 text-blue-600', icon: Send },
  APPROVED: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-600', icon: XCircle },
  CANCELLED: { label: 'Anulada', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export function InvoicesList({
  invoices,
  onView,
  onDownload,
  onResend,
  onCancel,
  onPrint
}: InvoicesListProps) {
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
      month: 'short',
      year: 'numeric',
    });
  };

  if (invoices.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No hay facturas
          </h3>
          <p className="text-slate-500">
            Las facturas emitidas aparecerán aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">Facturas Emitidas</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar factura..." className="pl-9 w-48" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Factura</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;

                return (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-slate-800">{invoice.number}</p>
                        {invoice.eNCF && (
                          <p className="text-xs text-slate-500 font-mono">e-NCF: {invoice.eNCF}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{invoice.customer.name}</p>
                        <p className="text-xs text-slate-500">RNC: {invoice.customer.rnc}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm text-slate-600">
                        <p>Emisión: {formatDate(invoice.issueDate)}</p>
                        {invoice.dueDate && invoice.paymentMethod !== 'CASH' && (
                          <p className="text-xs text-slate-400">Vence: {formatDate(invoice.dueDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      <p className="text-xs text-slate-500">
                        ITBIS: {formatCurrency(invoice.taxTotal, invoice.currency)}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge className={`${status.color} gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                      {invoice.dgiiResponse?.qrCode && (
                        <div className="mt-1">
                          <QrCode className="w-4 h-4 text-slate-400 mx-auto" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(invoice)}
                          className="h-8 w-8 p-0"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {onPrint && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrint(invoice)}
                            className="h-8 w-8 p-0"
                            title="Imprimir"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(invoice)}
                          className="h-8 w-8 p-0"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResend(invoice)}
                          className="h-8 w-8 p-0"
                          title="Reenviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'APPROVED' && onCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancel(invoice)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Anular"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvoicesList;
