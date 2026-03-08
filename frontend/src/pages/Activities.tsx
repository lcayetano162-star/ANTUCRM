import { useEffect, useState } from 'react'
import { 
  Plus, Search, CheckCircle, Clock, AlertCircle, Calendar,
  Edit3, Trash2, MoreHorizontal, ArrowRight, Bell, User,
  Phone, Mail, MessageSquare, FileText, X, Filter,
  MapPin, Send, MessageCircle, Building2, UserCircle,
  PlusCircle, History, Eye, ChevronDown, ChevronUp,
  ClipboardList, TrendingUp, Briefcase
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { tasksApi, clientsApi, usersApi, opportunitiesApi, contactsApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

// ============================================================
// TIPOS DE DATOS
// ============================================================

interface Activity {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string
  assigned_to: string
  assigned_to_name: string
  assigned_to_avatar?: string
  client_id: string
  client_name: string
  opportunity_id: string
  opportunity_name: string
  contact_id: string
  contact_name: string
  related_type: 'client' | 'opportunity' | 'contact' | 'general'
  related_id: string
  related_name: string
  reminder_minutes: number
  is_recurring: boolean
  recurrence_pattern: string
  completed_at: string
  completed_by: string
  created_at: string
  created_by: string
  comments: ActivityComment[]
  logs: ActivityLog[]
}

interface ActivityComment {
  id: string
  activity_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  content: string
  created_at: string
}

interface ActivityLog {
  id: string
  activity_id: string
  type: 'visit' | 'call' | 'email' | 'whatsapp' | 'note' | 'meeting'
  description: string
  user_id: string
  user_name: string
  created_at: string
  // Campos específicos por tipo
  visit_date?: string
  visit_outcome?: string
  call_duration?: number
  call_notes?: string
  whatsapp_message?: string
  whatsapp_response?: string
  email_content?: string
  email_subject?: string
  meeting_date?: string
  meeting_notes?: string
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar?: string
}

// ============================================================
// CONFIGURACIONES VISUALES
// ============================================================

const STATUS_CONFIG = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    bgGradient: 'from-slate-50 to-slate-100',
    icon: Clock 
  },
  in_progress: { 
    label: 'En Progreso', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bgGradient: 'from-blue-50 to-blue-100',
    icon: ArrowRight 
  },
  completed: { 
    label: 'Completada', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bgGradient: 'from-emerald-50 to-emerald-100',
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    bgGradient: 'from-rose-50 to-rose-100',
    icon: X 
  }
}

const PRIORITY_CONFIG = {
  low: { 
    label: 'Baja', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
    icon: AlertCircle 
  },
  medium: { 
    label: 'Media', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    icon: AlertCircle 
  },
  high: { 
    label: 'Alta', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
    icon: AlertCircle 
  },
  urgent: { 
    label: 'Urgente', 
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    icon: AlertCircle 
  }
}

// Configuración de tipos de actividad/log con colores pastel
const LOG_TYPES = {
  visit: { 
    label: 'Visita', 
    icon: MapPin, 
    color: 'bg-emerald-100 text-emerald-700', 
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    placeholder: 'Describe el propósito de la visita...'
  },
  call: { 
    label: 'Llamada', 
    icon: Phone, 
    color: 'bg-blue-100 text-blue-700', 
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    placeholder: 'Resume la conversación telefónica...'
  },
  email: { 
    label: 'Correo', 
    icon: Mail, 
    color: 'bg-violet-100 text-violet-700', 
    border: 'border-violet-200',
    bg: 'bg-violet-50',
    placeholder: 'Pega aquí el contenido del correo o resumen...'
  },
  whatsapp: { 
    label: 'WhatsApp', 
    icon: MessageCircle, 
    color: 'bg-green-100 text-green-700', 
    border: 'border-green-200',
    bg: 'bg-green-50',
    placeholder: 'Resume la conversación de WhatsApp...'
  },
  meeting: {
    label: 'Reunión',
    icon: Calendar,
    color: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    placeholder: 'Notas de la reunión...'
  },
  note: { 
    label: 'Nota', 
    icon: FileText, 
    color: 'bg-slate-100 text-slate-700', 
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    placeholder: 'Agrega una nota o comentario...'
  }
}

