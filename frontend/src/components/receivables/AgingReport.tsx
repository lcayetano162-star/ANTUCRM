import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import type { PortfolioSummary } from '@/types/receivables';

interface AgingReportProps {
  summary: PortfolioSummary;
}

export function AgingReport({ summary }: AgingReportProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const agingData = [
    {
      label: 'Por Cobrar (No vencido)',
      amount: summary.aging.current,
      percentage: summary.totalPortfolio > 0 ? (summary.aging.current / summary.totalPortfolio) * 100 : 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: '',
    },
    {
      label: '1-30 días (Vencido)',
      amount: summary.aging.days1to30,
      percentage: summary.totalPortfolio > 0 ? (summary.aging.days1to30 / summary.totalPortfolio) * 100 : 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      status: '🟡 Atención',
    },
    {
      label: '31-60 días (Riesgo)',
      amount: summary.aging.days31to60,
      percentage: summary.totalPortfolio > 0 ? (summary.aging.days31to60 / summary.totalPortfolio) * 100 : 0,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      status: '🟠 Priorizar',
    },
    {
      label: '61-90 días (Crítico)',
      amount: summary.aging.days61to90,
      percentage: summary.totalPortfolio > 0 ? (summary.aging.days61to90 / summary.totalPortfolio) * 100 : 0,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      status: '🔴 Urgente',
    },
    {
      label: '>90 días (Dudoso)',
      amount: summary.aging.daysOver90,
      percentage: summary.totalPortfolio > 0 ? (summary.aging.daysOver90 / summary.totalPortfolio) * 100 : 0,
      color: 'bg-red-900',
      textColor: 'text-red-900',
      bgColor: 'bg-red-100',
      status: '⚫ Cobro judicial',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            Análisis de Aging (Antigüedad de Saldos)
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">Corte al 20/02/2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de barras */}
        <div className="space-y-4">
          {agingData.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.status && (
                    <span className="text-xs">{item.status}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${item.textColor}`}>
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-sm text-slate-500 w-12 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${Math.max(item.percentage, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalPortfolio)}
            </p>
            <p className="text-xs text-slate-500">Total Cartera</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalOverdue)}
            </p>
            <p className="text-xs text-slate-500">
              Vencido ({summary.overduePercentage.toFixed(0)}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {summary.averageDSO} días
            </p>
            <p className="text-xs text-slate-500">
              DSO Promedio {summary.averageDSO > 28 ? '↗️' : '↘️'} vs meta
            </p>
          </div>
        </div>

        {/* Tendencia */}
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div>
            <p className="font-medium text-amber-900">Tendencia del DSO</p>
            <p className="text-sm text-amber-700">
              +2 días vs mes anterior. Se recomienda enfocar esfuerzos en cartera 31-60 días.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-amber-300 text-amber-700">
            Ver detalle por cliente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
