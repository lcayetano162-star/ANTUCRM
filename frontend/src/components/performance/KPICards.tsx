// ============================================
// ANTU CRM - KPI Cards Component
// Tarjetas de métricas principales
// ============================================

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Trophy, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KPICardsProps {
  quotaPercentage: number;
  quotaTarget: number;
  quotaAchieved: number;
  quotaRemaining: number;
  projected: number;
  opportunitiesWon: number;
  opportunitiesTarget: number;
  opportunitiesValue: number;
  pipelineValue: number;
  activitiesPercentage: number;
  calls: { current: number; target: number };
  meetings: { current: number; target: number };
  emails: { current: number; target: number };
  visits: { current: number; target: number };
  getQuotaColor: (p: number) => string;
}

export function KPICards({
  quotaPercentage,
  quotaTarget,
  quotaAchieved,
  quotaRemaining,
  projected,
  opportunitiesWon,
  opportunitiesTarget,
  opportunitiesValue,
  pipelineValue,
  activitiesPercentage,
  calls,
  meetings,
  emails,
  visits,
  getQuotaColor
}: KPICardsProps) {
  const navigate = useNavigate();
  const quotaColor = getQuotaColor(quotaPercentage);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Cumplimiento de Cuota */}
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Cumplimiento</span>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-3xl font-bold" style={{ color: quotaColor }}>
              {quotaPercentage}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(quotaPercentage, 100)}%`,
                  backgroundColor: quotaColor
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Meta: RD${(quotaTarget / 1000).toFixed(0)}K</span>
              <span>Restan: RD${(quotaRemaining / 1000).toFixed(0)}K</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => navigate('/opportunities?status=WON')}>
            Ver desglose
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Ingresos Totales */}
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Ingresos</span>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-3xl font-bold text-slate-800">
              RD${(quotaAchieved / 1000).toFixed(1)}K
            </span>
          </div>

          <p className="text-sm text-slate-500 mb-3">
            de RD${(quotaTarget / 1000).toFixed(0)}K meta
          </p>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-700">
                Proyectado: <strong>RD${(projected / 1000).toFixed(1)}K</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              91% probabilidad de cierre
            </p>
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('/opportunities')}>
            Detalle
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Oportunidades Ganadas */}
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Oportunidades</span>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-3xl font-bold text-slate-800">
              {opportunitiesWon}
            </span>
            <span className="text-lg text-slate-400"> / {opportunitiesTarget}</span>
          </div>

          <p className="text-sm text-slate-500 mb-3">
            {Math.round((opportunitiesWon / opportunitiesTarget) * 100)}% de meta alcanzada
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Valor:</span>
              <span className="font-semibold text-emerald-600">RD${(opportunitiesValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pipeline:</span>
              <span className="font-semibold text-indigo-600">RD${(pipelineValue / 1000).toFixed(0)}K</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => navigate('/opportunities')}>
            Pipeline
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Actividades */}
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Actividades</span>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-3xl font-bold text-slate-800">
              {activitiesPercentage}%
            </span>
          </div>

          <p className="text-sm text-slate-500 mb-3">
            vs meta mensual
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-400">📞</span>
              <span className="ml-1 font-medium">{calls.current}/{calls.target}</span>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-400">🤝</span>
              <span className="ml-1 font-medium">{meetings.current}/{meetings.target}</span>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-400">📧</span>
              <span className="ml-1 font-medium">{emails.current}/{emails.target}</span>
            </div>
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-400">✈️</span>
              <span className="ml-1 font-medium">{visits.current}/{visits.target}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-3 text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => navigate('/activities')}>
            Ver detalle
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default KPICards;
