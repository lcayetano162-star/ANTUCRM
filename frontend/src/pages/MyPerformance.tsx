import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Target,
  Phone,
  MapPin,
  Mail,
  Briefcase,
  Calendar,
  DollarSign,
  Percent,
  Award,
  BarChart3,
  User,
  ChevronUp,
  ChevronDown,
  Users,
  Filter,
  Sparkles,
  Lightbulb,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { performanceApi, activitiesApi, aiApi } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

// Tipos
interface PerformanceMetrics {
  // Cuotas de venta
  monthlyQuota: number
  monthlyAchieved: number
  monthlyPercentage: number
  yearlyQuota: number
  yearlyAchieved: number
  yearlyPercentage: number
  
  // Actividades del mes
  activities: {
    calls: number
    callsTarget: number
    visits: number
    visitsTarget: number
    emails: number
    emailsTarget: number
    opportunitiesCreated: number
    opportunitiesTarget: number
  }
  
  // Oportunidades
  opportunities: {
    total: number
    won: number
    lost: number
    pipeline: number
    conversionRate: number
  }
  
  // Histórico mensual
  monthlyHistory: {
    month: string
    sales: number
    quota: number
    calls: number
    visits: number
  }[]
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  metrics: PerformanceMetrics
}

const ACTIVITY_CONFIG = {
  calls: { label: 'Llamadas', icon: Phone, color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700' },
  visits: { label: 'Visitas', icon: MapPin, color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  emails: { label: 'Correos', icon: Mail, color: 'bg-violet-500', lightColor: 'bg-violet-100', textColor: 'text-violet-700' },
  opportunitiesCreated: { label: 'Oportunidades', icon: Briefcase, color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700' },
}

// ── AI Coach Tab ────────────────────────────────────────────────────────────
function AICoachTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiApi.salesRecommendations()
      setResult(res.data)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error'
      setError(msg.includes('no configurada')
        ? 'La IA no está activada. Pide al administrador que la configure en Super Admin → IA.'
        : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Coach de Ventas IA
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Análisis de tu pipeline y recomendaciones personalizadas</p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analizando...' : result ? 'Actualizar análisis' : 'Analizar mi desempeño'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">Obtén recomendaciones personalizadas</p>
          <p className="text-sm text-slate-400">La IA analiza tu pipeline, actividades y cierres del mes para darte un plan de acción concreto.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 bg-violet-50 border border-violet-200 rounded-xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-violet-300 border-t-violet-600 animate-spin" />
          <p className="text-violet-700 font-medium">Analizando tu pipeline y actividades...</p>
          <p className="text-violet-500 text-sm mt-1">Comparando con tus metas y generando recomendaciones</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
            <p className="text-sm font-medium text-violet-800">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommendations */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Recomendaciones
              </h4>
              <ul className="space-y-2">
                {(result.recommendations || []).map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Focus + Goal */}
            <div className="space-y-3">
              {result.focusStage && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Etapa prioritaria</p>
                  <p className="text-sm font-medium text-blue-800">{result.focusStage}</p>
                </div>
              )}
              {result.weeklyGoal && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Meta esta semana</p>
                  <p className="text-sm font-medium text-emerald-800">{result.weeklyGoal}</p>
                </div>
              )}
              {result.riskAlert && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Alerta
                  </p>
                  <p className="text-sm font-medium text-amber-800">{result.riskAlert}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Análisis generado por IA con tu pipeline actual. Actualiza después de cerrar oportunidades.
          </p>
        </div>
      )}
    </div>
  )
}

