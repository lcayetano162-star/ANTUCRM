import { useState } from 'react'
import { Sparkles, Loader2, Thermometer, MessageSquare, ArrowRight, Lightbulb, Target, TrendingUp, Calendar, User, Phone, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { aiApi } from '@/services/api'

// ============================================================
// Componente: ContactAIAnalysis
// Análisis de Cliente con IA - Vista del Perfil del Contacto
// Conectado a /api/ai/analyze/contact
// ============================================================

export interface AIAnalysisResult {
  temperature: 'caliente' | 'tibio' | 'frio'
  temperatureScore: number
  context: string
  nextAction: string
  insights: string[]
  lastInteraction: string
  estimatedValue: string
}

export interface ContactAIAnalysisProps {
  contactId: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  clientName?: string
}

const TEMPERATURE_CONFIG = {
  caliente: {
    label: 'Caliente', color: 'bg-rose-100 text-rose-700 border-rose-200',
    iconColor: 'text-rose-500', gradient: 'from-rose-500 to-orange-500',
    description: 'Alto potencial de cierre'
  },
  tibio: {
    label: 'Tibio', color: 'bg-amber-100 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500', gradient: 'from-amber-500 to-yellow-500',
    description: 'Requiere seguimiento activo'
  },
  frio: {
    label: 'Frío', color: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-500', gradient: 'from-slate-400 to-slate-500',
    description: 'Necesita nurturing'
  }
}

export default function ContactAIAnalysis({ contactId, contactName, contactEmail, contactPhone, clientName }: ContactAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const res = await aiApi.analyzeContact({ contactId, contactName, contactEmail, clientName })
      setAnalysisResult(res.data)
      setHasAnalyzed(true)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al analizar'
      setError(msg.includes('no configurada')
        ? 'La IA no está configurada. Pide al administrador que la active en Super Admin → IA.'
        : msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const tempConfig = analysisResult ? TEMPERATURE_CONFIG[analysisResult.temperature] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Análisis Inteligente
          </h3>
          <p className="text-sm text-slate-500 mt-1">IA analiza el historial completo del contacto</p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          variant={hasAnalyzed ? "outline" : "default"}
          className={`${!hasAnalyzed && !isAnalyzing ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white' : 'border-violet-200 text-violet-700 hover:bg-violet-50'} transition-all duration-200`}
        >
          {isAnalyzing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando historial...</>)
            : hasAnalyzed ? (<><Sparkles className="w-4 h-4 mr-2" />Analizar de nuevo</>)
            : (<><Sparkles className="w-4 h-4 mr-2" />Analizar con IA</>)}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {!hasAnalyzed && !isAnalyzing && !error && (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-slate-600 font-medium mb-2">Haz clic en "Analizar con IA"</p>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              La IA leerá el historial completo de interacciones, correos, llamadas y actividades
              para generar insights y sugerencias de próximos pasos.
            </p>
          </CardContent>
        </Card>
      )}

      {isAnalyzing && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="py-12 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-violet-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
              </div>
            </div>
            <p className="text-violet-700 font-medium mb-2">Analizando historial de {contactName}...</p>
            <p className="text-violet-500 text-sm">Revisando correos, llamadas, reuniones y actividades recientes</p>
            <div className="mt-8 flex justify-center gap-8">
              {[{ Icon: Mail, label: 'Correos' }, { Icon: Phone, label: 'Llamadas' }, { Icon: Calendar, label: 'Reuniones' }, { Icon: TrendingUp, label: 'Tendencias' }].map(({ Icon, label }) => (
                <div key={label} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-xs text-violet-600">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasAnalyzed && analysisResult && tempConfig && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className={`h-2 bg-gradient-to-r ${tempConfig.gradient}`}></div>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${tempConfig.gradient} flex flex-col items-center justify-center text-white shadow-lg`}>
                    <Thermometer className="w-8 h-8 mb-1" />
                    <span className="text-2xl font-bold">{analysisResult.temperatureScore}</span>
                    <span className="text-xs opacity-80">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${tempConfig.color} text-sm px-3 py-1 font-semibold`}>{tempConfig.label}</Badge>
                    <span className="text-sm text-slate-500">{tempConfig.description}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Resumen del Análisis</h4>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Última interacción</p>
                        <p className="text-sm font-medium text-slate-700">{analysisResult.lastInteraction}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Target className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Valor estimado</p>
                        <p className="text-sm font-medium text-slate-700">{analysisResult.estimatedValue}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />Contexto del Contacto
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-slate-600 text-sm leading-relaxed">{analysisResult.context}</p></CardContent>
            </Card>
            <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />Siguiente Acción Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-800 text-sm leading-relaxed font-medium">{analysisResult.nextAction}</p>
                <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />Programar Acción
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />Insights Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">{index + 1}</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400 text-center">
            Análisis generado por IA basado en el historial de interacciones. Siempre verifica la información antes de tomar decisiones.
          </p>
        </div>
      )}
    </div>
  )
}
