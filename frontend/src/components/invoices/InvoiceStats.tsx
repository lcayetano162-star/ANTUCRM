// ============================================
// ANTU CRM - Invoice Stats Component
// Estadísticas de facturación
// ============================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  DollarSign 
} from 'lucide-react';
import type { InvoiceStats } from '@/types/invoice';

interface InvoiceStatsProps {
  stats: InvoiceStats;
}

export function InvoiceStatsPanel({ stats }: InvoiceStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
      badge: stats.pending > 0 ? `${stats.pending} por facturar` : undefined,
    },
    {
      label: 'Enviadas a DGII',
      value: stats.sentToDgii,
      icon: Send,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Aprobadas Hoy',
      value: stats.approvedToday,
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Rechazadas',
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5" />
                </div>
                {card.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Monto Total Facturado Hoy</p>
                <p className="text-3xl font-bold text-indigo-700">
                  {formatCurrency(stats.totalAmountToday)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">+12% vs ayer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvoiceStatsPanel;
