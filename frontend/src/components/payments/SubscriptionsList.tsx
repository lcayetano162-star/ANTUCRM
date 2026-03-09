import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CreditCard, ArrowRight, Download, Mail, 
  Play, Ban, RefreshCw
} from 'lucide-react';
import type { Subscription, SubscriptionStatus } from '@/types/payments';

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  onViewDetail: (subscription: Subscription) => void;
  onChargeNow: (subscriptionId: string) => void;
  onCancel: (subscriptionId: string) => void;
}

export function SubscriptionsList({ 
  subscriptions, 
  onViewDetail
}: SubscriptionsListProps) {
  const [activeTab, setActiveTab] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  const filteredSubscriptions = activeTab === 'ALL' 
    ? subscriptions 
    : subscriptions.filter(sub => sub.status === activeTab);

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700">🟢 Activa</Badge>;
      case 'TRIAL':
        return <Badge className="bg-blue-100 text-blue-700">🟢 Trial</Badge>;
      case 'PAST_DUE':
        return <Badge className="bg-amber-100 text-amber-700">🟡 Fallo</Badge>;
      case 'UNPAID':
        return <Badge className="bg-orange-100 text-orange-700">🟠 Impaga</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-700">🔴 Suspendida</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-slate-500">⚫ Cancelada</Badge>;
      case 'PENDING_CANCELLATION':
        return <Badge className="bg-purple-100 text-purple-700">🟣 Pend. cancelar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodDisplay = (subscription: Subscription) => {
    if (subscription.status === 'TRIAL') {
      return <span className="text-slate-400">N/A (requiere método)</span>;
    }
    
    const method = subscription.paymentMethod;
    if (method.type === 'CREDIT_CARD' || method.type === 'DEBIT_CARD') {
      return (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span>{method.cardBrand} ****{method.cardLast4}</span>
          {!method.isValid && <Badge variant="destructive" className="text-xs">Inválida</Badge>}
        </div>
      );
    }
    return <span>{method.type}</span>;
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleSelection = (subscriptionId: string) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subscriptionId) 
        ? prev.filter(id => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const tabs = [
    { value: 'ALL', label: 'Todas', count: subscriptions.length },
    { value: 'ACTIVE', label: 'Activas', count: subscriptions.filter(s => s.status === 'ACTIVE').length },
    { value: 'TRIAL', label: 'Trial', count: subscriptions.filter(s => s.status === 'TRIAL').length },
    { value: 'PAST_DUE', label: 'Con fallos', count: subscriptions.filter(s => s.status === 'PAST_DUE').length },
    { value: 'SUSPENDED', label: 'Suspendidas', count: subscriptions.filter(s => s.status === 'SUSPENDED').length },
    { value: 'CANCELLED', label: 'Canceladas', count: subscriptions.filter(s => s.status === 'CANCELLED').length },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Suscripciones Activas</CardTitle>
          <div className="flex items-center gap-2">
            {selectedSubscriptions.length > 0 && (
              <>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-1" />
                  Cobrar seleccionadas
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Enviar recordatorio
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SubscriptionStatus | 'ALL')}>
          <TabsList className="mb-4 flex-wrap h-auto">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="relative">
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedSubscriptions.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubscriptions(filteredSubscriptions.map(s => s.id));
                        } else {
                          setSelectedSubscriptions([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Próximo cobro</TableHead>
                  <TableHead>Método de pago</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No hay suscripciones en este estado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="hover:bg-slate-50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedSubscriptions.includes(subscription.id)}
                          onCheckedChange={() => toggleSelection(subscription.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{subscription.tenantName}</p>
                          <p className="text-xs text-slate-500">{subscription.tenantAdminEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subscription.planName}</p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(subscription.planPrice, subscription.planCurrency)}/mes
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        {subscription.status === 'SUSPENDED' ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <div>
                            <p>{subscription.nextBillingDate}</p>
                            {subscription.status === 'PAST_DUE' && (
                              <p className="text-xs text-amber-600">(retry)</p>
                            )}
                            {subscription.status === 'TRIAL' && (
                              <p className="text-xs text-blue-600">
                                {Math.ceil((new Date(subscription.trialEndDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días restantes
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodDisplay(subscription)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewDetail(subscription)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>

        {/* Acciones masivas */}
        {selectedSubscriptions.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {selectedSubscriptions.length} suscripción(es) seleccionada(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-1" />
                Cobrar
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-1" />
                Recordatorio
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Cambiar plan
              </Button>
              <Button variant="outline" size="sm" className="text-red-600">
                <Ban className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
