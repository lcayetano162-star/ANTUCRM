import { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, ArrowRight, TrendingUp, Phone, Building2, CalendarDays } from 'lucide-react'
import ActivityModal, { ActivityData } from '@/components/ActivityModal'
import { GovBiddingPanel } from '@/components/gov/GovBiddingPanel'
import MeetingPrepModal from '@/components/ai/MeetingPrepModal'
import DealScoreBadge from '@/components/ai/DealScoreBadge'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  HorizontalDialog, 
  HorizontalDialogContent, 
  HorizontalDialogHeader, 
  HorizontalDialogTitle, 
  HorizontalDialogDescription,
  HorizontalDialogFooter,
  HorizontalDialogBody,
  HorizontalDialogTwoColumn
} from '@/components/ui/horizontal-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { opportunitiesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import OpportunityCard, { OpportunityCardData } from '@/components/OpportunityCard'

interface Opportunity {
  id: string
  name: string
  client_id?: string
  client_name: string
  stage: string
  probability: number
  estimated_revenue: number
  expected_close_date: string
  owner_first_name: string
  owner_last_name: string
  is_gov?: boolean
  gov_type?: string
  submission_deadline?: string
  ai_deal_score?: number | null
  ai_score_label?: string | null
}

const GOV_TYPES = [
  'Licitación Pública',
  'Licitación Restringida',
  'Selección Abreviada',
  'Compra Menor',
  'Comparación de Precios',
  'Contratación Directa',
  'Subasta Inversa Electrónica',
]

const PIPELINE_STAGES = [
  { id: 'prospecting', name: 'Prospección', probability: 10 },
  { id: 'qualification', name: 'Calificación', probability: 25 },
  { id: 'proposal', name: 'Propuesta', probability: 50 },
  { id: 'negotiation', name: 'Negociación', probability: 75 },
  { id: 'closed_won', name: 'Cerrada Ganada', probability: 100 },
  { id: 'closed_lost', name: 'Cerrada Perdida', probability: 0 }
]

// ── Demo cards for visual preview (solo en desarrollo) ───────────────
const DEMO_CARDS: OpportunityCardData[] = import.meta.env.DEV ? [
  {
    id: 'demo-1',
    name: 'Implementación CRM Corporativo',
    client_name: 'Grupo Empresarial Patagonia',
    stage: 'prospecting',
    stageName: 'Prospección',
    probability: 15,
    estimated_revenue: 4800000,
    expected_close_date: '2026-04-30',
    owner_first_name: 'María',
    owner_last_name: 'González',
  },
  {
    id: 'demo-2',
    name: 'Renovación Flota Impresión MPS',
    client_name: 'Minera Los Andes S.A.',
    stage: 'qualification',
    stageName: 'Propuesta',
    probability: 55,
    estimated_revenue: 12500000,
    expected_close_date: '2026-03-20',
    owner_first_name: 'Carlos',
    owner_last_name: 'Ramírez',
  },
  {
    id: 'demo-3',
    name: 'Contrato Servicio Anual Outsourcing',
    client_name: 'Constructora Andina SpA',
    stage: 'closed_won',
    stageName: 'Cerrada Ganada',
    probability: 100,
    estimated_revenue: 8200000,
    expected_close_date: '2026-03-05',
    owner_first_name: 'Sofía',
    owner_last_name: 'Vega',
  },
] : []

