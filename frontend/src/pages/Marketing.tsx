import { useEffect, useState } from 'react'
import {
  Plus, Search, Send, Users, Mail, MessageSquare,
  Target, Eye, MousePointer, Calendar,
  Edit3, Trash2, MoreHorizontal, Play, Pause, Copy, CheckCircle,
  AlertCircle, Zap, Shield,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { marketingApi, clientsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'automation'
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
  subject: string
  audience_count: number
  sent_count: number
  open_count: number
  click_count: number
  open_rate: number
  click_rate: number
  scheduled_at: string
  created_at: string
}

interface Automation {
  id: string
  name: string
  trigger_type: 'new_contact' | 'opportunity_stage' | 'task_due' | 'quote_accepted'
  status: 'active' | 'paused' | 'draft'
  actions_count: number
  executed_count: number
  created_at: string
}

interface Segment {
  id: string
  name: string
  description: string
  criteria: any
  contact_count: number
  created_at: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  status: 'new' | 'contacted' | 'qualified' | 'lost'
  source: string
  assigned_to: string
  assigned_to_name: string
  created_at: string
}

const USER_ROLES = { STANDARD: 'user', MANAGER: 'manager', ADMIN: 'admin' }

const CAMPAIGN_STATUS = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Edit3 },
  scheduled: { label: 'Programada', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Calendar },
  running: { label: 'Enviando', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  paused: { label: 'Pausada', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Pause },
  completed: { label: 'Completada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle }
}

const AUTOMATION_STATUS = {
  active: { label: 'Activa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: 'Pausada', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  draft: { label: 'Borrador', color: 'bg-slate-50 text-slate-600 border-slate-200' }
}

const TRIGGER_TYPES = {
  new_contact: 'Nuevo Contacto',
  opportunity_stage: 'Cambio de Etapa',
  task_due: 'Tarea Vencida',
  quote_accepted: 'Cotización Aceptada'
}

const LEAD_STATUS = {
  new: { label: 'Nuevo', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  contacted: { label: 'Contactado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  qualified: { label: 'Calificado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost: { label: 'Perdido', color: 'bg-slate-50 text-slate-600 border-slate-200' }
}

export default function Marketing() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const userRole = user?.role || USER_ROLES.ADMIN
  const isAdmin = userRole === USER_ROLES.ADMIN
  const isManager = userRole === USER_ROLES.MANAGER
  const hasFullAccess = isAdmin || isManager

  const [activeTab, setActiveTab] = useState(hasFullAccess ? 'campaigns' : 'leads')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Campaign dialog
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ name: '', type: 'email', subject: '', content: '', scheduled_at: '' })
  const [isSavingCampaign, setIsSavingCampaign] = useState(false)

  // Automation dialog
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)
  const [automationForm, setAutomationForm] = useState({ name: '', trigger_type: 'new_contact' })
  const [isSavingAutomation, setIsSavingAutomation] = useState(false)

  // Segment dialog
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false)
  const [segmentForm, setSegmentForm] = useState({ name: '', description: '' })
  const [isSavingSegment, setIsSavingSegment] = useState(false)

  // Lead dialog
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', lead_source: '' })
  const [isSavingLead, setIsSavingLead] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'campaigns' && hasFullAccess) {
        const response = await marketingApi.getCampaigns()
        setCampaigns(response.data.campaigns || [])
      } else if (activeTab === 'automations' && hasFullAccess) {
        const response = await marketingApi.getAutomations()
        setAutomations(response.data.automations || [])
      } else if (activeTab === 'segments' && hasFullAccess) {
        const response = await marketingApi.getSegments()
        setSegments(response.data.segments || [])
      } else if (activeTab === 'leads') {
        const leadsRes = await clientsApi.getAll({ type: 'lead', limit: 100 })
        const mapped: Lead[] = (leadsRes.data.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          status: c.lead_status || 'new',
          source: c.lead_source || c.source || '',
          assigned_to: c.owner_id || '',
          assigned_to_name: c.owner_name || '',
          created_at: c.created_at
        }))
        setLeads(mapped)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLaunchCampaign = async (campaignId: string) => {
    try {
      await marketingApi.launchCampaign(campaignId)
      toast({ title: 'Éxito', description: 'Campaña lanzada correctamente', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo lanzar la campaña', variant: 'destructive' })
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await marketingApi.pauseCampaign(campaignId)
      toast({ title: 'Éxito', description: 'Campaña pausada', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo pausar', variant: 'destructive' })
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await marketingApi.deleteCampaign(campaignId)
      toast({ title: 'Éxito', description: 'Campaña eliminada', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleToggleAutomation = async (automation: Automation) => {
    try {
      const newStatus = automation.status === 'active' ? 'paused' : 'active'
      await marketingApi.updateAutomationStatus(automation.id, newStatus)
      toast({ title: 'Éxito', description: `Automatización ${newStatus === 'active' ? 'activada' : 'pausada'}`, variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleDeleteAutomation = async (id: string) => {
    try {
      await marketingApi.deleteAutomation(id)
      toast({ title: 'Éxito', description: 'Automatización eliminada', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleDeleteSegment = async (id: string) => {
    try {
      await marketingApi.deleteSegment(id)
      toast({ title: 'Éxito', description: 'Segmento eliminado', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.type) {
      toast({ title: 'Error', description: 'Nombre y tipo son requeridos', variant: 'destructive' })
      return
    }
    setIsSavingCampaign(true)
    try {
      await marketingApi.createCampaign(campaignForm)
      toast({ title: 'Éxito', description: 'Campaña creada correctamente', variant: 'success' })
      setIsCampaignDialogOpen(false)
      setCampaignForm({ name: '', type: 'email', subject: '', content: '', scheduled_at: '' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo crear la campaña', variant: 'destructive' })
    } finally {
      setIsSavingCampaign(false)
    }
  }

  const handleCreateAutomation = async () => {
    if (!automationForm.name || !automationForm.trigger_type) {
      toast({ title: 'Error', description: 'Nombre y trigger son requeridos', variant: 'destructive' })
      return
    }
    setIsSavingAutomation(true)
    try {
      await marketingApi.createAutomation({ name: automationForm.name, trigger_type: automationForm.trigger_type })
      toast({ title: 'Éxito', description: 'Automatización creada correctamente', variant: 'success' })
      setIsAutomationDialogOpen(false)
      setAutomationForm({ name: '', trigger_type: 'new_contact' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo crear la automatización', variant: 'destructive' })
    } finally {
      setIsSavingAutomation(false)
    }
  }

  const handleCreateSegment = async () => {
    if (!segmentForm.name) {
      toast({ title: 'Error', description: 'Nombre es requerido', variant: 'destructive' })
      return
    }
    setIsSavingSegment(true)
    try {
      await marketingApi.createSegment({ name: segmentForm.name, description: segmentForm.description })
      toast({ title: 'Éxito', description: 'Segmento creado correctamente', variant: 'success' })
      setIsSegmentDialogOpen(false)
      setSegmentForm({ name: '', description: '' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo crear el segmento', variant: 'destructive' })
    } finally {
      setIsSavingSegment(false)
    }
  }

  const handleCreateLead = async () => {
    if (!leadForm.name) {
      toast({ title: 'Error', description: 'Nombre es requerido', variant: 'destructive' })
      return
    }
    setIsSavingLead(true)
    try {
      await clientsApi.create({ ...leadForm, contact_type: 'lead' })
      toast({ title: 'Éxito', description: 'Lead creado correctamente', variant: 'success' })
      setIsLeadDialogOpen(false)
      setLeadForm({ name: '', email: '', phone: '', lead_source: '' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo crear el lead', variant: 'destructive' })
    } finally {
      setIsSavingLead(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = CAMPAIGN_STATUS[status as keyof typeof CAMPAIGN_STATUS] || CAMPAIGN_STATUS.draft
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const getAutomationStatusBadge = (status: string) => {
    const config = AUTOMATION_STATUS[status as keyof typeof AUTOMATION_STATUS] || AUTOMATION_STATUS.draft
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const getLeadStatusBadge = (status: string) => {
    const config = LEAD_STATUS[status as keyof typeof LEAD_STATUS] || LEAD_STATUS.new
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
  const avgOpenRate = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / campaigns.length : 0
  const avgClickRate = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / campaigns.length : 0

  const filteredCampaigns = campaigns.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredAutomations = automations.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredSegments = segments.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredLeads = leads.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.email?.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!hasFullAccess && activeTab !== 'leads') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Marketing</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de leads y campañas</p>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Acceso Restringido</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Como vendedor, solo tienes acceso a los leads que te han sido asignados.
            </p>
            <Button onClick={() => setActiveTab('leads')} className="bg-violet-600 hover:bg-violet-700">
              <Users className="w-4 h-4 mr-2" />
              Ver mis leads
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Marketing</h1>
          <p className="text-slate-500 text-sm mt-1">
            {hasFullAccess ? t('Campañas, automatizaciones y segmentación') : t('Gestión de tus leads asignados')}
          </p>
        </div>
        <Badge className={cn(
          "w-fit",
          isAdmin ? "bg-violet-50 text-violet-700 border-violet-200" :
          isManager ? "bg-blue-50 text-blue-700 border-blue-200" :
          "bg-slate-50 text-slate-600 border-slate-200"
        )}>
          <Shield className="w-3 h-3 mr-1" />
          {isAdmin ? t('Administrador') : isManager ? t('Gerente') : t('Vendedor')}
        </Badge>
      </div>

      {/* Stats - campaigns tab only */}
      {hasFullAccess && activeTab === 'campaigns' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{t('Emails Enviados')}</p>
              <p className="text-2xl font-bold text-slate-800">{formatNumber(totalSent)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">{t('Tasa de Apertura')}</p>
              <p className="text-2xl font-bold text-blue-700">{avgOpenRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-600">{t('Tasa de Clics')}</p>
              <p className="text-2xl font-bold text-emerald-700">{avgClickRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{t('Campañas Activas')}</p>
              <p className="text-2xl font-bold text-slate-800">
                {campaigns.filter(c => c.status === 'running').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + actions row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn("grid", hasFullAccess ? "grid-cols-4" : "grid-cols-1")}>
            {hasFullAccess && (
              <>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                  <Mail className="w-4 h-4 mr-2" />
                  {t('Campañas')}
                </TabsTrigger>
                <TabsTrigger value="automations" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                  <Zap className="w-4 h-4 mr-2" />
                  {t('Automatizaciones')}
                </TabsTrigger>
                <TabsTrigger value="segments" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                  <Users className="w-4 h-4 mr-2" />
                  {t('Segmentos')}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="leads" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
              <Target className="w-4 h-4 mr-2" />
              {hasFullAccess ? t('Leads') : t('Mis Leads')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'campaigns' && hasFullAccess && (
          <Button onClick={() => setIsCampaignDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('Nueva Campaña')}
          </Button>
        )}
        {activeTab === 'automations' && hasFullAccess && (
          <Button onClick={() => setIsAutomationDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            <Zap className="w-4 h-4 mr-2" />
            {t('Nueva Automatización')}
          </Button>
        )}
        {activeTab === 'segments' && hasFullAccess && (
          <Button onClick={() => setIsSegmentDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            <Users className="w-4 h-4 mr-2" />
            {t('Nuevo Segmento')}
          </Button>
        )}
        {activeTab === 'leads' && (
          <Button onClick={() => setIsLeadDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('Nuevo Lead')}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={`Buscar ${activeTab === 'campaigns' ? 'campañas' : activeTab === 'automations' ? 'automatizaciones' : activeTab === 'segments' ? 'segmentos' : 'leads'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Content - Leads */}
      {activeTab === 'leads' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{hasFullAccess ? t('Todos los Leads') : t('Mis Leads Asignados')}</CardTitle>
            <CardDescription>
              {hasFullAccess ? t('Gestiona todos los leads del sistema') : t('Solo puedes ver y editar los leads que te han sido asignados')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hay leads {searchQuery ? 'que coincidan' : 'registrados'}</p>
                <Button onClick={() => setIsLeadDialogOpen(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer lead
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Nombre')}</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Contacto')}</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Estado')}</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Origen')}</th>
                      {hasFullAccess && <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Asignado a')}</th>}
                      <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">{t('Fecha')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800 text-sm">{lead.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-600">
                            <p>{lead.email}</p>
                            <p className="text-slate-400">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getLeadStatusBadge(lead.status)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-slate-50 border-slate-200">{lead.source || '—'}</Badge>
                        </td>
                        {hasFullAccess && <td className="py-3 px-4 text-sm text-slate-600">{lead.assigned_to_name || '—'}</td>}
                        <td className="py-3 px-4 text-sm text-slate-500">{formatDate(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content - Campaigns */}
      {hasFullAccess && activeTab === 'campaigns' && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hay campañas {searchQuery ? 'que coincidan' : 'creadas'}</p>
                <Button onClick={() => setIsCampaignDialogOpen(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera campaña
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-800">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline" className="bg-slate-50 text-xs">{campaign.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">{campaign.subject}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{formatNumber(campaign.audience_count || 0)} destinatarios</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">{(campaign.open_rate || 0).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MousePointer className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">{(campaign.click_rate || 0).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <Button size="sm" onClick={() => handleLaunchCampaign(campaign.id)} className="bg-violet-600 hover:bg-violet-700">
                            <Play className="w-4 h-4 mr-1" />
                            Lanzar
                          </Button>
                        )}
                        {campaign.status === 'running' && (
                          <Button size="sm" variant="outline" onClick={() => handlePauseCampaign(campaign.id)} className="border-slate-200">
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteCampaign(campaign.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content - Automations */}
      {hasFullAccess && activeTab === 'automations' && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              </div>
            ) : filteredAutomations.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hay automatizaciones {searchQuery ? 'que coincidan' : 'creadas'}</p>
                <Button onClick={() => setIsAutomationDialogOpen(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Crear primera automatización
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAutomations.map((automation) => (
                  <div key={automation.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-800">{automation.name}</h3>
                            {getAutomationStatusBadge(automation.status)}
                          </div>
                          <p className="text-sm text-slate-500">
                            Trigger: {TRIGGER_TYPES[automation.trigger_type as keyof typeof TRIGGER_TYPES] || automation.trigger_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Ejecutada {automation.executed_count || 0} veces</p>
                          <p className="text-xs text-slate-400">{automation.actions_count || 0} acciones</p>
                        </div>
                        <Switch
                          checked={automation.status === 'active'}
                          onCheckedChange={() => handleToggleAutomation(automation)}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteAutomation(automation.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content - Segments */}
      {hasFullAccess && activeTab === 'segments' && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              </div>
            ) : filteredSegments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hay segmentos {searchQuery ? 'que coincidan' : 'creados'}</p>
                <Button onClick={() => setIsSegmentDialogOpen(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Users className="w-4 h-4 mr-2" />
                  Crear primer segmento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSegments.map((segment) => (
                  <div key={segment.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{segment.name}</h3>
                          <p className="text-sm text-slate-500">{segment.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-violet-50 text-violet-700 border-violet-200">
                          {formatNumber(segment.contact_count || 0)} contactos
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteSegment(segment.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== DIALOGS ===== */}

      {/* Campaign Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Nueva Campaña')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Campaña Black Friday 2025"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={campaignForm.type} onValueChange={(v) => setCampaignForm(p => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="automation">Automatización</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Asunto del email</Label>
              <Input
                placeholder="Ej: ¡Ofertas exclusivas para ti!"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(p => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenido</Label>
              <Textarea
                placeholder="Escribe el contenido de la campaña..."
                rows={4}
                value={campaignForm.content}
                onChange={(e) => setCampaignForm(p => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Programar envío (opcional)</Label>
              <Input
                type="datetime-local"
                value={campaignForm.scheduled_at}
                onChange={(e) => setCampaignForm(p => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>{t('Cancelar')}</Button>
            <Button onClick={handleCreateCampaign} disabled={isSavingCampaign} className="bg-violet-600 hover:bg-violet-700">
              {isSavingCampaign ? t('Creando...') : t('Crear Campaña')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Dialog */}
      <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Nueva Automatización')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Bienvenida a nuevos contactos"
                value={automationForm.name}
                onChange={(e) => setAutomationForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Evento disparador *</Label>
              <Select value={automationForm.trigger_type} onValueChange={(v) => setAutomationForm(p => ({ ...p, trigger_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>{t('Cancelar')}</Button>
            <Button onClick={handleCreateAutomation} disabled={isSavingAutomation} className="bg-violet-600 hover:bg-violet-700">
              {isSavingAutomation ? t('Creando...') : t('Crear Automatización')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Dialog */}
      <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Nuevo Segmento')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Clientes activos > $10,000"
                value={segmentForm.name}
                onChange={(e) => setSegmentForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Describe los criterios de este segmento..."
                rows={3}
                value={segmentForm.description}
                onChange={(e) => setSegmentForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSegmentDialogOpen(false)}>{t('Cancelar')}</Button>
            <Button onClick={handleCreateSegment} disabled={isSavingSegment} className="bg-violet-600 hover:bg-violet-700">
              {isSavingSegment ? t('Creando...') : t('Crear Segmento')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Dialog */}
      <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Nuevo Lead')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Nombre completo o empresa"
                value={leadForm.name}
                onChange={(e) => setLeadForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={leadForm.email}
                onChange={(e) => setLeadForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                placeholder="+1 (809) 000-0000"
                value={leadForm.phone}
                onChange={(e) => setLeadForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <Select value={leadForm.lead_source} onValueChange={(v) => setLeadForm(p => ({ ...p, lead_source: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Sitio Web</SelectItem>
                  <SelectItem value="referral">Referido</SelectItem>
                  <SelectItem value="social_media">Redes Sociales</SelectItem>
                  <SelectItem value="email_campaign">Campaña Email</SelectItem>
                  <SelectItem value="cold_call">Llamada en frío</SelectItem>
                  <SelectItem value="trade_show">Evento/Feria</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>{t('Cancelar')}</Button>
            <Button onClick={handleCreateLead} disabled={isSavingLead} className="bg-violet-600 hover:bg-violet-700">
              {isSavingLead ? t('Creando...') : t('Crear Lead')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
