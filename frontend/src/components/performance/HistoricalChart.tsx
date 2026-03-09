// ============================================
// ANTU CRM - Historical Chart Component
// Historial de cumplimiento - últimos 12 meses
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MonthlyPerformance } from '@/types/performance';

interface HistoricalChartProps {
  data: MonthlyPerformance[];
  getQuotaColor: (p: number) => string;
}

export function HistoricalChart({ data, getQuotaColor }: HistoricalChartProps) {
  const navigate = useNavigate();
  const average = Math.round(data.reduce((acc, item) => acc + item.percentage, 0) / data.length);
  const bestMonth = data.reduce((best, item) => item.percentage > best.percentage ? item : best, data[0]);

  // Calcular tendencia (últimos 3 meses vs 3 meses anteriores)
  const recent = data.slice(0, 3).reduce((acc, item) => acc + item.percentage, 0) / 3;
  const previous = data.slice(3, 6).reduce((acc, item) => acc + item.percentage, 0) / 3;
  const trend = recent > previous ? '↗️' : recent < previous ? '↘️' : '→';

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            Historial de Cumplimiento
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/reports')}>
              <FileText className="w-4 h-4" />
              Ver detalle
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const color = getQuotaColor(item.percentage);
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-slate-600">
                  {item.period}
                </div>
                <div className="flex-1 relative">
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: color
                      }}
                    >
                      {item.percentage >= 40 && (
                        <span className="text-xs font-bold text-white">{item.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-28 text-right text-sm text-slate-500">
                  RD${(item.achieved / 1000).toFixed(0)}K / RD${(item.target / 1000).toFixed(0)}K
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Promedio anual:</span>
            <span className="font-semibold text-slate-700">{average}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Mejor mes:</span>
            <span className="font-semibold text-emerald-600">
              {bestMonth.period} ({bestMonth.percentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tendencia:</span>
            <span className="font-semibold text-slate-700">{trend}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoricalChart;
