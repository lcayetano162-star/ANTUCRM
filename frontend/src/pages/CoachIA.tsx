import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Award, AlertTriangle, RefreshCw, Loader2, Users, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { aiApi } from '@/services/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface RepStats {
  userId: string; name: string; won: number; lost: number
  winRate: number; avgDealValue: number; avgDaysToClose: number; coaching?: string
}
interface CoachAnalysis {
  periodDays: number; totalWon: number; totalLost: number; overallWinRate: number
  avgWonValue: number; avgLostValue: number; winPatterns: string[]; lossPatterns: string[]
  keyRecommendations: string[]; reps: RepStats[]; generatedAt: string
}

export default function CoachIA() {
  const [data, setData] = useState<CoachAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)
  const [expandedRep, setExpandedRep] = useState<string | null>(null)

  const load = async (d = days, refresh = false) => {
    setLoading(true)
    try {
      const res = await aiApi.getCoach(d, refresh)
      setData(res.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error cargando análisis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handlePeriodChange = (d: number) => {
    setDays(d)
    load(d, true)
  }

  const totalDeals = (data?.totalWon || 0) + (data?.totalLost || 0)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Antü Coach IA</h1>
          <p className="text-gray-500 text-sm mt-0.5">Análisis de wins &amp; losses • Coaching inteligente por vendedor</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {[30, 60, 90].map(d => (
              <button key={d}
                onClick={() => handlePeriodChange(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${days === d ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >{d} días</button>
            ))}
          </div>
          <button
            onClick={() => load(days, true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Analizando historial de ventas con IA...</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Win Rate General"
              value={`${data.overallWinRate}%`}
              sub={`${data.totalWon}G / ${data.totalLost}P`}
              color={data.overallWinRate >= 50 ? 'green' : data.overallWinRate >= 30 ? 'yellow' : 'red'}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <KpiCard
              label="Deals Analizados"
              value={totalDeals.toString()}
              sub={`Últimos ${data.periodDays} días`}
              color="blue"
              icon={<Target className="w-5 h-5" />}
            />
            <KpiCard
              label="Valor Prom. Ganado"
              value={formatCurrency(data.avgWonValue)}
              sub="por deal cerrado"
              color="green"
              icon={<Award className="w-5 h-5" />}
            />
            <KpiCard
              label="Valor Prom. Perdido"
              value={formatCurrency(data.avgLostValue)}
              sub="deals que se escaparon"
              color="red"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </div>

          {/* No data state */}
          {totalDeals === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <p className="text-amber-700 font-medium">No hay deals cerrados en los últimos {data.periodDays} días</p>
              <p className="text-amber-600 text-sm mt-1">El análisis aparecerá cuando haya oportunidades cerradas (ganadas o perdidas)</p>
            </div>
          )}

          {/* Win & Loss Patterns */}
          {(data.winPatterns.length > 0 || data.lossPatterns.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Win patterns */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 font-semibold text-emerald-800">
                  <TrendingUp className="w-5 h-5" />
                  Patrones de Éxito
                </div>
                <ul className="space-y-2">
                  {data.winPatterns.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Loss patterns */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 font-semibold text-red-700">
                  <TrendingDown className="w-5 h-5" />
                  Patrones de Pérdida
                </div>
                <ul className="space-y-2">
                  {data.lossPatterns.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✗</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Key Recommendations */}
          {data.keyRecommendations.length > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4 font-semibold text-violet-800">
                <Lightbulb className="w-5 h-5" />
                Recomendaciones Clave
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {data.keyRecommendations.map((r, i) => (
                  <div key={i} className="bg-white border border-violet-100 rounded-lg p-3 text-sm text-gray-700">
                    <span className="font-bold text-violet-600">{i+1}. </span>{r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rep Performance Table */}
          {data.reps.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-gray-700">
                <Users className="w-5 h-5 text-gray-400" />
                Rendimiento por Vendedor
              </div>
              <div className="divide-y">
                {data.reps.map(rep => (
                  <div key={rep.userId}>
                    <div
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRep(expandedRep === rep.userId ? null : rep.userId)}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {rep.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{rep.name}</p>
                        <p className="text-xs text-gray-400">{rep.won}G · {rep.lost}P · prom. {rep.avgDaysToClose} días</p>
                      </div>
                      {/* Win rate bar */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rep.winRate >= 60 ? 'bg-emerald-500' : rep.winRate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${rep.winRate}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${rep.winRate >= 60 ? 'text-emerald-600' : rep.winRate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {rep.winRate}%
                        </span>
                        <span className="text-xs text-gray-400">{formatCurrency(rep.avgDealValue)}</span>
                        {expandedRep === rep.userId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Coaching detail */}
                    {expandedRep === rep.userId && rep.coaching && (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Coach IA:</p>
                        <p className="text-sm text-gray-700">{rep.coaching}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-right">
            Análisis generado: {new Date(data.generatedAt).toLocaleString('es-DO')}
          </p>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
  }
  const valColors: Record<string, string> = {
    green: 'text-emerald-700', red: 'text-red-600', yellow: 'text-yellow-700', blue: 'text-blue-700'
  }
  return (
    <div className={`border rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className={`text-2xl font-bold ${valColors[color] || ''}`}>{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  )
}