export default function Opportunities() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const govModuleEnabled = useAuthStore(s => s.user?.gov_module_enabled)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [pipelineSummary, setPipelineSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedGovId, setExpandedGovId] = useState<string | null>(null)

  // Activity Modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [selectedOpportunityForActivity, setSelectedOpportunityForActivity] = useState<Opportunity | null>(null)

  // Meeting Prep IA state
  const [meetingPrepOpp, setMeetingPrepOpp] = useState<Opportunity | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    stage: 'prospecting',
    estimated_revenue: '',
    expected_close_date: '',
    is_gov: false,
    gov_type: 'Compra Menor',
    submission_deadline: ''
  })

  useEffect(() => {
    loadData()
  }, [stageFilter])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [oppRes, summaryRes] = await Promise.all([
        opportunitiesApi.getAll(stageFilter !== 'all' ? { stage: stageFilter } : undefined),
        opportunitiesApi.getPipelineSummary()
      ])
      setOpportunities(oppRes.data.data || [])
      setPipelineSummary(summaryRes.data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar las oportunidades',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await opportunitiesApi.create({
        ...formData,
        estimated_revenue: parseFloat(formData.estimated_revenue),
        is_gov: formData.is_gov || undefined,
        gov_type: formData.is_gov ? formData.gov_type : undefined,
        submission_deadline: formData.is_gov && formData.submission_deadline ? formData.submission_deadline : undefined,
      })
      toast({
        title: 'Éxito',
        description: 'Oportunidad creada correctamente',
        variant: 'success'
      })
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear la oportunidad',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMoveStage = async (opp: Opportunity, newStage: string) => {
    try {
      await opportunitiesApi.move(opp.id, newStage)
      toast({
        title: 'Éxito',
        description: 'Oportunidad movida correctamente',
        variant: 'success'
      })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo mover la oportunidad',
        variant: 'destructive'
      })
    }
  }

  const openActivityModal = (opportunity: Opportunity) => {
    setSelectedOpportunityForActivity(opportunity)
    setIsActivityModalOpen(true)
  }

  const handleActivitySubmit = async (activity: ActivityData) => {
    try {
      await activitiesApi.create(activity)
      toast({
        title: 'Éxito',
        description: `Actividad registrada para ${activity.related_name}`,
        variant: 'success'
      })
      setIsActivityModalOpen(false)
      setSelectedOpportunityForActivity(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo registrar la actividad',
        variant: 'destructive'
      })
    }
  }

  const getStageBadge = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-gray-100 text-gray-800',
      qualification: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    }
    const stageInfo = PIPELINE_STAGES.find(s => s.id === stage)
    return (
      <Badge className={colors[stage] || ''}>
        {stageInfo?.name || stage}
      </Badge>
    )
  }

  const filteredOpportunities = opportunities.filter(opp =>
    opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-gray-500">Gestiona tu pipeline de ventas</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Oportunidad
        </Button>
      </div>

      {/* ── OpportunityCard Preview ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
          Vista de tarjeta — Calificar · Desarrollar · Cerrar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_CARDS.map((card) => (
            <OpportunityCard
              key={card.id}
              opportunity={card}
              onActivity={(opp) => console.log('Actividad:', opp.name)}
              onMove={(opp) => console.log('Mover:', opp.name)}
            />
          ))}
        </div>
      </div>

      {/* Pipeline Stats */}
      {pipelineSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Pipeline</p>
              <p className="text-xl font-bold">{formatCurrency(pipelineSummary.totals?.pipeline_value || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Ventas Ganadas</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(pipelineSummary.totals?.won_value || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Oportunidades</p>
              <p className="text-xl font-bold">{pipelineSummary.totals?.total_count || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Tasa de Conversión</p>
              <p className="text-xl font-bold text-cyan-600">
                {pipelineSummary.totals?.total_count > 0
                  ? Math.round((pipelineSummary.stages?.find((s: any) => s.stage === 'closed_won')?.count || 0) / pipelineSummary.totals.total_count * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar oportunidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-56 min-w-[14rem]">
            <SelectValue placeholder="Filtrar por etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {PIPELINE_STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opportunities Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay oportunidades registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Oportunidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Etapa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Score IA</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Cierre Est.</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => (
                    <>
                    <tr key={opp.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{opp.name}</p>
                            {opp.is_gov && (
                              <button
                                onClick={() => setExpandedGovId(expandedGovId === opp.id ? null : opp.id)}
                                title="Expediente Gubernamental Ley 47-25"
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                              >
                                <Building2 className="w-3 h-3" />
                                GOV
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {opp.owner_first_name} {opp.owner_last_name}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{opp.client_name || '-'}</td>
                      <td className="py-3 px-4">{getStageBadge(opp.stage)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{formatCurrency(opp.estimated_revenue)}</p>
                          <p className="text-sm text-gray-500">{opp.probability}% prob.</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <DealScoreBadge
                          opportunityId={opp.id}
                          initialScore={opp.ai_deal_score}
                          initialLabel={opp.ai_score_label}
                          onScored={(s) => {
                            setOpportunities(prev => prev.map(o =>
                              o.id === opp.id ? { ...o, ai_deal_score: s.score, ai_score_label: s.label } : o
                            ))
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {opp.expected_close_date
                          ? new Date(opp.expected_close_date).toLocaleDateString('es-DO')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMeetingPrepOpp(opp)}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            title="Preparar reunión con IA"
                          >
                            <CalendarDays className="w-4 h-4 mr-1" />
                            Reunión IA
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openActivityModal(opp)}
                            className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Actividad
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Mover a
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {PIPELINE_STAGES.filter(s => s.id !== opp.stage).map(stage => (
                                <DropdownMenuItem
                                  key={stage.id}
                                  onClick={() => handleMoveStage(opp, stage.id)}
                                >
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  {stage.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable Gov Panel */}
                    {opp.is_gov && expandedGovId === opp.id && (
                      <tr key={`gov-${opp.id}`}>
                        <td colSpan={7} className="px-4 py-4 bg-indigo-50 border-b">
                          <GovBiddingPanel
                            opportunityId={opp.id}
                            govType={opp.gov_type}
                            submissionDeadline={opp.submission_deadline}
                          />
                        </td>
                      </tr>
                    )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Prep IA Modal */}
      {meetingPrepOpp && (
        <MeetingPrepModal
          clientId={meetingPrepOpp.client_id || ''}
          clientName={meetingPrepOpp.client_name}
          opportunityId={meetingPrepOpp.id}
          opportunityName={meetingPrepOpp.name}
          onClose={() => setMeetingPrepOpp(null)}
        />
      )}

      {/* Create Dialog - Horizontal Layout with Pastel Colors */}
      <HorizontalDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <HorizontalDialogContent>
          <HorizontalDialogHeader>
            <HorizontalDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              Nueva Oportunidad
            </HorizontalDialogTitle>
            <HorizontalDialogDescription>
              Crea un nuevo negocio en tu pipeline de ventas
            </HorizontalDialogDescription>
          </HorizontalDialogHeader>
          
          <HorizontalDialogBody>
            <form onSubmit={handleSubmit}>
              <HorizontalDialogTwoColumn
                left={
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-medium">Nombre de la Oportunidad *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ej: Implementación CRM Empresarial"
                        className="bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_id" className="text-slate-700 font-medium">Cliente</Label>
                      <Select
                        value={formData.client_id}
                        onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Aquí se cargarían los clientes */}
                          <SelectItem value="client1">Cliente Ejemplo 1</SelectItem>
                          <SelectItem value="client2">Cliente Ejemplo 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stage" className="text-slate-700 font-medium">Etapa Inicial</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => setFormData({ ...formData, stage: value })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPELINE_STAGES.map(stage => (
                            <SelectItem key={stage.id} value={stage.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  stage.id === 'prospecting' ? 'bg-slate-400' :
                                  stage.id === 'qualification' ? 'bg-blue-400' :
                                  stage.id === 'proposal' ? 'bg-amber-400' :
                                  stage.id === 'negotiation' ? 'bg-orange-400' :
                                  stage.id === 'closed_won' ? 'bg-emerald-400' :
                                  'bg-rose-400'
                                }`} />
                                {stage.name}
                                <span className="text-slate-400 text-xs">({stage.probability}%)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                }
                right={
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_revenue" className="text-slate-700 font-medium">Valor Estimado</Label>
                      <Input
                        id="estimated_revenue"
                        type="number"
                        value={formData.estimated_revenue}
                        onChange={(e) => setFormData({ ...formData, estimated_revenue: e.target.value })}
                        placeholder="0.00"
                        className="bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      />
                      <p className="text-xs text-slate-400">Valor estimado del negocio</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expected_close_date" className="text-slate-700 font-medium">Fecha de Cierre Estimada</Label>
                      <Input
                        id="expected_close_date"
                        type="date"
                        value={formData.expected_close_date}
                        onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                        className="bg-white border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      />
                      <p className="text-xs text-slate-400">Fecha esperada de cierre del negocio</p>
                    </div>

                    {/* Gov module switch — only visible when tenant has gov_module_enabled */}
                    {govModuleEnabled && (
                      <div className="space-y-3 pt-1">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div
                            onClick={() => setFormData(p => ({ ...p, is_gov: !p.is_gov }))}
                            className={`relative w-10 h-5 rounded-full transition-colors ${formData.is_gov ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_gov ? 'translate-x-5' : ''}`} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-slate-700">¿Venta a Gobierno?</span>
                          </div>
                        </label>
                        {formData.is_gov && (
                          <div className="space-y-3 pl-2 border-l-2 border-indigo-100">
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-600">Tipo de Proceso (Ley 47-25)</Label>
                              <select
                                value={formData.gov_type}
                                onChange={e => setFormData(p => ({ ...p, gov_type: e.target.value }))}
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              >
                                {GOV_TYPES.map(gt => <option key={gt} value={gt}>{gt}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-600">Plazo de Presentación</Label>
                              <Input
                                type="datetime-local"
                                value={formData.submission_deadline}
                                onChange={e => setFormData(p => ({ ...p, submission_deadline: e.target.value }))}
                                className="bg-white border-slate-200 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Resumen del Pipeline</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Valor en Pipeline:</span>
                          <span className="font-medium text-blue-700">{formatCurrency(pipelineSummary?.totals?.pipeline_value || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ventas Ganadas:</span>
                          <span className="font-medium text-emerald-600">{formatCurrency(pipelineSummary?.totals?.won_value || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tasa de Conversión:</span>
                          <span className="font-medium text-cyan-600">
                            {pipelineSummary?.totals?.total_count > 0
                              ? Math.round((pipelineSummary?.stages?.find((s: any) => s.stage === 'closed_won')?.count || 0) / pipelineSummary.totals.total_count * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                }
              />
            </form>
          </HorizontalDialogBody>

          <HorizontalDialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Oportunidad'}
            </Button>
          </HorizontalDialogFooter>
        </HorizontalDialogContent>
      </HorizontalDialog>

      {/* Activity Modal */}
      {selectedOpportunityForActivity && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false)
            setSelectedOpportunityForActivity(null)
          }}
          onSubmit={handleActivitySubmit}
          relatedType="opportunity"
          relatedId={selectedOpportunityForActivity.id}
          relatedName={selectedOpportunityForActivity.name}
        />
      )}
    </div>
  )
}
