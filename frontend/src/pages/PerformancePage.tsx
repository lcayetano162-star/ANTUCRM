// ============================================
// ANTU CRM - Performance Page
// Módulo Mi Desempeño / Desempeño del Equipo
// ============================================

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, User, Calendar, TrendingUp, Users, Award } from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';
import { useAuth } from '@/hooks/useAuth';
import {
  KPICards,
  HistoricalChart,
  ActivityMetrics,
  AIInsights,
  Gamification,
  TeamView,
} from '@/components/performance';
import { SalesOpsPerformance } from '@/components/quota';
import { QuotaProgress } from '@/components/performance/QuotaProgress';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PerformancePage() {
  const { user } = useAuth();

  // Use user data from auth context
  const userId = user?.id || '1';
  // Map auth role to performance role if needed, or use as is
  const userRole = (user?.role === 'SALES_MANAGER' || user?.role === 'TENANT_ADMIN') ? 'SALES_MANAGER' : 'SALES_REP';

  const {
    data,
    teamData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    selectedUserId,
    setSelectedUserId,
    refreshData,
    getQuotaColor,
    isManager,
  } = usePerformance(userId, userRole as any);

  // Determinar si estamos viendo una vista individual o de equipo
  // Si no hay seleccionado (null) o es el admin viendo "todo", es equipo.
  // Pero si el usuario es un gerente y selecciona un ID, es individual.
  const isViewingIndividual = !!selectedUserId;

  // Meses disponibles
  const months = [
    { value: '2-2026', label: 'Febrero 2026' },
    { value: '1-2026', label: 'Enero 2026' },
    { value: '12-2025', label: 'Diciembre 2025' },
    { value: '11-2025', label: 'Noviembre 2025' },
    { value: '10-2025', label: 'Octubre 2025' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Cargando tu desempeño...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">No se pudieron cargar los datos</p>
          <Button onClick={refreshData} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {isViewingIndividual ? 'Vista Individual' : (isManager ? 'Desempeño del Equipo' : 'Mi Desempeño')}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isViewingIndividual
                  ? `Viendo métricas de: ${selectedUserId === userId ? 'Mí mismo' : (teamData?.find(u => u.id === selectedUserId)?.name || 'Vendedor')}`
                  : (isManager
                    ? 'Visualiza y compara el rendimiento de tu equipo'
                    : 'Seguimiento de tus métricas y objetivos')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Selector de vendedor (para gerentes y admins) */}
              {isManager && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <Select
                    value={selectedUserId || 'all'}
                    onValueChange={(value) => setSelectedUserId(value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {userRole === 'SALES_REP' ? 'Mí mismo' : 'Todo el equipo'}
                      </SelectItem>
                      {teamData?.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.name} {rep.id === userId ? '(Mí)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Selector de período */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Select
                  value={`${(selectedPeriod as any).month}-${(selectedPeriod as any).year}`}
                  onValueChange={(value) => {
                    if (value === 'ANNUAL') return;
                    const [month, year] = value.split('-').map(Number);
                    const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    setSelectedPeriod({
                      month,
                      year,
                      monthName: monthNames[month]
                    });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botón actualizar */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  refreshData();
                  toast.success('Datos actualizados');
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue={!isViewingIndividual && isManager ? "team" : "overview"} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            {(isViewingIndividual || !isManager) && (
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Resumen
              </TabsTrigger>
            )}
            {(isViewingIndividual || !isManager) && (
              <TabsTrigger value="activities" className="gap-2">
                <Award className="w-4 h-4" />
                Actividades
              </TabsTrigger>
            )}
            {isManager && !isViewingIndividual && (
              <TabsTrigger value="team" className="gap-2">
                <Users className="w-4 h-4" />
                Equipo
              </TabsTrigger>
            )}
            {(isViewingIndividual || !isManager) && (
              <TabsTrigger value="achievements" className="gap-2">
                <Award className="w-4 h-4" />
                Logros
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Resumen (Individual) */}
          {(isViewingIndividual || !isManager) && (
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <KPICards
                quotaPercentage={data.quota.percentage}
                quotaTarget={data.quota.target}
                quotaAchieved={data.quota.achieved}
                quotaRemaining={data.quota.remaining}
                projected={data.quota.projected}
                opportunitiesWon={3}
                opportunitiesTarget={5}
                opportunitiesValue={data.quota.achieved}
                pipelineValue={data.historical[0]?.achieved || 340000}
                activitiesPercentage={Math.round(
                  (data.activities.calls.percentage +
                    data.activities.meetings.percentage +
                    data.activities.emails.percentage +
                    data.activities.visits.percentage) / 4
                )}
                calls={data.activities.calls}
                meetings={data.activities.meetings}
                emails={data.activities.emails}
                visits={data.activities.visits}
                getQuotaColor={getQuotaColor}
              />

              {/* Grid principal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cumplimiento de Cuota */}
                <QuotaProgress
                  monthName={data.period.monthName}
                  year={data.period.year}
                  target={data.quota.target}
                  achieved={data.quota.achieved}
                  percentage={data.quota.percentage}
                  remaining={data.quota.remaining}
                  projected={data.quota.projected}
                  projectedPercentage={data.quota.projectedPercentage}
                  getQuotaColor={getQuotaColor}
                />

                {/* Historial */}
                <HistoricalChart
                  data={data.historical}
                  getQuotaColor={getQuotaColor}
                />
              </div>

              {/* Insights de IA */}
              <AIInsights
                insights={data.insights}
                trends={data.trends}
              />

              {data.salesOpsConfig && (
                <SalesOpsPerformance
                  role={data.salesOpsConfig.role}
                  score={
                    data.salesOpsConfig.role === 'seller'
                      ? Math.round(
                        (data.salesOpsConfig.metrics.visits.percent +
                          (data.salesOpsConfig.metrics.calls?.percent || 0) +
                          data.salesOpsConfig.metrics.newOpps.percent +
                          data.salesOpsConfig.metrics.speedToLead.percent +
                          data.salesOpsConfig.metrics.followUp.percent) / 5
                      )
                      : Math.round(
                        (data.salesOpsConfig.metrics.pipelineHealth.percent +
                          data.salesOpsConfig.metrics.coaching.percent +
                          data.salesOpsConfig.metrics.forecastAccuracy.percent +
                          data.salesOpsConfig.metrics.teamQuota.percent) / 4
                      )
                  }
                  metrics={data.salesOpsConfig.metrics}
                />
              )}
            </TabsContent>
          )}

          {/* Tab: Actividades (Individual) */}
          {(isViewingIndividual || !isManager) && (
            <TabsContent value="activities" className="space-y-6">
              <ActivityMetrics
                calls={data.activities.calls}
                meetings={data.activities.meetings}
                emails={data.activities.emails}
                visits={data.activities.visits}
                opportunitiesCreated={data.activities.opportunitiesCreated}
                teamPosition={data.teamRanking?.position || 3}
                teamTotal={data.teamRanking?.total || 8}
                teamAverage={data.teamRanking?.average || 72}
              />
            </TabsContent>
          )}

          {/* Tab: Logros (Individual) */}
          {(isViewingIndividual || !isManager) && (
            <TabsContent value="achievements" className="space-y-6">
              <Gamification
                badges={data.badges}
                challenges={data.challenges}
              />
            </TabsContent>
          )}

          {/* Tab: Equipo (Gerente - Vista General) */}
          {isManager && !isViewingIndividual && teamData && (
            <TabsContent value="team" className="space-y-6">
              {data.salesOpsConfig && data.salesOpsConfig.role === 'manager' && (
                <SalesOpsPerformance
                  role="manager"
                  score={Math.round(
                    (data.salesOpsConfig.metrics.pipelineHealth.percent +
                      data.salesOpsConfig.metrics.coaching.percent +
                      data.salesOpsConfig.metrics.forecastAccuracy.percent +
                      data.salesOpsConfig.metrics.teamQuota.percent) / 4
                  )}
                  metrics={data.salesOpsConfig.metrics}
                />
              )}

              <TeamView
                teamMembers={teamData}
                getQuotaColor={getQuotaColor}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div >
  );
}

export default PerformancePage;
