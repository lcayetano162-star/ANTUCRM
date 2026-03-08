import { useState, useEffect, useCallback } from 'react'
import {
  Plug, Settings, CheckCircle2, XCircle, AlertCircle, Clock,
  Eye, EyeOff, Save, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Building2, BarChart3, Search, Activity, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { erpApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import AdmcloudConnector from './settings/AdmcloudConnector'

// ─── Connector definitions ────────────────────────────────────────────────────

interface ConnectorDef {
  id: string
  name: string
  logo: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  apiUrlPlaceholder: string
  apiKeyLabel: string
  apiKeyPlaceholder: string
  apiKeyHint: string
  extraFields?: { key: string; label: string; placeholder: string }[]
  isDGII?: boolean
}

const CONNECTORS: ConnectorDef[] = [
  {
    id: 'alegra',
    name: 'Alegra',
    logo: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Sincronización de NCF y Facturación Contable. Envía facturas creadas en Antü CRM automáticamente a Alegra.',
    apiUrlPlaceholder: 'https://app.alegra.com/api/r1',
    apiKeyLabel: 'Email:Token de Alegra',
    apiKeyPlaceholder: 'correo@empresa.com:tu_token_alegra',
    apiKeyHint: 'Formato: tu_email:tu_token — obtenlo en Alegra → Configuración → API',
  },
  {
    id: 'odoo',
    name: 'Odoo',
    logo: '🟣',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Sincronización de Inventario y Almacén Central. Mantiene el stock de Odoo actualizado con los movimientos de Antü CRM.',
    apiUrlPlaceholder: 'https://tu-empresa.odoo.com',
    apiKeyLabel: 'API Key / Access Token',
    apiKeyPlaceholder: 'tu_api_key_odoo',
    apiKeyHint: 'Obtén tu API Key en Odoo → Configuración → Técnico → API Keys',
    extraFields: [
      { key: 'database', label: 'Nombre de la Base de Datos', placeholder: 'tu_bd_odoo' },
    ]
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    logo: '🟢',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Sincronización de Clientes y Cobros. Refleja facturas pagadas e historial de clientes en QuickBooks Online.',
    apiUrlPlaceholder: 'https://quickbooks.api.intuit.com',
    apiKeyLabel: 'OAuth 2.0 Access Token',
    apiKeyPlaceholder: 'eyJhbGciOiJSUzI...',
    apiKeyHint: 'Genera el token en Intuit Developer → Tu App → OAuth 2.0',
    extraFields: [
      { key: 'realm_id', label: 'Company ID (Realm ID)', placeholder: '123456789' },
    ]
  },
  {
    id: 'dgii',
    name: 'DGII — Consulta RNC',
    logo: '🇩🇴',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Autofill de datos fiscales mediante RNC. Consulta la Dirección General de Impuestos Internos para obtener Razón Social y Actividad Económica automáticamente.',
    apiUrlPlaceholder: '',
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    apiKeyHint: '',
    isDGII: true,
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ERPConfig {
  service_name: string
  api_url?: string
  is_active: boolean
  auto_sync: boolean
  extra_config: Record<string, string>
  last_sync_at?: string
  last_status: 'ok' | 'error' | 'unconfigured'
  api_key_set: boolean
}

interface LogEntry {
  id: string
  endpoint: string
  method: string
  status_code?: number
  duration_ms?: number
  error_message?: string
  triggered_by?: string
  created_at: string
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ERPConfig['last_status'] }) {
  if (status === 'ok')           return <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle2 className="w-3 h-3" />Conectado</Badge>
  if (status === 'error')        return <Badge className="bg-rose-100 text-rose-700 border-0 gap-1"><XCircle className="w-3 h-3" />Error</Badge>
  return <Badge className="bg-slate-100 text-slate-600 border-0 gap-1"><AlertCircle className="w-3 h-3" />Sin configurar</Badge>
}

// ─── Config Modal ─────────────────────────────────────────────────────────────

interface ConfigModalProps {
  connector: ConnectorDef
  config?: ERPConfig
  onClose: () => void
  onSaved: () => void
}

function ConfigModal({ connector, config, onClose, onSaved }: ConfigModalProps) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'config' | 'logs'>('config')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const [form, setForm] = useState({
    api_url:    config?.api_url   || '',
    api_key:    '',
    is_active:  config?.is_active  ?? false,
    auto_sync:  config?.auto_sync  ?? false,
    extra_config: config?.extra_config || {} as Record<string, string>,
  })

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await erpApi.getLogs(connector.id)
      setLogs(res.data)
    } catch { /* silent */ }
    finally { setLogsLoading(false) }
  }, [connector.id])

  useEffect(() => {
    if (tab === 'logs') loadLogs()
  }, [tab, loadLogs])

  const handleSave = async () => {
    setSaving(true)
    try {
      await erpApi.save(connector.id, {
        api_url:      form.api_url || null,
        api_key:      form.api_key || undefined,
        is_active:    form.is_active,
        auto_sync:    form.auto_sync,
        extra_config: form.extra_config,
      })
      toast({ title: 'Configuración guardada', description: `${connector.name} configurado correctamente.`, variant: 'success' })
      onSaved()
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.error || 'No se pudo guardar', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await erpApi.test(connector.id)
      toast({ title: 'Conexión exitosa', description: res.data.message, variant: 'success' })
      loadLogs()
    } catch (e: any) {
      toast({ title: 'Error de conexión', description: e.response?.data?.error || 'Sin respuesta del servidor', variant: 'destructive' })
      loadLogs()
    } finally { setTesting(false) }
  }

  const handleRemove = async () => {
    if (!confirm(`¿Eliminar la configuración de ${connector.name}? Las credenciales se borrarán permanentemente.`)) return
    try {
      await erpApi.remove(connector.id)
      toast({ title: 'Integración eliminada', variant: 'success' })
      onSaved()
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{connector.logo}</span>
            Configurar {connector.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="config"><Settings className="w-4 h-4 mr-1" />Credenciales</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-1" />Log de Llamadas</TabsTrigger>
          </TabsList>

          {/* ── Config tab ── */}
          <TabsContent value="config" className="space-y-4 pt-2">
            {/* API URL */}
            {connector.apiUrlPlaceholder && (
              <div className="space-y-2">
                <Label>URL de la API</Label>
                <Input
                  value={form.api_url}
                  onChange={e => setForm({ ...form, api_url: e.target.value })}
                  placeholder={connector.apiUrlPlaceholder}
                />
              </div>
            )}

            {/* API Key */}
            {connector.apiKeyLabel && (
              <div className="space-y-2">
                <Label>{connector.apiKeyLabel} {config?.api_key_set && <span className="text-emerald-600 text-xs font-normal ml-1">✓ Configurada</span>}</Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={form.api_key}
                    onChange={e => setForm({ ...form, api_key: e.target.value })}
                    placeholder={config?.api_key_set ? '••••••• (dejar vacío para no cambiar)' : connector.apiKeyPlaceholder}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {connector.apiKeyHint && <p className="text-xs text-slate-400">{connector.apiKeyHint}</p>}
              </div>
            )}

            {/* Extra fields per connector */}
            {(connector.extraFields || []).map(field => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  value={form.extra_config[field.key] || ''}
                  onChange={e => setForm({ ...form, extra_config: { ...form.extra_config, [field.key]: e.target.value } })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            {/* Toggles */}
            {!connector.isDGII && (
              <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Integración activa</p>
                    <p className="text-xs text-slate-400">Habilita el envío de datos a {connector.name}</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sincronización automática</p>
                    <p className="text-xs text-slate-400">Envía datos automáticamente al crear facturas</p>
                  </div>
                  <Switch checked={form.auto_sync} onCheckedChange={v => setForm({ ...form, auto_sync: v })} />
                </div>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Las credenciales se almacenan cifradas con AES-256-GCM. Nunca se muestran en texto plano después de ser guardadas.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {config?.api_key_set && !connector.isDGII && (
                <Button variant="outline" onClick={handleTest} disabled={testing} className="border-slate-200">
                  <RefreshCw className={cn('w-4 h-4 mr-2', testing && 'animate-spin')} />
                  {testing ? 'Probando...' : 'Probar Conexión'}
                </Button>
              )}
              {config && (
                <Button variant="ghost" size="icon" onClick={handleRemove} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || connector.isDGII} className="ml-auto bg-violet-600 hover:bg-violet-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : connector.isDGII ? 'Sin configuración requerida' : 'Guardar'}
              </Button>
            </div>
          </TabsContent>

          {/* ── Logs tab ── */}
          <TabsContent value="logs" className="pt-2">
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay registros de llamadas aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border text-sm',
                    log.status_code && log.status_code >= 200 && log.status_code < 300
                      ? 'bg-emerald-50 border-emerald-100'
                      : log.error_message
                        ? 'bg-rose-50 border-rose-100'
                        : 'bg-slate-50 border-slate-100'
                  )}>
                    <div className="mt-0.5">
                      {log.status_code && log.status_code < 300
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">{log.method}</span>
                        <span className="text-slate-600 text-xs truncate">{log.endpoint}</span>
                        {log.status_code && (
                          <span className={cn('text-xs font-semibold', log.status_code < 300 ? 'text-emerald-600' : 'text-rose-600')}>
                            {log.status_code}
                          </span>
                        )}
                        {log.duration_ms && <span className="text-xs text-slate-400">{log.duration_ms}ms</span>}
                      </div>
                      {log.error_message && <p className="text-xs text-rose-600 mt-1 truncate">{log.error_message}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {log.triggered_by && <span className="text-xs text-slate-400">via {log.triggered_by}</span>}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString('es-DO')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── DGII Tester Widget ───────────────────────────────────────────────────────

function DGIITester() {
  const { toast } = useToast()
  const [rnc, setRnc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleLookup = async () => {
    if (!rnc.replace(/\D/g, '')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await erpApi.lookupRNC(rnc)
      setResult(res.data)
    } catch (e: any) {
      toast({ title: 'RNC no encontrado', description: e.response?.data?.error || 'No se encontraron datos para este RNC', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-slate-600">
        Consulta la DGII para obtener el nombre fiscal y actividad económica de cualquier empresa dominicana por su RNC.
      </p>
      <div className="flex gap-2">
        <Input
          value={rnc}
          onChange={e => setRnc(e.target.value)}
          placeholder="Ej: 101001562"
          className="font-mono"
          maxLength={11}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
        />
        <Button onClick={handleLookup} disabled={loading || !rnc.replace(/\D/g, '')} className="bg-blue-600 hover:bg-blue-700 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {result && (
        <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900 text-base">{result.razon_social}</span>
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />{result.estado}
            </Badge>
          </div>
          {result.nombre_comercial && result.nombre_comercial !== result.razon_social && (
            <p className="text-slate-600">Nombre comercial: <strong>{result.nombre_comercial}</strong></p>
          )}
          <p className="text-slate-600">Actividad: <strong>{result.actividad_economica}</strong></p>
          <p className="text-slate-500 font-mono text-xs">RNC: {result.rnc}</p>
          {result.source === 'mock' && (
            <p className="text-xs text-amber-600">Dato de demostración — conecta a internet para consultas en tiempo real</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { t } = useLanguage()
  const [configs, setConfigs] = useState<ERPConfig[]>([])
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [showAdmcloud, setShowAdmcloud] = useState(false)

  const loadConfigs = useCallback(async () => {
    try {
      const res = await erpApi.getAll()
      setConfigs(res.data)
    } catch { /* silent on load */ }
  }, [])

  useEffect(() => { loadConfigs() }, [loadConfigs])

  const getConfig = (id: string) => configs.find(c => c.service_name === id)

  const activeConnector = openModal ? CONNECTORS.find(c => c.id === openModal) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('Centro de Integraciones')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('Conecta Antü CRM con los sistemas más usados')}</p>
        </div>
        <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50 px-3 py-1.5">
          <Plug className="w-4 h-4 mr-1.5" />
          {configs.filter(c => c.is_active).length} activas
        </Badge>
      </div>

      {/* ERP Connector Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('Conectores ERP / Contabilidad')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONNECTORS.map(connector => {
            const cfg = getConfig(connector.id)
            const status: ERPConfig['last_status'] = cfg?.last_status || 'unconfigured'

            return (
              <Card
                key={connector.id}
                className={cn(
                  'border transition-all duration-200 hover:shadow-md cursor-pointer',
                  cfg?.is_active ? connector.borderColor : 'border-slate-200'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl', connector.bgColor)}>
                        {connector.logo}
                      </div>
                      <div>
                        <CardTitle className="text-base">{connector.name}</CardTitle>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                    {cfg?.last_sync_at && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(cfg.last_sync_at).toLocaleDateString('es-DO')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4">{connector.description}</CardDescription>

                  {/* DGII gets inline tester */}
                  {connector.isDGII ? (
                    <DGIITester />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {cfg?.api_key_set && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Credenciales guardadas</span>}
                        {cfg?.auto_sync && <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-violet-500" />Auto-sync activo</span>}
                      </div>
                      <Button
                        size="sm"
                        variant={cfg?.is_active ? 'default' : 'outline'}
                        className={cfg?.is_active ? 'bg-violet-600 hover:bg-violet-700' : ''}
                        onClick={() => setOpenModal(connector.id)}
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        {cfg ? 'Editar' : 'Configurar'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* AdmCloud — existing connector, unchanged */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">AdmCloud ERP</h2>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-2xl">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-base">AdmCloud</CardTitle>
                  <CardDescription className="text-sm">ERP local dominicano — sincronización bidireccional completa</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAdmcloud(v => !v)}>
                {showAdmcloud ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showAdmcloud ? 'Contraer' : 'Expandir'}
              </Button>
            </div>
          </CardHeader>
          {showAdmcloud && (
            <CardContent className="pt-0 border-t border-slate-100">
              <AdmcloudConnector />
            </CardContent>
          )}
        </Card>
      </div>

      {/* Info block */}
      <Card className="border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-violet-700">{configs.filter(c => c.is_active).length}</div>
              <div className="text-slate-500">Integraciones activas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">{configs.filter(c => c.last_status === 'ok').length}</div>
              <div className="text-slate-500">Conectadas sin errores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">AES-256</div>
              <div className="text-slate-500">Cifrado de credenciales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Modal */}
      {openModal && activeConnector && (
        <ConfigModal
          connector={activeConnector}
          config={getConfig(openModal)}
          onClose={() => setOpenModal(null)}
          onSaved={() => { setOpenModal(null); loadConfigs() }}
        />
      )}
    </div>
  )
}
