import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, Calendar, AlertTriangle, Clock, CheckCircle, TrendingDown, DollarSign } from 'lucide-react';
import type { Receivable, ReceivableStatus } from '@/types/receivables';

interface ReceivablesListProps {
  receivables: Receivable[];
  onManage: (receivable: Receivable, tab?: string) => void;
}

export function ReceivablesList({ receivables, onManage }: ReceivablesListProps) {
  const [activeTab, setActiveTab] = useState<ReceivableStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'amount' | 'days'>('priority');

  const filteredReceivables = activeTab === 'ALL'
    ? receivables
    : receivables.filter(r => r.status === activeTab);

  const sortedReceivables = [...filteredReceivables].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return riskOrder[a.aiPrediction.riskLevel] - riskOrder[b.aiPrediction.riskLevel];
      case 'date':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'amount':
        return b.balance - a.balance;
      case 'days':
        return b.daysOverdue - a.daysOverdue;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status: ReceivableStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Por Cobrar</Badge>;
      case 'DUE_TODAY':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Vence Hoy</Badge>;
      case 'OVERDUE':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Vencida</Badge>;
      case 'IN_COLLECTION':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">En Gestión</Badge>;
      case 'PAYMENT_AGREEMENT':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Acuerdo Pago</Badge>;
      case 'PAID':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pagada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (riskLevel: string, probability: number) => {
    const configs = {
      CRITICAL: { bg: 'bg-red-900', text: 'text-white', icon: AlertTriangle, label: 'URG' },
      HIGH: { bg: 'bg-red-500', text: 'text-white', icon: TrendingDown, label: 'MED' },
      MEDIUM: { bg: 'bg-amber-500', text: 'text-white', icon: Clock, label: 'MED' },
      LOW: { bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle, label: 'BAJ' },
    };

    const config = configs[riskLevel as keyof typeof configs] || configs.LOW;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{config.label}</span>
        <span className="text-xs">{probability}% riesgo</span>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDaysLabel = (days: number) => {
    if (days < 0) return `En ${Math.abs(days)} días`;
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  };

  const getActionButton = (receivable: Receivable) => {
    const risk = receivable.aiPrediction.riskLevel;

    if (risk === 'CRITICAL' || risk === 'HIGH') {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="destructive" onClick={() => onManage(receivable)}>
            <Phone className="h-4 w-4 mr-1" />
            Gestionar
          </Button>
        </div>
      );
    }

    if (risk === 'MEDIUM') {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="border-amber-500 text-amber-600" onClick={() => onManage(receivable)}>
            <Mail className="h-4 w-4 mr-1" />
            Gestionar
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => onManage(receivable)}>
          <Clock className="h-4 w-4 mr-1" />
          Monitorear
        </Button>
      </div>
    );
  };

  const tabs = [
    { value: 'ALL', label: 'Todas', count: receivables.length },
    { value: 'PENDING', label: 'Por Cobrar', count: receivables.filter(r => r.status === 'PENDING').length },
    { value: 'DUE_TODAY', label: 'Vencen Hoy', count: receivables.filter(r => r.status === 'DUE_TODAY').length },
    { value: 'OVERDUE', label: 'Vencidas', count: receivables.filter(r => r.status === 'OVERDUE').length },
    { value: 'IN_COLLECTION', label: 'En Gestión', count: receivables.filter(r => r.status === 'IN_COLLECTION').length },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Listado Inteligente con Priorización IA</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="priority">Prioridad IA</option>
              <option value="date">Fecha vencimiento</option>
              <option value="amount">Monto</option>
              <option value="days">Días vencido</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReceivableStatus | 'ALL')}>
          <TabsList className="mb-4 flex-wrap h-auto">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="relative">
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Prioridad IA</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No hay facturas en esta categoría
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedReceivables.map((receivable) => (
                    <TableRow
                      key={receivable.id}
                      className={`hover:bg-slate-50 ${receivable.aiPrediction.riskLevel === 'CRITICAL' ? 'bg-red-50' :
                          receivable.aiPrediction.riskLevel === 'HIGH' ? 'bg-amber-50/50' : ''
                        }`}
                    >
                      <TableCell>
                        {getPriorityBadge(
                          receivable.aiPrediction.riskLevel,
                          100 - receivable.aiPrediction.paymentProbability
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{receivable.customerName}</p>
                          <p className="text-xs text-slate-500">Vendedor: {receivable.sellerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{receivable.invoiceNumber}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className={receivable.daysOverdue > 0 ? 'text-red-600 font-medium' : ''}>
                            {getDaysLabel(receivable.daysOverdue)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(receivable.balance)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receivable.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getActionButton(receivable)}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => onManage(receivable, 'actions')}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Cobrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
