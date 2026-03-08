import { useState, useMemo } from 'react'
import { 
  Plus, Search, Edit2, Trash2, Package, 
  TrendingUp, Users, Star, Download, 
  FileText, Calculator, ArrowLeft, CheckCircle,
  Filter, Copy, Eye, ShoppingCart, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

// Tipos de precios disponibles
type PriceLevel = 'lista' | 'estrategico' | 'especial'

interface ProductItem {
  id: string
  code: string
  name: string
  description: string
  category: string
  prices: {
    lista: number
    estrategico: number
    especial: number
  }
  cost: number
  stock: number
  isActive: boolean
  createdAt: string
}

interface QuoteItem extends ProductItem {
  quantity: number
  selectedPriceLevel: PriceLevel
  discount: number
}

interface ProductFormData {
  code: string
  name: string
  description: string
  category: string
  prices: {
    lista: number
    estrategico: number
    especial: number
  }
  cost: number
  stock: number
  isActive: boolean
}

const CATEGORIES = [
  'Software',
  'Hardware', 
  'Servicios',
  'Consultoría',
  'Soporte',
  'Licencias',
  'Otros'
]

const PRICE_LEVEL_CONFIG: Record<PriceLevel, { label: string; color: string; badge: string; description: string }> = {
  lista: { 
    label: 'Precio de Lista', 
    color: 'text-blue-600', 
    badge: 'bg-blue-100 text-blue-800',
    description: 'Precio estándar para todos los clientes'
  },
  estrategico: { 
    label: 'Precio Estratégico', 
    color: 'text-amber-600', 
    badge: 'bg-amber-100 text-amber-800',
    description: 'Precio para clientes estratégicos y volumen'
  },
  especial: { 
    label: 'Precio Especial', 
    color: 'text-emerald-600', 
    badge: 'bg-emerald-100 text-emerald-800',
    description: 'Precio negociado para casos específicos'
  }
}

// Datos de ejemplo
const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: '1',
    code: 'CRM-BAS-001',
    name: 'Licencia CRM Básica',
    description: 'Acceso a funcionalidades esenciales de gestión de clientes',
    category: 'Software',
    prices: { lista: 99, estrategico: 79, especial: 69 },
    cost: 40,
    stock: 999,
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    code: 'CRM-PRO-002',
    name: 'Licencia CRM Profesional',
    description: 'Funcionalidades avanzadas con automatización y reportes',
    category: 'Software',
    prices: { lista: 199, estrategico: 159, especial: 139 },
    cost: 80,
    stock: 999,
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    code: 'CRM-ENT-003',
    name: 'Licencia CRM Enterprise',
    description: 'Solución completa con API, integraciones y soporte prioritario',
    category: 'Software',
    prices: { lista: 499, estrategico: 399, especial: 349 },
    cost: 200,
    stock: 999,
    isActive: true,
    createdAt: '2024-01-20'
  },
  {
    id: '4',
    code: 'SUP-BAS-001',
    name: 'Soporte Técnico Básico',
    description: 'Soporte por email con respuesta en 24-48 horas',
    category: 'Soporte',
    prices: { lista: 49, estrategico: 39, especial: 35 },
    cost: 20,
    stock: 999,
    isActive: true,
    createdAt: '2024-02-01'
  },
  {
    id: '5',
    code: 'SUP-PRE-002',
    name: 'Soporte Premium',
    description: 'Soporte 24/7 con respuesta en 2 horas y gestor dedicado',
    category: 'Soporte',
    prices: { lista: 149, estrategico: 119, especial: 99 },
    cost: 60,
    stock: 999,
    isActive: true,
    createdAt: '2024-02-01'
  },
  {
    id: '6',
    code: 'CON-IMP-001',
    name: 'Consultoría Implementación',
    description: 'Servicio de implementación y configuración inicial del CRM',
    category: 'Consultoría',
    prices: { lista: 1200, estrategico: 950, especial: 850 },
    cost: 500,
    stock: 50,
    isActive: true,
    createdAt: '2024-02-10'
  },
  {
    id: '7',
    code: 'CON-CAP-002',
    name: 'Capacitación Equipo',
    description: 'Capacitación presencial o virtual para hasta 10 usuarios',
    category: 'Consultoría',
    prices: { lista: 800, estrategico: 650, especial: 550 },
    cost: 300,
    stock: 30,
    isActive: true,
    createdAt: '2024-02-15'
  },
  {
    id: '8',
    code: 'INT-ZAP-001',
    name: 'Integración Zapier',
    description: 'Conexión con Zapier para automatización de flujos',
    category: 'Servicios',
    prices: { lista: 199, estrategico: 159, especial: 139 },
    cost: 80,
    stock: 999,
    isActive: true,
    createdAt: '2024-03-01'
  }
]

