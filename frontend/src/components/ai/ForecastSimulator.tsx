import { useEffect, useState } from 'react'
import { RefreshCw, Loader2, TrendingUp, Calendar, DollarSign, BarChart3 } from 'lucide-react'
import { aiApi } from '@/services/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface StageRow { stage: string; stageName: string; count: number; totalValue: number; weightedPessimistic: number; weightedRealistic: number; weightedOptimistic: number }
interface Scenario { label: string; multiplier: number; total: number; color: string }
interface ForecastResult {
  stages: StageRow[]; scenarios: Scenario[]; pipelineTotal: number; activeCount: number
  avgDealSize: number; closingThisMonth: number; closingThisMonthValue: number
  historicalWinRate: number; generatedAt: string
}

const SCENARIO_STYLES: Record<string, { bg: string; border: string; text: string; bar: string; badge: string }> = {
  red:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   bar: 'bg-red-400',   badge: 'bg-red-100 text-red-700' },
  blue:  { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  bar: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
}

export default function ForecastSimulator() {
  const [data, setData] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeScenario, setActiveScenario] = useState<string>('Realista')

  const load = async (refresh = false) => {
    setLoading(true)
    try {
      const res = await aiApi.getForecast(refresh)
      setData(res.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error cargando forecast')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const maxScenario = data ? Math.max(...data.scenarios.map(s => s.total)) : 1

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5" />
          <div>
            <p className="font-bold">Forecast Simulator IA</p>
            <p className="text-blue-200 text-xs">Proyección de ingresos · Pipeline actual</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar forecast"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {data && (
        <div className="p-5 space-y-5">

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Pipeline Total',       value: formatCurrency(data.pipelineTotal),    icon: <DollarSign className="w-4 h-4" />,  color: 'text-blue-600' },
              { label: 'Deals Activos',         value: data.activeCount.toString(),           icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-600' },
              { label: 'Win Rate Histórico',    value: `${data.historicalWinRate}%`,          icon: <BarChart3 className="w-4 h-4" />,  color: 'text-emerald-600' },
              { label: 'Cierran Este Mes',      value: data.closingThisMonth.toString(),      icon: <Calendar className="w-4 h-4" />,   color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-medium text-gray-500">{s.label}</span></div>
                <p className="text-lg font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Scenario cards */}
          <div className="grid grid-cols-3 gap-3">
            {data.scenarios.map(sc => {
              const st = SCENARIO_STYLES[sc.color] || SCENARIO_STYLES.blue
              const isActive = sc.label === activeScenario
              return (
                <button
                  key={sc.label}
                  onClick={() => setActiveScenario(sc.label)}
                  className={`border rounded-xl p-4 text-left transition-all ${st.bg} ${st.border} ${isActive ? 'ring-2 ring-offset-1 ring-blue-400 shadow-md' : 'opacity-80 hover:opacity-100'}`}
                >
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${st.badge}`}>{sc.label}</div>
                  <p className={`text-xl font-bold ${st.text}`}>{formatCurrency(sc.total)}</p>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${(sc.total / maxScenario) * 100}%` }} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Stage breakdown */}
          {data.stages.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Desglose por Etapa — Escenario {activeScenario}</p>
              <div className="space-y-2">
                {data.stages.map(row => {
                  const scenarioValue = activeScenario === 'Pesimista' ? row.weightedPessimistic
                    : activeScenario === 'Optimista' ? row.weightedOptimistic
                    : row.weightedRealistic
                  const pct = row.totalValue > 0 ? (scenarioValue / row.totalValue) * 100 : 0
                  return (
                    <div key={row.stage} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-600 flex-shrink-0">{row.stageName}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-24 text-right">{formatCurrency(scenarioValue)}</span>
                      <span className="text-xs text-gray-400 w-12 text-right">{row.count} deals</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No hay deals activos en el pipeline para proyectar
            </div>
          )}

          {/* Closing this month callout */}
          {data.closingThisMonth > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  {data.closingThisMonth} deal{data.closingThisMonth > 1 ? 's' : ''} con cierre este mes
                </p>
                <p className="text-xs text-orange-600">Valor total: {formatCurrency(data.closingThisMonthValue)}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-right">
            Actualizado: {new Date(data.generatedAt).toLocaleString('es-DO')} · cache 30 min
          </p>
        </div>
      )}
    </div>
  )
}
