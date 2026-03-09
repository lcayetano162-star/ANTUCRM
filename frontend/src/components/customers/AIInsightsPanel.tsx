// ============================================
// ANTU CRM - AI Insights Panel
// Panel de insights de IA en tiempo real
// ============================================

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Lightbulb,
  AlertTriangle,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { AIInsight } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

// ============================================
// COMPONENT
// ============================================

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'BUYING_MOMENT':
        return <Target className="w-5 h-5 text-emerald-600" />;
      case 'RISK':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'OPPORTUNITY':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'ALERT':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'RECOMMENDATION':
        return <Lightbulb className="w-5 h-5 text-violet-600" />;
      default:
        return <Zap className="w-5 h-5 text-cyan-600" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'BUYING_MOMENT':
        return 'border-emerald-200 bg-emerald-50';
      case 'RISK':
        return 'border-rose-200 bg-rose-50';
      case 'OPPORTUNITY':
        return 'border-blue-200 bg-blue-50';
      case 'ALERT':
        return 'border-amber-200 bg-amber-50';
      case 'RECOMMENDATION':
        return 'border-violet-200 bg-violet-50';
      default:
        return 'border-cyan-200 bg-cyan-50';
    }
  };

  const getTypeLabel = (type: AIInsight['type']) => {
    switch (type) {
      case 'BUYING_MOMENT':
        return 'Momento de compra';
      case 'RISK':
        return 'Riesgo detectado';
      case 'OPPORTUNITY':
        return 'Oportunidad';
      case 'ALERT':
        return 'Alerta';
      case 'RECOMMENDATION':
        return 'Recomendación';
      default:
        return 'Insight';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h4 className="font-medium text-slate-700 mb-1">Sin insights nuevos</h4>
        <p className="text-sm text-slate-500">
          El análisis de IA no ha detectado patrones significativos en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className={cn(
            'p-4 rounded-xl border transition-all hover:shadow-md',
            getInsightColor(insight.type)
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-white">
                  {getTypeLabel(insight.type)}
                </Badge>
                {insight.confidence && (
                  <span className="text-xs text-slate-500">
                    Confianza: {insight.confidence}%
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-slate-800">{insight.title}</h4>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-3 ml-13 pl-13">
            {insight.description}
          </p>

          {/* Probability */}
          {insight.probability && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-500">Probabilidad</span>
                <span className="font-medium text-slate-700">{insight.probability}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    insight.probability >= 70 ? 'bg-emerald-500' :
                    insight.probability >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${insight.probability}%` }}
                />
              </div>
            </div>
          )}

          {/* Action */}
          {insight.actionable && insight.actionText && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="bg-white hover:bg-slate-50"
                onClick={() => toast.success(`Acción: ${insight.actionText}`)}
              >
                {insight.actionText}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AIInsightsPanel;
