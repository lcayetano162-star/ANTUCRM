import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaymentGateways } from '@/hooks/usePaymentGateways';
import { PaymentGatewaysList } from '@/components/payments/PaymentGatewaysList';
import { GatewayConfigForm } from '@/components/payments/GatewayConfigForm';
import { SubscriptionsList } from '@/components/payments/SubscriptionsList';
import { SubscriptionDetail } from '@/components/payments/SubscriptionDetail';
import { BillingSettingsView } from '@/components/payments/BillingSettings';
import { PaymentReports } from '@/components/payments/PaymentReports';
import { 
  CreditCard, Users, Settings, BarChart3, RefreshCw, 
  Shield, Globe, Wallet
} from 'lucide-react';
import type { PaymentGateway, Subscription, GatewayStatus } from '@/types/payments';

export default function PaymentGatewayPage() {
  const {
    gateways,
    subscriptions,
    billingSettings,
    financialReport,
    updateGatewayStatus,
    testGatewayConnection,
    updateBillingSettings,
  } = usePaymentGateways();

  const [view, setView] = useState<'list' | 'config' | 'subscription'>('list');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Handlers
  const handleConfigureGateway = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setView('config');
  };

  const handleToggleGatewayStatus = (gatewayId: string, status: GatewayStatus) => {
    updateGatewayStatus(gatewayId, status);
  };

  const handleTestGateway = (gatewayId: string) => {
    testGatewayConnection(gatewayId);
  };

  const handleSaveGateway = (_gateway: PaymentGateway) => {
    // Aquí se guardaría la configuración
    setView('list');
    setSelectedGateway(null);
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setView('subscription');
  };

  const handleChargeNow = (subscriptionId: string) => {
    // Aquí se procesaría el cobro inmediato
    alert(`Cobro iniciado para suscripción ${subscriptionId}`);
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    // Aquí se cancelaría la suscripción
    alert(`Suscripción ${subscriptionId} cancelada`);
    setView('list');
    setSelectedSubscription(null);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedGateway(null);
    setSelectedSubscription(null);
  };

  // Renderizar vista de configuración de pasarela
  if (view === 'config' && selectedGateway) {
    return (
      <div className="p-6 space-y-6">
        <GatewayConfigForm
          gateway={selectedGateway}
          onSave={handleSaveGateway}
          onCancel={handleBackToList}
          onTest={handleTestGateway}
        />
      </div>
    );
  }

  // Renderizar vista de detalle de suscripción
  if (view === 'subscription' && selectedSubscription) {
    return (
      <div className="p-6 space-y-6">
        <SubscriptionDetail
          subscription={selectedSubscription}
          onBack={handleBackToList}
          onChargeNow={handleChargeNow}
          onCancel={handleCancelSubscription}
        />
      </div>
    );
  }

  // Vista principal
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Pasarelas de Pago y Billing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Multi-Gateway | Multi-País | Subscription Billing Automático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{gateways.filter(g => g.status === 'ACTIVE').length}</p>
              <p className="text-xs text-slate-500">Pasarelas activas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'ACTIVE').length}</p>
              <p className="text-xs text-slate-500">Suscripciones activas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('es-DO', {
                  style: 'currency',
                  currency: 'DOP',
                  minimumFractionDigits: 0,
                }).format(financialReport.summary.totalCollected)}
              </p>
              <p className="text-xs text-slate-500">Cobrado este mes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-slate-500">Regiones activas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="gateways" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gateways" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pasarelas</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Suscripciones</span>
            <Badge variant="secondary" className="ml-1">
              {subscriptions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gateways */}
        <TabsContent value="gateways" className="space-y-4">
          <PaymentGatewaysList
            gateways={gateways}
            onConfigure={handleConfigureGateway}
            onToggleStatus={handleToggleGatewayStatus}
            onTestConnection={handleTestGateway}
          />
        </TabsContent>

        {/* Tab: Subscriptions */}
        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsList
            subscriptions={subscriptions}
            onViewDetail={handleViewSubscription}
            onChargeNow={handleChargeNow}
            onCancel={handleCancelSubscription}
          />
        </TabsContent>

        {/* Tab: Reports */}
        <TabsContent value="reports" className="space-y-4">
          <PaymentReports report={financialReport} />
        </TabsContent>

        {/* Tab: Settings */}
        <TabsContent value="settings" className="space-y-4">
          <BillingSettingsView
            settings={billingSettings}
            onSave={updateBillingSettings}
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            PCI DSS Compliant
          </span>
          <span>SSL/TLS 1.3</span>
          <span>3D Secure 2.0</span>
        </div>
        <div>
          Última actualización: Hace 2 minutos
        </div>
      </div>
    </div>
  );
}

// Componente Card simple
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}
