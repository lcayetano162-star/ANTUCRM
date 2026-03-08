import { useEffect, useState, lazy, Suspense } from 'react'
import { 
  Plus, Search, FileText, Send, CheckCircle, XCircle, 
  Trash2, Eye, Download, Calculator, Package, RefreshCw,
  ArrowLeft, Edit3, Printer, Mail, Settings, Loader2, ShoppingBag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { quotesApi, clientsApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load MPS components
const MPSCalculator = lazy(() => import('@/components/mps/MPSCalculator'))
const MPSApprovalPanel = lazy(() => import('@/components/mps/MPSApprovalPanel'))
const CotizadorGral = lazy(() => import('@/components/quotes/CotizadorGral'))

interface QuoteItem {
  id?: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  is_recurring: boolean
  total_price?: number
}

interface Quote {
  id: string
  quote_number: string
  client_id: string
  client_name: string
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_monthly: number
  total_onetime: number
  total: number
  valid_until: string
  notes: string
  created_at: string
  items?: QuoteItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw }
}

export default function Quotes() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail' | 'mps-calculator' | 'mps-approvals' | 'cotizador-gral'>('list')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    valid_until: '',
    notes: '',
    items: [] as QuoteItem[]
  })

  useEffect(() => {
    loadQuotes()
    loadClients()
  }, [statusFilter])

  const loadQuotes = async () => {
    try {
      setIsLoading(true)
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await quotesApi.getAll(params)
      setQuotes(response.data.data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar las cotizaciones',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await clientsApi.getAll()
      setClients(response.data.data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleViewDetail = async (quote: Quote) => {
    try {
      const response = await quotesApi.getById(quote.id)
      setSelectedQuote(response.data.quote)
      setViewMode('detail')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle de la cotización',
        variant: 'destructive'
      })
    }
  }

  const handleStatusChange = async (quote: Quote, newStatus: string) => {
    try {
      await quotesApi.updateStatus(quote.id, newStatus)
      toast({
        title: 'Éxito',
        description: `Cotización ${STATUS_CONFIG[newStatus].label.toLowerCase()} correctamente`,
        variant: 'success'
      })
      loadQuotes()
      if (selectedQuote) {
        setSelectedQuote({ ...selectedQuote, status: newStatus })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo actualizar el estado',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (quote: Quote) => {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return
    
    try {
      await quotesApi.delete(quote.id)
      toast({
        title: 'Éxito',
        description: 'Cotización eliminada correctamente',
        variant: 'success'
      })
      loadQuotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar',
        variant: 'destructive'
      })
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        is_recurring: false
      }]
    })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalculate total
    const item = newItems[index]
    const quantity = item.quantity || 1
    const unitPrice = item.unit_price || 0
    const discount = item.discount_percent || 0
    item.total_price = quantity * unit_price * (1 - discount / 100)
    
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalMonthly = 0
    let totalOnetime = 0

    formData.items.forEach(item => {
      const quantity = item.quantity || 1
      const unitPrice = item.unit_price || 0
      const discount = item.discount_percent || 0
      const total = quantity * unitPrice * (1 - discount / 100)
      
      subtotal += total
      
      if (item.is_recurring) {
        totalMonthly += total
      } else {
        totalOnetime += total
      }
    })

    const taxRate = 18
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    return { subtotal, taxAmount, total, totalMonthly, totalOnetime }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un item',
        variant: 'destructive'
      })
      return
    }

    try {
      await quotesApi.create(formData)
      toast({
        title: 'Éxito',
        description: 'Cotización creada correctamente',
        variant: 'success'
      })
      setViewMode('list')
      setFormData({ client_id: '', valid_until: '', notes: '', items: [] })
      loadQuotes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear la cotización',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totals = calculateTotals()

  // Vista de Detalle
  if (viewMode === 'detail' && selectedQuote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedQuote.quote_number}</h1>
              <p className="text-gray-500">Cotización para {selectedQuote.client_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Enviar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>Cambiar Estado</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <DropdownMenuItem 
                    key={key}
                    onClick={() => handleStatusChange(selectedQuote, key)}
                    disabled={selectedQuote.status === key}
                  >
                    <config.icon className="w-4 h-4 mr-2" />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items de la Cotización</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Producto/Servicio</th>
                      <th className="text-center py-2">Cant.</th>
                      <th className="text-right py-2">Precio</th>
                      <th className="text-right py-2">Desc.</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-center py-2">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-3">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right">{item.discount_percent}%</td>
                        <td className="text-right font-medium">{formatCurrency(item.total_price)}</td>
                        <td className="text-center">
                          <Badge variant={item.is_recurring ? 'default' : 'secondary'}>
                            {item.is_recurring ? 'Recurrente' : 'Único'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {selectedQuote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedQuote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ITBIS ({selectedQuote.tax_rate}%)</span>
                  <span>{formatCurrency(selectedQuote.tax_amount)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedQuote.total)}</span>
                  </div>
                </div>
                
                {selectedQuote.total_monthly > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Desglose:</p>
                    <div className="flex justify-between text-sm">
                      <span>Mensual recurrente:</span>
                      <span className="font-medium">{formatCurrency(selectedQuote.total_monthly)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pago único:</span>
                      <span className="font-medium">{formatCurrency(selectedQuote.total_onetime)}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Válida hasta:</span>
                    <span>{selectedQuote.valid_until ? formatDate(selectedQuote.valid_until) : 'Sin fecha'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Estado:</span>
                    {getStatusBadge(selectedQuote.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Vista de Crear Cotización
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select 
                      value={formData.client_id} 
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Válida hasta</Label>
                    <Input 
                      type="date" 
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea 
                    placeholder="Notas adicionales para el cliente..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items</CardTitle>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay items agregados</p>
                    <Button type="button" onClick={addItem} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar primer item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Item #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Producto/Servicio *</Label>
                            <Input 
                              value={item.product_name}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              placeholder="Ej: Licencia CRM Premium"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input 
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Detalles del producto..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Precio Unitario</Label>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descuento %</Label>
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total</Label>
                            <div className="h-10 flex items-center font-medium">
                              {formatCurrency((item.quantity || 1) * (item.unit_price || 0) * (1 - (item.discount_percent || 0) / 100))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={item.is_recurring}
                            onCheckedChange={(checked) => updateItem(index, 'is_recurring', checked)}
                          />
                          <Label className="cursor-pointer">Pago recurrente mensual</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ITBIS (18%)</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
                
                {totals.totalMonthly > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Desglose:</p>
                    <div className="flex justify-between text-sm">
                      <span>Mensual recurrente:</span>
                      <span className="font-medium">{formatCurrency(totals.totalMonthly)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pago único:</span>
                      <span className="font-medium">{formatCurrency(totals.totalOnetime)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={formData.items.length === 0 || !formData.client_id}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Crear Cotización
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    )
  }

  // Vista del Cotizador MPS
  if (viewMode === 'mps-calculator') {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }>
        <MPSCalculator
          opportunityId={selectedOpportunity?.id}
          opportunityName={selectedOpportunity?.name}
          onBack={() => {
            setViewMode('list')
            setSelectedOpportunity(null)
          }}
          onQuoteGenerated={(quoteData) => {
            toast({
              title: 'Cotización MPS Generada',
              description: 'La cotización ha sido guardada exitosamente',
              variant: 'success'
            })
            setViewMode('list')
            setSelectedOpportunity(null)
            loadQuotes()
          }}
        />
      </Suspense>
    )
  }

  // Vista de Aprobaciones MPS (solo para gerentes)
  if (viewMode === 'mps-approvals') {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }>
        <MPSApprovalPanel />
      </Suspense>
    )
  }

  // Vista del Cotizador General
  if (viewMode === 'cotizador-gral') {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }>
        <CotizadorGral onBack={() => setViewMode('list')} />
      </Suspense>
    )
  }

  // Vista de Lista
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Cotizaciones')}</h1>
          <p className="text-gray-500">{t('Gestiona tus presupuestos y propuestas comerciales')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setViewMode('cotizador-gral')} 
            variant="outline"
            className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Cotizador Gral
          </Button>
          <Button 
            onClick={() => setViewMode('mps-calculator')} 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {t('Cotizador MPS')}
          </Button>
          {isManager && (
            <Button 
              onClick={() => setViewMode('mps-approvals')} 
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t('Aprobaciones MPS')}
            </Button>
          )}
          <Button onClick={() => setViewMode('create')} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('Nueva Cotización')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Total Cotizaciones')}</p>
            <p className="text-2xl font-bold">{quotes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Pendientes')}</p>
            <p className="text-2xl font-bold text-blue-600">
              {quotes.filter(q => q.status === 'draft' || q.status === 'sent').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Aceptadas')}</p>
            <p className="text-2xl font-bold text-green-600">
              {quotes.filter(q => q.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Valor Total')}</p>
            <p className="text-2xl font-bold">
              {formatCurrency(quotes.reduce((sum, q) => sum + (q.total || 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar cotizaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{t('Todas')}</TabsTrigger>
            <TabsTrigger value="draft">{t('Borradores')}</TabsTrigger>
            <TabsTrigger value="sent">{t('Enviadas')}</TabsTrigger>
            <TabsTrigger value="accepted">{t('Aceptadas')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay cotizaciones registradas</p>
              <Button onClick={() => setViewMode('create')} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Crear primera cotización
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t('Número')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t('Cliente')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t('Estado')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t('Total')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t('Válida hasta')}</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">{t('Acciones')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{quote.quote_number}</td>
                      <td className="py-3 px-4 text-gray-500">{quote.client_name || '-'}</td>
                      <td className="py-3 px-4">{getStatusBadge(quote.status)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{formatCurrency(quote.total)}</p>
                          {quote.total_monthly > 0 && (
                            <p className="text-xs text-gray-500">
                              {formatCurrency(quote.total_monthly)}/mes
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(quote)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Send className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'sent')}>
                                <Send className="w-4 h-4 mr-2" />
                                Marcar como Enviada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'accepted')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Marcar como Aceptada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote, 'rejected')}>
                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                Marcar como Rechazada
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(quote)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
