// ============================================
// ANTU CRM - Quota Summary
// Resumen de planificación y validaciones
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Building2, 
  Users, 
  User, 
  FileText, 
  Download, 
  Send,
  Save,
  History,
  TrendingUp
} from 'lucide-react';
import type { QuotaConfig, QuotaValidation, QuotaChangeLog } from '@/types/quota';

interface QuotaSummaryProps {
  config: QuotaConfig;
  validation: QuotaValidation;
  changeLog: QuotaChangeLog[];
  onPublish: () => void;
  onSaveDraft: () => void;
  onExport: () => void;
}

export function QuotaSummary({ 
  config, 
  validation, 
  changeLog,
  onPublish, 
  onSaveDraft, 
  onExport 
}: QuotaSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calcular estado de configuración
  const configStatus = [
    { label: 'Meta empresarial', complete: config.companyGoal.totalRevenue > 0 },
    { label: 'Distribución equipos', complete: validation.totalAssigned === config.companyGoal.totalRevenue },
    { label: 'Cuotas individuales', complete: config.sellers.length > 0 },
    { label: 'Períodos especiales', complete: config.specialPeriods.length > 0 },
    { label: 'Métricas de actividad', complete: config.activityMetrics.length > 0 },
  ];

  const completedCount = configStatus.filter(s => s.complete).length;
  const configProgress = Math.round((completedCount / configStatus.length) * 100);

  return (
    <div className="space-y-6">
      {/* Jerarquía de cuotas */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            Resumen de Planificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Jerarquía visual */}
          <div className="space-y-4">
            {/* Empresa */}
            <div className="p-4 bg-slate-800 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5" />
                <span className="font-semibold">EMPRESA</span>
                <Badge variant="secondary" className="ml-auto">
                  {formatCurrency(config.companyGoal.totalRevenue)}
                </Badge>
              </div>
              <p className="text-sm text-slate-300">
                Año Fiscal: {config.fiscalYear.label}
              </p>
            </div>

            {/* Equipos */}
            <div className="ml-6 space-y-3">
              {config.teams.map((team) => (
                <div key={team.id}>
                  <div className="p-4 bg-slate-600 rounded-xl text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{team.name}</span>
                      <span className="text-sm text-slate-300">({team.territory})</span>
                      <Badge variant="secondary" className="ml-auto">
                        {formatCurrency(team.annualQuota)} ({team.percentageOfTotal}%)
                      </Badge>
                    </div>
                  </div>

                  {/* Vendedores */}
                  <div className="ml-6 mt-2 space-y-2">
                    {config.sellers
                      .filter((s) => s.teamId === team.id)
                      .map((seller) => (
                        <div 
                          key={seller.id} 
                          className="p-3 bg-slate-100 rounded-lg flex items-center gap-3"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">{seller.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {seller.level}
                          </Badge>
                          <span className="ml-auto font-semibold text-slate-700">
                            {formatCurrency(seller.annualQuota)} ({seller.percentageOfTeam}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de configuración */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700">Estado de Configuración</h4>
              <Badge variant={configProgress === 100 ? 'default' : 'secondary'}>
                {completedCount}/{configStatus.length} completados
              </Badge>
            </div>
            <Progress value={configProgress} className="h-2 mb-4" />
            <div className="space-y-2">
              {configStatus.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  {status.complete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300" />
                  )}
                  <span className={`text-sm ${status.complete ? 'text-slate-700' : 'text-slate-400'}`}>
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Validaciones */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700">Validaciones</h4>
            
            {validation.isValid ? (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Todas las validaciones pasaron</p>
                  <p className="text-sm text-emerald-700">
                    La configuración de cuotas está lista para publicarse.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ))}
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={onPublish} 
              disabled={!validation.isValid || config.isPublished}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {config.isPublished ? 'Cuotas Publicadas' : 'Publicar Cuotas'}
            </Button>
            <Button variant="outline" onClick={onSaveDraft} className="gap-2">
              <Save className="w-4 h-4" />
              Guardar Borrador
            </Button>
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>

          {config.isPublished && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Cuotas Publicadas</span>
              </div>
              <p className="text-sm text-emerald-700">
                Publicado el {config.publishedAt && formatDate(config.publishedAt)} por {config.publishedBy}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                Las cuotas son visibles para todos los vendedores en sus dashboards de &quot;Mi Desempeño&quot;.
                Los cambios posteriores requerirán justificación y auditoría.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de cambios */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <History className="w-4 h-4 text-slate-600" />
            </div>
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {changeLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-700">{log.userName}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.action === 'CREATE' && 'Creó'}
                      {log.action === 'UPDATE' && 'Actualizó'}
                      {log.action === 'DELETE' && 'Eliminó'}
                      {log.action === 'PUBLISH' && 'Publicó'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {log.entityType === 'COMPANY' && 'Meta Empresarial'}
                      {log.entityType === 'TEAM' && 'Equipo'}
                      {log.entityType === 'SELLER' && 'Vendedor'}
                      {log.entityType === 'CONFIG' && 'Configuración'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuotaSummary;
