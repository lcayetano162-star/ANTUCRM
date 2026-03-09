// ============================================
// ANTU CRM - Quota Configuration Page
// Configuración de Cuotas y Metas
// ============================================

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Card imports removed - not used
import {
  Calendar,
  Building2,
  Users,
  User,
  TrendingUp,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  CheckSquare
} from 'lucide-react';
import { useQuotaConfig } from '@/hooks/useQuotaConfig';
import {
  FiscalYearConfigPanel,
  CompanyGoalConfig,
  TeamAssignment,
  SellerAssignment,
  MonthlyDistributionPanel,
  QuotaSummary,
} from '@/components/quota';
import { ActivityGoalsConfig } from '@/components/quota/ActivityGoalsConfig';

export function QuotaConfigPage() {
  const {
    config,
    changeLog,
    hasChanges,
    validation,
    updateCompanyGoal,
    updateRevenueType,
    updateTeam,
    updateSeller,
    addTeam,
    removeTeam,
    addSeller,
    removeSeller,
    publishQuotas,
    saveDraft,
  } = useQuotaConfig();

  const [activeTab, setActiveTab] = useState('company');

  const handleAddTeam = () => {
    const teamName = `Equipo ${String.fromCharCode(68 + config.teams.length)}`;
    addTeam({
      name: teamName,
      territory: 'Nuevo',
      percentageOfTotal: 0,
      annualQuota: 0,
      members: [],
    });
  };

  const handleAddSeller = (teamId: string) => {
    const team = config.teams.find((t) => t.id === teamId);
    if (!team) return;

    const teamSellers = config.sellers.filter((s) => s.teamId === teamId);
    const newSellerName = `Vendedor ${teamSellers.length + 1}`;

    addSeller({
      name: newSellerName,
      email: `vendedor${teamSellers.length + 1}@antu.com`,
      teamId,
      level: 'MID',
      percentageOfTeam: 0,
      annualQuota: 0,
    });
  };

  const handlePublish = () => {
    if (publishQuotas()) {
      toast.success('Cuotas publicadas exitosamente');
    }
  };

  const handleSaveDraft = () => {
    saveDraft();
  };

  const handleExport = () => {
    toast.info('Exportando a Excel...');
    // Aquí iría la lógica de exportación
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Configuración de Cuotas y Metas
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Año Fiscal: {config.fiscalYear.label} |
                Meta Empresarial: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(config.companyGoal.totalRevenue)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="secondary" className="gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  Cambios sin guardar
                </Badge>
              )}
              <Badge
                variant={validation.isValid ? 'default' : 'destructive'}
                className="gap-1"
              >
                {validation.isValid ? (
                  <><CheckCircle2 className="w-3 h-3" /> Válido</>
                ) : (
                  <><RotateCcw className="w-3 h-3" /> Pendiente</>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!validation.isValid}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 flex flex-wrap h-auto">
            <TabsTrigger value="fiscal" className="gap-2">
              <Calendar className="w-4 h-4" />
              Año Fiscal
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Meta Empresarial
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2">
              <User className="w-4 h-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Distribución
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2 text-[var(--color-primary)] bg-[rgba(94,217,207,0.1)] hover:bg-[rgba(94,217,207,0.2)]">
              <CheckSquare className="w-4 h-4" />
              Sales Ops (Metas de Actividad)
            </TabsTrigger>
          </TabsList>

          {/* Tab: Año Fiscal */}
          <TabsContent value="fiscal" className="space-y-6">
            <FiscalYearConfigPanel
              config={config.fiscalYear}
              onUpdate={(updates) => console.log(updates)}
              onSave={() => toast.success('Configuración guardada')}
            />
          </TabsContent>

          {/* Tab: Meta Empresarial */}
          <TabsContent value="company" className="space-y-6">
            <CompanyGoalConfig
              goal={config.companyGoal}
              onUpdate={updateCompanyGoal}
              onUpdateRevenueType={updateRevenueType}
              onSave={() => toast.success('Meta empresarial guardada')}
            />
          </TabsContent>

          {/* Tab: Equipos */}
          <TabsContent value="teams" className="space-y-6">
            <TeamAssignment
              teams={config.teams}
              companyTotal={config.companyGoal.totalRevenue}
              onUpdateTeam={updateTeam}
              onAddTeam={handleAddTeam}
              onRemoveTeam={removeTeam}
              onSave={() => toast.success('Asignaciones de equipos guardadas')}
            />
          </TabsContent>

          {/* Tab: Vendedores */}
          <TabsContent value="sellers" className="space-y-6">
            <SellerAssignment
              sellers={config.sellers}
              teams={config.teams}
              onUpdateSeller={updateSeller}
              onAddSeller={handleAddSeller}
              onRemoveSeller={removeSeller}
              onSave={() => toast.success('Cuotas individuales guardadas')}
            />
          </TabsContent>

          {/* Tab: Distribución */}
          <TabsContent value="distribution" className="space-y-6">
            <MonthlyDistributionPanel
              distribution={config.monthlyDistribution}
              teams={config.teams}
              onUpdateDistribution={() => { }}
              onSave={() => toast.success('Distribución mensual guardada')}
            />
          </TabsContent>

          {/* Tab: Resumen */}
          <TabsContent value="summary" className="space-y-6">
            <QuotaSummary
              config={config}
              validation={validation}
              changeLog={changeLog}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              onExport={handleExport}
            />
          </TabsContent>

          {/* Tab: Sales Ops (Metas de Actividad) */}
          <TabsContent value="activities" className="space-y-6">
            <ActivityGoalsConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default QuotaConfigPage;
