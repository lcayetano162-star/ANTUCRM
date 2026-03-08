import { useState, useEffect } from 'react'
import {
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, Play,
  ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle,
  Webhook, Bell, ArrowRight, ListTodo, GitBranch, Activity
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

// ── Types ─────────────────────────────────────────────────────────────────────
type TriggerType = 'deal_stuck' | 'contact_inactive' | 'task_overdue' | 'deal_won' | 'deal_lost' | 'stage_changed' | 'new_deal_created'
type ActionType  = 'create_task' | 'send_notification' | 'change_stage' | 'webhook'

interface AutomationRule {
  id: string
  name: string
  description?: string
  is_active: boolean
  trigger_type: TriggerType
  trigger_config: Record<string, any>
  action_type: ActionType
  action_config: Record<string, any>
  run_count: number
  last_run_at?: string
  total_executions?: number
  total_errors?: number
  created_by_name?: string
  created_at: string
}

// ── Config labels ─────────────────────────────────────────────────────────────
const TRIGGER_META: Record<TriggerType, { label: string; icon: any; color: string; description: string }> = {
  deal_stuck:        { label: 'Deal estancado',         icon: Clock,      color: 'text-amber-600',  description: 'Oportunidad sin movimiento por N días' },
  contact_inactive:  { label: 'Contacto inactivo',      icon: Activity,   color: 'text-blue-600',   description: 'Contacto sin actividad por N días' },
  task_overdue:      { label: 'Tarea vencida',           icon: AlertCircle,color: 'text-red-600',    description: 'Tarea pendiente después de la fecha límite' },
  deal_won:          { label: 'Deal ganado',             icon: CheckCircle2,color:'text-emerald-600', description: 'Oportunidad cerrada como ganada' },
  deal_lost:         { label: 'Deal perdido',            icon: AlertCircle,color: 'text-red-600',    description: 'Oportunidad cerrada como perdida' },
  stage_changed:     { label: 'Cambio de etapa',        icon: GitBranch,  color: 'text-violet-600', description: 'Oportunidad movida a una etapa específica' },
  new_deal_created:  { label: 'Nuevo deal creado',       icon: Plus,       color: 'text-indigo-600', description: 'Nueva oportunidad creada en el pipeline' },
}

const ACTION_META: Record<ActionType, { label: string; icon: any; color: string }> = {
  create_task:       { label: 'Crear tarea',            icon: ListTodo,   color: 'text-violet-600' },
  send_notification: { label: 'Enviar notificación',    icon: Bell,       color: 'text-blue-600'   },
  change_stage:      { label: 'Cambiar etapa',          icon: GitBranch,  color: 'text-amber-600'  },
  webhook:           { label: 'Llamar webhook',         icon: Webhook,    color: 'text-slate-600'  },
}

const PIPELINE_STAGES = [
  { value: 'prospecting',  label: 'Prospección' },
  { value: 'qualification',label: 'Calificación' },
  { value: 'proposal',     label: 'Propuesta' },
  { value: 'negotiation',  label: 'Negociación' },
  { value: 'closed_won',   label: 'Cerrado Ganado' },
  { value: 'closed_lost',  label: 'Cerrado Perdido' },
]

// ── Default configs ───────────────────────────────────────────────────────────
const defaultTriggerConfig: Record<TriggerType, Record<string, any>> = {
  deal_stuck:        { days: 14, stage: 'any' },
  contact_inactive:  { days: 30 },
  task_overdue:      {},
  deal_won:          { min_value: null, only_gov: false },
  deal_lost:         { min_value: null, only_gov: false },
  stage_changed:     { to_stage: 'negotiation' },
  new_deal_created:  { min_value: null, only_gov: false },
}

const defaultActionConfig: Record<ActionType, Record<string, any>> = {
  create_task:       { title: 'Seguimiento: {name}', description: '', assigned_to: 'owner', days_from_now: 1, priority: 'high' },
  send_notification: { message: 'Automatización activada para {name}' },
  change_stage:      { stage: 'negotiation' },
  webhook:           { url: '', method: 'POST' },
}

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '',
  description: '',
  trigger_type: 'deal_stuck' as TriggerType,
  trigger_config: { ...defaultTriggerConfig['deal_stuck'] },
  action_type: 'create_task' as ActionType,
  action_config: { ...defaultActionConfig['create_task'] },
})

