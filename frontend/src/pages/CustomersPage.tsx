// ============================================
// ANTU CRM - Customers Module with AI
// Módulo de Clientes con Inteligencia Artificial Predictiva
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Sparkles,
  Users,
  DollarSign,
  ArrowRight,
  LayoutGrid,
  List,
  Star,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useCustomersWithAI } from '@/hooks/useCustomersWithAI';
import { useCustomerCredit } from '@/hooks/useCustomerCredit';
import { useReceivables } from '@/hooks/useReceivables';
import {
  AIHealthScore,
  AICopilot,
  AIInsightsPanel,
  ProductRecommendations,
  ChurnPredictionPanel,
  CommunicationTimeline,
  CustomerFormModal,
} from '@/components/customers';
import type { Customer } from '@/types/customer';

// ============================================
// CUSTOMER LIST ITEM
// ============================================

interface CustomerListItemProps {
  customer: Customer;
  isSelected: boolean;
  viewMode?: 'list' | 'grid';
  onClick: () => void;
}

function CustomerListItem({ customer, isSelected, viewMode = 'list', onClick }: CustomerListItemProps) {
  const getHealthColor = (score?: number) => {
    if (!score) return 'bg-slate-200';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left transition-all hover:bg-slate-50',
        viewMode === 'list' ? 'p-4 border-b' : 'p-4 border rounded-xl m-1 relative mb-2',
        isSelected ? 'bg-cyan-50 border-cyan-200' : 'border-slate-100',
        viewMode === 'grid' && isSelected && 'ring-2 ring-cyan-500 ring-offset-1 z-10'
      )}
    >
      <div className={cn("flex gap-3", viewMode === 'list' ? 'items-start' : 'flex-col items-center h-full')}>
        {/* Logo Placeholder */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-cyan-600" />
        </div>

        <div className={cn("flex-1 min-w-0 w-full", viewMode === 'grid' && 'hidden')}>
          {/* Name & Status */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-800 truncate">{customer.name}</h4>
            {customer.healthScore && (
              <div className={cn('w-2 h-2 rounded-full', getHealthColor(customer.healthScore.overall))} />
            )}
          </div>

          {/* RNC & Location */}
          <p className="text-xs text-slate-500 mb-1 truncate">
            ID: {customer.rnc || 'N/A'} • {customer.city || 'Sin ubicación'}
          </p>

          {/* Industry & Size */}
          <p className="text-xs text-slate-400 mb-2 truncate">
            {customer.industry || 'Sin industria'} • {customer.size || 'Sin tamaño'}
          </p>

          {/* AI Insights Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {customer.healthScore && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                Score: {customer.healthScore.overall}
              </Badge>
            )}
            {customer.hiddenOpportunities.length > 0 && (
              <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                <Target className="w-3 h-3 mr-1" />
                {customer.hiddenOpportunities.length} oportunidades
              </Badge>
            )}
            {customer.churnPrediction?.riskLevel === 'HIGH' && (
              <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Riesgo churn
              </Badge>
            )}
          </div>
        </div>

        {/* Minimal Grid Mode Interior */}
        <div className={cn("flex-1 min-w-0 w-full text-center mt-2 flex flex-col justify-between", viewMode === 'list' && 'hidden')}>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800 truncate text-sm">{customer.name}</h4>
              {customer.healthScore && (
                <div className={cn('w-2 h-2 rounded-full shrink-0', getHealthColor(customer.healthScore.overall))} />
              )}
            </div>
            <p className="text-[10px] text-slate-500 mb-2 truncate">
              {customer.city || 'Sin ubicación'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 w-full mt-auto pt-2">
            {customer.healthScore && (
              <Badge variant="outline" className="text-[10px] px-1 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 w-full justify-center">
                Score: {customer.healthScore.overall}
              </Badge>
            )}
            {customer.hiddenOpportunities.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0.5 bg-violet-50 text-violet-700 border-violet-200 w-full justify-center">
                {customer.hiddenOpportunities.length} ops
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================
// STATS CARD
// ============================================

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
  icon: React.ElementType;
}

function StatCard({ title, value, subtitle, color, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CustomersPage() {
  const navigate = useNavigate();
  const {
    customers,
    stats,
    loading,
    selectedCustomer,
    selectCustomer,
    copilotMessages,
    sendCopilotMessage,
    clearCopilot,
    searchCustomers,
    addCustomer,
    updateCustomer,
  } = useCustomersWithAI();

  const { requestCredit } = useCustomerCredit();
  const { addCreditRequest } = useReceivables();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditCustomer, setCreditCustomer] = useState<Customer | null>(null);
  const [creditFormAmount, setCreditFormAmount] = useState<number>(500000);
  const [creditFormFiles, setCreditFormFiles] = useState<File[]>([]);

  // Filter and sort customers
  const filteredCustomers = (searchQuery
    ? searchCustomers(searchQuery)
    : [...customers]).sort((a, b) => {
      // 1. Prioritize active customers
      const aIsActive = a.status === 'ACTIVE' || a.status === 'PROSPECT';
      const bIsActive = b.status === 'ACTIVE' || b.status === 'PROSPECT';

      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // 2. Sort by most recent activity
      const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : new Date(b.updatedAt || b.createdAt).getTime();

      return dateB - dateA; // Descending (newest first)
    });

  // Handle create customer
  const handleCreateCustomer = (data: Partial<Customer>) => {
    addCustomer(data as any);
    setIsModalOpen(false);
  };

  // Handle edit customer
  const handleEditCustomer = (data: Partial<Customer>) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  // Open modal for new customer
  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  // Handle credit request
  const handleCreditRequest = async () => {
    if (creditFormFiles.some(f => f.size > 1.5 * 1024 * 1024)) {
      toast.error('En esta versión Demo, el tamaño máximo por archivo es de 1.5MB para evitar saturar la memoria del navegador.');
      return;
    }
    if (creditFormFiles.length < 3) {
      toast.error('Debe adjuntar un mínimo de 3 documentos para la solicitud de crédito.');
      return;
    }
    if (creditFormFiles.length > 4) {
      toast.error('Solo se permite un máximo de 4 documentos para la solicitud de crédito.');
      return;
    }

    if (selectedCustomer && creditFormAmount > 0) {
      const newCredit = requestCredit(
        selectedCustomer.id,
        selectedCustomer.name,
        selectedCustomer.rnc || '',
        creditFormAmount,
        'Usuario Actual'
      );

      const filePromises = creditFormFiles.map(file => {
        return new Promise<{ name: string, dataUrl: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              dataUrl: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const processedFiles = await Promise.all(filePromises);

      const docsToSave = processedFiles.map((file, idx) => ({
        id: `D${Date.now()}-${idx}`,
        type: 'OTHER' as const,
        name: file.name,
        url: file.dataUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'Usuario Actual',
        verified: false,
      }));

      // Sincronizar con useReceivables para que aparezca en CxC
      addCreditRequest({
        id: newCredit.requestId || `REQ-${Date.now()}`,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerRNC: selectedCustomer.rnc || '',
        requestedAmount: creditFormAmount,
        requestedBy: 'Usuario Actual',
        requestedById: 'U001',
        requestDate: new Date().toISOString().split('T')[0],
        reason: 'Solicitud de línea de crédito inicial',
        status: 'PENDING',
        aiScore: 85,
        riskLevel: 'LOW',
        aiFactors: [
          { category: 'FINANCIAL', score: 25, maxScore: 30, description: 'Buen historial', positive: true },
          { category: 'BEHAVIOR', score: 20, maxScore: 20, description: 'Cliente recurrente', positive: true }
        ],
        aiRecommendation: docsToSave.length > 0 ? 'Aprobar línea de crédito solicitada. Adjuntos recibidos.' : 'Aprobar línea de crédito solicitada. Se sugiere pedir docs.',
        documents: docsToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Sincronizar con el objeto cliente
      updateCustomer(selectedCustomer.id, {
        creditLineStatus: 'PENDING',
        creditLine: creditFormAmount
      });

      toast.success(`Solicitud de crédito por RD$ ${creditFormAmount.toLocaleString()} enviada exitosamente`);
    }
    setShowCreditModal(false);
    setCreditFormFiles([]);
    setCreditFormAmount(500000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[rgb(94,217,207)] animate-pulse mx-auto mb-4" />
          <p className="text-slate-500">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(94,217,207)] to-[rgb(75,201,191)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">CLIENTES</h1>
                <p className="text-sm text-slate-500">
                  Gestión de clientes con IA predictiva
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={openNewCustomerModal}
                className="gap-2 bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)] border-0"
              >
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* AI Insights of the Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Insights del día</span>
              </div>
              <p className="text-sm opacity-90">
                Tienes <strong>{stats.opportunitiesCount} clientes</strong> con oportunidades detectadas hoy.
                Prioriza: Corporación Dominicana, Grupo Financiero del Caribe.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const customersWithOpps = customers.filter(c => c.hiddenOpportunities.length > 0);
                  if (customersWithOpps.length > 0) {
                    selectCustomer(customersWithOpps[0]);
                    // Scroll to opportunities tab
                    const opportunitiesTab = document.querySelector('[data-value="opportunities"]') as HTMLElement;
                    opportunitiesTab?.click();
                    toast.info(`Mostrando oportunidades de ${customersWithOpps[0].name}`);
                  } else {
                    navigate('/opportunities');
                  }
                }}
                className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Ver acciones sugeridas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Alertas de retención</span>
              </div>
              <p className="text-sm opacity-90">
                <strong>{stats.highRiskCount} clientes</strong> muestran señales de riesgo de churn.
                Requiere atención inmediata.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const highRiskCustomers = customers.filter(c =>
                    c.churnPrediction?.riskLevel === 'HIGH' || c.churnPrediction?.riskLevel === 'CRITICAL'
                  );
                  if (highRiskCustomers.length > 0) {
                    selectCustomer(highRiskCustomers[0]);
                    // Switch to financial tab to see churn prediction
                    const financialTab = document.querySelector('[data-value="financial"]') as HTMLElement;
                    financialTab?.click();
                    toast.info(`Mostrando plan de retención para ${highRiskCustomers[0].name}`);
                  } else {
                    toast.info('No hay clientes en riesgo alto actualmente');
                  }
                }}
                className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Ver plan de retención
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Clientes"
              value={stats.total}
              color="#0891B2"
              icon={Users}
            />
            <StatCard
              title="Activos"
              value={stats.active}
              color="#10B981"
              icon={CheckCircle2}
            />
            <StatCard
              title="Health Score Prom."
              value={stats.avgHealthScore}
              color="#8B5CF6"
              icon={TrendingUp}
            />
            <StatCard
              title="Riesgo Alto"
              value={stats.highRiskCount}
              color="#EF4444"
              icon={AlertCircle}
            />
            <StatCard
              title="Oportunidades"
              value={stats.opportunitiesCount}
              color="#F59E0B"
              icon={Target}
            />
            <StatCard
              title="Pipeline Total"
              value={`RD$ ${(stats.totalPipeline / 1000000).toFixed(1)}M`}
              subtitle="potencial detectado"
              color="#EC4899"
              icon={DollarSign}
            />
          </div>

          {/* Main Content - 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Customer List */}
            <div className="lg:col-span-4">
              <Card className="border-slate-200 flex flex-col h-[calc(100vh-220px)]">
                <CardHeader className="pb-3 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-700">
                      Lista de Clientes
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-1.5 rounded',
                          viewMode === 'list' ? 'bg-slate-200' : 'hover:bg-slate-100'
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-1.5 rounded',
                          viewMode === 'grid' ? 'bg-slate-200' : 'hover:bg-slate-100'
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[rgb(94,217,207)] focus-visible:border-[rgb(94,217,207)] outline-none ring-offset-0"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative overflow-hidden">
                  <ScrollArea className="absolute inset-0 h-full w-full">
                    <div className={cn("p-2 pb-16", viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : '')}>
                      {filteredCustomers.map((customer) => (
                        <CustomerListItem
                          key={customer.id}
                          customer={customer}
                          isSelected={selectedCustomer?.id === customer.id}
                          viewMode={viewMode}
                          onClick={() => selectCustomer(customer)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Customer Detail */}
            <div className="lg:col-span-5">
              {selectedCustomer ? (
                <div className="space-y-4">
                  {/* Profile Card */}
                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-slate-800">
                              {selectedCustomer.name}
                            </h2>
                            <Badge variant="outline" className="text-xs">
                              {selectedCustomer.rnc}
                            </Badge>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <p className="text-sm text-slate-500 mb-2">
                            {selectedCustomer.legalName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {selectedCustomer.city}, {selectedCustomer.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {selectedCustomer.industry}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{selectedCustomer.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{selectedCustomer.phone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs */}
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="profile">Perfil + IA</TabsTrigger>
                      <TabsTrigger value="activity">Actividad</TabsTrigger>
                      <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
                      <TabsTrigger value="financial">Financiero</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 mt-4">
                      {/* Health Score */}
                      {selectedCustomer.healthScore && (
                        <AIHealthScore
                          healthScore={selectedCustomer.healthScore}
                          healthScoreDetails={selectedCustomer.healthScoreDetails}
                        />
                      )}

                      {/* AI Insights */}
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            Insights de IA
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <AIInsightsPanel insights={selectedCustomer.aiInsights} />
                        </CardContent>
                      </Card>

                      {/* Product Recommendations */}
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            Recomendaciones de Productos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ProductRecommendations
                            recommendations={selectedCustomer.productRecommendations}
                            currency={selectedCustomer.creditLineCurrency || 'DOP'}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="mt-4">
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">
                            Timeline de Comunicaciones
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CommunicationTimeline events={selectedCustomer.communicationHistory} />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="opportunities" className="space-y-4 mt-4">
                      {/* Hidden Opportunities */}
                      {selectedCustomer.hiddenOpportunities.map((opp) => (
                        <Card key={opp.id} className="border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge className="mb-2">
                                  {opp.type === 'CROSS_SELL' && 'Cross-sell'}
                                  {opp.type === 'UP_SELL' && 'Up-sell'}
                                  {opp.type === 'EXPANSION' && 'Expansión'}
                                  {opp.type === 'RENEWAL' && 'Renovación'}
                                </Badge>
                                <h4 className="font-semibold text-slate-800">{opp.title}</h4>
                                <p className="text-sm text-slate-500 mt-1">{opp.description}</p>
                                <p className="text-sm text-slate-600 mt-2">
                                  <strong>Razón:</strong> {opp.reasoning}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-emerald-600">
                                  RD$ {opp.potentialValue.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-400">potencial</p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {opp.probability}% probabilidad
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <p className="text-sm text-slate-600 mb-3">
                                <strong>Enfoque sugerido:</strong> {opp.suggestedApproach}
                              </p>
                              <Button
                                size="sm"
                                className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white border-0 shadow-md"
                                onClick={() => {
                                  // Navigate to quotes page with opportunity data
                                  navigate('/cotizaciones', {
                                    state: {
                                      customer: selectedCustomer,
                                      opportunity: opp
                                    }
                                  });
                                  toast.success(`Preparando propuesta para ${opp.title}`);
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Preparar propuesta
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-4 mt-4">
                      {/* Churn Prediction */}
                      {selectedCustomer.churnPrediction && (
                        <ChurnPredictionPanel
                          prediction={selectedCustomer.churnPrediction}
                        />
                      )}

                      {/* Credit Line */}
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            Línea de Crédito
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedCustomer.creditLineStatus === 'NONE' ? (
                            <div className="bg-slate-50 rounded-lg p-4">
                              <p className="text-sm text-slate-600 mb-3">
                                Estado: <strong>SIN SOLICITUD</strong>
                              </p>
                              <div className="bg-gradient-to-r from-violet-50 to-cyan-50 rounded-lg p-4 border border-violet-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-5 h-5 text-violet-500" />
                                  <span className="font-semibold text-violet-700">
                                    IA Recomienda: Solicitar $500,000 DOP
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">
                                  Basado en: Historial de pagos puntual + volumen de compras proyectado
                                </p>
                                <Button
                                  className="bg-violet-600 hover:bg-violet-700"
                                  onClick={() => {
                                    setCreditCustomer(selectedCustomer);
                                    setShowCreditModal(true);
                                  }}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Solicitar Crédito Recomendado
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-bold text-emerald-600">
                                RD$ {selectedCustomer.creditLine?.toLocaleString()}
                              </p>
                              <Badge className="mt-2">
                                {selectedCustomer.creditLineStatus}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">Selecciona un cliente para ver detalles</p>
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: AI Copilot */}
            <div className="lg:col-span-3">
              <AICopilot
                messages={copilotMessages}
                context={selectedCustomer ? {
                  customerId: selectedCustomer.id,
                  customerName: selectedCustomer.name,
                } : undefined}
                onSendMessage={sendCopilotMessage}
                onClear={clearCopilot}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={editingCustomer ? handleEditCustomer : handleCreateCustomer}
        customer={editingCustomer}
      />

      {/* Credit Request Modal */}
      {showCreditModal && creditCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Solicitar Línea de Crédito</h3>
                <p className="text-sm text-slate-500">{creditCustomer.name}</p>
              </div>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Monto recomendado por IA:</p>
              <p className="text-xl font-bold text-violet-700">RD$ 500,000</p>
              <p className="text-xs text-slate-500 mt-1">Basado en historial de pagos y volumen proyectado</p>
            </div>

            <div className="space-y-4 mb-6 relative">
              <div>
                <Label>Monto a Solicitar (RD$)</Label>
                <Input
                  type="number"
                  value={creditFormAmount}
                  onChange={(e) => setCreditFormAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Adjuntar Documentaciones (Requerido: 3 a 4 documentos)</Label>
                <div className="mt-1 border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) {
                        setCreditFormFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {creditFormFiles.length > 0 && (
                    <div className="mt-3 text-left">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Archivos adjuntos:</p>
                      <ul className="text-xs text-slate-500 space-y-1">
                        {creditFormFiles.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {f.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={handleCreditRequest}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Enviar Solicitud
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditCustomer(null);
                  setCreditFormFiles([]);
                  setCreditFormAmount(500000);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
