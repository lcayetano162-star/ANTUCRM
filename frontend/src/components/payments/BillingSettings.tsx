import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Bell, FileText, Globe, 
  Calendar, Clock, Save, Plus
} from 'lucide-react';
import type { BillingSettings } from '@/types/payments';

interface BillingSettingsProps {
  settings: BillingSettings;
  onSave: (settings: BillingSettings) => void;
}

export function BillingSettingsView({ settings, onSave }: BillingSettingsProps) {
  const [formData, setFormData] = useState<BillingSettings>({ ...settings });

  const handleSave = () => {
    onSave(formData);
  };

  const updateNotifications = (key: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updateFiscalBilling = (key: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      fiscalBilling: { ...prev.fiscalBilling, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Facturación Recurrente
          </h2>
          <p className="text-sm text-slate-500">Configuración global del sistema de billing</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar cambios
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ciclo de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ciclo predeterminado</Label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 mt-1"
                    value={formData.defaultBillingCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultBillingCycle: e.target.value as any }))}
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
                <div>
                  <Label>Día de facturación</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={28}
                    value={formData.defaultBillingDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultBillingDay: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Día del mes (1-28)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reintentos de Cobro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Grace period (días)</Label>
                  <Input 
                    type="number"
                    value={formData.gracePeriodDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, gracePeriodDays: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Días antes de suspensión</p>
                </div>
                <div>
                  <Label>Intentos</Label>
                  <Input 
                    type="number"
                    value={formData.retryAttempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, retryAttempts: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Intervalo (días)</Label>
                  <Input 
                    type="number"
                    value={formData.retryIntervalDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, retryIntervalDays: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Acción después de intentos fallidos</Label>
                <div className="flex gap-4">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="actionAfterFailed"
                      checked={formData.actionAfterFailedRetries === 'SUSPEND'}
                      onChange={() => setFormData(prev => ({ ...prev, actionAfterFailedRetries: 'SUSPEND' }))}
                    />
                    Suspender servicio
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="actionAfterFailed"
                      checked={formData.actionAfterFailedRetries === 'COLLECTION'}
                      onChange={() => setFormData(prev => ({ ...prev, actionAfterFailedRetries: 'COLLECTION' }))}
                    />
                    Enviar a cobranza
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones Automáticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Recordatorio antes del cobro</p>
                    <p className="text-sm text-slate-500">
                      Enviar {formData.notifications.reminderBeforeDays} días antes de la facturación
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-20"
                      value={formData.notifications.reminderBeforeDays}
                      onChange={(e) => updateNotifications('reminderBeforeDays', Number(e.target.value))}
                    />
                    <Switch 
                      checked={formData.notifications.sendOnBillingDay}
                      onCheckedChange={(v) => updateNotifications('sendOnBillingDay', v)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Confirmación de facturación</p>
                    <p className="text-sm text-slate-500">Enviar el día del cobro</p>
                  </div>
                  <Switch 
                    checked={formData.notifications.sendOnBillingDay}
                    onCheckedChange={(v) => updateNotifications('sendOnBillingDay', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Recibo de pago</p>
                    <p className="text-sm text-slate-500">Enviar después de cobro exitoso</p>
                  </div>
                  <Switch 
                    checked={formData.notifications.sendOnSuccess}
                    onCheckedChange={(v) => updateNotifications('sendOnSuccess', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Alerta de cobro fallido</p>
                    <p className="text-sm text-slate-500">Enviar cuando un cobro falle</p>
                  </div>
                  <Switch 
                    checked={formData.notifications.sendOnFailure}
                    onCheckedChange={(v) => updateNotifications('sendOnFailure', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notificación de suspensión</p>
                    <p className="text-sm text-slate-500">Enviar cuando se suspende el servicio</p>
                  </div>
                  <Switch 
                    checked={formData.notifications.sendOnSuspension}
                    onCheckedChange={(v) => updateNotifications('sendOnSuspension', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Plantillas de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Recordatorio de próximo cobro</p>
                    <p className="text-sm text-slate-500">Enviado X días antes de la facturación</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Preview</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Factura mensual de suscripción</p>
                    <p className="text-sm text-slate-500">Enviado el día de facturación</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Preview</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Confirmación de pago exitoso</p>
                    <p className="text-sm text-slate-500">Enviado después de cobro exitoso</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Preview</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-red-900">Problema con tu pago</p>
                    <p className="text-sm text-red-700">Enviado cuando un cobro falla</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700">Editar</Button>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700">Preview</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Servicio suspendido</p>
                    <p className="text-sm text-slate-500">Enviado al suspender por mora</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Preview</Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Variables disponibles:</strong> {'{{nombre}}'}, {'{{plan}}'}, {'{{monto}}'}, 
                  {'{{fecha_inicio}}'}, {'{{fecha_fin}}'}, {'{{numero_factura}}'}, 
                  {'{{metodo_pago}}'}, {'{{link_factura}}'}, {'{{link_portal}}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fiscal */}
        <TabsContent value="fiscal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Configuración Fiscal por País
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.taxConfig.map((tax, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tax.country}</h3>
                      <Badge variant="outline">{tax.countryCode}</Badge>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Impuesto</p>
                      <p className="font-medium">{tax.taxName} ({tax.taxRate}%)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Facturación electrónica</p>
                      <p className="font-medium">{tax.requiresElectronicInvoice ? 'Obligatoria' : 'Opcional'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Formato</p>
                      <p className="font-medium">{tax.invoiceFormat}</p>
                    </div>
                  </div>

                  {tax.retentionRules?.applies && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-sm">
                      <p className="text-amber-800">
                        <strong>Retención:</strong> {tax.retentionRules.percentage}% - {tax.retentionRules.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar configuración país
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Facturación Recurrente con e-CF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generar e-CF automáticamente</p>
                  <p className="text-sm text-slate-500">Para tenants en República Dominicana</p>
                </div>
                <Switch 
                  checked={formData.fiscalBilling.autoGenerateECF}
                  onCheckedChange={(v) => updateFiscalBilling('autoGenerateECF', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enviar XML + PDF al email</p>
                  <p className="text-sm text-slate-500">Adjuntar documentos fiscales</p>
                </div>
                <Switch 
                  checked={formData.fiscalBilling.enabled}
                  onCheckedChange={(v) => updateFiscalBilling('enabled', v)}
                />
              </div>

              <div>
                <Label>Almacenar XML firmado (años)</Label>
                <Input 
                  type="number"
                  value={formData.fiscalBilling.storeXmlYears}
                  onChange={(e) => updateFiscalBilling('storeXmlYears', Number(e.target.value))}
                />
                <p className="text-xs text-slate-500 mt-1">Período de retención para cumplimiento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
