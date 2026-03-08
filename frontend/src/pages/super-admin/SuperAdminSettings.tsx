import { useState, useEffect } from 'react'
import { 
  Settings, 
  Mail, 
  CreditCard,
  Shield,
  Bell,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  Server,
  Key,
  Globe,
  Lock,
  Palette,
  ToggleLeft,
  ToggleRight,
  Brain,
  Cpu,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { superAdminApi, aiApi } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

interface PaymentGateway {
  id: string
  name: string
  description: string
  enabled: boolean
  icon: string
  color: string
  bgColor: string
  fields: {
    key: string
    label: string
    type: string
    placeholder: string
    helpText?: string
  }[]
}

export default function SuperAdminSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  // Payment Gateways
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Acepta pagos con tarjetas de crédito/débito. Soporte para Apple Pay y Google Pay.',
      enabled: true,
      icon: '💳',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      fields: [
        { key: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
        { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
        { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', helpText: 'Para verificación de webhooks' }
      ]
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Integración con PayPal para pagos express.',
      enabled: false,
      icon: '🅿️',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      fields: [
        { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Abc123...' },
        { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
        { key: 'sandbox_mode', label: 'Sandbox Mode', type: 'toggle', placeholder: '' }
      ]
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Pasarela de pagos líder en Latinoamérica.',
      enabled: false,
      icon: '💰',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      fields: [
        { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'APP_USR-...' },
        { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'APP_USR-...' }
      ]
    },
    {
      id: 'manual',
      name: 'Transferencia Bancaria',
      description: 'Pagos manuales mediante transferencia bancaria.',
      enabled: true,
      icon: '🏦',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      fields: [
        { key: 'bank_name', label: 'Nombre del Banco', type: 'text', placeholder: 'Banco Nacional' },
        { key: 'account_number', label: 'Número de Cuenta', type: 'text', placeholder: '0000-0000-0000' },
        { key: 'account_holder', label: 'Titular de la Cuenta', type: 'text', placeholder: 'Empresa SRL' },
        { key: 'instructions', label: 'Instrucciones para el Cliente', type: 'textarea', placeholder: 'Realice la transferencia y envíe el comprobante a...' }
      ]
    }
  ])

  // SMTP Settings
  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    username: '',
    password: '',
    from_email: 'noreply@antucrm.com',
    from_name: 'Antü CRM',
    encryption: 'tls',
    enabled: true
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    allow_registration: true,
    default_tenant_status: 'trial',
    trial_days: '14',
    max_users_per_tenant: '100',
    session_timeout: '60',
    api_rate_limit: '1000'
  })

  // Branding Settings
  const [brandingSettings, setBrandingSettings] = useState({
    app_name: 'Antü CRM',
    primary_color: '#7c3aed',
    logo_url: '',
    favicon_url: '',
    login_background: ''
  })
  // AI Configuration
  const [aiConfig, setAiConfig] = useState({
    provider: 'claude' as 'claude' | 'openai' | 'gemini',
    api_key: '',
    model: 'claude-sonnet-4-6',
    is_active: true,
    enable_contact_analysis: true,
    enable_sales_recommendations: true,
    enable_route_planner: true,
    api_key_set: false,
    configured: false,
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTesting, setAiTesting] = useState(false)


  // Load SMTP and AI config on mount
  useEffect(() => {
    superAdminApi.getSmtpSettings().then(res => {
      setSmtpSettings(prev => ({ ...prev, ...res.data, password: '' }));
    }).catch(() => {});

    aiApi.getConfig().then(res => {
      if (res.data?.configured) {
        setAiConfig(prev => ({ ...prev, ...res.data, api_key: '' }));
      }
    }).catch(() => {});
  }, []);

  const toggleGateway = (gatewayId: string) => {
    setPaymentGateways(prev => prev.map(g => 
      g.id === gatewayId ? { ...g, enabled: !g.enabled } : g
    ))
  }

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async (section: string) => {
    setIsSaving(true)
    try {
      if (section === 'SMTP') {
        await superAdminApi.saveSmtpSettings(smtpSettings)
      }
      toast({
        title: 'Configuración guardada',
        description: `Los cambios en ${section} han sido guardados correctamente.`,
        variant: 'success'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || `No se pudo guardar la configuración de ${section}`,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestSMTP = async () => {
    toast({
      title: 'Probando conexión SMTP',
      description: 'Conectando al servidor de correo...',
    })
    try {
      const res = await superAdminApi.testSmtpSettings(smtpSettings)
      toast({
        title: 'Conexión exitosa',
        description: res.data?.message || 'El correo de prueba fue enviado correctamente.',
        variant: 'success'
      })
    } catch (error: any) {
      toast({
        title: 'Error de conexión',
        description: error.response?.data?.error || 'No se pudo conectar al servidor SMTP',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Configuración Global</h1>
        <p className="text-slate-500 text-sm mt-1">Administra la configuración del sistema</p>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="border-b border-slate-200 w-full justify-start rounded-none bg-transparent p-0 flex-wrap h-auto gap-1">
          <TabsTrigger 
            value="payments" 
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pasarelas de Pago
          </TabsTrigger>
          <TabsTrigger 
            value="smtp"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Mail className="w-4 h-4 mr-2" />
            SMTP
          </TabsTrigger>
          <TabsTrigger 
            value="system"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Server className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Brain className="w-4 h-4 mr-2" />
            Inteligencia Artificial
          </TabsTrigger>
        </TabsList>

        {/* Payment Gateways */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="grid gap-6">
            {paymentGateways.map((gateway) => (
              <Card key={gateway.id} className={cn(
                "border transition-all duration-200",
                gateway.enabled ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-75"
              )}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", gateway.bgColor)}>
                        {gateway.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          {gateway.enabled && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">
                              <Check className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="max-w-md">{gateway.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={gateway.enabled}
                      onCheckedChange={() => toggleGateway(gateway.id)}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                </CardHeader>
                
                {gateway.enabled && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gateway.fields.map((field) => (
                        <div key={field.key} className={cn("space-y-2", field.type === 'textarea' && "md:col-span-2")}>
                          <Label htmlFor={`${gateway.id}_${field.key}`}>{field.label}</Label>
                          {field.type === 'textarea' ? (
                            <textarea
                              id={`${gateway.id}_${field.key}`}
                              placeholder={field.placeholder}
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            />
                          ) : field.type === 'toggle' ? (
                            <div className="flex items-center gap-2">
                              <Switch id={`${gateway.id}_${field.key}`} />
                              <span className="text-sm text-slate-500">Habilitar modo sandbox</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                id={`${gateway.id}_${field.key}`}
                                type={field.type === 'password' && !showSecrets[`${gateway.id}_${field.key}`] ? 'password' : 'text'}
                                placeholder={field.placeholder}
                                className="bg-white pr-10"
                              />
                              {field.type === 'password' && (
                                <button
                                  type="button"
                                  onClick={() => toggleShowSecret(`${gateway.id}_${field.key}`)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showSecrets[`${gateway.id}_${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          )}
                          {field.helpText && (
                            <p className="text-xs text-slate-400">{field.helpText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => handleSave('Pasarelas de Pago')} 
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-violet-500" />
                    Configuración SMTP
                  </CardTitle>
                  <CardDescription>Configura el servidor de correo para enviar notificaciones</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={smtpSettings.enabled}
                    onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, enabled: checked })}
                    className="data-[state=checked]:bg-violet-600"
                  />
                  <span className="text-sm text-slate-600">{smtpSettings.enabled ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP *</Label>
                  <Input
                    id="smtp_host"
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                    placeholder="smtp.ejemplo.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Puerto *</Label>
                  <Input
                    id="smtp_port"
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                    placeholder="587"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Usuario</Label>
                  <Input
                    id="smtp_username"
                    value={smtpSettings.username}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showSecrets['smtp_password'] ? 'text' : 'password'}
                      value={smtpSettings.password}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('smtp_password')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecrets['smtp_password'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">Email Remitente *</Label>
                  <Input
                    id="from_email"
                    value={smtpSettings.from_email}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, from_email: e.target.value })}
                    placeholder="noreply@antucrm.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">Nombre Remitente *</Label>
                  <Input
                    id="from_name"
                    value={smtpSettings.from_name}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, from_name: e.target.value })}
                    placeholder="Antü CRM"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={handleTestSMTP} className="border-slate-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Probar Conexión
                </Button>
                <Button 
                  onClick={() => handleSave('SMTP')} 
                  disabled={isSaving}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-violet-500" />
                Configuración del Sistema
              </CardTitle>
              <CardDescription>Parámetros generales del sistema multi-tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">Modo Mantenimiento</p>
                    <p className="text-sm text-amber-700">Bloquea el acceso a todos los tenants</p>
                  </div>
                </div>
                <Switch
                  checked={systemSettings.maintenance_mode}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenance_mode: checked })}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trial_days">Días de Prueba</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={systemSettings.trial_days}
                    onChange={(e) => setSystemSettings({ ...systemSettings, trial_days: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users">Máximo Usuarios por Tenant</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={systemSettings.max_users_per_tenant}
                    onChange={(e) => setSystemSettings({ ...systemSettings, max_users_per_tenant: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de Sesión (minutos)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={systemSettings.session_timeout}
                    onChange={(e) => setSystemSettings({ ...systemSettings, session_timeout: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_rate_limit">Límite API (peticiones/hora)</Label>
                  <Input
                    id="api_rate_limit"
                    type="number"
                    value={systemSettings.api_rate_limit}
                    onChange={(e) => setSystemSettings({ ...systemSettings, api_rate_limit: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button 
                  onClick={() => handleSave('Sistema')} 
                  disabled={isSaving}
                  className="bg-violet-600 hover:bg-violet-700 ml-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-500" />
                Personalización de Marca
              </CardTitle>
              <CardDescription>Personaliza la apariencia de tu plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Nombre de la Aplicación</Label>
                  <Input
                    id="app_name"
                    value={brandingSettings.app_name}
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, app_name: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      value={brandingSettings.primary_color}
                      onChange={(e) => setBrandingSettings({ ...brandingSettings, primary_color: e.target.value })}
                      className="bg-white"
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-slate-200"
                      style={{ backgroundColor: brandingSettings.primary_color }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL del Logo</Label>
                <Input
                  id="logo_url"
                  value={brandingSettings.logo_url}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button 
                  onClick={() => handleSave('Branding')} 
                  disabled={isSaving}
                  className="bg-violet-600 hover:bg-violet-700 ml-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-500" />
                    Configuración de IA Global
                  </CardTitle>
                  <CardDescription>
                    La clave API configurada aquí se usa en todos los tenants para análisis de contactos,
                    recomendaciones de ventas y despacho inteligente.
                  </CardDescription>
                </div>
                <Switch
                  checked={aiConfig.is_active}
                  onCheckedChange={(v) => setAiConfig({ ...aiConfig, is_active: v })}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider + Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor de IA</Label>
                  <div className="flex gap-2">
                    {([
                      { value: 'claude', label: 'Claude (Anthropic)', icon: '🤖', models: ['claude-sonnet-4-6','claude-opus-4-6','claude-haiku-4-5-20251001'] },
                      { value: 'openai', label: 'OpenAI', icon: '🟢', models: ['gpt-4o','gpt-4o-mini','gpt-4-turbo'] },
                      { value: 'gemini', label: 'Gemini (Google)', icon: '💎', models: ['gemini-1.5-pro','gemini-1.5-flash','gemini-2.0-flash'] },
                    ] as const).map(p => (
                      <button
                        key={p.value}
                        onClick={() => {
                          setAiConfig({ ...aiConfig, provider: p.value, model: p.models[0] });
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                          ${aiConfig.provider === p.value
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                      >
                        {p.icon} {p.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai_model">Modelo</Label>
                  <select
                    id="ai_model"
                    value={aiConfig.model}
                    onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {aiConfig.provider === 'claude' && <>
                      <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Recomendado)</option>
                      <option value="claude-opus-4-6">Claude Opus 4.6 (Más potente)</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Más rápido)</option>
                    </>}
                    {aiConfig.provider === 'openai' && <>
                      <option value="gpt-4o">GPT-4o (Recomendado)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Económico)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>}
                    {aiConfig.provider === 'gemini' && <>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recomendado)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    </>}
                  </select>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="ai_key">
                  API Key
                  {aiConfig.api_key_set && (
                    <span className="ml-2 text-xs text-emerald-600 font-normal">✓ Configurada</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="ai_key"
                    type={showSecrets['ai_key'] ? 'text' : 'password'}
                    value={aiConfig.api_key}
                    onChange={e => setAiConfig({ ...aiConfig, api_key: e.target.value })}
                    placeholder={aiConfig.api_key_set ? '••••••• (dejar vacío para no cambiar)' : aiConfig.provider === 'claude' ? 'sk-ant-...' : aiConfig.provider === 'openai' ? 'sk-...' : 'AIzaSy...'}
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('ai_key')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets['ai_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {aiConfig.provider === 'claude' && 'Obtén tu clave en console.anthropic.com'}
                  {aiConfig.provider === 'openai' && 'Obtén tu clave en platform.openai.com/api-keys'}
                  {aiConfig.provider === 'gemini' && 'Obtén tu clave en aistudio.google.com/apikey'}
                </p>
              </div>

              {/* Feature toggles */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Funcionalidades habilitadas
                </p>
                {[
                  { key: 'enable_contact_analysis', label: 'Análisis de Contactos con IA', desc: 'En módulo Contactos → pestaña Análisis IA' },
                  { key: 'enable_sales_recommendations', label: 'Recomendaciones de Ventas', desc: 'En Mi Desempeño → sección recomendaciones' },
                  { key: 'enable_route_planner', label: 'Planificador de Rutas IA', desc: 'En Service Desk → Despacho Inteligente' },
                ].map(feat => (
                  <div key={feat.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{feat.label}</p>
                      <p className="text-xs text-slate-400">{feat.desc}</p>
                    </div>
                    <Switch
                      checked={(aiConfig as any)[feat.key]}
                      onCheckedChange={v => setAiConfig({ ...aiConfig, [feat.key]: v })}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setAiTesting(true);
                    try {
                      await aiApi.testConfig();
                      toast({ title: 'Conexión exitosa', description: 'La IA respondió correctamente.', variant: 'success' });
                    } catch (e: any) {
                      toast({ title: 'Error de conexión', description: e.response?.data?.error || e.message, variant: 'destructive' });
                    } finally { setAiTesting(false); }
                  }}
                  disabled={aiTesting || (!aiConfig.api_key_set && !aiConfig.api_key)}
                  className="border-slate-200"
                >
                  <Cpu className={cn('w-4 h-4 mr-2', aiTesting && 'animate-spin')} />
                  {aiTesting ? 'Probando...' : 'Probar Conexión'}
                </Button>
                <Button
                  onClick={async () => {
                    setAiLoading(true);
                    try {
                      await aiApi.saveConfig(aiConfig);
                      toast({ title: 'IA configurada', description: 'La configuración fue guardada correctamente.', variant: 'success' });
                      setAiConfig(prev => ({ ...prev, api_key: '', api_key_set: true, configured: true }));
                    } catch (e: any) {
                      toast({ title: 'Error', description: e.response?.data?.error || e.message, variant: 'destructive' });
                    } finally { setAiLoading(false); }
                  }}
                  disabled={aiLoading}
                  className="bg-violet-600 hover:bg-violet-700 ml-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {aiLoading ? 'Guardando...' : 'Guardar Configuración IA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
