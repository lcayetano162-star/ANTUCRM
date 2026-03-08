import { useState, useEffect } from 'react'
import {
  Sparkles, RefreshCw, AlertTriangle, UserX,
  CheckCircle2, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Zap, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'
import { formatCurrency } from '@/lib/utils'

interface AIDailyBriefing {
  id: string
  briefingDate: string
  greeting: string
  summary: string
  atRiskDeals: { id: string; name: string; stage: string; daysStuck: number; value: number; clientName?: string }[]
  staleContacts: { id: string; name: string; company?: string; daysSinceContact: number }[]
  overdueTasks: { id: string; title: string; dueDate: string; relatedTo?: string }[]
  pipelineHealth: 'excelente' | 'bueno' | 'en_riesgo' | 'critico'
  pipelineGap: number
  topAction: string
  insights: string[]
  monthlyGoal: number
  wonThisMonth: number
  createdAt: string
}

const HEALTH_CONFIG = {
  excelente: { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: TrendingUp },
  bueno:     { label: 'Bueno',     color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',       icon: TrendingUp },
  en_riesgo: { label: 'En riesgo', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     icon: Minus },
  critico:   { label: 'Crítico',   color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: TrendingDown },
}

export default function AIMorningBriefing() {
  const [briefing, setBriefing] = useState<AIDailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { loadBriefing() }, [])

  const loadBriefing = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/ai/briefing')
      setBriefing(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo cargar el briefing de IA')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    try {
      setRegenerating(true)
      setError(null)
      const res = await api.post('/ai/briefing/regenerate')
      setBriefing(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error actualizando briefing')
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <Card className="border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-violet-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-violet-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadBriefing} className="text-amber-700 hover:bg-amber-100">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!briefing) return null

  const health = HEALTH_CONFIG[briefing.pipelineHealth] || HEALTH_CONFIG.bueno
  const HealthIcon = health.icon
  const totalAlerts = briefing.atRiskDeals.length + briefing.staleContacts.length + briefing.overdueTasks.length

  return (
    <Card className="border border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icono animado */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm leading-snug">{briefing.greeting}</p>
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{briefing.summary}</p>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-slate-400 hover:text-violet-600 hover:bg-violet-100 shrink-0 h-7 w-7 p-0"
            title="Actualizar briefing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 space-y-3">
        {/* Pipeline Health + Meta */}
        <div className={`rounded-lg border p-3 ${health.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <HealthIcon className={`w-4 h-4 ${health.color}`} />
            <span className={`text-sm font-semibold ${health.color}`}>Pipeline {health.label}</span>
          </div>
          {briefing.monthlyGoal > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Cierre mes</p>
              <p className="text-xs font-bold text-slate-700">
                {formatCurrency(briefing.wonThisMonth)} / {formatCurrency(briefing.monthlyGoal)}
              </p>
            </div>
          )}
        </div>

        {/* Acción prioritaria */}
        <div className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 p-3 flex gap-2">
          <Zap className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wide">Acción prioritaria de hoy</p>
            <p className="text-white text-xs mt-0.5 leading-snug">{briefing.topAction}</p>
          </div>
        </div>

        {/* Alertas resumen */}
        {totalAlerts > 0 && (
          <div className="flex gap-2 flex-wrap">
            {briefing.atRiskDeals.length > 0 && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs gap-1">
                <AlertTriangle className="w-3 h-3" />
                {briefing.atRiskDeals.length} deal{briefing.atRiskDeals.length > 1 ? 's' : ''} en riesgo
              </Badge>
            )}
            {briefing.staleContacts.length > 0 && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-xs gap-1">
                <UserX className="w-3 h-3" />
                {briefing.staleContacts.length} contacto{briefing.staleContacts.length > 1 ? 's' : ''} sin seguimiento
              </Badge>
            )}
            {briefing.overdueTasks.length > 0 && (
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-xs gap-1">
                <Clock className="w-3 h-3" />
                {briefing.overdueTasks.length} tarea{briefing.overdueTasks.length > 1 ? 's' : ''} vencida{briefing.overdueTasks.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Expandir detalle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-violet-600 hover:text-violet-800 py-1 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Ocultar detalles</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Ver análisis completo</>
          )}
        </button>

        {/* Detalles expandidos */}
        {expanded && (
          <div className="space-y-3 pt-1 border-t border-violet-100">
            {/* Insights */}
            {briefing.insights.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" /> Insights de Antü IA
                </p>
                <ul className="space-y-1.5">
                  {briefing.insights.map((insight, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deals en riesgo */}
            {briefing.atRiskDeals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Oportunidades estancadas
                </p>
                <ul className="space-y-1.5">
                  {briefing.atRiskDeals.map(deal => (
                    <li key={deal.id} className="bg-white rounded-md border border-amber-100 px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{deal.name}</p>
                        <p className="text-[10px] text-slate-400">{deal.clientName} · {deal.stage}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-amber-600">{deal.daysStuck}d sin avance</p>
                        <p className="text-[10px] text-slate-400">{formatCurrency(deal.value)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contactos descuidados */}
            {briefing.staleContacts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                  <UserX className="w-3 h-3" /> Contactos sin seguimiento
                </p>
                <ul className="space-y-1.5">
                  {briefing.staleContacts.map(contact => (
                    <li key={contact.id} className="bg-white rounded-md border border-blue-100 px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.company || 'Sin empresa'}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">{contact.daysSinceContact}d</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tareas vencidas */}
            {briefing.overdueTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tareas vencidas
                </p>
                <ul className="space-y-1.5">
                  {briefing.overdueTasks.map(task => (
                    <li key={task.id} className="bg-white rounded-md border border-red-100 px-3 py-2">
                      <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
                      <p className="text-[10px] text-red-500">Venció: {new Date(task.dueDate).toLocaleDateString('es')}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
