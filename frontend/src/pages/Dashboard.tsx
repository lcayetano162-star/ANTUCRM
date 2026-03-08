import { useEffect, useState } from 'react'
import { 
  Users, 
  Briefcase, 
  FileText, 
  CheckSquare,
  TrendingUp,
  DollarSign,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  HorizontalDialog, 
  HorizontalDialogContent, 
  HorizontalDialogHeader, 
  HorizontalDialogTitle, 
  HorizontalDialogDescription,
  HorizontalDialogBody
} from '@/components/ui/horizontal-dialog'
import { useNavigate } from 'react-router-dom'
import { opportunitiesApi, tasksApi } from '@/services/api'
import AIMorningBriefing from '@/components/ai/AIMorningBriefing'
import ForecastSimulator from '@/components/ai/ForecastSimulator'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface StageData { count: number; total_value: number }
interface PipelineData { [stage: string]: StageData }

interface DashboardStats {
  opportunities: {
    total: number
    pipeline_value: number
    won_value: number
  }
  tasks: {
    pending: number
    overdue: number
  }
}

export default function Dashboard() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    opportunities: { total: 0, pipeline_value: 0, won_value: 0 },
    tasks: { pending: 0, overdue: 0 }
  })
  const [pipeline, setPipeline] = useState<PipelineData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStat, setSelectedStat] = useState<string | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      const [pipelineRes, tasksRes] = await Promise.all([
        opportunitiesApi.getPipelineSummary(),
        tasksApi.getStats()
      ])

      const stageData: PipelineData = pipelineRes.data || {}
      setPipeline(stageData)

      const activeStages = ['prospecting', 'qualification', 'proposal', 'negotiation']
      const totalActive = activeStages.reduce((sum, s) => sum + (stageData[s]?.count || 0), 0)
      const pipelineValue = activeStages.reduce((sum, s) => sum + (stageData[s]?.total_value || 0), 0)
      const wonValue = stageData['closed_won']?.total_value || 0

      setStats({
        opportunities: {
          total: totalActive,
          pipeline_value: pipelineValue,
          won_value: wonValue
        },
        tasks: {
          pending: tasksRes.data.stats?.my_pending || 0,
          overdue: tasksRes.data.stats?.overdue || 0
        }
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatClick = (statTitle: string) => {
    setSelectedStat(statTitle)
    setIsDetailDialogOpen(true)
  }

  const statCards = [
    {
      id: 'opportunities',
      title: t('Oportunidades'),
      value: formatNumber(stats.opportunities.total),
      subtitle: `${formatCurrency(stats.opportunities.pipeline_value)} en pipeline`,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200/50'
    },
    {
      id: 'sales',
      title: t('Ventas Ganadas'),
      value: formatCurrency(stats.opportunities.won_value),
      subtitle: t('Total acumulado'),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      gradient: 'from-emerald-50 to-emerald-100/50',
      borderColor: 'border-emerald-200/50'
    },
    {
      id: 'tasks',
      title: t('Tareas Pendientes'),
      value: formatNumber(stats.tasks.pending),
      subtitle: stats.tasks.overdue > 0 ? `${stats.tasks.overdue} vencidas` : t('Al día'),
      icon: CheckSquare,
      color: stats.tasks.overdue > 0 ? 'text-rose-600' : 'text-amber-600',
      bgColor: stats.tasks.overdue > 0 ? 'bg-rose-50' : 'bg-amber-50',
      gradient: stats.tasks.overdue > 0 ? 'from-rose-50 to-rose-100/50' : 'from-amber-50 to-amber-100/50',
      borderColor: stats.tasks.overdue > 0 ? 'border-rose-200/50' : 'border-amber-200/50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{t('Resumen del mes')}</p>
      </div>

      {/* IA que Anticipa — Briefing diario */}
      <AIMorningBriefing />

      {/* Forecast Simulator IA */}
      <ForecastSimulator />

      {/* Stats Grid - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card 
            key={card.title}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${card.gradient} border ${card.borderColor}`}
            onClick={() => handleStatClick(card.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Acciones Rápidas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium">{t('Nuevo cliente')}</p>
                  <p className="text-sm text-gray-500">{t('Agregar prospecto')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/opportunities')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{t('Nueva oportunidad')}</p>
                  <p className="text-sm text-gray-500">{t('Crear negocio')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/quotes')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{t('Nueva cotización')}</p>
                  <p className="text-sm text-gray-500">{t('Generar presupuesto')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">{t('Nueva actividad')}</p>
                  <p className="text-sm text-gray-500">{t('Asignar actividad')}</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('Pipeline de Ventas')}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stages = [
                { key: 'prospecting',   label: t('Prospección'),   color: 'bg-gray-400' },
                { key: 'qualification', label: t('Calificación'),  color: 'bg-blue-400' },
                { key: 'proposal',      label: t('Propuesta'),     color: 'bg-yellow-400' },
                { key: 'negotiation',   label: t('Negociación'),   color: 'bg-orange-400' },
                { key: 'closed_won',    label: t('Cerrado Ganado'), color: 'bg-green-500' },
              ]
              const maxCount = Math.max(...stages.map(s => pipeline[s.key]?.count || 0), 1)
              return (
                <div className="space-y-4">
                  {stages.map(({ key, label, color }) => {
                    const count = pipeline[key]?.count || 0
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">{label}</span>
                          <Badge variant="secondary">{count} oport.</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog - Horizontal Layout with Pastel Colors */}
      <HorizontalDialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <HorizontalDialogContent>
          <HorizontalDialogHeader>
            <HorizontalDialogTitle className="flex items-center gap-2">
              {selectedStat === 'opportunities' && (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  Detalle de Oportunidades
                </>
              )}
              {selectedStat === 'sales' && (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  Detalle de Ventas
                </>
              )}
              {selectedStat === 'tasks' && (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    stats.tasks.overdue > 0 
                      ? 'bg-gradient-to-br from-rose-100 to-rose-200' 
                      : 'bg-gradient-to-br from-amber-100 to-amber-200'
                  }`}>
                    <CheckSquare className={`w-4 h-4 ${
                      stats.tasks.overdue > 0 ? 'text-rose-600' : 'text-amber-600'
                    }`} />
                  </div>
                  Detalle de Tareas
                </>
              )}
            </HorizontalDialogTitle>
            <HorizontalDialogDescription>
              {selectedStat === 'opportunities' && 'Información detallada de oportunidades en pipeline'}
              {selectedStat === 'sales' && 'Resumen de ventas ganadas y conversión'}
              {selectedStat === 'tasks' && 'Estado actual de tus tareas pendientes'}
            </HorizontalDialogDescription>
          </HorizontalDialogHeader>
          
          <HorizontalDialogBody>
            {selectedStat === 'opportunities' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Oportunidades</p>
                      <p className="text-2xl font-bold text-blue-700">{formatNumber(stats.opportunities.total)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className="flex items-center gap-1 text-blue-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Activas en pipeline</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Valor Pipeline</p>
                      <p className="text-2xl font-bold text-indigo-700">{formatCurrency(stats.opportunities.pipeline_value)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className="flex items-center gap-1 text-indigo-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Potencial de ingresos</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-5 border border-violet-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Próximos Cierres</p>
                      <p className="text-2xl font-bold text-violet-700">Ver Pipeline</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <a href="/opportunities" className="flex items-center gap-1 text-violet-600 hover:underline">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ir a oportunidades</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {selectedStat === 'sales' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Ventas Ganadas</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.opportunities.won_value)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Total acumulado</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-5 border border-teal-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tasa de Conversión</p>
                      <p className="text-2xl font-bold text-teal-700">
                        {stats.opportunities.total > 0 
                          ? Math.round((stats.opportunities.won_value / (stats.opportunities.won_value + stats.opportunities.pipeline_value)) * 100) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className="flex items-center gap-1 text-teal-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Rendimiento</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-5 border border-cyan-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Este Mes</p>
                      <p className="text-2xl font-bold text-cyan-700">Ver Reporte</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <a href="/opportunities" className="flex items-center gap-1 text-cyan-600 hover:underline">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ver detalles</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {selectedStat === 'tasks' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-xl p-5 border ${
                  stats.tasks.overdue > 0 
                    ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50' 
                    : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stats.tasks.overdue > 0 ? 'bg-rose-100' : 'bg-amber-100'
                    }`}>
                      <CheckSquare className={`w-5 h-5 ${
                        stats.tasks.overdue > 0 ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tareas Pendientes</p>
                      <p className={`text-2xl font-bold ${
                        stats.tasks.overdue > 0 ? 'text-rose-700' : 'text-amber-700'
                      }`}>{formatNumber(stats.tasks.pending)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div className={`flex items-center gap-1 ${
                      stats.tasks.overdue > 0 ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {stats.tasks.overdue > 0 ? (
                        <>
                          <ArrowDownRight className="w-4 h-4" />
                          <span>{stats.tasks.overdue} vencidas</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Al día</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-5 border border-violet-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Para Hoy</p>
                      <p className="text-2xl font-bold text-violet-700">Ver Tareas</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <a href="/tasks" className="flex items-center gap-1 text-violet-600 hover:underline">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ir a tareas</span>
                    </a>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-5 border border-cyan-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Completadas</p>
                      <p className="text-2xl font-bold text-cyan-700">Ver Historial</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <a href="/tasks" className="flex items-center gap-1 text-cyan-600 hover:underline">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ver historial</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </HorizontalDialogBody>
        </HorizontalDialogContent>
      </HorizontalDialog>
    </div>
  )
}
