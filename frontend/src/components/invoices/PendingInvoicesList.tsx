// ============================================
// ANTU CRM - Pending Invoices List
// Lista de facturas pendientes desde oportunidades
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  User, 
  DollarSign, 
  Package, 
  ArrowRight,
  Calendar,
  FileOutput,
  Clock,
  CheckCircle2
} from 'lucide-react';
import type { PendingInvoice } from '@/types/invoice';

interface PendingInvoicesListProps {
  invoices: PendingInvoice[];
  onInvoice: (id: string) => void;
  onBulkInvoice?: (ids: string[]) => void;
}

export function PendingInvoicesList({ 
  invoices, 
  onInvoice,
  onBulkInvoice 
}: PendingInvoicesListProps) {
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
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
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No hay facturas pendientes
          </h3>
          <p className="text-slate-500">
            Todas las oportunidades ganadas han sido facturadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            Facturas Pendientes
            <Badge variant="secondary" className="ml-2">{invoices.length}</Badge>
          </CardTitle>
          {invoices.length > 1 && onBulkInvoice && (
            <Button variant="outline" size="sm" className="gap-2">
              <FileOutput className="w-4 h-4" />
              Facturación Masiva
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Oportunidades ganadas pendientes de facturación
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id} 
            className="p-4 border rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="text-xs font-mono">
                    {invoice.opportunityNumber}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(invoice.createdAt)}
                  </span>
                </div>

                {/* Cliente */}
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{invoice.customer.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    RNC: {invoice.customer.rnc}
                  </Badge>
                </div>

                {/* Items */}
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm text-slate-500">
                    {invoice.items.map(item => item.description).join(', ').substring(0, 60)}
                    {invoice.items.map(item => item.description).join(', ').length > 60 && '...'}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(invoice.estimatedTotal, invoice.currency)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Vendedor: {invoice.sellerName}
                  </span>
                </div>
              </div>

              {/* Acción */}
              <Button 
                onClick={() => onInvoice(invoice.id)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText className="w-4 h-4" />
                Facturar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PendingInvoicesList;
