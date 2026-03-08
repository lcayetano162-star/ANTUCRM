import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Package, Users, Puzzle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { superAdminApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
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
}

export default function SuperAdminPlans() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    limits: { max_users: 5 } as Record<string, any>
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const response = await superAdminApi.getPlans()
      setPlans(response.data.plans || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los planes',
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
        limits: plan.limits && typeof plan.limits === 'object' ? plan.limits : { max_users: 5 }
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
        limits: { max_users: 5 }
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
        toast({
          title: 'Éxito',
          description: 'Plan actualizado correctamente',
          variant: 'success'
        })
      } else {
        await superAdminApi.createPlan(data)
        toast({
          title: 'Éxito',
          description: 'Plan creado correctamente',
          variant: 'success'
        })
      }

      setIsDialogOpen(false)
      loadPlans()
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
    if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) {
      return
    }

    try {
      await superAdminApi.deletePlan(plan.id)
      toast({
        title: 'Éxito',
        description: 'Plan eliminado correctamente',
        variant: 'success'
      })
      loadPlans()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar el plan',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h1>
          <p className="text-gray-500">Gestiona los planes disponibles para los tenants</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando planes...</p>
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No hay planes registrados</p>
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Crear primer plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-500">{plan.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(plan)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(plan)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold">
                    {formatCurrency(plan.price_monthly, plan.currency)}
                  </span>
                  <span className="text-gray-500">/mes</span>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  {formatCurrency(plan.price_yearly, plan.currency)}/año
                </div>

                {/* Limits */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-2 bg-slate-50 rounded-lg">
                  <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span>
                    {plan.limits?.max_users != null
                      ? `Hasta ${plan.limits.max_users} usuario${plan.limits.max_users !== 1 ? 's' : ''}`
                      : 'Usuarios ilimitados'}
                  </span>
                </div>

                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Características:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-gray-400">+{plan.features.length - 3} más...</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  {plan.is_active ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Precio Mensual *</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  required
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Características (una por línea)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={3}
                placeholder="500 contactos&#10;Soporte por email&#10;Reportes avanzados"
              />
            </div>

            {/* Limits */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-500" />
                Límites del Plan
              </p>
              <div className="flex items-center gap-3">
                <Label htmlFor="max_users" className="w-36 text-sm shrink-0">Máximo de usuarios</Label>
                <Input
                  id="max_users"
                  type="number"
                  min={1}
                  value={formData.limits.max_users ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    limits: { ...formData.limits, max_users: e.target.value === '' ? null : parseInt(e.target.value) }
                  })}
                  placeholder="Ej: 5"
                  className="w-28 bg-white"
                />
                <span className="text-xs text-slate-400">Dejar vacío = ilimitado</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="sort_order">Orden:</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-20"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingPlan ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
