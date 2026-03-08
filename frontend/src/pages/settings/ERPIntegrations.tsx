import { useState, useEffect, useCallback } from 'react'
import {
  Key, Webhook, Plus, Trash2, Copy, Check, Eye, EyeOff,
  AlertCircle, RefreshCw, Send, ChevronDown, ChevronUp,
  Shield, Globe, Zap, Clock, CheckCircle2, XCircle, Loader2,
  Activity, Database
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { integrationApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import AdmcloudConnector from './AdmcloudConnector'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string
  name: string
  description?: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at?: string
  expires_at?: string
  created_at: string
}

interface NewApiKeyResult extends ApiKey {
  full_key: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  failure_count: number
  last_triggered_at?: string
  last_success_at?: string
  created_at: string
}

interface WebhookEvent {
  id: string
  event_type: string
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  response_code?: number
  error_message?: string
  delivered_at?: string
  created_at: string
}

interface ScopeItem { value: string; label: string; description: string }
interface EventItem { event: string; label: string; description: string }

// ─── Scope badges ────────────────────────────────────────────────────────────

const SCOPE_COLORS: Record<string, string> = {
  'read:crm': 'bg-blue-50 text-blue-700 border-blue-200',
  'write:crm': 'bg-blue-100 text-blue-800 border-blue-300',
  'read:invoices': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'write:invoices': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'read:inventory': 'bg-amber-50 text-amber-700 border-amber-200',
  'write:inventory': 'bg-amber-100 text-amber-800 border-amber-300',
  'read:service': 'bg-violet-50 text-violet-700 border-violet-200',
  'write:service': 'bg-violet-100 text-violet-800 border-violet-300',
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${SCOPE_COLORS[scope] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {scope}
    </span>
  )
}

// ─── Status badge for webhook events ─────────────────────────────────────────

function EventStatusBadge({ status }: { status: WebhookEvent['status'] }) {
  const cfg = {
    delivered: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Entregado' },
    failed:    { icon: XCircle,      cls: 'bg-rose-50 text-rose-700 border-rose-200',           label: 'Fallido' },
    retrying:  { icon: RefreshCw,    cls: 'bg-amber-50 text-amber-700 border-amber-200',        label: 'Reintentando' },
    pending:   { icon: Clock,        cls: 'bg-slate-50 text-slate-600 border-slate-200',        label: 'Pendiente' },
  }[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Create API Key Modal ─────────────────────────────────────────────────────

interface CreateApiKeyModalProps {
  scopeCatalog: ScopeItem[]
  onClose: () => void
  onCreated: (key: NewApiKeyResult) => void
}

function CreateApiKeyModal({ scopeCatalog, onClose, onCreated }: CreateApiKeyModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const toggleScope = (scope: string) =>
    setSelectedScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope])

  const handleCreate = async () => {
    if (!name.trim() || selectedScopes.length === 0) {
      toast({ title: 'Campos requeridos', description: 'Nombre y al menos un scope son obligatorios', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await integrationApi.createApiKey({ name: name.trim(), description: description.trim() || undefined, scopes: selectedScopes })
      onCreated(res.data)
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error ?? 'No se pudo crear la clave', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-500" />
            Nueva API Key
          </h2>
          <p className="text-sm text-slate-500 mt-1">La clave completa se mostrará solo una vez</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre <span className="text-rose-500">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder='Ej. "ERP SAP Producción"' className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Para qué se usará esta clave" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Scopes de acceso <span className="text-rose-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {scopeCatalog.map(scope => (
                <button
                  key={scope.value}
                  onClick={() => toggleScope(scope.value)}
                  className={cn(
                    'text-left p-3 rounded-xl border-2 transition-all',
                    selectedScopes.includes(scope.value)
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className="font-mono text-xs font-medium text-slate-800">{scope.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{scope.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-slate-200">Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear API Key
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Show New Key Modal ───────────────────────────────────────────────────────

function ShowNewKeyModal({ keyData, onClose }: { keyData: NewApiKeyResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(keyData.full_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">API Key creada</h2>
              <p className="text-sm text-slate-500">Copia la clave ahora — no volverá a mostrarse</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm text-emerald-400 break-all">
            {keyData.full_key}
          </div>
          <Button onClick={handleCopy} className={cn('w-full', copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700')}>
            {copied ? <><Check className="w-4 h-4 mr-2" />Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar al portapapeles</>}
          </Button>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Guarda esta clave en un lugar seguro. Por razones de seguridad no podrás verla de nuevo.
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Scopes asignados:</p>
            <div className="flex flex-wrap gap-1.5">
              {keyData.scopes.map(s => <ScopeBadge key={s} scope={s} />)}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="w-full border-slate-200">Entendido, ya la guardé</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Webhook Modal ─────────────────────────────────────────────────────

interface CreateWebhookModalProps {
  eventCatalog: EventItem[]
  webhook?: Webhook | null
  onClose: () => void
  onSaved: (wh: Webhook) => void
}

function CreateWebhookModal({ eventCatalog, webhook, onClose, onSaved }: CreateWebhookModalProps) {
  const [name, setName] = useState(webhook?.name ?? '')
  const [url, setUrl] = useState(webhook?.url ?? '')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook?.events ?? [])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const toggleEvent = (event: string) =>
    setSelectedEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event])

  const toggleAll = () => {
    if (selectedEvents.length === eventCatalog.length) setSelectedEvents([])
    else setSelectedEvents(eventCatalog.map(e => e.event))
  }

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) {
      toast({ title: 'Campos requeridos', description: 'Nombre, URL y al menos un evento son obligatorios', variant: 'destructive' })
      return
    }
    if (!url.startsWith('https://')) {
      toast({ title: 'URL inválida', description: 'La URL del webhook debe usar HTTPS', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      let res
      if (webhook) {
        res = await integrationApi.updateWebhook(webhook.id, { name: name.trim(), url: url.trim(), events: selectedEvents })
      } else {
        res = await integrationApi.createWebhook({ name: name.trim(), url: url.trim(), events: selectedEvents })
      }
      onSaved(res.data)
      toast({ title: webhook ? 'Webhook actualizado' : 'Webhook creado', variant: 'success' } as any)
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error ?? 'No se pudo guardar el webhook', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Group events by module
  const grouped = eventCatalog.reduce<Record<string, EventItem[]>>((acc, e) => {
    const mod = e.event.split('.')[0]
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(e)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            {webhook ? 'Editar Webhook' : 'Nuevo Webhook'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Recibirás eventos firmados con HMAC-SHA256</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre <span className="text-rose-500">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder='Ej. "Sync clientes a ERP"' className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>URL destino (HTTPS) <span className="text-rose-500">*</span></Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://erp.tuempresa.com/webhook" className="bg-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Eventos suscritos <span className="text-rose-500">*</span></Label>
              <button onClick={toggleAll} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                {selectedEvents.length === eventCatalog.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {Object.entries(grouped).map(([mod, events], i) => (
                <div key={mod} className={cn('p-3', i > 0 && 'border-t border-slate-100')}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{mod}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {events.map(ev => (
                      <button
                        key={ev.event}
                        onClick={() => toggleEvent(ev.event)}
                        className={cn(
                          'text-left p-2 rounded-lg border transition-all text-xs',
                          selectedEvents.includes(ev.event)
                            ? 'border-violet-400 bg-violet-50 text-violet-800'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <span className="font-mono font-medium">{ev.event}</span>
                        <span className="block text-slate-400 mt-0.5">{ev.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-slate-200">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {webhook ? 'Guardar cambios' : 'Crear webhook'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Webhook Events Drawer ────────────────────────────────────────────────────

function WebhookEventsDrawer({ webhook, onClose }: { webhook: Webhook; onClose: () => void }) {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await integrationApi.getWebhookEvents(webhook.id, { limit: 50 })
      setEvents(res.data.events ?? res.data)
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el historial', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [webhook.id])

  useEffect(() => { load() }, [load])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              Historial de entregas
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{webhook.name} — últimas 50 entregas</p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Sin entregas registradas</p>
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-medium text-slate-700">{ev.event_type}</span>
                    <EventStatusBadge status={ev.status} />
                    {ev.response_code && (
                      <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded',
                        ev.response_code >= 200 && ev.response_code < 300
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      )}>
                        {ev.response_code}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{new Date(ev.created_at).toLocaleString('es-DO')}</span>
                  </div>
                  {ev.error_message && (
                    <p className="text-xs text-rose-600 mt-1 font-mono truncate">{ev.error_message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">Intento {ev.attempts}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="w-full border-slate-200">Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ERPIntegrations() {
  const { toast } = useToast()

  // Catalogs
  const [scopeCatalog, setScopeCatalog] = useState<ScopeItem[]>([])
  const [eventCatalog, setEventCatalog] = useState<EventItem[]>([])

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<NewApiKeyResult | null>(null)

  // Webhooks
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [webhooksLoading, setWebhooksLoading] = useState(true)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null | undefined>(undefined)
  const [viewingWebhook, setViewingWebhook] = useState<Webhook | null>(null)

  // UI
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'erp'>('keys')
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [keysRes, whRes, scopesRes, eventsRes] = await Promise.all([
        integrationApi.getApiKeys(),
        integrationApi.getWebhooks(),
        integrationApi.getScopeCatalog(),
        integrationApi.getEventCatalog(),
      ])
      setApiKeys(keysRes.data.api_keys ?? keysRes.data)
      setWebhooks(whRes.data.webhooks ?? whRes.data)
      setScopeCatalog(scopesRes.data.scopes ?? scopesRes.data)
      setEventCatalog(eventsRes.data.events ?? eventsRes.data)
    } catch {
      // Use demo data if API is unavailable
      setScopeCatalog([
        { value: 'read:crm', label: 'Leer CRM', description: 'Clientes, contactos, oportunidades' },
        { value: 'write:crm', label: 'Escribir CRM', description: 'Crear/modificar registros CRM' },
        { value: 'read:invoices', label: 'Leer Facturación', description: 'Consultar facturas y NCF' },
        { value: 'write:invoices', label: 'Escribir Facturación', description: 'Crear facturas' },
        { value: 'read:inventory', label: 'Leer Inventario', description: 'Consultar stock y productos' },
        { value: 'write:inventory', label: 'Escribir Inventario', description: 'Ajustar stock' },
        { value: 'read:service', label: 'Leer Servicio', description: 'Consultar tickets y OT' },
        { value: 'write:service', label: 'Escribir Servicio', description: 'Crear/actualizar tickets' },
      ])
      setEventCatalog([
        { event: 'client.created', label: 'Cliente creado', description: 'Nuevo cliente registrado' },
        { event: 'client.updated', label: 'Cliente actualizado', description: 'Datos del cliente modificados' },
        { event: 'opportunity.created', label: 'Oportunidad creada', description: 'Nueva oportunidad de venta' },
        { event: 'opportunity.won', label: 'Oportunidad ganada', description: 'Oportunidad marcada como ganada' },
        { event: 'opportunity.lost', label: 'Oportunidad perdida', description: 'Oportunidad perdida' },
        { event: 'invoice.created', label: 'Factura creada', description: 'Nueva factura generada' },
        { event: 'invoice.paid', label: 'Factura pagada', description: 'Pago registrado en factura' },
        { event: 'invoice.cancelled', label: 'Factura anulada', description: 'Factura anulada' },
        { event: 'ticket.created', label: 'Ticket creado', description: 'Nuevo ticket de servicio' },
        { event: 'ticket.closed', label: 'Ticket cerrado', description: 'Ticket resuelto y cerrado' },
        { event: 'inventory.low_stock', label: 'Stock bajo', description: 'Producto bajo punto de reorden' },
        { event: 'inventory.adjusted', label: 'Inventario ajustado', description: 'Ajuste de stock realizado' },
      ])
    } finally {
      setKeysLoading(false)
      setWebhooksLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la API Key "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await integrationApi.deleteApiKey(id)
      setApiKeys(prev => prev.filter(k => k.id !== id))
      toast({ title: 'API Key eliminada', variant: 'success' } as any)
    } catch {
      toast({ title: 'Error al eliminar la clave', variant: 'destructive' })
    }
  }

  const handleToggleKey = async (key: ApiKey) => {
    try {
      await integrationApi.updateApiKey(key.id, { is_active: !key.is_active })
      setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, is_active: !k.is_active } : k))
    } catch {
      toast({ title: 'Error al actualizar la clave', variant: 'destructive' })
    }
  }

  const handleNewKeyCreated = (key: NewApiKeyResult) => {
    setShowCreateKey(false)
    setApiKeys(prev => [key, ...prev])
    setNewKeyResult(key)
  }

  const handleDeleteWebhook = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el webhook "${name}"?`)) return
    try {
      await integrationApi.deleteWebhook(id)
      setWebhooks(prev => prev.filter(w => w.id !== id))
      toast({ title: 'Webhook eliminado', variant: 'success' } as any)
    } catch {
      toast({ title: 'Error al eliminar el webhook', variant: 'destructive' })
    }
  }

  const handleToggleWebhook = async (wh: Webhook) => {
    try {
      await integrationApi.updateWebhook(wh.id, { is_active: !wh.is_active })
      setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, is_active: !w.is_active, failure_count: !wh.is_active ? 0 : w.failure_count } : w))
    } catch {
      toast({ title: 'Error al actualizar el webhook', variant: 'destructive' })
    }
  }

  const handleTestWebhook = async (wh: Webhook) => {
    setTestingWebhook(wh.id)
    try {
      await integrationApi.testWebhook(wh.id)
      toast({ title: 'Evento de prueba enviado', description: `Revisa el historial de "${wh.name}"`, variant: 'success' } as any)
    } catch (err: any) {
      toast({ title: 'Error en prueba', description: err.response?.data?.error ?? 'No se pudo enviar el evento de prueba', variant: 'destructive' })
    } finally {
      setTestingWebhook(null)
    }
  }

  const handleWebhookSaved = (wh: Webhook) => {
    setWebhooks(prev => {
      const exists = prev.find(w => w.id === wh.id)
      return exists ? prev.map(w => w.id === wh.id ? wh : w) : [wh, ...prev]
    })
    setEditingWebhook(undefined)
  }

  // ─── ERP Connector Cards ──────────────────────────────────────────────────

  const connectors = [
    { name: 'SAP Business One', logo: '🔷', description: 'Sincroniza clientes, facturas e inventario con SAP', available: true },
    { name: 'Oracle NetSuite', logo: '🟠', description: 'Integración bidireccional con NetSuite ERP', available: true },
    { name: 'Odoo', logo: '🟣', description: 'Conecta con Odoo Community o Enterprise', available: true },
    { name: 'QuickBooks Online', logo: '🟢', description: 'Sincroniza facturas y pagos con QuickBooks', available: true },
    { name: 'Alegra', logo: '🔵', description: 'Integración con Alegra para facturación fiscal RD', available: false },
    { name: 'ContaFácil', logo: '🟡', description: 'Sistema contable para PYMES dominicanas', available: false },
  ]

  const tabs = [
    { key: 'keys', label: 'API Keys', icon: Key, count: apiKeys.length },
    { key: 'webhooks', label: 'Webhooks', icon: Zap, count: webhooks.length },
    { key: 'erp', label: 'Conectores ERP', icon: Database, count: null },
  ] as const

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                activeTab === tab.key
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== null && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-mono',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── API KEYS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'keys' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="w-5 h-5 text-violet-500" />
                  API Keys
                </CardTitle>
                <CardDescription>Credenciales para que sistemas externos llamen la API de ANTÜ CRM</CardDescription>
              </div>
              <Button onClick={() => setShowCreateKey(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva API Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {keysLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Sin API Keys</p>
                <p className="text-sm text-slate-400 mt-1">Crea una clave para que tu ERP pueda conectarse</p>
                <Button onClick={() => setShowCreateKey(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />Crear API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className={cn(
                    'p-4 rounded-xl border transition-all',
                    key.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-800">{key.name}</p>
                          {!key.is_active && <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Inactiva</Badge>}
                          {key.expires_at && new Date(key.expires_at) < new Date() && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-xs">Expirada</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{key.key_prefix}••••••••</code>
                          {key.last_used_at && (
                            <span className="text-xs text-slate-400">Último uso: {new Date(key.last_used_at).toLocaleDateString('es-DO')}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {key.scopes.map(s => <ScopeBadge key={s} scope={s} />)}
                        </div>
                        {key.description && <p className="text-xs text-slate-400 mt-1.5">{key.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={key.is_active}
                          onCheckedChange={() => handleToggleKey(key)}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKey(key.id, key.name)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info box */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
              <Globe className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Cómo usar la API Key</p>
                <p className="mt-1">Incluye el encabezado <code className="bg-blue-100 px-1 rounded">X-API-Key: &lt;tu_clave&gt;</code> en cada petición a la API de ANTÜ CRM. Todos los endpoints respetan los scopes asignados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── WEBHOOKS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'webhooks' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-violet-500" />
                  Webhooks
                </CardTitle>
                <CardDescription>ANTÜ CRM notificará a tu ERP cuando ocurran eventos relevantes</CardDescription>
              </div>
              <Button onClick={() => setEditingWebhook(null)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {webhooksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Sin webhooks configurados</p>
                <p className="text-sm text-slate-400 mt-1">Agrega un webhook para recibir eventos en tiempo real</p>
                <Button onClick={() => setEditingWebhook(null)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />Crear webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map(wh => (
                  <div key={wh.id} className={cn(
                    'p-4 rounded-xl border',
                    wh.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60',
                    wh.failure_count >= 5 && 'border-rose-200 bg-rose-50/30'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        wh.failure_count >= 5 ? 'bg-rose-100' : 'bg-emerald-100'
                      )}>
                        <Zap className={cn('w-5 h-5', wh.failure_count >= 5 ? 'text-rose-600' : 'text-emerald-600')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-800">{wh.name}</p>
                          {wh.failure_count >= 5 && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />Suspendido ({wh.failure_count} fallos)
                            </Badge>
                          )}
                          {!wh.is_active && wh.failure_count < 5 && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Inactivo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{wh.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {wh.events.slice(0, 5).map(ev => (
                            <span key={ev} className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ev}</span>
                          ))}
                          {wh.events.length > 5 && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">+{wh.events.length - 5} más</span>
                          )}
                        </div>
                        {wh.last_success_at && (
                          <p className="text-xs text-slate-400 mt-1.5">
                            Último éxito: {new Date(wh.last_success_at).toLocaleString('es-DO')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <Switch
                          checked={wh.is_active}
                          onCheckedChange={() => handleToggleWebhook(wh)}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingWebhook(wh)}
                          className="border-slate-200 text-slate-600 text-xs"
                        >
                          <Activity className="w-3.5 h-3.5 mr-1" />Log
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestWebhook(wh)}
                          disabled={testingWebhook === wh.id}
                          className="border-slate-200 text-slate-600 text-xs"
                        >
                          {testingWebhook === wh.id
                            ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            : <Send className="w-3.5 h-3.5 mr-1" />}
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingWebhook(wh)}
                          className="text-violet-600 hover:bg-violet-50 text-xs"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWebhook(wh.id, wh.name)}
                          className="text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HMAC info */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Seguridad HMAC-SHA256</p>
                <p className="mt-1">Cada entrega incluye el encabezado <code className="bg-amber-100 px-1 rounded">X-Antu-Signature: sha256=...</code> firmado con el secret único del webhook. Verifica la firma en tu servidor antes de procesar el evento.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── ERP CONNECTORS TAB ────────────────────────────────────────── */}
      {activeTab === 'erp' && (
        <div className="space-y-4">
          {/* ── Adm Cloud: conector nativo completo ── */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conector Nativo</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>
          <AdmcloudConnector />

          {/* ── Otros ERPs vía API/Webhooks ── */}
          <div className="flex items-center gap-2 mt-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vía API Keys y Webhooks</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectors.map(connector => (
                  <div key={connector.name} className={cn(
                    'p-4 rounded-xl border transition-all',
                    connector.available
                      ? 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm'
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  )}>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{connector.logo}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 text-sm">{connector.name}</p>
                          {connector.available
                            ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Vía API</Badge>
                            : <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Próximamente</Badge>
                          }
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{connector.description}</p>
                      </div>
                    </div>
                    {connector.available && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 border-violet-200 text-violet-700 hover:bg-violet-50"
                        onClick={() => setActiveTab('keys')}
                      >
                        <Key className="w-3.5 h-3.5 mr-1.5" />
                        Crear API Key
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick start guide */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Guía de integración rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {[
                  { n: 1, title: 'Crear una API Key', desc: 'Ve a la pestaña "API Keys" y crea una clave con los scopes que necesita tu ERP.', action: () => setActiveTab('keys'), label: 'Ir a API Keys' },
                  { n: 2, title: 'Configurar un Webhook', desc: 'Ve a la pestaña "Webhooks" y registra la URL de tu ERP para recibir eventos en tiempo real.', action: () => setActiveTab('webhooks'), label: 'Ir a Webhooks' },
                  { n: 3, title: 'Verificar firma HMAC', desc: 'En tu servidor, valida el header X-Antu-Signature con el secret del webhook usando HMAC-SHA256.', action: null, label: null },
                  { n: 4, title: 'Probar la integración', desc: 'Usa el botón "Test" en el webhook para enviar un evento de prueba y verificar la conectividad.', action: () => setActiveTab('webhooks'), label: 'Ir a Webhooks' },
                ].map(step => (
                  <li key={step.n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-600">{step.n}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{step.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                      {step.action && (
                        <button onClick={step.action} className="text-xs text-violet-600 hover:underline mt-1 font-medium">{step.label} →</button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {showCreateKey && (
        <CreateApiKeyModal
          scopeCatalog={scopeCatalog}
          onClose={() => setShowCreateKey(false)}
          onCreated={handleNewKeyCreated}
        />
      )}

      {newKeyResult && (
        <ShowNewKeyModal
          keyData={newKeyResult}
          onClose={() => setNewKeyResult(null)}
        />
      )}

      {editingWebhook !== undefined && (
        <CreateWebhookModal
          eventCatalog={eventCatalog}
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(undefined)}
          onSaved={handleWebhookSaved}
        />
      )}

      {viewingWebhook && (
        <WebhookEventsDrawer
          webhook={viewingWebhook}
          onClose={() => setViewingWebhook(null)}
        />
      )}
    </div>
  )
}
