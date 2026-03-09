// ============================================
// ANTU CRM - Churn Prediction Component
// Predicción de riesgo de pérdida del cliente
// ============================================

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { ChurnPrediction } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface ChurnPredictionProps {
  prediction: ChurnPrediction;
  onRefresh?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ChurnPredictionPanel({ prediction, onRefresh }: ChurnPredictionProps) {
  const getRiskColor = (level: ChurnPrediction['riskLevel']) => {
    switch (level) {
      case 'LOW':
        return 'text-emerald-600';
      case 'MEDIUM':
        return 'text-amber-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'CRITICAL':
        return 'text-rose-600';
      default:
        return 'text-slate-600';
    }
  };

  const getRiskBgColor = (level: ChurnPrediction['riskLevel']) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500';
      case 'MEDIUM':
        return 'bg-amber-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'CRITICAL':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getRiskLabel = (level: ChurnPrediction['riskLevel']) => {
    switch (level) {
      case 'LOW':
        return 'BAJO';
      case 'MEDIUM':
        return 'MEDIO';
      case 'HIGH':
        return 'ALTO';
      case 'CRITICAL':
        return 'CRÍTICO';
      default:
        return 'DESCONOCIDO';
    }
  };

  const getRiskIcon = (level: ChurnPrediction['riskLevel']) => {
    switch (level) {
      case 'LOW':
        return <Shield className="w-6 h-6" />;
      case 'MEDIUM':
        return <AlertCircle className="w-6 h-6" />;
      case 'HIGH':
        return <AlertTriangle className="w-6 h-6" />;
      case 'CRITICAL':
        return <TrendingDown className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
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
    <div className={cn(
      'rounded-xl p-4 border',
      prediction.riskLevel === 'LOW' && 'bg-emerald-50 border-emerald-200',
      prediction.riskLevel === 'MEDIUM' && 'bg-amber-50 border-amber-200',
      prediction.riskLevel === 'HIGH' && 'bg-orange-50 border-orange-200',
      prediction.riskLevel === 'CRITICAL' && 'bg-rose-50 border-rose-200',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            prediction.riskLevel === 'LOW' && 'bg-emerald-100',
            prediction.riskLevel === 'MEDIUM' && 'bg-amber-100',
            prediction.riskLevel === 'HIGH' && 'bg-orange-100',
            prediction.riskLevel === 'CRITICAL' && 'bg-rose-100',
          )}>
            {getRiskIcon(prediction.riskLevel)}
          </div>
          <span className="font-semibold text-slate-700">Riesgo de Churn</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Risk Level */}
      <div className="text-center mb-4">
        <div className={cn('text-4xl font-bold mb-1', getRiskColor(prediction.riskLevel))}>
          {getRiskLabel(prediction.riskLevel)}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={cn('text-2xl font-bold', getRiskColor(prediction.riskLevel))}>
            {prediction.probability}%
          </span>
          <span className="text-slate-400">probabilidad</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-200">
          <div
            className={cn('h-full transition-all duration-500', getRiskBgColor(prediction.riskLevel))}
            style={{ width: `${prediction.probability}%` }}
          />
        </div>
      </div>

      {/* Protective Factors */}
      {prediction.protectiveFactors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Factores protectores
          </h4>
          <ul className="space-y-1">
            {prediction.protectiveFactors.map((factor, index) => (
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {prediction.riskFactors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Factores de riesgo
          </h4>
          <ul className="space-y-1">
            {prediction.riskFactors.map((factor, index) => (
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-rose-500 mt-1">!</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {prediction.recommendedActions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            Acciones recomendadas
          </h4>
          <ul className="space-y-1">
            {prediction.recommendedActions.map((action, index) => (
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-cyan-500 mt-1">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
        <span>Actualizado: {formatDate(prediction.lastUpdated)}</span>
        {prediction.riskLevel !== 'LOW' && (
          <Button size="sm" variant="outline" className="h-7 text-xs bg-white">
            Ver plan de retención
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default ChurnPredictionPanel;
