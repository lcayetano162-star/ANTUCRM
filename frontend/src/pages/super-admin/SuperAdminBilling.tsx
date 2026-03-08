import { useEffect, useState } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard,
  DollarSign,
  Check,
  X,
  TrendingUp,
  Calendar,
  Users,
  Package,
  MoreHorizontal,
  Download,
  Wallet,
  RefreshCw,
  ExternalLink,
  Copy,
  Search,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { superAdminApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
  limits: Record<string, any>
  is_active: boolean
  sort_order: number
  tenant_count: number
  color: string
}

interface Invoice {
  id: string
  transaction_id: string
  tenant_id: string
  tenant_name: string
  plan_name: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'refunded'
  payment_method: 'stripe' | 'paypal' | 'mercadopago' | 'manual'
  due_date: string
  paid_date: string | null
  description: string
  created_at: string
}

const paymentMethodConfig = {
  stripe: { label: 'Stripe', icon: CreditCard, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  paypal: { label: 'PayPal', icon: Wallet, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  mercadopago: { label: 'Mercado Pago', icon: Wallet, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  manual: { label: 'Transferencia', icon: Wallet, color: 'text-slate-600', bgColor: 'bg-slate-50' }
} as const

const statusConfig = {
  paid: { label: 'Pagada', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
  pending: { label: 'Pendiente', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-100' },
  overdue: { label: 'Vencida', bgColor: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-100' },
  cancelled: { label: 'Cancelada', bgColor: 'bg-slate-50', textColor: 'text-slate-500', borderColor: 'border-slate-200' },
  refunded: { label: 'Reembolsada', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-100' }
} as const

export default function SuperAdminBilling() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    currency: 'USD',
    features: '',
    is_active: true,
    sort_order: '0',
    color: '#7c3aed'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [plansRes, subsRes] = await Promise.all([
        superAdminApi.getPlans(),
        superAdminApi.getBillingSubscriptions()
      ])
      setPlans(plansRes.data.plans || [])
      setInvoices(subsRes.data.subscriptions || [])
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

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price_monthly: plan.price_monthly.toString(),
        price_yearly: plan.price_yearly.toString(),
        currency: plan.currency,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        is_active: plan.is_active,
        sort_order: plan.sort_order.toString(),
        color: plan.color || '#7c3aed'
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        price_monthly: '',
        price_yearly: '',
        currency: 'USD',
        features: '',
        is_active: true,
        sort_order: '0',
        color: '#7c3aed'
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        sort_order: parseInt(formData.sort_order),
        features: formData.features.split('\n').filter(f => f.trim())
      }

      if (editingPlan) {
        await superAdminApi.updatePlan(editingPlan.id, data)
        toast({ title: 'Éxito', description: 'Plan actualizado correctamente', variant: 'success' })
      } else {
        await superAdminApi.createPlan(data)
        toast({ title: 'Éxito', description: 'Plan creado correctamente', variant: 'success' })
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo guardar el plan',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return

    try {
      await superAdminApi.deletePlan(plan.id)
      toast({ title: 'Éxito', description: 'Plan eliminado correctamente', variant: 'success' })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar el plan',
        variant: 'destructive'
      })
    }
  }

  const copyTransactionId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: 'Copiado', description: 'ID de transacción copiado al portapapeles' })
  }

  // Calculate stats
  const totalMRR = plans.reduce((acc, plan) => acc + (plan.price_monthly * (plan.tenant_count || 0)), 0)
  const activePlans = plans.filter(p => p.is_active).length
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((acc, inv) => acc + inv.amount, 0)

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => 
    inv.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Planes y Facturación</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona planes de suscripción y pagos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">MRR Estimado</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalMRR)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-violet-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-violet-700">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Pendiente de Cobro</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Planes Activos</p>
                <p className="text-2xl font-bold text-slate-700">{activePlans}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-slate-200 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="plans" 
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Package className="w-4 h-4 mr-2" />
            Planes de Suscripción
          </TabsTrigger>
          <TabsTrigger 
            value="invoices"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Historial de Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-slate-800">Planes Disponibles</h2>
            <Button onClick={() => handleOpenDialog()} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plan
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              <p className="mt-4 text-slate-500">Cargando planes...</p>
            </div>
          ) : plans.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hay planes registrados</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={cn(
                  "border transition-all duration-200",
                  plan.is_active ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: plan.color + '20' }}
                        >
                          <Package className="w-5 h-5" style={{ color: plan.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <p className="text-sm text-slate-400">{plan.slug}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(plan)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(plan)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                    
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-slate-800">
                        {formatCurrency(plan.price_monthly, plan.currency)}
                      </span>
                      <span className="text-slate-400">/mes</span>
                    </div>

                    <div className="text-sm text-slate-400 mb-4">
                      {formatCurrency(plan.price_yearly, plan.currency)}/año
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <ul className="text-sm text-slate-600 space-y-1">
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 4 && (
                            <li className="text-slate-400 text-sm">
                              +{plan.features.length - 4} más...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{plan.tenant_count || 0} clientes</span>
                      </div>
                      {plan.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 border">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-6 space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por empresa o ID de transacción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button variant="outline" className="border-slate-200">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Registro de todas las transacciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No hay facturas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">ID Transacción</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Empresa</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Plan</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Monto</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Método</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Estado</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => {
                        const statusConfig_item = statusConfig[invoice.status]
                        const paymentConfig = paymentMethodConfig[invoice.payment_method]
                        const PaymentIcon = paymentConfig?.icon || Wallet
                        
                        return (
                          <tr key={invoice.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                                  {invoice.transaction_id.slice(0, 20)}...
                                </code>
                                <button 
                                  onClick={() => copyTransactionId(invoice.transaction_id)}
                                  className="text-slate-400 hover:text-violet-600 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">{invoice.tenant_name}</td>
                            <td className="py-3.5 px-4">
                              <Badge variant="outline" className="bg-slate-50 border-slate-200">
                                {invoice.plan_name}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit", paymentConfig?.bgColor)}>
                                <PaymentIcon className={cn("w-3.5 h-3.5", paymentConfig?.color)} />
                                <span className={cn("text-xs font-medium", paymentConfig?.color)}>
                                  {paymentConfig?.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge 
                                variant="outline" 
                                className={cn("font-medium", statusConfig_item.bgColor, statusConfig_item.textColor, statusConfig_item.borderColor)}
                              >
                                {statusConfig_item.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-sm text-slate-500">
                              {formatDate(invoice.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Modifica los detalles del plan de suscripción' : 'Crea un nuevo plan para ofrecer a los clientes'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Plan Pro"
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
                  disabled={!!editingPlan}
                  placeholder="plan-pro"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Describe las características principales del plan..."
                className="bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Precio Mensual *</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Precio Anual *</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Características (una por línea)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={4}
                placeholder="Hasta 3 usuarios&#10;500 clientes&#10;Soporte por email&#10;Reportes avanzados"
                className="bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-violet-600"
                />
                <Label htmlFor="is_active">Plan activo</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="color">Color:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-24 text-xs"
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
                {isSubmitting ? 'Guardando...' : editingPlan ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
