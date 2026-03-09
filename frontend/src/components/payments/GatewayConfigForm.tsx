import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Save, TestTube, FileText, ExternalLink,
  CreditCard, Shield, RefreshCw
} from 'lucide-react';
import type { PaymentGateway } from '@/types/payments';

interface GatewayConfigFormProps {
  gateway: PaymentGateway;
  onSave: (gateway: PaymentGateway) => void;
  onCancel: () => void;
  onTest: (gatewayId: string) => void;
}

export function GatewayConfigForm({ gateway, onSave, onCancel, onTest }: GatewayConfigFormProps) {
  const [formData, setFormData] = useState<PaymentGateway>({ ...gateway });
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    onSave(formData);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onTest(gateway.id);
    setIsTesting(false);
  };

  const updateCredentials = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [key]: value }
    }));
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configuración: {gateway.displayName}</h2>
            <p className="text-sm text-slate-500">{gateway.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isTesting}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Probando...' : 'Probar conexión'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda - Credenciales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credenciales de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Merchant ID */}
            <div>
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                value={formData.credentials.merchantId || ''}
                onChange={(e) => updateCredentials('merchantId', e.target.value)}
                placeholder="Ej: 1234567890"
              />
            </div>

            {/* API Key */}
            <div>
              <Label htmlFor="apiKey">API Key / Auth Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.credentials.apiKey || ''}
                onChange={(e) => updateCredentials('apiKey', e.target.value)}
                placeholder="***************************"
              />
            </div>

            {/* Secret Key */}
            <div>
              <Label htmlFor="secretKey">Secret Key / Auth Token</Label>
              <Input
                id="secretKey"
                type="password"
                value={formData.credentials.secretKey || formData.credentials.authToken || ''}
                onChange={(e) => updateCredentials('secretKey', e.target.value)}
                placeholder="***************************"
              />
            </div>

            {/* Terminal ID */}
            {gateway.type === 'AZUL' && (
              <div>
                <Label htmlFor="terminalId">Terminal ID</Label>
                <Input
                  id="terminalId"
                  value={formData.credentials.terminalId || ''}
                  onChange={(e) => updateCredentials('terminalId', e.target.value)}
                  placeholder="Ej: TERM001"
                />
              </div>
            )}

            {/* Client ID / Client Secret para PayPal */}
            {gateway.type === 'PAYPAL' && (
              <>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={formData.credentials.clientId || ''}
                    onChange={(e) => updateCredentials('clientId', e.target.value)}
                    placeholder="***************************"
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={formData.credentials.clientSecret || ''}
                    onChange={(e) => updateCredentials('clientSecret', e.target.value)}
                    placeholder="***************************"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Validar conexión
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Ver documentación
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha - Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configuración de Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Modo */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Modo de operación</p>
                <p className="text-sm text-slate-500">Sandbox para pruebas, Producción para cobros reales</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={formData.config.mode === 'PRODUCTION' ? 'default' : 'secondary'}>
                  {formData.config.mode === 'PRODUCTION' ? 'Producción' : 'Sandbox'}
                </Badge>
                <Switch
                  checked={formData.config.mode === 'PRODUCTION'}
                  onCheckedChange={(checked) => updateConfig('mode', checked ? 'PRODUCTION' : 'SANDBOX')}
                />
              </div>
            </div>

            {/* Monedas */}
            <div>
              <Label>Monedas aceptadas</Label>
              <div className="flex gap-2 mt-2">
                {gateway.supportedCurrencies.map(currency => (
                  <Badge key={currency} variant="outline">{currency}</Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Captura automática */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Captura automática</p>
                <p className="text-sm text-slate-500">Autorizar y capturar en una sola transacción</p>
              </div>
              <Switch
                checked={formData.config.autoCapture}
                onCheckedChange={(checked) => updateConfig('autoCapture', checked)}
              />
            </div>

            {/* 3D Secure */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">3D Secure</p>
                <p className="text-sm text-slate-500">Requerir autenticación 3D Secure</p>
              </div>
              <Switch
                checked={formData.config.require3DS}
                onCheckedChange={(checked) => updateConfig('require3DS', checked)}
              />
            </div>

            {formData.config.require3DS && (
              <div>
                <Label htmlFor="min3DS">Monto mínimo para 3DS (DOP)</Label>
                <Input
                  id="min3DS"
                  type="number"
                  value={formData.config.minAmountFor3DS || ''}
                  onChange={(e) => updateConfig('minAmountFor3DS', Number(e.target.value))}
                  placeholder="5000"
                />
              </div>
            )}

            {/* Retornos */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Permitir retornos</p>
                <p className="text-sm text-slate-500">Habilitar devoluciones a clientes</p>
              </div>
              <Switch
                checked={formData.config.allowRefunds}
                onCheckedChange={(checked) => updateConfig('allowRefunds', checked)}
              />
            </div>

            {formData.config.allowRefunds && (
              <div>
                <Label htmlFor="maxRefundDays">Días máximos para retorno</Label>
                <Input
                  id="maxRefundDays"
                  type="number"
                  value={formData.config.maxRefundDays}
                  onChange={(e) => updateConfig('maxRefundDays', Number(e.target.value))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* URLs de retorno */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            URLs de Retorno (Webhooks)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>URL de Éxito</Label>
              <Input 
                value={gateway.webhookUrls.success} 
                readOnly 
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>URL de Fallo</Label>
              <Input 
                value={gateway.webhookUrls.failure} 
                readOnly 
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>Webhook</Label>
              <Input 
                value={gateway.webhookUrls.webhook} 
                readOnly 
                className="bg-slate-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={isTesting}>
          <TestTube className="h-4 w-4 mr-2" />
          {isTesting ? 'Probando...' : '🧪 Probar transacción de $1'}
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          💾 Guardar configuración
        </Button>
      </div>
    </div>
  );
}
