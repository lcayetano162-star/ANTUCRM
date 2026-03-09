import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, Download, FileSpreadsheet, 
  AlertTriangle, CheckCircle, Clock, CreditCard
} from 'lucide-react';
import type { FinancialReport } from '@/types/payments';

interface PaymentReportsProps {
  report: FinancialReport;
}

export function PaymentReports({ report }: PaymentReportsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const collectionRate = report.summary.collectionRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reportes de Pagos y Facturación</h2>
          <p className="text-sm text-slate-500">
            Período: {report.period.start} - {report.period.end}
          </p>
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
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Facturado</p>
            <p className="text-2xl font-bold">{formatCurrency(report.summary.totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Cobrado</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(report.summary.totalCollected)}</p>
            <p className="text-xs text-emerald-600">({collectionRate.toFixed(0)}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Pendiente</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(report.summary.totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Fallido</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(report.summary.totalFailed)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasa de cobranza */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasa de Cobranza</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={collectionRate} className="h-4" />
            </div>
            <span className="text-2xl font-bold">{collectionRate.toFixed(1)}%</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {collectionRate >= 90 ? '🟢 Excelente' : collectionRate >= 80 ? '🟡 Buena' : '🔴 Necesita atención'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Pasarela */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Por Pasarela
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.byGateway.map((gateway, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{gateway.gateway}</span>
                    <span className="text-sm">{gateway.transactions} trans.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500">Monto</p>
                      <p className="font-medium">{formatCurrency(gateway.amount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Comisión</p>
                      <p className="text-red-600">-{formatCurrency(gateway.commission)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Neto</p>
                      <p className="font-medium text-emerald-600">{formatCurrency(gateway.netAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.byStatus.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {status.status === 'APPROVED' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    {status.status === 'DECLINED' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {status.status === 'PENDING' && <Clock className="h-5 w-5 text-amber-500" />}
                    <span className="font-medium">
                      {status.status === 'APPROVED' ? 'Aprobadas' : 
                       status.status === 'DECLINED' ? 'Rechazadas' : 'Pendientes'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{status.count}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(status.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conciliación Bancaria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Conciliación Bancaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-slate-500">Depósitos esperados</p>
              <p className="text-xl font-bold">{formatCurrency(report.reconciliation.expectedDeposits)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg text-center">
              <p className="text-sm text-emerald-600">Confirmados</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(report.reconciliation.confirmedDeposits)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-sm text-amber-600">Pendientes</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(report.reconciliation.pendingDeposits)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Azul: Depósito esperado mañana RD$95,052 (T+1)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Tpago: Depósito confirmado RD$26,936</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Dlocal: 3 transacciones en clearing</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Descargar reporte detallado
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar para contabilidad
            </Button>
            <Button variant="outline" size="sm">
              Conciliar manualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Fraude */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Fraude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-red-900 font-medium">
                🚨 2 transacciones marcadas para revisión
              </p>
              <p className="text-sm text-red-700 mt-1">
                • Velocidad inusual: 5 transacciones en 10 minutos desde diferentes IPs<br/>
                • Monto inusual: Transacción de $50,000 vs promedio de $5,000
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-red-300 text-red-700">
              Ver detalle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
