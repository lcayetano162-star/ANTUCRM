// ============================================
// ANTU CRM - Invoice Form
// Formulario de emisión de factura electrónica
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  User, 
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';
import type { PendingInvoice, PaymentMethod, ECFTipo } from '@/types/invoice';

interface InvoiceFormProps {
  pendingInvoice: PendingInvoice;
  onSubmit: (data: {
    paymentMethod: PaymentMethod;
    paymentMethodName: string;
    dueDate: Date;
    tipoECF: ECFTipo;
    purchaseOrderNumber?: string;
    internalNotes?: string;
  }) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
}

const paymentMethods: { value: PaymentMethod; label: string; days?: number }[] = [
  { value: 'CASH', label: 'Contado', days: 0 },
  { value: 'CREDIT_15', label: 'Crédito 15 días', days: 15 },
  { value: 'CREDIT_30', label: 'Crédito 30 días', days: 30 },
  { value: 'CREDIT_60', label: 'Crédito 60 días', days: 60 },
  { value: 'CREDIT_90', label: 'Crédito 90 días', days: 90 },
];

const ecfTipos: { value: ECFTipo; label: string; description: string }[] = [
  { value: '31', label: 'Factura de Crédito Fiscal', description: 'Para empresas con RNC' },
  { value: '32', label: 'Factura de Consumo', description: 'Para personas naturales' },
  { value: '33', label: 'Nota de Débito', description: 'Aumento de valor' },
  { value: '34', label: 'Nota de Crédito', description: 'Disminución de valor' },
  { value: '41', label: 'Comprobante de Compra', description: 'Para gastos menores' },
  { value: '47', label: 'Factura de Exportación', description: 'Ventas al exterior' },
];

export function InvoiceForm({ 
  pendingInvoice, 
  onSubmit, 
  onCancel, 
  onSaveDraft 
}: InvoiceFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tipoECF, setTipoECF] = useState<ECFTipo>('31');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Calcular totales
  const totals = useMemo(() => {
    const subtotal = pendingInvoice.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = pendingInvoice.items.reduce((sum, item) => sum + item.discount, 0);
    const itbis = pendingInvoice.items.reduce((sum, item) => sum + item.itbis, 0);
    const total = pendingInvoice.items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, discount, itbis, total };
  }, [pendingInvoice.items]);

  // Calcular fecha de vencimiento
  const dueDate = useMemo(() => {
    const days = paymentMethods.find(pm => pm.value === paymentMethod)?.days || 0;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }, [paymentMethod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: pendingInvoice.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = () => {
    const selectedMethod = paymentMethods.find(pm => pm.value === paymentMethod);
    onSubmit({
      paymentMethod,
      paymentMethodName: selectedMethod?.label || 'Contado',
      dueDate,
      tipoECF,
      purchaseOrderNumber: purchaseOrderNumber || undefined,
      internalNotes: internalNotes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Emitir Factura</h1>
            <p className="text-sm text-slate-500">
              Oportunidad {pendingInvoice.opportunityNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            Guardar Borrador
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Pre-visualizar
          </Button>
        </div>
      </div>

      {/* Emisor y Receptor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4" />
              Datos del Emisor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-slate-800">ANTÜ SOLUTIONS SRL</p>
            <p className="text-sm text-slate-500">RNC: 101-12345-6</p>
            <p className="text-sm text-slate-500">
              Av. Winston Churchill #456, Torre Empresarial, Santo Domingo
            </p>
            <p className="text-sm text-slate-500">(809) 555-0100</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Datos del Receptor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-slate-800">{pendingInvoice.customer.name}</p>
            <p className="text-sm text-slate-500">RNC: {pendingInvoice.customer.rnc}</p>
            <p className="text-sm text-slate-500">{pendingInvoice.customer.address}</p>
            <p className="text-sm text-slate-500">
              Contacto: {pendingInvoice.customer.contactName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tipo de Comprobante */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tipo de Comprobante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ecfTipos.map((tipo) => (
              <label
                key={tipo.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  tipoECF === tipo.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name="tipoECF"
                  value={tipo.value}
                  checked={tipoECF === tipo.value}
                  onChange={() => setTipoECF(tipo.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    tipoECF === tipo.value ? 'border-indigo-500' : 'border-slate-300'
                  }`}>
                    {tipoECF === tipo.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{tipo.label}</p>
                    <p className="text-xs text-slate-500">{tipo.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condiciones de Pago */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Condiciones de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Emisión</Label>
              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{dueDate.toLocaleDateString('es-DO')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4" />
            Items a Facturar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
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
                {pendingInvoice.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-3 px-4 text-sm font-mono">{item.code}</td>
                    <td className="py-3 px-4 text-sm">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.itbis)}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validación de inventario */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Validación de Inventario</span>
            </div>
            <div className="space-y-1">
              {pendingInvoice.items.filter(item => !item.isService).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="text-emerald-600">
                    Stock disponible: {item.stockAvailable} unidades ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-6">
          <div className="flex justify-end">
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Descuento</span>
                <span className="font-medium">{formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">ITBIS (18%)</span>
                <span className="font-medium">{formatCurrency(totals.itbis)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">TOTAL A PAGAR</span>
                  <span className="text-xl font-bold text-slate-800">{formatCurrency(totals.total)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  En letras: {totals.total.toLocaleString('es-DO')} PESOS DOMINICANOS
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Observaciones y Referencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Número de Orden de Compra del Cliente</Label>
            <Input 
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              placeholder="Ej: OC-2026-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Comentarios Internos</Label>
            <Textarea 
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas internas sobre esta factura..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>Vendedor responsable: {pendingInvoice.sellerName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerta DGII */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Validación DGII</p>
          <p className="text-sm text-amber-700">
            Al emitir esta factura, se enviará automáticamente a la DGII para validación.
            El proceso puede tomar hasta 30 segundos. Asegúrese de que todos los datos sean correctos.
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSaveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            Guardar Borrador
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Send className="w-4 h-4" />
            Emitir Factura Electrónica
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceForm;
