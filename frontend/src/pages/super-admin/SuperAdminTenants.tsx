import { useEffect, useState, useMemo } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Building2, 
  Power, 
  PowerOff, 
  MoreHorizontal,
  Search,
  Filter,
  Download,
  LogIn,
  Mail,
  Calendar,
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
  X,
  Check,
  ChevronDown,
  Eye,
  Puzzle,
  Users,
  MapPin,
  Lock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { superAdminApi } from '@/services/api'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string
  plan_id: string
  plan_name: string
  status: 'active' | 'suspended' | 'trial'
  payment_method: 'stripe' | 'paypal' | 'mercadopago' | 'manual' | null
  created_at: string
  owner_email: string
  owner_name: string
  user_count: number
  last_active: string
  logo_url?: string
}

interface Plan {
  id: string
  name: string
}

const statusConfig = {
  active: { 
    label: 'Activo', 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-100',
    icon: Check 
  },
  suspended: { 
    label: 'Suspendido', 
    bgColor: 'bg-rose-50', 
    textColor: 'text-rose-600',
    borderColor: 'border-rose-100',
    icon: PowerOff 
  },
  trial: { 
    label: 'En Prueba', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-600',
    borderColor: 'border-amber-100',
    icon: Calendar 
  }
} as const

const paymentMethodConfig = {
  stripe: { label: 'Stripe', icon: CreditCard, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  paypal: { label: 'PayPal', icon: Wallet, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  mercadopago: { label: 'Mercado Pago', icon: Smartphone, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  manual: { label: 'Transferencia', icon: Landmark, color: 'text-slate-600', bgColor: 'bg-slate-50' }
} as const

// MODULE_LIST — rdOnly means the module is exclusively available for República Dominicana
const MODULE_LIST: { key: string; label: string; description: string; default: boolean; rdOnly?: boolean }[] = [
  { key: 'crm', label: 'CRM', description: 'Clientes, Contactos y Oportunidades', default: true },
  { key: 'cpq', label: 'CPQ / Cotizaciones', description: 'Cotizaciones y Configuración de Precios', default: true },
  { key: 'activities', label: 'Actividades', description: 'Gestión de actividades y seguimiento', default: true },
  { key: 'marketing', label: 'Marketing', description: 'Campañas, Segmentos y Automatizaciones', default: true },
  { key: 'performance', label: 'Desempeño', description: 'Métricas y reportes de rendimiento', default: true },
  { key: 'email', label: 'Email', description: 'Módulo de correo electrónico integrado', default: true },
  { key: 'inventory', label: 'Inventario', description: 'Gestión de productos y stock', default: false },
  { key: 'invoicing', label: 'Facturación', description: 'Facturas NCF y cuentas por cobrar', default: false },
  { key: 'service_desk', label: 'Service Desk', description: 'Tickets, órdenes de trabajo y técnicos', default: false },
  { key: 'automations', label: 'Motor de Automatizaciones', description: 'Reglas automáticas de triggers y acciones (solo RD)', default: false, rdOnly: true },
]

const DEFAULT_MODULES = MODULE_LIST.reduce((acc, m) => ({ ...acc, [m.key]: m.default }), {} as Record<string, boolean>)


const COUNTRIES: { code: string; name: string }[] = [
  { code: 'DO', name: 'República Dominicana' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'CU', name: 'Cuba' },
  { code: 'BR', name: 'Brasil' },
  { code: 'ES', name: 'España' },
  { code: 'CA', name: 'Canadá' },
  { code: 'OTHER', name: 'Otro país' },
]

export default function SuperAdminTenants() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false)
  const [modulesForTenant, setModulesForTenant] = useState<Record<string, boolean>>({})
  const [selectedTenantForModules, setSelectedTenantForModules] = useState<Tenant | null>(null)
  const [isSavingModules, setIsSavingModules] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    plan_id: '',
    owner_email: '',
    owner_first_name: '',
    owner_password: '',
    modules: DEFAULT_MODULES as Record<string, boolean>,
    country: 'DO',
    gov_module_enabled: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [tenantsRes, plansRes] = await Promise.all([
        superAdminApi.getTenants(),
        superAdminApi.getPlans()
      ])
      setTenants(tenantsRes.data.tenants || [])
      setPlans(plansRes.data.plans || [])
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

  // Filter tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesSearch = 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
      const matchesPlan = planFilter === 'all' || tenant.plan_id === planFilter
      const matchesPayment = paymentFilter === 'all' || tenant.payment_method === paymentFilter
      
      return matchesSearch && matchesStatus && matchesPlan && matchesPayment
    })
  }, [tenants, searchQuery, statusFilter, planFilter, paymentFilter])

  // Stats
  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length
  }), [tenants])

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      slug: '',
      domain: '',
      plan_id: '',
      owner_email: '',
      owner_first_name: '',
      owner_password: '',
      modules: DEFAULT_MODULES,
      country: 'DO',
      gov_module_enabled: false
    })
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || '',
      plan_id: tenant.plan_id || '',
      owner_email: tenant.owner_email || '',
      owner_first_name: tenant.owner_name || '',
      owner_password: '',
      modules: {},
      country: 'DO',
      gov_module_enabled: false
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await superAdminApi.createTenant(formData)
      toast({
        title: 'Éxito',
        description: 'Empresa creada correctamente',
        variant: 'success'
      })
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear la empresa',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTenant) return
    
    setIsSubmitting(true)
    try {
      await superAdminApi.updateTenant(editingTenant.id, {
        name: formData.name,
        domain: formData.domain,
        plan_id: formData.plan_id
      })
      toast({
        title: 'Éxito',
        description: 'Empresa actualizada correctamente',
        variant: 'success'
      })
      setIsEditDialogOpen(false)
      setEditingTenant(null)
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo actualizar la empresa',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenModulesDialog = async (tenant: Tenant) => {
    setSelectedTenantForModules(tenant)
    try {
      const res = await superAdminApi.getTenantModules(tenant.id)
      setModulesForTenant(res.data.modules || { crm: true, cpq: true, activities: true, marketing: true, performance: true, email: true })
    } catch {
      setModulesForTenant({ crm: true, cpq: true, activities: true, marketing: true, performance: true, email: true })
    }
    setIsModulesDialogOpen(true)
  }

  const handleSaveModules = async () => {
    if (!selectedTenantForModules) return
    setIsSavingModules(true)
    try {
      await superAdminApi.updateTenantModules(selectedTenantForModules.id, modulesForTenant)
      toast({ title: 'Módulos actualizados', description: `Módulos de ${selectedTenantForModules.name} guardados exitosamente.` })
      setIsModulesDialogOpen(false)
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudieron guardar los módulos', variant: 'destructive' })
    } finally {
      setIsSavingModules(false)
    }
  }

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${tenant.name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await superAdminApi.deleteTenant(tenant.id)
      toast({
        title: 'Éxito',
        description: 'Empresa eliminada correctamente',
        variant: 'success'
      })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar la empresa',
        variant: 'destructive'
      })
    }
  }

  const handleSuspend = async (tenant: Tenant) => {
    try {
      await superAdminApi.suspendTenant(tenant.id)
      toast({
        title: 'Éxito',
        description: 'Empresa suspendida correctamente',
        variant: 'success'
      })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo suspender la empresa',
        variant: 'destructive'
      })
    }
  }

  const handleActivate = async (tenant: Tenant) => {
    try {
      await superAdminApi.activateTenant(tenant.id)
      toast({
        title: 'Éxito',
        description: 'Empresa activada correctamente',
        variant: 'success'
      })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo activar la empresa',
        variant: 'destructive'
      })
    }
  }

  const handleImpersonate = (tenant: Tenant) => {
    localStorage.setItem('impersonate_tenant', JSON.stringify({
      tenantId: tenant.id,
      tenantName: tenant.name,
      returnUrl: '/super-admin/tenants'
    }))
    toast({
      title: 'Impersonando',
      description: `Entrando como ${tenant.name}...`,
      variant: 'success'
    })
    window.location.href = `/dashboard?impersonate=${tenant.id}`
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPlanFilter('all')
    setPaymentFilter('all')
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    return (
      <Badge 
        variant="outline"
        className={cn("flex items-center gap-1.5 w-fit font-medium border", config.bgColor, config.textColor, config.borderColor)}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-slate-400 text-sm">—</span>
    const config = paymentMethodConfig[method as keyof typeof paymentMethodConfig]
    if (!config) return <span className="text-slate-400 text-sm">—</span>
    const Icon = config.icon
    return (
      <div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg", config.bgColor)}>
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EM'
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || planFilter !== 'all' || paymentFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Gestión de Empresas</h1>
          <p className="text-slate-500 text-sm mt-1">Administra los tenants registrados en el sistema</p>
        </div>
        <Button onClick={handleOpenDialog} className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Nueva Empresa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Empresas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Activas</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">En Prueba</p>
                <p className="text-2xl font-bold text-amber-700">{stats.trial}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-100 bg-rose-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600">Suspendidas</p>
                <p className="text-2xl font-bold text-rose-700">{stats.suspended}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <PowerOff className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, slug o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="trial">En Prueba</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[160px] bg-white">
                  <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[170px] bg-white">
                  <Wallet className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Método de Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="manual">Transferencia</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
              
              <Button variant="outline" size="icon" className="border-slate-200">
                <Download className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              <p className="mt-4 text-slate-500">Cargando empresas...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">
                {tenants.length === 0 ? 'No hay empresas registradas' : 'No se encontraron resultados'}
              </p>
              {tenants.length === 0 && (
                <Button onClick={handleOpenDialog} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera empresa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Empresa</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Administrador</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Plan</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Estado</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Método de Pago</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Registro</th>
                    <th className="text-right py-3.5 px-4 font-medium text-slate-600 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                              <span className="text-violet-600 font-semibold text-sm">{getInitials(tenant.name)}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{tenant.name}</p>
                            <p className="text-xs text-slate-400 font-mono">#{tenant.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{tenant.owner_email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-medium bg-slate-50 border-slate-200 text-slate-600">
                          {tenant.plan_name || 'Sin plan'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getPaymentMethodBadge(tenant.payment_method)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tenant.created_at)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleImpersonate(tenant)} className="text-violet-600 cursor-pointer">
                              <LogIn className="w-4 h-4 mr-2" />
                              Entrar como
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(tenant)} className="cursor-pointer">
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenModulesDialog(tenant)} className="cursor-pointer">
                              <Puzzle className="w-4 h-4 mr-2 text-cyan-500" />
                              Módulos
                            </DropdownMenuItem>
                            {tenant.status === 'active' || tenant.status === 'trial' ? (
                              <DropdownMenuItem onClick={() => handleSuspend(tenant)} className="cursor-pointer">
                                <PowerOff className="w-4 h-4 mr-2 text-amber-500" />
                                Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(tenant)} className="cursor-pointer">
                                <Power className="w-4 h-4 mr-2 text-emerald-500" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(tenant)} className="text-rose-600 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination info */}
          {!isLoading && filteredTenants.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-sm text-slate-500">
              Mostrando {filteredTenants.length} de {tenants.length} empresas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog - Horizontal Layout */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar Nueva Empresa</DialogTitle>
            <DialogDescription>
              Crea un nuevo tenant en el sistema con su administrador principal.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info Section */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" />
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Mi Empresa SRL"
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    placeholder="mi-empresa"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Dominio Personalizado</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="miempresa.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    País *
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      const isRD = value === 'DO'
                      setFormData(prev => ({
                        ...prev,
                        country: value,
                        gov_module_enabled: isRD ? prev.gov_module_enabled : false,
                        modules: { ...prev.modules, automations: isRD ? prev.modules.automations : false }
                      }))
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_id">Plan de Suscripción</Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Modules Section */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-cyan-500" />
                Módulos Habilitados
              </h3>
              <p className="text-xs text-slate-400 mb-3">Selecciona los módulos que tendrá disponibles esta empresa al inicio.</p>
              {formData.country !== 'DO' && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Los módulos <strong>Gov (Ley 47-25)</strong> y <strong>Motor de Automatizaciones</strong> son exclusivos para clientes de República Dominicana y no están disponibles para este país.</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {MODULE_LIST.map((mod) => {
                  const isLocked = mod.rdOnly && formData.country !== 'DO'
                  return (
                    <div key={mod.key} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border bg-white",
                      isLocked ? "border-slate-100 opacity-60" : "border-slate-200"
                    )}>
                      <div>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                          {mod.label}
                          {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        </p>
                        <p className="text-xs text-slate-400">{mod.description}</p>
                      </div>
                      <Switch
                        checked={!isLocked && formData.modules[mod.key] !== false}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, modules: { ...prev.modules, [mod.key]: checked } }))
                        }
                      />
                    </div>
                  )
                })}
                {/* Gov Module — RD exclusive */}
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border bg-white",
                  formData.country !== 'DO' ? "border-slate-100 opacity-60" : "border-slate-200"
                )}>
                  <div>
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      Gov — Licitaciones (Ley 47-25)
                      {formData.country !== 'DO' && <Lock className="w-3 h-3 text-slate-400" />}
                    </p>
                    <p className="text-xs text-slate-400">Expediente digital, checklist Ley 47-25 (solo RD)</p>
                  </div>
                  <Switch
                    checked={formData.country === 'DO' && formData.gov_module_enabled === true}
                    disabled={formData.country !== 'DO'}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, gov_module_enabled: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Owner Info Section */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-500" />
                Información del Administrador Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_first_name">Nombre *</Label>
                  <Input
                    id="owner_first_name"
                    value={formData.owner_first_name}
                    onChange={(e) => setFormData({ ...formData, owner_first_name: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_email">Email *</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_password">Contraseña *</Label>
                  <Input
                    id="owner_password"
                    type="password"
                    value={formData.owner_password}
                    onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                    required
                    minLength={8}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-200"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
                {isSubmitting ? 'Creando...' : 'Crear Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Modifica la información de {editingTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nombre de la Empresa</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_domain">Dominio Personalizado</Label>
              <Input
                id="edit_domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="miempresa.com"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_plan_id">Plan de Suscripción</Label>
              <Select
                value={formData.plan_id}
                onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-slate-200"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modules Dialog */}
      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-cyan-500" />
              Módulos — {selectedTenantForModules?.name}
            </DialogTitle>
            <DialogDescription>
              Activa o desactiva los módulos disponibles para esta empresa. Los cambios aplican de inmediato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {MODULE_LIST.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{mod.label}</p>
                  <p className="text-xs text-slate-500">{mod.description}</p>
                </div>
                <Switch
                  checked={modulesForTenant[mod.key] !== false}
                  onCheckedChange={(checked) => setModulesForTenant(prev => ({ ...prev, [mod.key]: checked }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)} className="border-slate-200">
              Cancelar
            </Button>
            <Button onClick={handleSaveModules} disabled={isSavingModules} className="bg-cyan-600 hover:bg-cyan-700">
              {isSavingModules ? 'Guardando...' : 'Guardar Módulos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