// ── Main Component ────────────────────────────────────────────────────────────
export default function Automations() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [runningNow, setRunningNow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadRules() }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      const res = await api.get('/automations')
      setRules(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error cargando automatizaciones')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingRule(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description || '',
      trigger_type: rule.trigger_type,
      trigger_config: { ...rule.trigger_config },
      action_type: rule.action_type,
      action_config: { ...rule.action_config },
    })
    setShowModal(true)
  }

  const handleTriggerChange = (t: TriggerType) => {
    setForm(f => ({ ...f, trigger_type: t, trigger_config: { ...defaultTriggerConfig[t] } }))
  }

  const handleActionChange = (a: ActionType) => {
    setForm(f => ({ ...f, action_type: a, action_config: { ...defaultActionConfig[a] } }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      setSaving(true)
      if (editingRule) {
        const res = await api.put(`/automations/${editingRule.id}`, form)
        setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...res.data } : r))
      } else {
        const res = await api.post('/automations', form)
        setRules(prev => [res.data, ...prev])
      }
      setShowModal(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error guardando automatización')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      const res = await api.patch(`/automations/${id}/toggle`)
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: res.data.is_active } : r))
    } catch (err: any) {
      setError('Error cambiando estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta automatización? No se puede deshacer.')) return
    try {
      await api.delete(`/automations/${id}`)
      setRules(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError('Error eliminando automatización')
    }
  }

  const handleRunNow = async () => {
    try {
      setRunningNow(true)
      await api.post('/automations/run-now')
      setTimeout(loadRules, 3000) // refresh after 3s
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error ejecutando verificación')
    } finally {
      setRunningNow(false)
    }
  }

  const activeCount = rules.filter(r => r.is_active).length
  const totalFired  = rules.reduce((acc, r) => acc + (r.total_executions || 0), 0)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-violet-600" />
            Motor de Automatizaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Reglas if-this-then-that: automatiza flujos de trabajo sin código
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={handleRunNow}
            disabled={runningNow}
            className="text-slate-600 border-slate-200"
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 ${runningNow ? 'animate-pulse' : ''}`} />
            {runningNow ? 'Ejecutando...' : 'Verificar ahora'}
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva regla
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de reglas',   value: rules.length,  color: 'text-slate-700' },
          { label: 'Reglas activas',    value: activeCount,   color: 'text-emerald-600' },
          { label: 'Acciones ejecutadas', value: totalFired,  color: 'text-violet-600' },
        ].map(stat => (
          <Card key={stat.label} className="border border-slate-100">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No hay automatizaciones aún</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Crea tu primera regla y deja que el CRM trabaje por ti
            </p>
            <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" /> Crear primera regla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const tm = TRIGGER_META[rule.trigger_type]
            const am = ACTION_META[rule.action_type]
            const TriggerIcon = tm.icon
            const ActionIcon  = am.icon
            const isExpanded  = expandedId === rule.id

            return (
              <Card key={rule.id} className={`border ${rule.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'} transition-all`}>
                <CardContent className="p-4">
                  {/* Rule header */}
                  <div className="flex items-start gap-3">
                    {/* Toggle */}
                    <button onClick={() => handleToggle(rule.id)} className="mt-0.5 shrink-0">
                      {rule.is_active
                        ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                        : <ToggleLeft  className="w-6 h-6 text-slate-300"  />
                      }
                    </button>

                    {/* Rule info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{rule.name}</p>
                        {!rule.is_active && <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200">Inactiva</Badge>}
                        {rule.total_errors! > 0 && (
                          <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">
                            {rule.total_errors} error{rule.total_errors! > 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Trigger → Action summary */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <div className={`flex items-center gap-1 text-xs ${tm.color}`}>
                          <TriggerIcon className="w-3 h-3" />
                          <span className="font-medium">{tm.label}</span>
                          {rule.trigger_config?.days && (
                            <span className="text-slate-400">(+{rule.trigger_config.days}d)</span>
                          )}
                          {rule.trigger_config?.to_stage && (
                            <span className="text-slate-400">→ {rule.trigger_config.to_stage}</span>
                          )}
                        </div>
                        {/* Condition badges */}
                        {rule.trigger_config?.min_value && (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 px-1.5 py-0">
                            ≥${(rule.trigger_config.min_value / 1000000).toFixed(1)}M
                          </Badge>
                        )}
                        {rule.trigger_config?.only_gov && (
                          <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-blue-50 px-1.5 py-0">
                            GOV
                          </Badge>
                        )}
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <div className={`flex items-center gap-1 text-xs ${am.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          <span className="font-medium">{am.label}</span>
                          {rule.action_config?.title && (
                            <span className="text-slate-400 truncate max-w-[120px]">"{rule.action_config.title}"</span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span>{rule.total_executions || 0} ejecución{rule.total_executions !== 1 ? 'es' : ''}</span>
                        {rule.last_run_at && (
                          <span>Última: {new Date(rule.last_run_at).toLocaleDateString('es')}</span>
                        )}
                        {rule.created_by_name && <span>Por {rule.created_by_name}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(rule)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded config detail */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                          <TriggerIcon className={`w-3 h-3 ${tm.color}`} /> Disparador
                        </p>
                        <p className="text-slate-500">{tm.description}</p>
                        {Object.entries(rule.trigger_config || {}).map(([k, v]) => (
                          <p key={k} className="mt-1 text-slate-600">
                            <span className="font-medium">{k}:</span> {String(v)}
                          </p>
                        ))}
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                          <ActionIcon className={`w-3 h-3 ${am.color}`} /> Acción
                        </p>
                        {Object.entries(rule.action_config || {}).filter(([,v]) => v !== '').map(([k, v]) => (
                          <p key={k} className="mt-1 text-slate-600">
                            <span className="font-medium">{k}:</span> {String(v)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Modal: Create / Edit Rule ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-600" />
                  {editingRule ? 'Editar automatización' : 'Nueva automatización'}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Configura el disparador y la acción a ejecutar</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nombre de la regla *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Crear seguimiento cuando deal se estanca"
                  className="text-sm"
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Disparador — ¿Cuándo debe ejecutarse?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TRIGGER_META) as TriggerType[]).map(t => {
                    const meta = TRIGGER_META[t]
                    const Icon = meta.icon
                    return (
                      <button
                        key={t}
                        onClick={() => handleTriggerChange(t)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.trigger_type === t
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${form.trigger_type === t ? meta.color : 'text-slate-600'}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trigger Config */}
              <TriggerConfigFields
                type={form.trigger_type}
                config={form.trigger_config}
                onChange={c => setForm(f => ({ ...f, trigger_config: { ...f.trigger_config, ...c } }))}
              />

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100" />
                <div className="flex items-center gap-1 bg-violet-100 text-violet-600 rounded-full px-3 py-1 text-xs font-semibold">
                  <ArrowRight className="w-3 h-3" /> Entonces
                </div>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Action Type */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Acción — ¿Qué debe hacer?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ACTION_META) as ActionType[]).map(a => {
                    const meta = ACTION_META[a]
                    const Icon = meta.icon
                    return (
                      <button
                        key={a}
                        onClick={() => handleActionChange(a)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.action_type === a
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${form.action_type === a ? meta.color : 'text-slate-600'}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action Config */}
              <ActionConfigFields
                type={form.action_type}
                config={form.action_config}
                onChange={c => setForm(f => ({ ...f, action_config: { ...f.action_config, ...c } }))}
              />
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {saving ? 'Guardando...' : (editingRule ? 'Actualizar regla' : 'Crear regla')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Trigger Config Fields ──────────────────────────────────────────────────────
function TriggerConfigFields({ type, config, onChange }: {
  type: TriggerType
  config: Record<string, any>
  onChange: (c: Record<string, any>) => void
}) {
  if (type === 'deal_stuck') return (
    <div className="space-y-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
      <div>
        <label className="text-xs font-medium text-amber-800 block mb-1">Días sin movimiento</label>
        <Input
          type="number" min="1" max="365"
          value={config.days || 14}
          onChange={e => onChange({ days: parseInt(e.target.value) })}
          className="text-sm h-8"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-amber-800 block mb-1">Etapa (opcional)</label>
        <select
          value={config.stage || 'any'}
          onChange={e => onChange({ stage: e.target.value })}
          className="w-full text-xs border border-amber-200 rounded-md h-8 px-2 bg-white"
        >
          <option value="any">Cualquier etapa activa</option>
          {PIPELINE_STAGES.slice(0,4).map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )

  if (type === 'contact_inactive') return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
      <label className="text-xs font-medium text-blue-800 block mb-1">Días sin actividad</label>
      <Input
        type="number" min="1" max="365"
        value={config.days || 30}
        onChange={e => onChange({ days: parseInt(e.target.value) })}
        className="text-sm h-8"
      />
    </div>
  )

  if (type === 'stage_changed') return (
    <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
      <label className="text-xs font-medium text-violet-800 block mb-1">Cuando llega a la etapa</label>
      <select
        value={config.to_stage || 'negotiation'}
        onChange={e => onChange({ to_stage: e.target.value })}
        className="w-full text-xs border border-violet-200 rounded-md h-8 px-2 bg-white"
      >
        {PIPELINE_STAGES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )

  // deal_won, deal_lost, new_deal_created — conditional filters
  if (['deal_won', 'deal_lost', 'new_deal_created'].includes(type)) return (
    <div className="space-y-3 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
      <p className="text-xs font-semibold text-emerald-800">Condiciones (opcionales)</p>
      <div>
        <label className="text-xs font-medium text-emerald-800 block mb-1">
          Valor mínimo del deal (0 = sin límite)
        </label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
          <Input
            type="number" min="0" step="100000"
            value={config.min_value || ''}
            onChange={e => onChange({ min_value: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Ej: 2000000"
            className="text-sm h-8 pl-6"
          />
        </div>
        <p className="text-[10px] text-emerald-600 mt-0.5">Solo aplica si el deal supera este valor</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="only_gov"
          checked={config.only_gov || false}
          onChange={e => onChange({ only_gov: e.target.checked })}
          className="rounded border-emerald-300 text-emerald-600"
        />
        <label htmlFor="only_gov" className="text-xs font-medium text-emerald-800 cursor-pointer">
          Solo clientes gubernamentales (Ley 47-25)
        </label>
      </div>
    </div>
  )

  return (
    <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg p-3">
      Este disparador no requiere configuración adicional.
    </p>
  )
}

// ── Action Config Fields ───────────────────────────────────────────────────────
function ActionConfigFields({ type, config, onChange }: {
  type: ActionType
  config: Record<string, any>
  onChange: (c: Record<string, any>) => void
}) {
  if (type === 'create_task') return (
    <div className="space-y-3 bg-violet-50 rounded-lg p-3 border border-violet-100">
      <div>
        <label className="text-xs font-medium text-violet-800 block mb-1">
          Título de la tarea <span className="text-slate-400 font-normal">(usa {'{name}'} para el nombre del deal)</span>
        </label>
        <Input
          value={config.title || ''}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Seguimiento: {name}"
          className="text-sm h-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-violet-800 block mb-1">Días desde hoy</label>
          <Input
            type="number" min="0" max="365"
            value={config.days_from_now ?? 1}
            onChange={e => onChange({ days_from_now: parseInt(e.target.value) })}
            className="text-sm h-8"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-violet-800 block mb-1">Prioridad</label>
          <select
            value={config.priority || 'high'}
            onChange={e => onChange({ priority: e.target.value })}
            className="w-full text-xs border border-violet-200 rounded-md h-8 px-2 bg-white"
          >
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-violet-800 block mb-1">Asignar a</label>
        <select
          value={config.assigned_to || 'owner'}
          onChange={e => onChange({ assigned_to: e.target.value })}
          className="w-full text-xs border border-violet-200 rounded-md h-8 px-2 bg-white"
        >
          <option value="owner">Dueño del deal/contacto</option>
        </select>
      </div>
    </div>
  )

  if (type === 'send_notification') return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
      <label className="text-xs font-medium text-blue-800 block mb-1">
        Mensaje <span className="text-slate-400 font-normal">(usa {'{name}'}, {'{days_stuck}'}, etc.)</span>
      </label>
      <textarea
        value={config.message || ''}
        onChange={e => onChange({ message: e.target.value })}
        placeholder="Automatización activada para {name}"
        rows={2}
        className="w-full text-xs border border-blue-200 rounded-md p-2 bg-white resize-none"
      />
    </div>
  )

  if (type === 'change_stage') return (
    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
      <label className="text-xs font-medium text-amber-800 block mb-1">Mover a la etapa</label>
      <select
        value={config.stage || 'negotiation'}
        onChange={e => onChange({ stage: e.target.value })}
        className="w-full text-xs border border-amber-200 rounded-md h-8 px-2 bg-white"
      >
        {PIPELINE_STAGES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )

  if (type === 'webhook') return (
    <div className="space-y-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">URL del webhook *</label>
        <Input
          value={config.url || ''}
          onChange={e => onChange({ url: e.target.value })}
          placeholder="https://hooks.example.com/crm-event"
          className="text-sm h-8"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Método HTTP</label>
        <select
          value={config.method || 'POST'}
          onChange={e => onChange({ method: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md h-8 px-2 bg-white"
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
      </div>
    </div>
  )

  return null
}