const REMINDER_OPTIONS = [
  { value: 0, label: 'Sin recordatorio' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 día antes' },
  { value: 10080, label: '1 semana antes' }
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Activities() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  
  // Estados principales
  const [activities, setActivities] = useState<Activity[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'overdue' | 'today'>('all')
  
  // Modales
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  
  // Formulario de actividad
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Activity['priority'],
    due_date: '',
    assigned_to: '',
    client_id: '',
    opportunity_id: '',
    contact_id: '',
    related_type: 'general' as Activity['related_type'],
    reminder_minutes: 0,
    is_recurring: false,
    recurrence_pattern: 'daily'
  })
  
  // Formulario de log/actividad registrada
  const [newLog, setNewLog] = useState<{
    type: ActivityLog['type']
    description: string
    // Visita
    visit_date: string
    visit_outcome: string
    // Llamada
    call_duration: string
    call_notes: string
    // WhatsApp
    whatsapp_message: string
    whatsapp_response: string
    // Correo
    email_subject: string
    email_content: string
    // Reunión
    meeting_date: string
    meeting_notes: string
  }>({
    type: 'call',
    description: '',
    visit_date: '',
    visit_outcome: '',
    call_duration: '',
    call_notes: '',
    whatsapp_message: '',
    whatsapp_response: '',
    email_subject: '',
    email_content: '',
    meeting_date: '',
    meeting_notes: ''
  })
  
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    loadData()
  }, [statusFilter, priorityFilter, assignedFilter, viewMode])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (!isManager && viewMode === 'my') params.assigned_to = user?.id
      if (viewMode === 'overdue') params.overdue = true
      if (viewMode === 'today') params.today = true
      
      const [activitiesRes, clientsRes, usersRes, oppRes, contactsRes] = await Promise.all([
        tasksApi.getAll(params),
        clientsApi.getAll(),
        usersApi.getAll(),
        opportunitiesApi.getAll(),
        contactsApi.getAll()
      ])
      
      setActivities(activitiesRes.data?.tasks || [])
      setClients(clientsRes.data?.clients || [])
      setUsers(usersRes.data?.users || [])
      setOpportunities(oppRes.data?.opportunities || [])
      setContacts(contactsRes.data?.contacts || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!isManager && assignedFilter === 'all') {
      return matchesSearch && activity.assigned_to === user?.id
    }
    
    if (assignedFilter !== 'all') {
      return matchesSearch && activity.assigned_to === assignedFilter
    }
    
    return matchesSearch
  })

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const isDueToday = (dueDate: string) => {
    if (!dueDate) return false
    return new Date(dueDate).toDateString() === new Date().toDateString()
  }

  const isDueSoon = (dueDate: string) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    return diff > 0 && diff <= 24 * 60 * 60 * 1000 && !isDueToday(dueDate)
  }

  // Estadísticas
  const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'in_progress')
  const overdueActivities = pendingActivities.filter(a => isOverdue(a.due_date))
  const todayActivities = pendingActivities.filter(a => isDueToday(a.due_date))
  const soonActivities = pendingActivities.filter(a => isDueSoon(a.due_date))
  const completedActivities = activities.filter(a => a.status === 'completed')

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        related_type: formData.client_id ? 'client' : formData.opportunity_id ? 'opportunity' : formData.contact_id ? 'contact' : 'general',
        related_id: formData.client_id || formData.opportunity_id || formData.contact_id || null
      }
      
      if (editingActivity) {
        await tasksApi.update(editingActivity.id, data)
        toast({ title: 'Éxito', description: 'Actividad actualizada correctamente', variant: 'success' })
      } else {
        await tasksApi.create(data)
        toast({ title: 'Éxito', description: 'Actividad creada correctamente', variant: 'success' })
      }
      
      setIsCreateDialogOpen(false)
      setEditingActivity(null)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo guardar la actividad',
        variant: 'destructive'
      })
    }
  }

  const handleComplete = async (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await tasksApi.updateStatus(activity.id, 'completed')
      toast({ title: 'Éxito', description: 'Actividad completada', variant: 'success' })
      loadData()
      if (selectedActivity?.id === activity.id) {
        setSelectedActivity({ ...selectedActivity, status: 'completed', completed_at: new Date().toISOString() })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo completar', variant: 'destructive' })
    }
  }

  const handleDelete = async (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return
    
    try {
      await tasksApi.delete(activity.id)
      toast({ title: 'Éxito', description: 'Actividad eliminada', variant: 'success' })
      loadData()
      if (selectedActivity?.id === activity.id) {
        setIsDetailDialogOpen(false)
        setSelectedActivity(null)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const openCreateDialog = (baseActivity?: Activity) => {
    if (baseActivity) {
      setFormData({
        title: `Seguimiento: ${baseActivity.title}`,
        description: `Actividad de seguimiento de: ${baseActivity.title}`,
        priority: baseActivity.priority,
        due_date: '',
        assigned_to: baseActivity.assigned_to,
        client_id: baseActivity.client_id,
        opportunity_id: baseActivity.opportunity_id,
        contact_id: baseActivity.contact_id,
        related_type: baseActivity.related_type,
        reminder_minutes: baseActivity.reminder_minutes,
        is_recurring: false,
        recurrence_pattern: 'daily'
      })
    } else {
      resetForm()
    }
    setEditingActivity(null)
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (activity: Activity, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      priority: activity.priority,
      due_date: activity.due_date ? activity.due_date.slice(0, 16) : '',
      assigned_to: activity.assigned_to || '',
      client_id: activity.client_id || '',
      opportunity_id: activity.opportunity_id || '',
      contact_id: activity.contact_id || '',
      related_type: activity.related_type || 'general',
      reminder_minutes: activity.reminder_minutes || 0,
      is_recurring: activity.is_recurring || false,
      recurrence_pattern: activity.recurrence_pattern || 'daily'
    })
    setIsCreateDialogOpen(true)
  }

  const openDetailDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsDetailDialogOpen(true)
    setActiveTab('details')
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      assigned_to: user?.id || '',
      client_id: '',
      opportunity_id: '',
      contact_id: '',
      related_type: 'general',
      reminder_minutes: 0,
      is_recurring: false,
      recurrence_pattern: 'daily'
    })
  }

  // Resetear formulario de log al cambiar tipo
  const resetLogForm = (type: ActivityLog['type']) => {
    setNewLog({
      type,
      description: '',
      visit_date: '',
      visit_outcome: '',
      call_duration: '',
      call_notes: '',
      whatsapp_message: '',
      whatsapp_response: '',
      email_subject: '',
      email_content: '',
      meeting_date: '',
      meeting_notes: ''
    })
  }

  // Agregar log/actividad registrada
  const handleAddLog = async () => {
    if (!selectedActivity) return
    
    // Validar campos según tipo
    const logType = newLog.type
    let isValid = false
    let logData: any = { type: logType }
    
    switch (logType) {
      case 'visit':
        isValid = !!(newLog.visit_date && newLog.visit_outcome)
        logData = {
          ...logData,
          visit_date: newLog.visit_date,
          visit_outcome: newLog.visit_outcome,
          description: `Visita realizada el ${newLog.visit_date}. Resultado: ${newLog.visit_outcome}`
        }
        break
      case 'call':
        isValid = !!(newLog.call_notes)
        logData = {
          ...logData,
          call_duration: newLog.call_duration ? parseInt(newLog.call_duration) : undefined,
          call_notes: newLog.call_notes,
          description: newLog.call_notes
        }
        break
      case 'whatsapp':
        isValid = !!(newLog.whatsapp_message || newLog.whatsapp_response)
        logData = {
          ...logData,
          whatsapp_message: newLog.whatsapp_message,
          whatsapp_response: newLog.whatsapp_response,
          description: `Mensaje: ${newLog.whatsapp_message}\nRespuesta: ${newLog.whatsapp_response}`
        }
        break
      case 'email':
        isValid = !!(newLog.email_content)
        logData = {
          ...logData,
          email_subject: newLog.email_subject,
          email_content: newLog.email_content,
          description: newLog.email_subject 
            ? `Asunto: ${newLog.email_subject}\n\n${newLog.email_content}` 
            : newLog.email_content
        }
        break
      case 'meeting':
        isValid = !!(newLog.meeting_notes)
        logData = {
          ...logData,
          meeting_date: newLog.meeting_date,
          meeting_notes: newLog.meeting_notes,
          description: newLog.meeting_notes
        }
        break
      case 'note':
        isValid = !!(newLog.description)
        logData = { ...logData, description: newLog.description }
        break
    }
    
    if (!isValid) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa los campos obligatorios',
        variant: 'destructive'
      })
      return
    }
    
    try {
      await tasksApi.addActivity(selectedActivity.id, logData)
      toast({ title: 'Éxito', description: 'Registro agregado correctamente', variant: 'success' })
      resetLogForm('call')
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo agregar el registro', variant: 'destructive' })
    }
  }

  // Agregar comentario
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedActivity) return
    
    try {
      await tasksApi.addComment(selectedActivity.id, { content: newComment })
      toast({ title: 'Éxito', description: 'Comentario agregado', variant: 'success' })
      setNewComment('')
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo agregar el comentario', variant: 'destructive' })
    }
  }

  // Helpers visuales
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium
    return (
      <Badge className={config.color}>
        <div className={`w-2 h-2 rounded-full ${config.dot} mr-1`} />
        {config.label}
      </Badge>
    )
  }

  const getLogIcon = (type: string) => {
    const config = LOG_TYPES[type as keyof typeof LOG_TYPES] || LOG_TYPES.note
    const Icon = config.icon
    return <Icon className="w-4 h-4" />
  }

  // Renderizar tarjeta de actividad
  const renderActivityCard = (activity: Activity) => {
    const statusConfig = STATUS_CONFIG[activity.status]
    const priorityConfig = PRIORITY_CONFIG[activity.priority]
    const isActivityOverdue = isOverdue(activity.due_date) && activity.status !== 'completed'
    const isActivityDueToday = isDueToday(activity.due_date) && activity.status !== 'completed'
    const isActivityDueSoon = isDueSoon(activity.due_date) && activity.status !== 'completed'
    
    return (
      <Card 
        key={activity.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4 ${
          isActivityOverdue ? 'border-l-rose-400' : 
          isActivityDueToday ? 'border-l-amber-400' : 
          isActivityDueSoon ? 'border-l-orange-300' : 
          'border-l-transparent'
        }`}
        onClick={() => openDetailDialog(activity)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleComplete(activity, e)}
                disabled={activity.status === 'completed'}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  activity.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                {activity.status === 'completed' && <CheckCircle className="w-4 h-4" />}
              </button>
              <h4 className={`font-medium ${activity.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {activity.title}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              {isActivityOverdue && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Vencida
                </Badge>
              )}
              {isActivityDueToday && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Hoy
                </Badge>
              )}
              {isActivityDueSoon && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pronto
                </Badge>
              )}
            </div>
          </div>
          
          {/* Descripción */}
          {activity.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-2 pl-8">
              {activity.description}
            </p>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pl-8">
            {getPriorityBadge(activity.priority)}
            {getStatusBadge(activity.status)}
          </div>
          
          {/* Info relacionada */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pl-8">
            {activity.client_name && (
              <Badge variant="outline" className="text-xs bg-cyan-50 border-cyan-200 text-cyan-700">
                <Building2 className="w-3 h-3 mr-1" />
                {activity.client_name}
              </Badge>
            )}
            {activity.opportunity_name && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                <Briefcase className="w-3 h-3 mr-1" />
                {activity.opportunity_name}
              </Badge>
            )}
            {activity.contact_name && (
              <Badge variant="outline" className="text-xs bg-violet-50 border-violet-200 text-violet-700">
                <UserCircle className="w-3 h-3 mr-1" />
                {activity.contact_name}
              </Badge>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pl-8">
            <div className={`flex items-center gap-1 text-sm ${
              isActivityOverdue ? 'text-rose-600 font-medium' : 
              isActivityDueToday ? 'text-amber-600 font-medium' : 
              'text-slate-500'
            }`}>
              <Calendar className="w-4 h-4" />
              {activity.due_date ? formatDateTime(activity.due_date) : 'Sin fecha'}
            </div>
            
            {activity.assigned_to_name && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700">
                    {activity.assigned_to_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500">{activity.assigned_to_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar formulario específico según tipo de log
  const renderLogForm = () => {
    const type = newLog.type
    
    switch (type) {
      case 'visit':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Fecha de visita *</Label>
                <Input
                  type="date"
                  value={newLog.visit_date}
                  onChange={(e) => setNewLog({ ...newLog, visit_date: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Resultado / Respuesta *</Label>
                <Select 
                  value={newLog.visit_outcome} 
                  onValueChange={(value) => setNewLog({ ...newLog, visit_outcome: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Seleccionar resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interesado">Interesado</SelectItem>
                    <SelectItem value="considerando">Considerando</SelectItem>
                    <SelectItem value="no_interesado">No interesado</SelectItem>
                    <SelectItem value="pendiente_decision">Pendiente de decisión</SelectItem>
                    <SelectItem value="requiere_seguimiento">Requiere seguimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Notas adicionales</Label>
              <Textarea
                value={newLog.description}
                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                placeholder="Detalles de la visita, temas tratados, observaciones..."
                className="bg-white border-slate-200 resize-none"
                rows={3}
              />
            </div>
          </div>
        )
        
      case 'call':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Duración (minutos)</Label>
              <Input
                type="number"
                value={newLog.call_duration}
                onChange={(e) => setNewLog({ ...newLog, call_duration: e.target.value })}
                placeholder="Ej: 15"
                className="bg-white border-slate-200 w-32"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Resumen de la llamada *</Label>
              <Textarea
                value={newLog.call_notes}
                onChange={(e) => setNewLog({ ...newLog, call_notes: e.target.value })}
                placeholder="Resume la conversación: qué hablaste, qué dijo el cliente, acuerdos..."
                className="bg-white border-slate-200 resize-none"
                rows={4}
              />
            </div>
          </div>
        )
        
      case 'whatsapp':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Mensaje enviado</Label>
              <Textarea
                value={newLog.whatsapp_message}
                onChange={(e) => setNewLog({ ...newLog, whatsapp_message: e.target.value })}
                placeholder="Pega aquí el mensaje que enviaste..."
                className="bg-white border-slate-200 resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Respuesta del cliente</Label>
              <Textarea
                value={newLog.whatsapp_response}
                onChange={(e) => setNewLog({ ...newLog, whatsapp_response: e.target.value })}
                placeholder="Pega aquí la respuesta que recibiste del cliente..."
                className="bg-white border-slate-200 resize-none"
                rows={3}
              />
            </div>
          </div>
        )
        
      case 'email':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Asunto del correo</Label>
              <Input
                value={newLog.email_subject}
                onChange={(e) => setNewLog({ ...newLog, email_subject: e.target.value })}
                placeholder="Ej: Propuesta de servicios - AntuCRM"
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Contenido del correo *</Label>
              <Textarea
                value={newLog.email_content}
                onChange={(e) => setNewLog({ ...newLog, email_content: e.target.value })}
                placeholder="Pega aquí la conversación completa del correo o un resumen detallado..."
                className="bg-white border-slate-200 resize-none font-mono text-sm"
                rows={6}
              />
            </div>
          </div>
        )
        
      case 'meeting':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Fecha de la reunión</Label>
              <Input
                type="datetime-local"
                value={newLog.meeting_date}
                onChange={(e) => setNewLog({ ...newLog, meeting_date: e.target.value })}
                className="bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Notas de la reunión *</Label>
              <Textarea
                value={newLog.meeting_notes}
                onChange={(e) => setNewLog({ ...newLog, meeting_notes: e.target.value })}
                placeholder="Puntos tratados, decisiones, próximos pasos..."
                className="bg-white border-slate-200 resize-none"
                rows={4}
              />
            </div>
          </div>
        )
        
      case 'note':
      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Nota</Label>
            <Textarea
              value={newLog.description}
              onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
              placeholder="Escribe tu nota o comentario..."
              className="bg-white border-slate-200 resize-none"
              rows={4}
            />
          </div>
        )
    }
  }

  // Renderizar detalle de log según tipo
  const renderLogDetail = (log: ActivityLog) => {
    switch (log.type) {
      case 'visit':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {log.visit_date && (
              <p className="text-slate-600">
                <Calendar className="w-3 h-3 inline mr-1" />
                Fecha: {formatDate(log.visit_date)}
              </p>
            )}
            {log.visit_outcome && (
              <p className="text-slate-600">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Resultado: <span className="capitalize">{log.visit_outcome.replace('_', ' ')}</span>
              </p>
            )}
          </div>
        )
      case 'call':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {log.call_duration && (
              <p className="text-slate-600">
                <Clock className="w-3 h-3 inline mr-1" />
                Duración: {log.call_duration} minutos
              </p>
            )}
            {log.call_notes && (
              <p className="text-slate-600 mt-2 whitespace-pre-wrap">{log.call_notes}</p>
            )}
          </div>
        )
      case 'whatsapp':
        return (
          <div className="mt-2 space-y-2 text-sm">
            {log.whatsapp_message && (
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">Mensaje enviado:</p>
                <p className="text-slate-700 whitespace-pre-wrap">{log.whatsapp_message}</p>
              </div>
            )}
            {log.whatsapp_response && (
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-xs text-slate-500 font-medium mb-1">Respuesta del cliente:</p>
                <p className="text-slate-700 whitespace-pre-wrap">{log.whatsapp_response}</p>
              </div>
            )}
          </div>
        )
      case 'email':
        return (
          <div className="mt-2 space-y-2 text-sm">
            {log.email_subject && (
              <p className="text-slate-600 font-medium">
                <Mail className="w-3 h-3 inline mr-1" />
                Asunto: {log.email_subject}
              </p>
            )}
            {log.email_content && (
              <div className="bg-violet-50 p-3 rounded-lg mt-2">
                <p className="text-slate-700 whitespace-pre-wrap font-mono text-xs">{log.email_content}</p>
              </div>
            )}
          </div>
        )
      case 'meeting':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {log.meeting_date && (
              <p className="text-slate-600">
                <Calendar className="w-3 h-3 inline mr-1" />
                Fecha: {formatDateTime(log.meeting_date)}
              </p>
            )}
            {log.meeting_notes && (
              <p className="text-slate-600 mt-2 whitespace-pre-wrap">{log.meeting_notes}</p>
            )}
          </div>
        )
      default:
        return log.description ? (
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{log.description}</p>
        ) : null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Actividades</h1>
          <p className="text-slate-500">Gestiona tus tareas, seguimientos y registros de interacción</p>
        </div>
        <Button 
          onClick={() => openCreateDialog()} 
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${viewMode === 'all' ? 'ring-2 ring-violet-400' : ''}`}
          onClick={() => setViewMode('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Todas</p>
              <p className="text-xl font-bold text-slate-700">{activities.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${viewMode === 'my' ? 'ring-2 ring-violet-400' : ''}`}
          onClick={() => setViewMode('my')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-200 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Mis Actividades</p>
              <p className="text-xl font-bold text-violet-700">
                {activities.filter(a => a.assigned_to === user?.id).length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${viewMode === 'overdue' ? 'ring-2 ring-rose-400' : ''}`}
          onClick={() => setViewMode('overdue')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vencidas</p>
              <p className="text-xl font-bold text-rose-700">{overdueActivities.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${viewMode === 'today' ? 'ring-2 ring-amber-400' : ''}`}
          onClick={() => setViewMode('today')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Hoy</p>
              <p className="text-xl font-bold text-amber-700">{todayActivities.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">Completadas</p>
              <p className="text-xl font-bold text-emerald-700">{completedActivities.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de actividades próximas a vencer */}
      {(soonActivities.length > 0 || overdueActivities.length > 0) && (
        <div className="space-y-2">
          {overdueActivities.slice(0, 3).map(activity => (
            <div key={activity.id} className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <div className="flex-1">
                <span className="font-medium text-rose-700">{activity.title}</span>
                <span className="text-rose-600 text-sm ml-2">- Vencida ({formatRelativeTime(activity.due_date)})</span>
              </div>
              <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => openDetailDialog(activity)}>
                Ver
              </Button>
            </div>
          ))}
          {soonActivities.slice(0, 3).map(activity => (
            <div key={activity.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <span className="font-medium text-orange-700">{activity.title}</span>
                <span className="text-orange-600 text-sm ml-2">- Vence pronto ({formatRelativeTime(activity.due_date)})</span>
              </div>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" onClick={() => openDetailDialog(activity)}>
                Ver
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar actividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-slate-200">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48 min-w-[12rem] bg-white border-slate-200">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          
          {isManager && (
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-52 min-w-[13rem] bg-white border-slate-200">
                <SelectValue placeholder="Asignado a" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-48 bg-slate-100" />
            </Card>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 text-lg">No hay actividades registradas</p>
          <p className="text-slate-400 text-sm mb-4">Crea tu primera actividad para comenzar</p>
          <Button 
            onClick={() => openCreateDialog()} 
            variant="outline"
            className="border-violet-300 text-violet-700 hover:bg-violet-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear primera actividad
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map(renderActivityCard)}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <HorizontalDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <HorizontalDialogContent>
          <HorizontalDialogHeader>
            <HorizontalDialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                editingActivity 
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100' 
                  : 'bg-gradient-to-br from-violet-100 to-purple-100'
              }`}>
                <ClipboardList className={`w-4 h-4 ${editingActivity ? 'text-amber-600' : 'text-violet-600'}`} />
              </div>
              {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
            </HorizontalDialogTitle>
            <HorizontalDialogDescription>
              {editingActivity ? 'Actualiza los detalles de la actividad' : 'Crea una nueva actividad o seguimiento'}
            </HorizontalDialogDescription>
          </HorizontalDialogHeader>
          
          <HorizontalDialogBody>
            <form onSubmit={handleSubmit}>
              <HorizontalDialogTwoColumn
                left={
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Título *</Label>
                      <Input 
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Llamar a cliente para seguimiento"
                        required
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Descripción</Label>
                      <Textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalles de la actividad..."
                        rows={4}
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Prioridad</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData({ ...formData, priority: value as Activity['priority'] })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              Baja
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              Media
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              Alta
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-rose-400" />
                              Urgente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                }
                right={
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Fecha y hora límite</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Asignar a</Label>
                      <Select 
                        value={formData.assigned_to} 
                        onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-violet-100 text-violet-600">
                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {u.first_name} {u.last_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Relacionar con</Label>
                      <Select 
                        value={formData.client_id || formData.opportunity_id || formData.contact_id || ''} 
                        onValueChange={(value) => {
                          const [type, id] = value.split(':')
                          setFormData({ 
                            ...formData, 
                            client_id: type === 'client' ? id : '',
                            opportunity_id: type === 'opportunity' ? id : '',
                            contact_id: type === 'contact' ? id : ''
                          })
                        }}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Seleccionar (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=":">
                            <span className="text-slate-400">Ninguno</span>
                          </SelectItem>
                          <Separator className="my-1" />
                          <SelectItem disabled value="" className="text-xs font-semibold text-slate-400">
                            CLIENTES
                          </SelectItem>
                          {clients.map(c => (
                            <SelectItem key={`client:${c.id}`} value={`client:${c.id}`}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-cyan-500" />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem disabled value="" className="text-xs font-semibold text-slate-400">
                            OPORTUNIDADES
                          </SelectItem>
                          {opportunities.map(o => (
                            <SelectItem key={`opportunity:${o.id}`} value={`opportunity:${o.id}`}>
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-3 h-3 text-blue-500" />
                                {o.name}
                              </div>
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem disabled value="" className="text-xs font-semibold text-slate-400">
                            CONTACTOS
                          </SelectItem>
                          {contacts.map(c => (
                            <SelectItem key={`contact:${c.id}`} value={`contact:${c.id}`}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="w-3 h-3 text-violet-500" />
                                {c.first_name} {c.last_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Recordatorio</Label>
                      <Select 
                        value={String(formData.reminder_minutes)} 
                        onValueChange={(value) => setFormData({ ...formData, reminder_minutes: parseInt(value) })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              <div className="flex items-center gap-2">
                                <Bell className="w-3 h-3 text-slate-400" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
            >
              {editingActivity ? 'Guardar Cambios' : 'Crear Actividad'}
            </Button>
          </HorizontalDialogFooter>
        </HorizontalDialogContent>
      </HorizontalDialog>

      {/* Detail Dialog */}
      {selectedActivity && (
        <HorizontalDialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <HorizontalDialogContent className="max-w-5xl">
            <HorizontalDialogHeader>
              <HorizontalDialogTitle className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedActivity.status === 'completed' 
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' 
                    : 'bg-gradient-to-br from-violet-100 to-purple-200'
                }`}>
                  <ClipboardList className={`w-4 h-4 ${
                    selectedActivity.status === 'completed' ? 'text-emerald-600' : 'text-violet-600'
                  }`} />
                </div>
                <span className={selectedActivity.status === 'completed' ? 'line-through text-slate-400' : ''}>
                  {selectedActivity.title}
                </span>
                {getStatusBadge(selectedActivity.status)}
              </HorizontalDialogTitle>
              <HorizontalDialogDescription>
                Creada el {formatDate(selectedActivity.created_at)} por {selectedActivity.created_by || 'Sistema'}
              </HorizontalDialogDescription>
            </HorizontalDialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                <TabsTrigger value="details" className="data-[state=active]:bg-white">Detalles</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-white">
                  Registros ({selectedActivity.logs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:bg-white">
                  Comentarios ({selectedActivity.comments?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              {/* Tab: Detalles */}
              <TabsContent value="details" className="mt-4">
                <HorizontalDialogBody>
                  <HorizontalDialogTwoColumn
                    left={
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                          <Label className="text-slate-500 text-sm">Descripción</Label>
                          <p className="text-slate-700 mt-1">
                            {selectedActivity.description || 'Sin descripción'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <Label className="text-slate-500 text-sm">Prioridad</Label>
                            <div className="mt-1">{getPriorityBadge(selectedActivity.priority)}</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <Label className="text-slate-500 text-sm">Estado</Label>
                            <div className="mt-1">{getStatusBadge(selectedActivity.status)}</div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4">
                          <Label className="text-slate-500 text-sm">Fecha límite</Label>
                          <p className={`mt-1 font-medium ${
                            isOverdue(selectedActivity.due_date) && selectedActivity.status !== 'completed' 
                              ? 'text-rose-600' 
                              : 'text-slate-700'
                          }`}>
                            <Calendar className="w-4 h-4 inline mr-2" />
                            {selectedActivity.due_date 
                              ? formatDateTime(selectedActivity.due_date) 
                              : 'Sin fecha límite'}
                          </p>
                          {isOverdue(selectedActivity.due_date) && selectedActivity.status !== 'completed' && (
                            <p className="text-rose-500 text-sm mt-1">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              Vencida ({formatRelativeTime(selectedActivity.due_date)})
                            </p>
                          )}
                        </div>
                      </div>
                    }
                    right={
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                          <Label className="text-slate-500 text-sm">Asignado a</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-violet-100 text-violet-600">
                                {selectedActivity.assigned_to_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-700">
                              {selectedActivity.assigned_to_name || 'Sin asignar'}
                            </span>
                          </div>
                        </div>
                        
                        {selectedActivity.client_name && (
                          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                            <Label className="text-cyan-600 text-sm">Cliente</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Building2 className="w-5 h-5 text-cyan-500" />
                              <span className="font-medium text-cyan-700">{selectedActivity.client_name}</span>
                            </div>
                          </div>
                        )}
                        
                        {selectedActivity.opportunity_name && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <Label className="text-blue-600 text-sm">Oportunidad</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Briefcase className="w-5 h-5 text-blue-500" />
                              <span className="font-medium text-blue-700">{selectedActivity.opportunity_name}</span>
                            </div>
                          </div>
                        )}
                        
                        {selectedActivity.contact_name && (
                          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                            <Label className="text-violet-600 text-sm">Contacto</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <UserCircle className="w-5 h-5 text-violet-500" />
                              <span className="font-medium text-violet-700">{selectedActivity.contact_name}</span>
                            </div>
                          </div>
                        )}
                        
                        {selectedActivity.status === 'completed' && (
                          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <Label className="text-emerald-600 text-sm">Completada</Label>
                            <p className="text-emerald-700 mt-1">
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              {selectedActivity.completed_at ? formatDateTime(selectedActivity.completed_at) : 'Fecha no registrada'}
                            </p>
                          </div>
                        )}
                      </div>
                    }
                  />
                </HorizontalDialogBody>
              </TabsContent>
              
              {/* Tab: Registros */}
              <TabsContent value="logs" className="mt-4">
                <HorizontalDialogBody>
                  <div className="space-y-4">
                    {/* Agregar nuevo registro */}
                    {selectedActivity.status !== 'completed' && selectedActivity.status !== 'cancelled' && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <Label className="text-slate-700 font-medium mb-3 block">Registrar interacción</Label>
                        
                        {/* Selector de tipo */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                          {Object.entries(LOG_TYPES).map(([type, config]) => {
                            const Icon = config.icon
                            return (
                              <button
                                key={type}
                                onClick={() => {
                                  resetLogForm(type as ActivityLog['type'])
                                  setNewLog(prev => ({ ...prev, type: type as ActivityLog['type'] }))
                                }}
                                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                                  newLog.type === type 
                                    ? `${config.color} ${config.border}` 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs">{config.label}</span>
                              </button>
                            )
                          })}
                        </div>
                        
                        {/* Formulario específico según tipo */}
                        <div className={`p-4 rounded-lg border ${LOG_TYPES[newLog.type].border} ${LOG_TYPES[newLog.type].bg}`}>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2">
                            {(() => {
                              const Icon = LOG_TYPES[newLog.type].icon
                              return <Icon className="w-4 h-4" />
                            })()}
                            Registrar {LOG_TYPES[newLog.type].label}
                          </p>
                          {renderLogForm()}
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button 
                            onClick={handleAddLog}
                            className="bg-violet-500 hover:bg-violet-600"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Registro
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Lista de registros */}
                    <ScrollArea className="h-80">
                      <div className="space-y-3">
                        {selectedActivity.logs?.length === 0 ? (
                          <div className="text-center py-8">
                            <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-400">No hay registros de interacción</p>
                            <p className="text-slate-400 text-sm">Registra tus llamadas, visitas, correos y más</p>
                          </div>
                        ) : (
                          selectedActivity.logs?.map((log) => {
                            const config = LOG_TYPES[log.type] || LOG_TYPES.note
                            const Icon = config.icon
                            return (
                              <div key={log.id} className={`p-4 rounded-xl border ${config.border} bg-white`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800">{config.label}</span>
                                        <span className="text-xs text-slate-400">por {log.user_name}</span>
                                      </div>
                                      <span className="text-xs text-slate-400">{formatRelativeTime(log.created_at)}</span>
                                    </div>
                                    {renderLogDetail(log)}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </HorizontalDialogBody>
              </TabsContent>
              
              {/* Tab: Comentarios */}
              <TabsContent value="comments" className="mt-4">
                <HorizontalDialogBody>
                  <div className="space-y-4">
                    {/* Agregar comentario */}
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="flex-1 bg-white border-slate-200 resize-none"
                        rows={2}
                      />
                      <Button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="bg-violet-500 hover:bg-violet-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Lista de comentarios */}
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {selectedActivity.comments?.length === 0 ? (
                          <p className="text-center text-slate-400 py-8">No hay comentarios</p>
                        ) : (
                          selectedActivity.comments?.map((comment) => (
                            <div key={comment.id} className="bg-slate-50 rounded-xl p-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
                                    {comment.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-700">{comment.user_name}</span>
                                    <span className="text-xs text-slate-400">{formatRelativeTime(comment.created_at)}</span>
                                  </div>
                                  <p className="text-slate-600 mt-1">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </HorizontalDialogBody>
              </TabsContent>
            </Tabs>
            
            <HorizontalDialogFooter>
              <div className="flex items-center gap-2">
                {selectedActivity.status !== 'completed' && selectedActivity.status !== 'cancelled' && (
                  <Button 
                    onClick={() => handleComplete(selectedActivity)}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => openEditDialog(selectedActivity)}
                  className="border-slate-200"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => openCreateDialog(selectedActivity)}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Crear seguimiento
                </Button>
              </div>
              <Button 
                variant="outline"
                onClick={() => handleDelete(selectedActivity)}
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </HorizontalDialogFooter>
          </HorizontalDialogContent>
        </HorizontalDialog>
      )}
    </div>
  )
}
