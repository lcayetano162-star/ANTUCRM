import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, CheckCircle, XCircle, 
  Settings, Activity, FileText, ExternalLink, Plus
} from 'lucide-react';
import type { PaymentGateway, GatewayStatus, GatewayType } from '@/types/payments';

interface PaymentGatewaysListProps {
  gateways: PaymentGateway[];
  onConfigure: (gateway: PaymentGateway) => void;
  onToggleStatus: (gatewayId: string, status: GatewayStatus) => void;
  onTestConnection: (gatewayId: string) => void;
}

export function PaymentGatewaysList({ 
  gateways, 
  onConfigure, 
  onToggleStatus, 
  onTestConnection 
}: PaymentGatewaysListProps) {
  
  const getStatusBadge = (status: GatewayStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">🟢 Activo</Badge>;
      case 'INACTIVE':
        return <Badge variant="outline" className="text-slate-500">⚫ Inactivo</Badge>;
      case 'PENDING_SETUP':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">🟡 Pendiente</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">🔴 Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGatewayIcon = (type: GatewayType) => {
    switch (type) {
      case 'AZUL':
        return <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">AZ</div>;
      case 'TPAGO':
        return <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">TP</div>;
      case 'DLOCAL':
        return <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">DL</div>;
      case 'PAYPAL':
        return <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">PP</div>;
      case 'STRIPE':
        return <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">ST</div>;
      default:
        return <CreditCard className="h-10 w-10 text-slate-400" />;
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const groupByRegion = () => {
    const groups: Record<string, PaymentGateway[]> = {
      'DOMINICAN_REPUBLIC': [],
      'LATAM': [],
      'GLOBAL': [],
    };
    
    gateways.forEach(gw => {
      groups[gw.region].push(gw);
    });
    
    return groups;
  };

  const regionLabels: Record<string, string> = {
    'DOMINICAN_REPUBLIC': 'República Dominicana (Mercado principal)',
    'LATAM': 'Latinoamérica (Expansión)',
    'GLOBAL': 'Global / Internacional',
  };

  const groupedGateways = groupByRegion();

  return (
    <div className="space-y-6">
      {Object.entries(groupedGateways).map(([region, regionGateways]) => (
        <Card key={region}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{regionLabels[region]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {regionGateways.map((gateway) => (
              <div 
                key={gateway.id} 
                className={`p-4 rounded-lg border ${
                  gateway.status === 'ACTIVE' ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="flex-shrink-0">
                    {getGatewayIcon(gateway.type)}
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{gateway.displayName}</h3>
                        {getStatusBadge(gateway.status)}
                      </div>
                      <Switch
                        checked={gateway.status === 'ACTIVE'}
                        onCheckedChange={(checked) => 
                          onToggleStatus(gateway.id, checked ? 'ACTIVE' : 'INACTIVE')
                        }
                      />
                    </div>

                    <p className="text-sm text-slate-500 mb-3">{gateway.description}</p>

                    {/* Detalles */}
                    {gateway.status === 'ACTIVE' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Comisión</p>
                          <p className="font-medium">{gateway.commission.percentage}% + {formatCurrency(gateway.commission.fixedAmount, gateway.commission.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Liquidación</p>
                          <p className="font-medium">T+{gateway.settlementDays} días</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Transacciones (24h)</p>
                          <p className="font-medium">{gateway.stats?.last24hTransactions || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Tasa de éxito</p>
                          <p className="font-medium text-emerald-600">{gateway.stats?.successRate || 0}%</p>
                        </div>
                      </div>
                    )}

                    {/* Credenciales mascaradas */}
                    {gateway.status === 'ACTIVE' && gateway.credentials.merchantId && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                        <span>Merchant ID: ********{gateway.credentials.merchantId.slice(-4)}</span>
                        <span className="text-slate-300">|</span>
                        <span>Modo: {gateway.config.mode === 'PRODUCTION' ? 'Producción' : 'Sandbox'}</span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onConfigure(gateway)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                      
                      {gateway.status === 'ACTIVE' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onTestConnection(gateway.id)}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            Verificar
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Transacciones
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Logs
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Resultado de última prueba */}
                    {gateway.lastTestDate && (
                      <div className={`flex items-center gap-2 mt-3 text-sm ${
                        gateway.lastTestResult ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {gateway.lastTestResult ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>Última prueba: {new Date(gateway.lastTestDate).toLocaleDateString('es-DO')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Agregar pasarela personalizada */}
      <Button variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar pasarela personalizada (API genérica)
      </Button>
    </div>
  );
}
