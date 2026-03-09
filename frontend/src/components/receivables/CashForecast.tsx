import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { TrendingUp, TrendingDown, Minus, Calendar, Lightbulb, ArrowRight } from 'lucide-react';
import type { CashForecast } from '@/types/receivables';

interface CashForecastProps {
  forecasts: CashForecast[];
}

export function CashForecastView({ forecasts }: CashForecastProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-emerald-600';
    if (variance < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  const getConfidenceBadge = (interval: number) => {
    if (interval <= 5) return <Badge className="bg-emerald-100 text-emerald-700">🟢 Alta</Badge>;
    if (interval <= 10) return <Badge className="bg-amber-100 text-amber-700">🟡 Media</Badge>;
    if (interval <= 15) return <Badge className="bg-orange-100 text-orange-700">🟠 Baja</Badge>;
    return <Badge className="bg-red-100 text-red-700">🔴 Incierta</Badge>;
  };

  const totalEstimated = forecasts.reduce((sum, f) => sum + f.estimatedCollections, 0);
  const totalExpected = forecasts.reduce((sum, f) => sum + f.expectedAmount, 0);
  const totalVariance = totalEstimated - totalExpected;
  const totalVariancePct = totalExpected > 0 ? (totalVariance / totalExpected) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              Proyección de Cobros - Próximos 30 Días
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Basado en modelo predictivo de comportamiento de pago
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen General */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalEstimated)}
              </p>
              <p className="text-xs text-slate-500">Total Estimado (30 días)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalExpected)}
              </p>
              <p className="text-xs text-slate-500">Total Esperado</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getVarianceColor(totalVariance)}`}>
                {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
              </p>
              <p className="text-xs text-slate-500">
                Diferencia ({totalVariancePct >= 0 ? '+' : ''}{totalVariancePct.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Proyección por semana */}
          <div className="space-y-4">
            {forecasts.map((forecast, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">{forecast.period}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getConfidenceBadge(forecast.confidenceInterval)}
                    {getVarianceIcon(forecast.variance)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Estimado</p>
                    <p className="font-semibold">{formatCurrency(forecast.estimatedCollections)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Confirmado</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(forecast.confirmedPayments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Probable (80%+)</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(forecast.probablePayments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Posible (50-80%)</p>
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(forecast.possiblePayments)}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">vs esperado ({formatCurrency(forecast.expectedAmount)})</span>
                    <span className={getVarianceColor(forecast.variance)}>
                      {forecast.variance >= 0 ? '+' : ''}{formatCurrency(forecast.variance)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        forecast.variance >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min((forecast.estimatedCollections / forecast.expectedAmount) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerta de déficit */}
          {totalVariance < 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">
                    Déficit Proyectado: {formatCurrency(Math.abs(totalVariance))} ({Math.abs(totalVariancePct).toFixed(0)}%)
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Se proyecta un déficit de flujo de caja para el próximo mes. 
                    Considere acelerar cobros de facturas vencidas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendación IA */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Acción Recomendada por IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900">
            "Acelerar cobros de facturas 31-60 días podría reducir el déficit a $150,000. 
            Enfocar esfuerzos en <strong>Corp. XYZ</strong> y <strong>Grupo ABC</strong> 
            (representan 60% del riesgo de impago)."
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700">
              Ver análisis completo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700">
              Ajustar proyección manualmente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
