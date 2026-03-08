import { useState } from 'react'
import { X, Zap, Target, AlertTriangle, CheckSquare, Loader2, Calendar, ChevronRight } from 'lucide-react'
import { aiApi } from '@/services/api'
import { toast } from 'sonner'

interface TalkingPoint { title: string; detail: string }
interface MeetingBrief {
  clientName: string
  opportunityName?: string
  executiveSummary: string
  keyContext: string[]
  talkingPoints: TalkingPoint[]
  openItems: string[]
  risks: string[]
  suggestedActions: string[]
  generatedAt: string
}

interface Props {
  clientId: string
  clientName: string
  opportunityId?: string
  opportunityName?: string
  onClose: () => void
}

export default function MeetingPrepModal({ clientId, clientName, opportunityId, opportunityName, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<MeetingBrief | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await aiApi.meetingPrep(clientId, opportunityId)
      setBrief(res.data)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error generando el briefing'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-t-2xl">
          <div>
            <p className="text-violet-200 text-xs font-medium uppercase tracking-widest">Preparación de Reunión • IA</p>
            <h2 className="text-lg font-bold">{clientName}</h2>
            {opportunityName && <p className="text-violet-200 text-sm">{opportunityName}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!brief && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Briefing Inteligente Pre-Reunión</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                La IA analizará el historial del cliente, actividades recientes, oportunidades y contactos
                para prepararte en segundos.
              </p>
              <button
                onClick={generate}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 mx-auto"
              >
                <Zap className="w-4 h-4" />
                Generar Briefing
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Analizando historial del cliente...</p>
              <p className="text-gray-400 text-sm mt-1">Esto tomará unos segundos</p>
            </div>
          )}

          {brief && (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <p className="text-violet-800 text-sm font-medium mb-1">Resumen ejecutivo</p>
                <p className="text-gray-800">{brief.executiveSummary}</p>
              </div>

              {/* Key Context */}
              {brief.keyContext.length > 0 && (
                <Section icon={<Target className="w-4 h-4 text-blue-600" />} title="Contexto clave" color="blue">
                  <ul className="space-y-1">
                    {brief.keyContext.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Talking Points */}
              {brief.talkingPoints.length > 0 && (
                <Section icon={<Zap className="w-4 h-4 text-violet-600" />} title="Puntos de conversación" color="violet">
                  <div className="space-y-3">
                    {brief.talkingPoints.map((pt, i) => (
                      <div key={i} className="border-l-2 border-violet-300 pl-3">
                        <p className="text-sm font-semibold text-gray-800">{pt.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{pt.detail}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Risks */}
              {brief.risks.length > 0 && (
                <Section icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} title="Riesgos a considerar" color="amber">
                  <ul className="space-y-1">
                    {brief.risks.map((r, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">⚠</span> {r}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Open Items */}
              {brief.openItems.length > 0 && (
                <Section icon={<CheckSquare className="w-4 h-4 text-orange-500" />} title="Temas pendientes" color="orange">
                  <ul className="space-y-1">
                    {brief.openItems.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-400">◦</span> {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Suggested Actions */}
              {brief.suggestedActions.length > 0 && (
                <Section icon={<CheckSquare className="w-4 h-4 text-green-600" />} title="Acciones post-reunión sugeridas" color="green">
                  <ol className="space-y-1">
                    {brief.suggestedActions.map((a, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="font-bold text-green-600 flex-shrink-0">{i+1}.</span> {a}
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Generado: {new Date(brief.generatedAt).toLocaleString('es-DO')}
                </p>
                <button
                  onClick={generate}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" /> Regenerar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    violet: 'bg-violet-50 border-violet-200',
    amber: 'bg-amber-50 border-amber-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
  }
  const titleColors: Record<string, string> = {
    blue: 'text-blue-700', violet: 'text-violet-700',
    amber: 'text-amber-700', orange: 'text-orange-700', green: 'text-green-700',
  }
  return (
    <div className={`border rounded-xl p-4 ${colors[color] || ''}`}>
      <div className={`flex items-center gap-2 mb-3 font-semibold text-sm ${titleColors[color] || ''}`}>
        {icon} {title}
      </div>
      {children}
    </div>
  )
}
