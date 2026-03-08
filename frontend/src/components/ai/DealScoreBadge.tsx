import { useState } from 'react'
import { Zap, Loader2, TrendingUp, AlertTriangle, ThumbsDown, Flame } from 'lucide-react'
import { aiApi } from '@/services/api'
import { toast } from 'sonner'

interface ScoreFactor { name: string; label: string; value: number; detail: string }

interface DealScore {
  score: number
  label: 'Caliente' | 'Tibio' | 'Frío' | 'Perdido'
  color: 'green' | 'yellow' | 'orange' | 'red'
  factors: ScoreFactor[]
  rationale: string
}

interface Props {
  opportunityId: string
  initialScore?: number | null
  initialLabel?: string | null
  onScored?: (score: DealScore) => void
}

const COLOR_CLASSES: Record<string, { badge: string; bar: string; icon: string }> = {
  green:  { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',  bar: 'bg-emerald-500',  icon: 'text-emerald-600' },
  yellow: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',    bar: 'bg-yellow-400',   icon: 'text-yellow-600' },
  orange: { badge: 'bg-orange-100 text-orange-700 border-orange-200',    bar: 'bg-orange-400',   icon: 'text-orange-600' },
  red:    { badge: 'bg-red-100 text-red-700 border-red-200',             bar: 'bg-red-400',      icon: 'text-red-600' },
}

const LABEL_ICON: Record<string, React.ReactNode> = {
  'Caliente': <Flame className="w-3.5 h-3.5" />,
  'Tibio':    <TrendingUp className="w-3.5 h-3.5" />,
  'Frío':     <AlertTriangle className="w-3.5 h-3.5" />,
  'Perdido':  <ThumbsDown className="w-3.5 h-3.5" />,
}

function colorFromScore(score: number | null | undefined) {
  if (score == null) return 'yellow'
  if (score >= 70) return 'green'
  if (score >= 45) return 'yellow'
  if (score >= 20) return 'orange'
  return 'red'
}

export default function DealScoreBadge({ opportunityId, initialScore, initialLabel, onScored }: Props) {
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<DealScore | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const currentScore = score?.score ?? initialScore
  const currentLabel = score?.label ?? initialLabel
  const currentColor = score?.color ?? colorFromScore(initialScore)
  const cls = COLOR_CLASSES[currentColor] || COLOR_CLASSES.yellow

  const calculate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await aiApi.scoreDeal(opportunityId)
      setScore(res.data)
      onScored?.(res.data)
      setShowDetail(true)
    } catch (err: any) {
      toast.error('Error calculando score del deal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-500 border-gray-200">
        <Loader2 className="w-3 h-3 animate-spin" /> Calculando...
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      {currentScore != null ? (
        <button
          onClick={(e) => { e.stopPropagation(); setShowDetail(v => !v) }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border cursor-pointer ${cls.badge}`}
          title="Click para ver detalles del score"
        >
          {LABEL_ICON[currentLabel || ''] || <Zap className="w-3.5 h-3.5" />}
          {currentScore} • {currentLabel}
        </button>
      ) : (
        <button
          onClick={calculate}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600 transition-colors cursor-pointer"
          title="Calcular score con IA"
        >
          <Zap className="w-3 h-3" /> Score IA
        </button>
      )}

      {/* Recalculate button (small) when score exists */}
      {currentScore != null && !showDetail && (
        <button
          onClick={calculate}
          className="ml-1 text-gray-300 hover:text-violet-400 transition-colors"
          title="Recalcular"
        >
          <Zap className="w-3 h-3" />
        </button>
      )}

      {/* Detail popover */}
      {showDetail && score && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Deal Score IA</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-2xl font-bold ${cls.icon}`}>{score.score}</span>
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${cls.badge}`}>{score.label}</span>
              </div>
            </div>
            <button onClick={() => setShowDetail(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
          </div>

          {/* Score bar */}
          <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${cls.bar}`} style={{ width: `${score.score}%` }} />
          </div>

          {/* Factors */}
          <div className="space-y-2 mb-3">
            {score.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs font-bold mt-0.5 w-10 text-right flex-shrink-0 ${f.value > 0 ? 'text-emerald-600' : f.value < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {f.value > 0 ? '+' : ''}{f.value}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={calculate}
            className="w-full py-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 border border-violet-200 hover:border-violet-300 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" /> Recalcular Score
          </button>
        </div>
      )}
    </div>
  )
}
