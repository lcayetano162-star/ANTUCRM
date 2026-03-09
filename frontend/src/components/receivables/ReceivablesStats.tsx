import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Clock, Wallet, AlertTriangle, Target } from 'lucide-react';
import type { PortfolioSummary } from '@/types/receivables';

interface ReceivablesStatsProps {
  summary: PortfolioSummary;
}

export function ReceivablesStats({ summary }: ReceivablesStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      title: 'DSO (Días)',
      value: summary.averageDSO.toString(),
      subtitle: 'vs meta de 28',
      icon: Clock,
      trend: summary.averageDSO > 28 ? 'up' : 'down',
      trendValue: `${summary.averageDSO > 28 ? '+' : ''}${summary.averageDSO - 28} días`,
      color: summary.averageDSO > 28 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: summary.averageDSO > 28 ? 'bg-amber-50' : 'bg-emerald-50',
    },
    {
      title: 'Cartera Total',
      value: formatCurrency(summary.totalPortfolio),
      subtitle: `${summary.totalInvoices} facturas`,
      icon: Wallet,
      trend: 'neutral',
      trendValue: '',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Vencido >30 días',
      value: formatCurrency(summary.aging.days31to60 + summary.aging.days61to90 + summary.aging.daysOver90),
      subtitle: `${summary.overduePercentage.toFixed(0)}% de cartera`,
      icon: AlertTriangle,
      trend: 'up',
      trendValue: '14% cartera',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Cobranza Efectiva (CEI)',
      value: `${summary.collectionEffectiveness}%`,
      subtitle: 'vs mes anterior',
      icon: Target,
      trend: 'up',
      trendValue: '+5%',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-l-4 border-l-transparent hover:border-l-current transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stat.value}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{stat.subtitle}</span>
              {stat.trend !== 'neutral' && (
                <span className={`flex items-center text-xs ${stat.trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.trendValue}
                </span>
              )}
              {stat.trend === 'neutral' && stat.trendValue && (
                <span className="flex items-center text-xs text-slate-400">
                  <Minus className="h-3 w-3 mr-0.5" />
                  {stat.trendValue}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
