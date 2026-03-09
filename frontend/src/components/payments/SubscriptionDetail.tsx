import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, CreditCard, FileText, 
  Play, Pause, Ban, Tag, MessageSquare,
  RefreshCw, Edit
} from 'lucide-react';
import type { Subscription, PaymentRecord } from '@/types/payments';

interface SubscriptionDetailProps {
  subscription: Subscription;
  onBack: () => void;
  onChargeNow: (subscriptionId: string) => void;
  onCancel: (subscriptionId: string) => void;
}

export function SubscriptionDetail({ subscription, onBack, onChargeNow, onCancel }: SubscriptionDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState(subscription.internalNotes || '');

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      TRIAL: { bg: 'bg-blue-100', text: 'text-blue-700' },
      PAST_DUE: { bg: 'bg-amber-100', text: 'text-amber-700' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700' },
      CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700' },
    };
    const config = configs[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
    return <Badge className={`${config.bg} ${config.text}`}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700">✅ Pagado</Badge>;
      case 'FAILED':
      case 'DECLINED':
        return <Badge className="bg-red-100 text-red-700">❌ Fallido</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700">⏳ Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{subscription.tenantName}</h2>
            <p className="text-sm text-slate-500">{subscription.tenantAdminEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(subscription.status)}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="history">Historial de Cobros</TabsTrigger>
          <TabsTrigger value="actions">Acciones</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan actual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{subscription.planName}</p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(subscription.planPrice, subscription.planCurrency)}/mes
                    </p>
                  </div>
                  <Badge variant="outline">{subscription.billingCycle}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Inicio</Label>
                    <p>{subscription.startDate}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Próxima renovación</Label>
                    <p>{subscription.nextBillingDate}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Período actual</Label>
                    <p>{subscription.currentPeriodStart} - {subscription.currentPeriodEnd}</p>
                  </div>
                  {subscription.trialEndDate && (
                    <div>
                      <Label className="text-slate-500">Fin de trial</Label>
                      <p>{subscription.trialEndDate}</p>
                    </div>
                  )}
                </div>

                {subscription.discount && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-900 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Descuento activo
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {subscription.discount.type === 'PERCENTAGE' 
                        ? `${subscription.discount.value}%` 
                        : formatCurrency(subscription.discount.value, subscription.planCurrency)}
                      {' '}- {subscription.discount.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Método de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription.status === 'TRIAL' ? (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-900 font-medium">No hay método de pago</p>
                    <p className="text-sm text-amber-700 mt-1">
                      El cliente debe agregar un método antes de que termine el trial.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Enviar recordatorio
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
                          {subscription.paymentMethod.cardBrand?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            **** {subscription.paymentMethod.cardLast4}
                          </p>
                          <p className="text-sm text-slate-500">
                            Exp: {subscription.paymentMethod.cardExpiryMonth}/{subscription.paymentMethod.cardExpiryYear}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Titular: {subscription.paymentMethod.cardHolderName}
                      </p>
                      {!subscription.paymentMethod.isValid && (
                        <Badge variant="destructive" className="mt-2">
                          Tarjeta inválida o expirada
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Actualizar tarjeta
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar alternativo
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notas internas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Agregar notas sobre esta suscripción..."
                rows={3}
              />
              <Button variant="outline" size="sm" className="mt-2">
                <Save className="h-4 w-4 mr-1" />
                Guardar nota
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Cobros</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No hay pagos registrados</p>
                  {subscription.status === 'TRIAL' && (
                    <p className="text-sm">La suscripción está en período de prueba</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {subscription.paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4 rounded-lg border hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(payment.status)}
                          <span className="font-medium">{payment.invoiceNumber}</span>
                        </div>
                        <span className="text-sm text-slate-500">{payment.billingDate}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Monto</p>
                          <p className="font-medium">{formatCurrency(payment.totalAmount, payment.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Base</p>
                          <p>{formatCurrency(payment.amount, payment.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">ITBIS</p>
                          <p>{formatCurrency(payment.taxAmount, payment.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Método</p>
                          <p>{payment.paymentMethod.brand} ****{payment.paymentMethod.last4}</p>
                        </div>
                      </div>

                      {payment.fiscalInvoice && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span>e-CF: {payment.fiscalInvoice.number}</span>
                          <Button variant="link" size="sm" className="h-auto p-0">
                            Ver XML
                          </Button>
                          <Button variant="link" size="sm" className="h-auto p-0">
                            Ver PDF
                          </Button>
                        </div>
                      )}

                      {payment.status === 'FAILED' && payment.failureReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          Motivo: {payment.failureReason}
                          {payment.retryCount > 0 && (
                            <span className="ml-2">({payment.retryCount} reintentos)</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Actions */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => onChargeNow(subscription.id)}
                  disabled={subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED'}
                >
                  <Play className="h-6 w-6" />
                  <span>Cobrar ahora</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Enviar factura manual</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6" />
                  <span>Cambiar plan</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Tag className="h-6 w-6" />
                  <span>Aplicar descuento</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Pause className="h-6 w-6" />
                  <span>Pausar suscripción</span>
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex flex-col items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Ban className="h-6 w-6" />
                      <span>Cancelar suscripción</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>¿Cancelar suscripción?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-slate-600">
                        Esta acción cancelará la suscripción de <strong>{subscription.tenantName}</strong>.
                        El cliente perderá acceso al final del período actual.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline">No, mantener</Button>
                        <Button 
                          variant="destructive"
                          onClick={() => onCancel(subscription.id)}
                        >
                          Sí, cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Icono Plus faltante
function Plus({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

// Icono Save faltante
function Save({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
