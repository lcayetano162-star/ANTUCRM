import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, X, ChevronRight } from 'lucide-react';
import type { AIAlert } from '@/types/receivables';

interface AIAlertsProps {
  alerts: AIAlert[];
  onMarkAsRead: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

export function AIAlerts({ alerts, onMarkAsRead, onDismiss }: AIAlertsProps) {
  const getAlertIcon = (type: AIAlert['type']) => {
    switch (type) {
      case 'HIGH_RISK':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'DUE_TODAY':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'PAYMENT_EXPECTED':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'PATTERN_CHANGE':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getSeverityColor = (severity: AIAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getAlertTypeLabel = (type: AIAlert['type']) => {
    switch (type) {
      case 'HIGH_RISK':
        return 'Alto Riesgo';
      case 'DUE_TODAY':
        return 'Vence Hoy';
      case 'PAYMENT_EXPECTED':
        return 'Pago Esperado';
      case 'PATTERN_CHANGE':
        return 'Cambio de Patrón';
      default:
        return type;
    }
  };

  const unreadAlerts = alerts.filter(a => !a.read);

  if (unreadAlerts.length === 0) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-900">¡Todo bajo control!</p>
              <p className="text-sm text-emerald-700">No hay alertas que requieran atención inmediata.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas IA - Requieren Acción
          <Badge variant="secondary" className="ml-2">
            {unreadAlerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unreadAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} relative group`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{alert.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {getAlertTypeLabel(alert.type)}
                  </Badge>
                </div>
                <p className="text-sm opacity-90">{alert.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onMarkAsRead(alert.id)}
                  >
                    Marcar como leída
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Ver detalle
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