export default function MyPerformance() {
  const { t } = useLanguage()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string>('me')
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    loadMetrics()
  }, [selectedMember, period])

  const loadMetrics = async () => {
    setIsLoading(true)
    try {
      const userId = selectedMember === 'me' ? user?.id : selectedMember
      
      const metricsResponse = await performanceApi.getMetrics(userId, period)
      if (metricsResponse.data?.success) {
        setMetrics(metricsResponse.data.data)
      }
      
      if (isManager) {
        const teamResponse = await performanceApi.getTeamMetrics()
        if (teamResponse.data?.success) {
          setTeamMembers(teamResponse.data.data)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar las métricas',
        variant: 'destructive',
      })

    } finally {
      setIsLoading(false)
    }
  }

  // Renderizar tarjeta de cuota
  const renderQuotaCard = (
    title: string,
    achieved: number,
    quota: number,
    percentage: number,
    period: string,
    colorClass: string,
    bgClass: string
  ) => (
    <Card className={`overflow-hidden ${bgClass}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(achieved)}</p>
          </div>
          <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center`}>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Meta: {formatCurrency(quota)}</span>
            <span className={`font-semibold ${percentage >= 100 ? 'text-emerald-600' : percentage >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
          />
          <p className="text-xs text-slate-400">
            {percentage >= 100 
              ? '🎉 ¡Meta alcanzada!' 
              : percentage >= 70 
                ? `Faltan ${formatCurrency(quota - achieved)} para la meta` 
                : `Necesitas ${formatCurrency(quota - achieved)} más`}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  // Renderizar tarjeta de actividad
  const renderActivityCard = (
    type: keyof typeof ACTIVITY_CONFIG,
    current: number,
    target: number
  ) => {
    const config = ACTIVITY_CONFIG[type]
    const Icon = config.icon
    const percentage = Math.round((current / target) * 100)
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${config.lightColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{config.label}</p>
              <p className="text-xl font-bold text-slate-800">
                {current} <span className="text-sm font-normal text-slate-400">/ {target}</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progreso</span>
              <span className={`font-medium ${percentage >= 100 ? 'text-emerald-600' : config.textColor}`}>
                {percentage}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${config.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="h-48 bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-cyan-600" />
            {isManager && selectedMember !== 'me' ? t('Desempeño del Vendedor') : t('Mi Desempeño')}
          </h1>
          <p className="text-slate-500">
            {isManager && selectedMember !== 'me'
              ? t('Visualiza el rendimiento de tu equipo de ventas')
              : t('Revisa tu progreso y métricas de ventas')}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Selector de período */}
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-44 min-w-[11rem] bg-white">
              <Calendar className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t('Este Mes')}</SelectItem>
              <SelectItem value="quarter">{t('Este Trimestre')}</SelectItem>
              <SelectItem value="year">{t('Este Año')}</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Selector de vendedor (solo para gerentes) */}
          {isManager && (
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-56 min-w-[14rem] bg-white">
                <Users className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Mi Desempeño
                  </div>
                </SelectItem>
                <SelectItem disabled value="" className="text-xs text-slate-400">
                  MI EQUIPO
                </SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-xs text-cyan-700">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Cuotas de Venta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderQuotaCard(
          t('Cuota Mensual'),
          metrics.monthlyAchieved,
          metrics.monthlyQuota,
          metrics.monthlyPercentage,
          'mes',
          'bg-gradient-to-br from-cyan-500 to-blue-500',
          'bg-gradient-to-br from-cyan-50 to-blue-50'
        )}
        
        {renderQuotaCard(
          t('Cuota Anual'),
          metrics.yearlyAchieved,
          metrics.yearlyQuota,
          metrics.yearlyPercentage,
          'año',
          'bg-gradient-to-br from-violet-500 to-purple-500',
          'bg-gradient-to-br from-violet-50 to-purple-50'
        )}
      </div>

      {/* Tabs para Actividades y Oportunidades */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="activities" className="data-[state=active]:bg-white">
            <Target className="w-4 h-4 mr-2" />
            {t('Actividades del Mes')}
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-white">
            <Briefcase className="w-4 h-4 mr-2" />
            {t('Oportunidades')}
          </TabsTrigger>
          <TabsTrigger value="ai-coach" className="data-[state=active]:bg-white">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('Coach IA')}
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de Actividades */}
        <TabsContent value="activities" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {renderActivityCard('calls', metrics.activities.calls, metrics.activities.callsTarget)}
            {renderActivityCard('visits', metrics.activities.visits, metrics.activities.visitsTarget)}
            {renderActivityCard('emails', metrics.activities.emails, metrics.activities.emailsTarget)}
            {renderActivityCard('opportunitiesCreated', metrics.activities.opportunitiesCreated, metrics.activities.opportunitiesTarget)}
          </div>
          
          {/* Resumen de actividades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                {t('Resumen de Actividades')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-700">{metrics.activities.calls}</p>
                  <p className="text-sm text-blue-600">Llamadas realizadas</p>
                  <p className="text-xs text-blue-400 mt-1">
                    {metrics.activities.calls >= metrics.activities.callsTarget 
                      ? '✅ Meta alcanzada' 
                      : `${metrics.activities.callsTarget - metrics.activities.calls} pendientes`}
                  </p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-700">{metrics.activities.visits}</p>
                  <p className="text-sm text-emerald-600">Visitas completadas</p>
                  <p className="text-xs text-emerald-400 mt-1">
                    {metrics.activities.visits >= metrics.activities.visitsTarget 
                      ? '✅ Meta alcanzada' 
                      : `${metrics.activities.visitsTarget - metrics.activities.visits} pendientes`}
                  </p>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-700">{metrics.activities.emails}</p>
                  <p className="text-sm text-violet-600">Correos enviados</p>
                  <p className="text-xs text-violet-400 mt-1">
                    {metrics.activities.emails >= metrics.activities.emailsTarget 
                      ? '✅ Meta alcanzada' 
                      : `${metrics.activities.emailsTarget - metrics.activities.emails} pendientes`}
                  </p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-700">{metrics.activities.opportunitiesCreated}</p>
                  <p className="text-sm text-amber-600">Oportunidades creadas</p>
                  <p className="text-xs text-amber-400 mt-1">
                    {metrics.activities.opportunitiesCreated >= metrics.activities.opportunitiesTarget 
                      ? '✅ Meta alcanzada' 
                      : `${metrics.activities.opportunitiesTarget - metrics.activities.opportunitiesCreated} pendientes`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Oportunidades */}
        <TabsContent value="opportunities" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-cyan-700">{metrics.opportunities.total}</p>
                <p className="text-sm text-cyan-600">{t('Total Oportunidades')}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{metrics.opportunities.won}</p>
                <p className="text-sm text-emerald-600">{t('Ganadas')}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-rose-50 to-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-rose-700">{metrics.opportunities.lost}</p>
                <p className="text-sm text-rose-600">{t('Perdidas')}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-700">{metrics.opportunities.conversionRate}%</p>
                <p className="text-sm text-amber-600">{t('Tasa de Conversión')}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-500" />
                {t('Valor en Pipeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Valor total en pipeline</p>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.opportunities.pipeline)}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Coach IA */}
        <TabsContent value="ai-coach" className="mt-4">
          <AICoachTab />
        </TabsContent>
      </Tabs>

      {/* Histórico Mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            {t('Histórico de Desempeño')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('Mes')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">{t('Ventas')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">{t('Meta')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">%</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('Llamadas')}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('Visitas')}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.monthlyHistory.map((month, index) => {
                  const percentage = Math.round((month.sales / month.quota) * 100)
                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-700">{month.month}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(month.sales)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatCurrency(month.quota)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge className={`
                          ${percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 
                            percentage >= 70 ? 'bg-amber-100 text-amber-700' : 
                            'bg-rose-100 text-rose-700'}
                        `}>
                          {percentage}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{month.calls}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{month.visits}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
