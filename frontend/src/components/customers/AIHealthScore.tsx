// ============================================
// ANTU CRM - AI Health Score Component
// Visualización del Health Score predictivo
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Heart,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { HealthScore, HealthScoreDetail } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface AIHealthScoreProps {
  healthScore: HealthScore;
  healthScoreDetails?: HealthScoreDetail[];
  onRefresh?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function AIHealthScore({ healthScore, healthScoreDetails, onRefresh }: AIHealthScoreProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Necesita atención';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5" />;
    if (score >= 60) return <Minus className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-violet-600" />
            </div>
            <span className="font-semibold text-slate-700">Health Score IA</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 text-slate-500"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Score */}
        <div className="text-center mb-4">
          <div className={cn('text-5xl font-bold mb-1', getScoreColor(healthScore.overall))}>
            {healthScore.overall}
            <span className="text-2xl text-slate-400">/100</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            {getScoreIcon(healthScore.overall)}
            <span className={cn('font-medium', getScoreColor(healthScore.overall))}>
              {getScoreLabel(healthScore.overall)}
            </span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-800">{healthScore.financial}</div>
            <div className="text-xs text-slate-500">Financiero</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-800">{healthScore.engagement}</div>
            <div className="text-xs text-slate-500">Engagement</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-xl font-bold text-slate-800">{healthScore.relational}</div>
            <div className="text-xs text-slate-500">Relacional</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', getScoreBgColor(healthScore.overall))}
              style={{ width: `${healthScore.overall}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Actualizado: {formatDate(healthScore.lastUpdated)}</span>
          <button
            onClick={() => setShowDetails(true)}
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Ver análisis completo →
          </button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-violet-600" />
              Análisis Detallado del Health Score
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className={cn('text-6xl font-bold', getScoreColor(healthScore.overall))}>
                {healthScore.overall}
              </div>
              <p className="text-slate-500 mt-2">Health Score General</p>
              <p className="text-sm text-slate-400 mt-1">
                Fórmula: (Financiero × 0.35) + (Engagement × 0.35) + (Relacional × 0.30)
              </p>
            </div>

            {/* Category Details */}
            {healthScoreDetails?.map((detail) => (
              <div key={detail.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">
                    {detail.category === 'financial' && '💰 Financiero'}
                    {detail.category === 'engagement' && '📊 Engagement'}
                    {detail.category === 'relational' && '🤝 Relacional'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xl font-bold', getScoreColor(detail.score))}>
                      {detail.score}
                    </span>
                    <span className="text-sm text-slate-400">({Math.round(detail.weight * 100)}% peso)</span>
                  </div>
                </div>

                <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                  <div
                    className={cn('h-full', getScoreBgColor(detail.score))}
                    style={{ width: `${detail.score}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {detail.factors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {factor.score >= 80 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : factor.score >= 60 ? (
                          <Info className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-sm">{factor.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{factor.description}</span>
                        <span className={cn('font-medium', getScoreColor(factor.score))}>
                          {factor.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Update Info */}
            <div className="text-center text-sm text-slate-500">
              <p>Última actualización: {formatDate(healthScore.lastUpdated)}</p>
              <p>Próxima actualización: {formatDate(healthScore.nextUpdate)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIHealthScore;
