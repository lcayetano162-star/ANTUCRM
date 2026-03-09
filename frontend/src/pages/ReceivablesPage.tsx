import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReceivables } from '@/hooks/useReceivables';
import { ReceivablesStats } from '@/components/receivables/ReceivablesStats';
import { AIAlerts } from '@/components/receivables/AIAlerts';
import { CreditRequestsList } from '@/components/receivables/CreditRequestsList';
import { CreditEvaluationForm } from '@/components/receivables/CreditEvaluationForm';
import { ReceivablesList } from '@/components/receivables/ReceivablesList';
import { CollectionManagement } from '@/components/receivables/CollectionManagement';
import { AgingReport } from '@/components/receivables/AgingReport';
import { CashForecastView } from '@/components/receivables/CashForecast';
import { useCustomerCredit } from '@/hooks/useCustomerCredit';
import { useCustomersWithAI } from '@/hooks/useCustomersWithAI';
import {
  Wallet, FileText, TrendingUp, AlertTriangle,
  Users, Settings, Download, RefreshCw
} from 'lucide-react';
import type { CreditRequest, Receivable } from '@/types/receivables';

export default function ReceivablesPage() {
  const {
    creditRequests,
    receivables,
    alerts,
    portfolioSummary,
    cashForecast,
    approveCreditRequest,
    rejectCreditRequest,
    startReview,
    addCollectionAction,
    registerPayment,
    markAlertAsRead,
    dismissAlert,
  } = useReceivables();

  const { approveCredit } = useCustomerCredit();
  const { updateCustomer } = useCustomersWithAI();

  const [view, setView] = useState<'dashboard' | 'credit-eval' | 'collection'>('dashboard');
  const [selectedCreditRequest, setSelectedCreditRequest] = useState<CreditRequest | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [managementTab, setManagementTab] = useState('overview');

  // Handlers para navegación
  const handleEvaluateCredit = (request: CreditRequest) => {
    setSelectedCreditRequest(request);
    setView('credit-eval');
  };

  const handleStartReview = (requestId: string) => {
    startReview(requestId);
  };

  const handleApproveCredit = (requestId: string, approvedAmount: number, conditions?: string[], comments?: string) => {
    approveCreditRequest(requestId, approvedAmount, conditions, comments);

    // Sincronizar con useCustomerCredit y el perfil del cliente
    const request = creditRequests.find(r => r.id === requestId);
    if (request) {
      approveCredit(request.customerId, approvedAmount, 'María López', conditions);

      updateCustomer(request.customerId, {
        creditLineStatus: 'APPROVED',
        creditLine: approvedAmount,
      });
    }

    setView('dashboard');
    setSelectedCreditRequest(null);
  };

  const handleRejectCredit = (requestId: string, reason: string) => {
    rejectCreditRequest(requestId, reason);
    setView('dashboard');
    setSelectedCreditRequest(null);
  };

  const handleManageCollection = (receivable: Receivable, tab: string = 'overview') => {
    setSelectedReceivable(receivable);
    setManagementTab(tab);
    setView('collection');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedCreditRequest(null);
    setSelectedReceivable(null);
  };

  // Renderizar vista de evaluación de crédito
  if (view === 'credit-eval' && selectedCreditRequest) {
    return (
      <div className="p-6 space-y-6">
        <CreditEvaluationForm
          request={selectedCreditRequest}
          onApprove={handleApproveCredit}
          onReject={handleRejectCredit}
          onCancel={handleBackToDashboard}
        />
      </div>
    );
  }

  // Renderizar vista de gestión de cobro
  if (view === 'collection' && selectedReceivable) {
    return (
      <div className="p-6 space-y-6">
        <CollectionManagement
          key={selectedReceivable.id + managementTab}
          receivable={selectedReceivable}
          onBack={handleBackToDashboard}
          onAddAction={addCollectionAction}
          onRegisterPayment={registerPayment}
          defaultTab={managementTab}
        />
      </div>
    );
  }

  // Vista principal del dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Cuentas por Cobrar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de Crédito + Cobros Inteligentes con IA Predictiva
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ReceivablesStats summary={portfolioSummary} />

      {/* AI Alerts */}
      <AIAlerts
        alerts={alerts}
        onMarkAsRead={markAlertAsRead}
        onDismiss={dismissAlert}
      />

      {/* Main Tabs */}
      <Tabs defaultValue="receivables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Cuentas por Cobrar</span>
            <span className="sm:hidden">Cobros</span>
            <Badge variant="secondary" className="ml-1">
              {receivables.filter(r => r.status !== 'PAID').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Líneas de Crédito</span>
            <span className="sm:hidden">Crédito</span>
            <Badge variant="secondary" className="ml-1">
              {creditRequests.filter(r => r.status === 'PENDING' || r.status === 'IN_REVIEW').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Aging</span>
            <span className="sm:hidden">Aging</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Proyección</span>
            <span className="sm:hidden">Forecast</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cuentas por Cobrar */}
        <TabsContent value="receivables" className="space-y-4">
          <ReceivablesList
            receivables={receivables.filter(r => r.status !== 'PAID')}
            onManage={handleManageCollection}
          />
        </TabsContent>

        {/* Tab: Líneas de Crédito */}
        <TabsContent value="credit" className="space-y-4">
          <CreditRequestsList
            requests={creditRequests}
            onEvaluate={handleEvaluateCredit}
            onStartReview={handleStartReview}
          />
        </TabsContent>

        {/* Tab: Aging */}
        <TabsContent value="aging" className="space-y-4">
          <AgingReport summary={portfolioSummary} />
        </TabsContent>

        {/* Tab: Forecast */}
        <TabsContent value="forecast" className="space-y-4">
          <CashForecastView forecasts={cashForecast} />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 pt-4 border-t">
        <p>Última actualización: Hace 5 minutos | Modelo IA v2.4.1 | Precisión: 87%</p>
      </div>
    </div>
  );
}
