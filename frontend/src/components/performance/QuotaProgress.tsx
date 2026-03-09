// ============================================
// ANTU CRM - Quota Progress Component
// Visualización principal de cumplimiento de cuota
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react';

interface QuotaProgressProps {
  monthName: string;
  year: number;
  target: number;
  achieved: number;
  percentage: number;
  remaining: number;
  projected: number;
  projectedPercentage: number;
  getQuotaColor: (p: number) => string;
}

export function QuotaProgress({
  monthName,
  year,
  target,
  achieved,
  percentage,
  remaining,
  projected,
  projectedPercentage,
  getQuotaColor
}: QuotaProgressProps) {
  const quotaColor = getQuotaColor(percentage);
  
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          Cumplimiento de Cuota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensual */}
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
              {monthName} {year}
            </h3>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">Meta</p>
              <p className="text-xl font-bold text-slate-700">RD${target.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">Alcanzado</p>
              <p className="text-xl font-bold" style={{ color: quotaColor }}>
                RD${achieved.toLocaleString()} ({percentage}%)
              </p>
            </div>
          </div>
          
          {/* Barra de progreso principal */}
          <div className="relative mb-4">
            <div className="h-6 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: quotaColor
                }}
              >
                {percentage >= 30 && (
                  <span className="text-xs font-bold text-white">{percentage}%</span>
                )}
              </div>
            </div>
            {/* Marcadores de porcentaje */}
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Indicador de posición */}
          <div className="text-center mb-4">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${quotaColor}20`, color: quotaColor }}
            >
              <TrendingUp className="w-4 h-4" />
              TÚ ESTÁS AQUÍ ({percentage}%)
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-slate-500 mb-1">Faltan para meta</p>
              <p className="text-lg font-bold text-slate-700">RD${remaining.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-slate-500 mb-1">Proyectado al cierre</p>
              <p className="text-lg font-bold text-indigo-600">
                RD${projected.toLocaleString()} ({projectedPercentage}%)
              </p>
            </div>
          </div>
        </div>
        
        {/* Insight de IA */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 mb-1">
                💡 IA: Recomendación para alcanzar meta
              </p>
              <p className="text-sm text-amber-700">
                Necesitas cerrar <strong>1 oportunidad de ~RD$15K</strong> o 
                generar <strong>RD$20K adicionales</strong> en pipeline.
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-amber-700 hover:text-amber-800 font-medium mt-2"
              >
                Ver oportunidades recomendadas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default QuotaProgress;
