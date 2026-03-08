import { Building2, Calendar, TrendingUp, User, ChevronRight, Phone } from 'lucide-react'

export type StageGroup = 'qualify' | 'develop' | 'close' | 'lost'

export interface OpportunityCardData {
  id: string
  name: string
  client_name: string
  stage: string
  stageName: string
  probability: number
  estimated_revenue: number
  expected_close_date?: string
  owner_first_name?: string
  owner_last_name?: string
}

// ─── Stage color mapping ───────────────────────────────────────────────
const STAGE_THEME: Record<string, {
  bg: string          // card background
  accent: string      // left accent bar
  pill: string        // stage badge bg+text
  probBar: string     // progress bar fill
  label: string       // display name
}> = {
  qualify: {
    bg: '#F4EBFF',
    accent: '#C084FC',
    pill: 'bg-purple-100 text-purple-700',
    probBar: '#C084FC',
    label: 'Calificar',
  },
  analysis: {
    bg: '#EFF6FF',
    accent: '#60A5FA',
    pill: 'bg-blue-100 text-blue-700',
    probBar: '#60A5FA',
    label: 'Análisis',
  },
  proposal: {
    bg: '#EFF6FF',
    accent: '#3B82F6',
    pill: 'bg-blue-100 text-blue-700',
    probBar: '#3B82F6',
    label: 'Propuesta',
  },
  negotiation: {
    bg: '#EFF6FF',
    accent: '#2563EB',
    pill: 'bg-blue-100 text-blue-800',
    probBar: '#2563EB',
    label: 'Negociación',
  },
  closed_won: {
    bg: '#F0FDF4',
    accent: '#34D399',
    pill: 'bg-emerald-100 text-emerald-700',
    probBar: '#34D399',
    label: 'Cerrada Ganada',
  },
  closed_lost: {
    bg: '#FFF7F7',
    accent: '#F87171',
    pill: 'bg-red-100 text-red-600',
    probBar: '#F87171',
    label: 'Perdida',
  },
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface Props {
  opportunity: OpportunityCardData
  onActivity?: (opp: OpportunityCardData) => void
  onMove?: (opp: OpportunityCardData) => void
}

export default function OpportunityCard({ opportunity, onActivity, onMove }: Props) {
  const theme = STAGE_THEME[opportunity.stage] ?? STAGE_THEME['qualify']
  const ownerName = [opportunity.owner_first_name, opportunity.owner_last_name]
    .filter(Boolean).join(' ') || '—'

  return (
    <div
      className="relative flex overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
      style={{ background: theme.bg }}
    >
      {/* Left accent bar — thin, no thick border */}
      <div
        className="w-1 flex-shrink-0 rounded-l-xl"
        style={{ background: theme.accent }}
      />

      <div className="flex-1 p-4 min-w-0">
        {/* Top row: stage pill + probability */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${theme.pill}`}>
            {theme.label}
          </span>
          <span className="text-xs text-gray-400 tabular-nums">{opportunity.probability}% prob.</span>
        </div>

        {/* Opportunity name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate mb-1">
          {opportunity.name}
        </h3>

        {/* Client */}
        <div className="flex items-center gap-1.5 mb-3">
          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{opportunity.client_name || '—'}</span>
        </div>

        {/* Probability bar */}
        <div className="mb-3">
          <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${opportunity.probability}%`,
                background: theme.probBar,
              }}
            />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-bold text-gray-800">
              {formatCLP(opportunity.estimated_revenue)}
            </span>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-black/5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Owner */}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate max-w-[80px]">{ownerName}</span>
            </div>
            {/* Close date */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">{formatDate(opportunity.expected_close_date)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {onActivity && (
              <button
                onClick={() => onActivity(opportunity)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
                title="Registrar actividad"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            )}
            {onMove && (
              <button
                onClick={() => onMove(opportunity)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
                title="Mover etapa"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