interface CotizadorGralProps {
  onBack?: () => void
}

export default function CotizadorGral({ onBack }: CotizadorGralProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin'
  
  // Estados
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'catalog' | 'quote'>('catalog')
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<PriceLevel>('lista')
  
  // Estados para modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isQuotePreviewOpen, setIsQuotePreviewOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    description: '',
    category: 'Software',
    prices: { lista: 0, estrategico: 0, especial: 0 },
    cost: 0,
    stock: 0,
    isActive: true
  })

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      return matchesSearch && matchesCategory && product.isActive
    })
  }, [products, searchQuery, categoryFilter])

  // Calcular totales de cotización
  const quoteTotals = useMemo(() => {
    const subtotal = quoteItems.reduce((sum, item) => {
      const price = item.prices[item.selectedPriceLevel]
      const discountedPrice = price * (1 - item.discount / 100)
      return sum + (discountedPrice * item.quantity)
    }, 0)
    const taxRate = 0.18
    const tax = subtotal * taxRate
    const total = subtotal + tax
    return { subtotal, tax, total }
  }, [quoteItems])

  // Calcular margen de ganancia
  const profitMargin = useMemo(() => {
    const totalCost = quoteItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0)
    const margin = quoteTotals.subtotal > 0 ? ((quoteTotals.subtotal - totalCost) / quoteTotals.subtotal) * 100 : 0
    return { totalCost, margin }
  }, [quoteItems, quoteTotals.subtotal])

  // Handlers
  const handleOpenProductModal = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description,
        category: product.category,
        prices: { ...product.prices },
        cost: product.cost,
        stock: product.stock,
        isActive: product.isActive
      })
    } else {
      setEditingProduct(null)
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'Software',
        prices: { lista: 0, estrategico: 0, especial: 0 },
        cost: 0,
        stock: 0,
        isActive: true
      })
    }
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = () => {
    if (!formData.code || !formData.name) {
      toast({
        title: 'Error',
        description: 'Código y nombre son obligatorios',
        variant: 'destructive'
      })
      return
    }

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...formData }
          : p
      ))
      toast({
        title: 'Éxito',
        description: 'Producto actualizado correctamente',
        variant: 'success'
      })
    } else {
      const newProduct: ProductItem = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setProducts([...products, newProduct])
      toast({
        title: 'Éxito',
        description: 'Producto creado correctamente',
        variant: 'success'
      })
    }
    setIsProductModalOpen(false)
  }

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    setProducts(products.map(p => 
      p.id === productId ? { ...p, isActive: false } : p
    ))
    toast({
      title: 'Éxito',
      description: 'Producto eliminado correctamente',
      variant: 'success'
    })
  }

  const handleAddToQuote = (product: ProductItem) => {
    const existingItem = quoteItems.find(item => item.id === product.id)
    if (existingItem) {
      setQuoteItems(quoteItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setQuoteItems([...quoteItems, {
        ...product,
        quantity: 1,
        selectedPriceLevel: selectedPriceLevel,
        discount: 0
      }])
    }
    toast({
      title: 'Agregado',
      description: `${product.name} agregado a la cotización`,
      variant: 'success'
    })
  }

  const handleRemoveFromQuote = (productId: string) => {
    setQuoteItems(quoteItems.filter(item => item.id !== productId))
  }

  const handleUpdateQuoteItem = (productId: string, field: keyof QuoteItem, value: any) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === productId ? { ...item, [field]: value } : item
    ))
  }

  const handleClearQuote = () => {
    if (quoteItems.length > 0 && confirm('¿Limpiar todos los items de la cotización?')) {
      setQuoteItems([])
    }
  }

  const handleDuplicateQuote = () => {
    toast({
      title: 'Cotización duplicada',
      description: 'Se ha creado una copia de la cotización actual',
      variant: 'success'
    })
  }

  const handleExportQuote = () => {
    toast({
      title: 'Exportando',
      description: 'La cotización se está generando en PDF...',
      variant: 'success'
    })
  }

  // Vista del catálogo de productos
  const renderCatalog = () => (
    <div className="space-y-6">
      {/* Header del catálogo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Catálogo de Productos</h2>
            <p className="text-gray-500 text-sm">{filteredProducts.length} productos disponibles</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isManagerOrAdmin && (
            <Button 
              onClick={() => handleOpenProductModal()} 
              variant="outline"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          )}
          <Button 
            onClick={() => setActiveTab('quote')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ver Cotización ({quoteItems.length})
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por código, nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isManagerOrAdmin && (
          <Select value={selectedPriceLevel} onValueChange={(v) => setSelectedPriceLevel(v as PriceLevel)}>
            <SelectTrigger className="w-full sm:w-56">
              <TrendingUp className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Nivel de precio" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_LEVEL_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    {config.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{product.code}</p>
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  </div>
                </div>
                {isManagerOrAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenProductModal(product)}
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
              
              {/* Precios */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${PRICE_LEVEL_CONFIG[selectedPriceLevel].color}`}>
                    {PRICE_LEVEL_CONFIG[selectedPriceLevel].label}
                  </span>
                  <span className={`text-lg font-bold ${PRICE_LEVEL_CONFIG[selectedPriceLevel].color}`}>
                    {formatCurrency(product.prices[selectedPriceLevel])}
                  </span>
                </div>
                {isManagerOrAdmin && (
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>L: {formatCurrency(product.prices.lista)}</span>
                    <span>•</span>
                    <span>E: {formatCurrency(product.prices.estrategico)}</span>
                    <span>•</span>
                    <span>ESP: {formatCurrency(product.prices.especial)}</span>
                  </div>
                )}
              </div>

              {/* Margen (solo gerentes/admin) */}
              {isManagerOrAdmin && (
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-gray-500">Costo: {formatCurrency(product.cost)}</span>
                  <Badge variant="outline" className="text-xs">
                    Margen: {Math.round(((product.prices[selectedPriceLevel] - product.cost) / product.prices[selectedPriceLevel]) * 100)}%
                  </Badge>
                </div>
              )}

              <Button 
                onClick={() => handleAddToQuote(product)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar a Cotización
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
          <p className="text-gray-400 text-sm">Intenta con otra búsqueda o crea un nuevo producto</p>
        </div>
      )}
    </div>
  )

  // Vista de la cotización
  const renderQuote = () => (
    <div className="space-y-6">
      {/* Header de cotización */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setActiveTab('catalog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Seguir Agregando
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cotización en Progreso</h2>
            <p className="text-gray-500 text-sm">{quoteItems.length} items • {formatCurrency(quoteTotals.total)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClearQuote}
            disabled={quoteItems.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDuplicateQuote}
            disabled={quoteItems.length === 0}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsQuotePreviewOpen(true)}
            disabled={quoteItems.length === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button 
            onClick={handleExportQuote}
            disabled={quoteItems.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items de cotización */}
        <div className="lg:col-span-2 space-y-4">
          {quoteItems.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">Tu cotización está vacía</p>
                <p className="text-gray-400 text-sm mb-4">Agrega productos desde el catálogo</p>
                <Button onClick={() => setActiveTab('catalog')} variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            quoteItems.map((item, index) => (
              <Card key={item.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-cyan-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.code}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveFromQuote(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuoteItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        
                        {isManagerOrAdmin ? (
                          <div>
                            <Label className="text-xs text-gray-500">Nivel de Precio</Label>
                            <Select 
                              value={item.selectedPriceLevel} 
                              onValueChange={(v) => handleUpdateQuoteItem(item.id, 'selectedPriceLevel', v)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PRICE_LEVEL_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-xs text-gray-500">Precio</Label>
                            <div className="h-10 flex items-center font-medium text-gray-900">
                              {formatCurrency(item.prices.lista)}
                            </div>
                          </div>
                        )}
                        
                        {isManagerOrAdmin && (
                          <div>
                            <Label className="text-xs text-gray-500">Descuento %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => handleUpdateQuoteItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-xs text-gray-500">Total</Label>
                          <div className="h-10 flex items-center font-bold text-gray-900">
                            {formatCurrency(
                              item.prices[item.selectedPriceLevel] * 
                              item.quantity * 
                              (1 - item.discount / 100)
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={PRICE_LEVEL_CONFIG[item.selectedPriceLevel].badge}>
                          {PRICE_LEVEL_CONFIG[item.selectedPriceLevel].label}
                        </Badge>
                        {item.discount > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            -{item.discount}% descuento
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Resumen */}
        <div>
          <Card className="sticky top-6 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-cyan-600" />
                Resumen de Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(quoteTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ITBIS (18%)</span>
                  <span className="font-medium">{formatCurrency(quoteTotals.tax)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-cyan-600">{formatCurrency(quoteTotals.total)}</span>
                  </div>
                </div>
              </div>

              {isManagerOrAdmin && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Análisis de Margen
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Costo Total</span>
                    <span>{formatCurrency(profitMargin.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ganancia Estimada</span>
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(quoteTotals.subtotal - profitMargin.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Margen</span>
                    <Badge className={profitMargin.margin >= 30 ? 'bg-emerald-100 text-emerald-800' : profitMargin.margin >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>
                      {profitMargin.margin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  disabled={quoteItems.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Guardar Cotización
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={quoteItems.length === 0}
                  onClick={() => setIsQuotePreviewOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips para el vendedor */}
          <Card className="mt-4 border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">Consejo del día</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Ofrece el Precio Estratégico a clientes con potencial de compra recurrente 
                    o volumen alto. El Precio Especial está reservado para casos de negociación directa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            Cotizador General
          </h1>
          <p className="text-gray-500 mt-1">
            Catálogo de productos con múltiples niveles de precios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Users className="w-3 h-3 mr-1" />
            {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Usuario'}
          </Badge>
          {isManagerOrAdmin && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Control de Precios
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'catalog' | 'quote')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Catálogo
            <Badge variant="secondary" className="ml-1 text-xs">{filteredProducts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="quote" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cotización
            {quoteItems.length > 0 && (
              <Badge className="ml-1 text-xs bg-cyan-600">{quoteItems.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Contenido */}
      {activeTab === 'catalog' ? renderCatalog() : renderQuote()}

      {/* Modal de Producto */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: CRM-PRO-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto o servicio"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada del producto..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-600" />
                Niveles de Precio
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-blue-600">Precio de Lista</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prices.lista}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      prices: { ...formData.prices, lista: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-amber-600">Precio Estratégico</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prices.estrategico}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      prices: { ...formData.prices, estrategico: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-600">Precio Especial</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prices.especial}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      prices: { ...formData.prices, especial: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Costo (para cálculo de margen)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock Disponible</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label className="cursor-pointer">Producto activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProduct}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista Previa */}
      <Dialog open={isQuotePreviewOpen} onOpenChange={setIsQuotePreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vista Previa de Cotización
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Encabezado */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">COT-2024-001</h3>
                <p className="text-gray-500">Fecha: {new Date().toLocaleDateString('es-DO')}</p>
                <p className="text-gray-500">Válida hasta: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">Antü CRM</p>
              </div>
            </div>

            {/* Items */}
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Item</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-500">Cant.</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Precio</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, idx) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.code}</p>
                      <Badge className={`text-xs mt-1 ${PRICE_LEVEL_CONFIG[item.selectedPriceLevel].badge}`}>
                        {PRICE_LEVEL_CONFIG[item.selectedPriceLevel].label}
                      </Badge>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">
                      {formatCurrency(item.prices[item.selectedPriceLevel])}
                      {item.discount > 0 && (
                        <p className="text-xs text-amber-600">-{item.discount}%</p>
                      )}
                    </td>
                    <td className="text-right font-medium">
                      {formatCurrency(
                        item.prices[item.selectedPriceLevel] * item.quantity * (1 - item.discount / 100)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(quoteTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ITBIS (18%)</span>
                  <span>{formatCurrency(quoteTotals.tax)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-cyan-600">{formatCurrency(quoteTotals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Términos y Condiciones</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Precios sujetos a cambio sin previo aviso</li>
                <li>• Validez de la cotización: 30 días</li>
                <li>• Forma de pago: 50% anticipo, 50% contra entrega</li>
                <li>• Tiempo de entrega: Según disponibilidad</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotePreviewOpen(false)}>
              Cerrar
            </Button>
            <Button 
              onClick={handleExportQuote}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
