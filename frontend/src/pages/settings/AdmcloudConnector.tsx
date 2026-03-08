import { useState, useEffect, useCallback } from 'react'
import {
  Database, CheckCircle2, XCircle, Loader2, RefreshCw, Play,
  Settings, ChevronDown, ChevronUp, Clock, Eye, EyeOff,
  Users, TrendingUp, Receipt, Package, CreditCard, Wrench, Megaphone, Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'
import { cn } from '@/lib/utils'

// ─── API calls (direct since integrationApi doesn't cover admcloud yet) ───────
const admcloudApi = {
  getConnection:  ()             => api.get('/integrations/admcloud/connection'),
  saveConnection: (data: any)    => api.post('/integrations/admcloud/connection', data),
  testConnection: ()             => api.post('/integrations/admcloud/test'),
  sync:           (mod: string)  => api.post(`/integrations/admcloud/sync/${mod}`),
  getLogs:        (params?: any) => api.get('/integrations/admcloud/logs', { params }),
}

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULES = [
  { key: 'clients',       label: 'Clientes',           icon: Users,      desc: 'GET /api/Customers' },
  { key: 'opportunities', label: 'Oportunidades',      icon: TrendingUp, desc: 'GET /api/Opportunities' },
  { key: 'invoices',      label: 'Facturación',        icon: Receipt,    desc: 'GET /api/CreditInvoices + /api/CashInvoices' },
  { key: 'inventory',     label: 'Inventario',         icon: Package,    desc: 'GET /api/Items' },
  { key: 'ar',            label: 'Cuentas por Cobrar', icon: CreditCard, desc: 'GET /api/AR' },
  { key: 'service',       label: 'Servicio Técnico',   icon: Wrench,     desc: 'GET /api/Incidents' },
  { key: 'marketing',     label: 'Marketing',          icon: Megaphone,  desc: 'GET /api/Contacts' },
] as const

type ModuleKey = typeof MODULES[number]['key']

interface Connection {
  id: string
  company: string
  role: string
  app_id: string
  is_active: boolean
  last_sync_at?: string
  sync_clients: boolean
  sync_opportunities: boolean
  sync_invoices: boolean
  sync_inventory: boolean
  sync_ar: boolean
  sync_service: boolean
  sync_marketing: boolean
}

interface SyncLog {
  id: string
  module: string
  direction: string
  status: 'running' | 'success' | 'partial' | 'failed'
  records_pulled: number
  records_created: number
  records_updated: number
  records_failed: number
  error_message?: string
  started_at: string
  finished_at?: string
  duration_seconds?: number
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function LogStatus({ status }: { status: SyncLog['status'] }) {
  const cfg = {
    success: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Exitoso' },
    partial: { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Parcial' },
    failed:  { cls: 'bg-rose-50 text-rose-700 border-rose-200',          label: 'Fallido' },
    running: { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Corriendo' },
  }[status]
  return <span className={`text-xs px-2 py-0.5 rounded border ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdmcloudConnector() {
  const { toast } = useToast()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [form, setForm] = useState({
    company: '', role: 'administradores', app_id: '', username: '', password: '',
    sync_clients: true, sync_opportunities: true, sync_invoices: true,
    sync_inventory: true, sync_ar: true, sync_service: false, sync_marketing: false,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [connRes, logsRes] = await Promise.allSettled([
        admcloudApi.getConnection(),
        admcloudApi.getLogs({ limit: 20 }),
      ])
      if (connRes.status === 'fulfilled' && connRes.value.data.connection) {
        const c = connRes.value.data.connection
        setConnection(c)
        setForm(prev => ({
          ...prev,
          company: c.company, role: c.role, app_id: c.app_id,
          sync_clients: c.sync_clients, sync_opportunities: c.sync_opportunities,
          sync_invoices: c.sync_invoices, sync_inventory: c.sync_inventory,
          sync_ar: c.sync_ar, sync_service: c.sync_service, sync_marketing: c.sync_marketing,
        }))
        setShowConfig(false)
      } else {
        setShowConfig(true)
      }
      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.data.logs || [])
      }
    } catch {
      setShowConfig(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!form.company || !form.role || !form.app_id || !form.username) {
      toast({ title: 'Faltan campos', description: 'Empresa, rol, App ID y usuario son obligatorios', variant: 'destructive' })
      return
    }
    try {
      const res = await admcloudApi.saveConnection(form)
      setConnection(res.data.connection)
      setShowConfig(false)
      toast({ title: 'Conexión guardada', description: 'Credenciales Admcloud guardadas correctamente', variant: 'success' } as any)
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.response?.data?.error ?? 'Error desconocido', variant: 'destructive' })
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await admcloudApi.testConnection()
      if (res.data.ok) {
        toast({ title: 'Conexión exitosa', description: res.data.message, variant: 'success' } as any)
      } else {
        toast({ title: 'Conexión fallida', description: res.data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  const handleSync = async (module: string) => {
    setSyncing(module)
    try {
      const res = await admcloudApi.sync(module)
      const summary = res.data.summary as Record<string, any>
      const successCount = Object.values(summary).filter((v: any) => v.status === 'success').length
      const failCount = Object.values(summary).filter((v: any) => v.status === 'failed').length
      if (failCount === 0) {
        toast({ title: 'Sincronización completada', description: `${successCount} módulo(s) sincronizados exitosamente`, variant: 'success' } as any)
      } else {
        toast({ title: 'Sincronización parcial', description: `${successCount} exitosos, ${failCount} con errores`, variant: 'destructive' })
      }
      loadData()
    } catch (err: any) {
      toast({ title: 'Error de sincronización', description: err.response?.data?.error ?? 'Error desconocido', variant: 'destructive' })
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Header card ──────────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
              AC
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-base">Adm Cloud ERP</CardTitle>
                {connection ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Conectado
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border-slate-200">Sin configurar</Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                Integración bidireccional con Adm Cloud — sincroniza clientes, oportunidades, facturas, inventario, CxC, servicio y marketing.
              </CardDescription>
              {connection?.last_sync_at && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Última sync: {new Date(connection.last_sync_at).toLocaleString('es-DO')}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              {connection && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing}
                    className="border-slate-200"
                  >
                    {testing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                    Probar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSync('all')}
                    disabled={!!syncing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {syncing === 'all' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                    Sync completo
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfig(!showConfig)}
                className="border-slate-200"
              >
                <Settings className="w-4 h-4 mr-1" />
                {showConfig ? 'Cerrar' : 'Configurar'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ─── Config form ──────────────────────────────────────────── */}
        {showConfig && (
          <CardContent className="border-t border-slate-100 pt-6 space-y-6">
            {/* Credenciales básicas */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Credenciales de acceso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Empresa (company) <span className="text-rose-500">*</span></Label>
                  <Input
                    value={form.company}
                    onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="miempresa"
                    className="bg-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rol (role) <span className="text-rose-500">*</span></Label>
                  <Input
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    placeholder="administradores"
                    className="bg-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>App ID (appid) <span className="text-rose-500">*</span></Label>
                  <Input
                    value={form.app_id}
                    onChange={e => setForm(p => ({ ...p, app_id: e.target.value }))}
                    placeholder="378d0208-6942-4bc6-a880-2c9b1229610f"
                    className="bg-white font-mono text-xs"
                  />
                  <p className="text-xs text-slate-400">UUID generado en Adm Cloud → Integraciones</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Usuario <span className="text-rose-500">*</span></Label>
                  <Input
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="usuario@empresa.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Contraseña {!connection && <span className="text-rose-500">*</span>}</Label>
                  <div className="relative max-w-sm">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder={connection ? '(sin cambios)' : 'Contraseña Adm Cloud'}
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Se cifra con AES-256-GCM antes de guardarse en la base de datos</p>
                </div>
              </div>
            </div>

            {/* Módulos a sincronizar */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Módulos a sincronizar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULES.map(mod => (
                  <div key={mod.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <mod.icon className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{mod.label}</p>
                        <p className="text-xs text-slate-400">{mod.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={(form as any)[`sync_${mod.key}`]}
                      onCheckedChange={v => setForm(p => ({ ...p, [`sync_${mod.key}`]: v }))}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfig(false)} className="border-slate-200">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Guardar conexión
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ─── Module sync grid ─────────────────────────────────────────── */}
      {connection && !showConfig && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map(mod => {
            const enabled = (connection as any)[`sync_${mod.key}`]
            const lastLog = logs.find(l => l.module === mod.key)
            const isSyncing = syncing === mod.key || syncing === 'all'
            return (
              <div
                key={mod.key}
                className={cn(
                  'p-4 rounded-xl border bg-white',
                  enabled ? 'border-slate-200' : 'border-slate-100 opacity-50'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <mod.icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{mod.label}</span>
                  </div>
                  {lastLog && <LogStatus status={lastLog.status} />}
                </div>
                {lastLog && (
                  <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                    <div className="bg-emerald-50 rounded-lg p-1.5">
                      <p className="text-xs font-bold text-emerald-700">{lastLog.records_created}</p>
                      <p className="text-xs text-emerald-500">Nuevos</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-1.5">
                      <p className="text-xs font-bold text-blue-700">{lastLog.records_updated}</p>
                      <p className="text-xs text-blue-500">Actualizados</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-1.5">
                      <p className="text-xs font-bold text-rose-700">{lastLog.records_failed}</p>
                      <p className="text-xs text-rose-500">Errores</p>
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-slate-200 text-xs"
                  disabled={!enabled || !!syncing}
                  onClick={() => handleSync(mod.key)}
                >
                  {isSyncing
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Sincronizando...</>
                    : <><Play className="w-3.5 h-3.5 mr-1" />Sincronizar</>
                  }
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Sync logs ────────────────────────────────────────────────── */}
      {connection && logs.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Historial de sincronizaciones
              </CardTitle>
              {showLogs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </CardHeader>
          {showLogs && (
            <CardContent>
              <div className="space-y-2">
                {logs.map(log => {
                  const mod = MODULES.find(m => m.key === log.module)
                  const ModIcon = mod?.icon ?? RefreshCw
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm">
                      <ModIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-700">{mod?.label ?? log.module}</span>
                          <LogStatus status={log.status} />
                          <span className="text-xs text-slate-400 ml-auto">
                            {new Date(log.started_at).toLocaleString('es-DO')}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-slate-500">
                          <span>{log.records_pulled} leídos</span>
                          <span className="text-emerald-600">+{log.records_created} nuevos</span>
                          <span className="text-blue-600">{log.records_updated} actualizados</span>
                          {log.records_failed > 0 && <span className="text-rose-600">{log.records_failed} errores</span>}
                          {log.duration_seconds && <span>{Math.round(log.duration_seconds)}s</span>}
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-rose-600 mt-0.5 truncate">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
