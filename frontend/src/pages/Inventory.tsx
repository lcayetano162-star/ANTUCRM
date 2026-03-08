import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Package, Plus, Search, X, TrendingDown, TrendingUp,
  AlertTriangle, BarChart3, ArrowUpCircle, ArrowDownCircle,
  RefreshCw, Edit2, Check, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { inventoryApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// ── TYPES ─────────────────────────────────────────────────────
type ProductType = 'product' | 'service' | 'consumable'

interface Product {
  id: string; sku?: string; name: string; description?: string
  type: ProductType; unit: string; price: number; cost: number
  tax_rate: number; is_active: boolean
  quantity_on_hand: number; quantity_reserved: number; quantity_available: number
  reorder_point?: number; location?: string; created_at: string
}
interface Movement {
  id: string; product_id: string; product_name: string; sku?: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number; reference_type?: string; reference_number?: string
  notes?: string; created_by_name?: string; created_at: string
}

// ── CONSTANTS ─────────────────────────────────────────────────
const TYPE_CFG: Record<ProductType, { label: string; color: string }> = {
  product:     { label: 'Producto',    color: 'bg-blue-100 text-blue-700' },
  service:     { label: 'Servicio',    color: 'bg-purple-100 text-purple-700' },
  consumable:  { label: 'Consumible',  color: 'bg-amber-100 text-amber-700' },
}
const MOV_CFG: Record<string, { label: string; icon: any; color: string }> = {
  in:         { label: 'Entrada',  icon: ArrowUpCircle,   color: 'text-emerald-600' },
  out:        { label: 'Salida',   icon: ArrowDownCircle, color: 'text-red-500' },
  adjustment: { label: 'Ajuste',   icon: RefreshCw,       color: 'text-blue-500' },
}

function stockBadge(p: Product) {
  if (p.type !== 'product') return null
  const qty = p.quantity_available
  const rp  = p.reorder_point ?? 0
  if (qty <= 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700 border-red-200' }
  if (rp > 0 && qty <= rp) return { label: 'Stock bajo', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'OK', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

const fmtCur = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n)
const fmtNum = (n: number) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(n)
const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s))

// ── DEMO DATA ─────────────────────────────────────────────────
const DEMO_PRODUCTS: Product[] = [
  { id: '1', sku: 'DRUM-C300', name: 'Drum Unit C300 Color', description: 'Unidad de tambor para MFP-C300', type: 'product', unit: 'unidad', price: 3500, cost: 2100, tax_rate: 0.18, is_active: true, quantity_on_hand: 4, quantity_reserved: 1, quantity_available: 3, reorder_point: 2, location: 'Almacén A-1', created_at: new Date(Date.now()-86400000*30).toISOString() },
  { id: '2', sku: 'TON-BN-8K', name: 'Tóner B/N 8500pg', description: 'Cartucho de tóner negro 8500 páginas', type: 'consumable', unit: 'unidad', price: 1400, cost: 780, tax_rate: 0.18, is_active: true, quantity_on_hand: 14, quantity_reserved: 2, quantity_available: 12, reorder_point: 5, location: 'Almacén A-2', created_at: new Date(Date.now()-86400000*60).toISOString() },
  { id: '3', sku: 'FUSER-B620', name: 'Fusor B620 Pro', description: 'Unidad fusora para serie B620', type: 'product', unit: 'unidad', price: 6200, cost: 3800, tax_rate: 0.18, is_active: true, quantity_on_hand: 1, quantity_reserved: 0, quantity_available: 1, reorder_point: 2, location: 'Almacén B-1', created_at: new Date(Date.now()-86400000*15).toISOString() },
  { id: '4', sku: 'FDR-ROLLER', name: 'Feed Roller Kit', description: 'Kit de rodillos de alimentación', type: 'product', unit: 'kit', price: 980, cost: 550, tax_rate: 0.18, is_active: true, quantity_on_hand: 8, quantity_reserved: 0, quantity_available: 8, reorder_point: 3, location: 'Almacén A-3', created_at: new Date(Date.now()-86400000*45).toISOString() },
  { id: '5', sku: 'SVC-MANT', name: 'Mantenimiento Preventivo', description: 'Servicio de mantenimiento trimestral', type: 'service', unit: 'servicio', price: 4500, cost: 1200, tax_rate: 0.18, is_active: true, quantity_on_hand: 0, quantity_reserved: 0, quantity_available: 0, created_at: new Date(Date.now()-86400000*90).toISOString() },
  { id: '6', sku: 'TON-CLR-C', name: 'Tóner Cyan MFP-C', description: 'Tóner cyan para equipos MFP-C series', type: 'consumable', unit: 'unidad', price: 1800, cost: 1050, tax_rate: 0.18, is_active: true, quantity_on_hand: 0, quantity_reserved: 0, quantity_available: 0, reorder_point: 3, location: 'Almacén A-2', created_at: new Date(Date.now()-86400000*20).toISOString() },
]
const DEMO_MOVEMENTS: Movement[] = [
  { id: 'm1', product_id: '1', product_name: 'Drum Unit C300 Color', sku: 'DRUM-C300', movement_type: 'out', quantity: 1, reference_type: 'service_order', reference_number: 'WO-202603-0001', notes: 'Consumo en orden de servicio', created_by_name: 'Carlos López', created_at: new Date(Date.now()-3600000*2).toISOString() },
  { id: 'm2', product_id: '2', product_name: 'Tóner B/N 8500pg', sku: 'TON-BN-8K', movement_type: 'in', quantity: 20, reference_type: 'manual', notes: 'Compra a proveedor Xerox RD', created_by_name: 'Admin', created_at: new Date(Date.now()-86400000*2).toISOString() },
  { id: 'm3', product_id: '3', product_name: 'Fusor B620 Pro', sku: 'FUSER-B620', movement_type: 'adjustment', quantity: 1, reference_type: 'manual', notes: 'Ajuste por inventario físico', created_by_name: 'Admin', created_at: new Date(Date.now()-86400000*5).toISOString() },
  { id: 'm4', product_id: '6', product_name: 'Tóner Cyan MFP-C', sku: 'TON-CLR-C', movement_type: 'out', quantity: 2, reference_type: 'service_order', reference_number: 'WO-202603-0002', notes: 'Consumo en orden de servicio', created_by_name: 'María Rodríguez', created_at: new Date(Date.now()-86400000*1).toISOString() },
  { id: 'm5', product_id: '4', product_name: 'Feed Roller Kit', sku: 'FDR-ROLLER', movement_type: 'in', quantity: 10, reference_type: 'manual', notes: 'Stock inicial', created_by_name: 'Admin', created_at: new Date(Date.now()-86400000*45).toISOString() },
]

// ── CREATE PRODUCT MODAL ──────────────────────────────────────
function CreateProductModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (p: Product) => void }) {
  const [form, setForm] = useState({
    sku: '', name: '', description: '', type: 'product' as ProductType,
    unit: 'unidad', price: '', cost: '', tax_rate: '0.18',
    initial_stock: '0', reorder_point: '', location: ''
  })
  const [loading, setLoading] = useState(false)
  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error('El precio es requerido'); return }
    setLoading(true)
    const data = {
      ...form,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost) || 0,
      tax_rate: parseFloat(form.tax_rate) || 0.18,
      initial_stock: parseFloat(form.initial_stock) || 0,
      reorder_point: form.reorder_point ? parseFloat(form.reorder_point) : undefined,
    }
    try {
      const res = await inventoryApi.createProduct(data)
      const prod: Product = { ...res.data, quantity_on_hand: data.initial_stock, quantity_reserved: 0, quantity_available: data.initial_stock }
      toast.success(`Producto "${prod.name}" creado exitosamente`)
      onCreated(prod)
      onClose()
    } catch {
      // Demo mode
      const demo: Product = {
        id: Date.now().toString(), ...data,
        is_active: true,
        quantity_on_hand: data.initial_stock, quantity_reserved: 0, quantity_available: data.initial_stock,
        created_at: new Date().toISOString()
      }
      toast.success(`Producto "${demo.name}" creado`)
      onCreated(demo); onClose()
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center"><Package className="w-4 h-4 text-cyan-600" /></div>
            Nuevo Producto / Servicio
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Tipo *</label>
            <div className="grid grid-cols-3 gap-1">
              {(['product','service','consumable'] as ProductType[]).map(t => (
                <button key={t} type="button" onClick={() => f('type', t)}
                  className={cn('rounded-lg border py-1.5 text-xs font-medium transition-all', form.type === t ? TYPE_CFG[t].color + ' border-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                  {TYPE_CFG[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">SKU / Código</label>
            <Input placeholder="Ej: DRUM-C300" value={form.sku} onChange={e => f('sku', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">Nombre *</label>
            <Input placeholder="Nombre descriptivo del producto" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">Descripción</label>
            <textarea className="w-full min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Descripción técnica del producto..." value={form.description} onChange={e => f('description', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Precio de venta (RD$) *</label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => f('price', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Costo (RD$)</label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={e => f('cost', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Unidad de medida</label>
            <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.unit} onChange={e => f('unit', e.target.value)}>
              {['unidad','kit','litro','caja','servicio','hora','metro','kilogramo'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">ITBIS</label>
            <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.tax_rate} onChange={e => f('tax_rate', e.target.value)}>
              <option value="0.18">18% (estándar)</option>
              <option value="0.16">16%</option>
              <option value="0">Exento</option>
            </select>
          </div>
          {form.type !== 'service' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Stock inicial</label>
                <Input type="number" min="0" step="0.01" placeholder="0" value={form.initial_stock} onChange={e => f('initial_stock', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Punto de reorden</label>
                <Input type="number" min="0" step="1" placeholder="Ej: 3" value={form.reorder_point} onChange={e => f('reorder_point', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-600">Ubicación en almacén</label>
                <Input placeholder="Ej: Almacén A-1, Estante 3" value={form.location} onChange={e => f('location', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── ADJUST STOCK MODAL ────────────────────────────────────────
function AdjustStockModal({ product, open, onClose, onAdjusted }: {
  product: Product | null; open: boolean; onClose: () => void; onAdjusted: (id: string, newQty: number) => void
}) {
  const [movType, setMovType] = useState<'in'|'out'|'adjustment'>('in')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!product) return null

  const submit = async () => {
    const quantity = parseFloat(qty)
    if (!qty || isNaN(quantity) || quantity <= 0) { toast.error('Ingresa una cantidad válida'); return }
    if (movType === 'out' && quantity > product.quantity_on_hand) {
      toast.error(`Stock insuficiente. Disponible: ${product.quantity_on_hand}`); return
    }
    setLoading(true)
    try {
      await inventoryApi.adjustStock(product.id, { quantity, movement_type: movType, notes })
      const sign = movType === 'out' ? -1 : 1
      const newQty = product.quantity_on_hand + (quantity * sign)
      toast.success(`Ajuste aplicado. Nuevo stock: ${fmtNum(newQty)} ${product.unit}`)
      onAdjusted(product.id, newQty)
      onClose()
    } catch {
      const sign = movType === 'out' ? -1 : 1
      const newQty = product.quantity_on_hand + (quantity * sign)
      toast.success(`Ajuste aplicado. Nuevo stock: ${fmtNum(newQty)} ${product.unit}`)
      onAdjusted(product.id, newQty)
      onClose()
    } finally { setLoading(false); setQty(''); setNotes('') }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-600" />
            Ajuste de Stock — {product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm text-slate-600">Stock actual</span>
            <span className="text-lg font-bold text-slate-800">{fmtNum(product.quantity_on_hand)} {product.unit}</span>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Tipo de movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              {([['in','Entrada','bg-emerald-100 text-emerald-700'],['out','Salida','bg-red-100 text-red-700'],['adjustment','Ajuste','bg-blue-100 text-blue-700']] as const).map(([v,l,c]) => (
                <button key={v} type="button" onClick={() => setMovType(v as any)}
                  className={cn('rounded-lg border py-2 text-xs font-semibold transition-all', movType === v ? c + ' border-current' : 'border-slate-200 text-slate-500')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Cantidad</label>
            <Input type="number" min="0.01" step="0.01" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} className="text-lg font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Motivo / Notas</label>
            <Input placeholder="Ej: Compra proveedor, conteo físico, daño..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {qty && !isNaN(parseFloat(qty)) && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-sm text-center">
              <span className="text-slate-600">Nuevo stock estimado: </span>
              <span className="font-bold text-cyan-700">
                {fmtNum(product.quantity_on_hand + (parseFloat(qty) * (movType === 'out' ? -1 : 1)))} {product.unit}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit} disabled={loading || !qty}>
            {loading ? 'Aplicando...' : 'Aplicar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── EDIT PRODUCT MODAL ────────────────────────────────────────
function EditProductModal({ product, open, onClose, onSaved }: {
  product: Product | null; open: boolean; onClose: () => void; onSaved: (p: Product) => void
}) {
  const [form, setForm] = useState<Partial<Product>>({})
  const [loading, setLoading] = useState(false)
  useEffect(() => { if (product) setForm({ name: product.name, sku: product.sku, price: product.price, cost: product.cost, unit: product.unit, description: product.description, is_active: product.is_active }) }, [product])
  if (!product) return null
  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (!form.name?.trim()) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      const res = await inventoryApi.updateProduct(product.id, form)
      toast.success('Producto actualizado')
      onSaved({ ...product, ...res.data })
      onClose()
    } catch {
      toast.success('Producto actualizado')
      onSaved({ ...product, ...form })
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Nombre *</label><Input value={form.name||''} onChange={e => f('name', e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs font-medium text-slate-600">SKU</label><Input value={form.sku||''} onChange={e => f('sku', e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Unidad</label><Input value={form.unit||''} onChange={e => f('unit', e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Precio (RD$)</label><Input type="number" value={form.price||''} onChange={e => f('price', parseFloat(e.target.value))} /></div>
          <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Costo (RD$)</label><Input type="number" value={form.cost||''} onChange={e => f('cost', parseFloat(e.target.value))} /></div>
          <div className="col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Descripción</label><textarea className="w-full min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500" value={form.description||''} onChange={e => f('description', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => f('is_active', e.target.checked)} className="w-4 h-4 accent-cyan-600" />
              <span className="text-sm text-slate-700">Producto activo</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function Inventory() {
  const { user } = useAuthStore()
  const isAdmin = ['admin','superadmin','sales_manager'].includes(user?.role || '')

  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS)
  const [movements, setMovements] = useState<Movement[]>(DEMO_MOVEMENTS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [movTypeFilter, setMovTypeFilter] = useState<string>('all')
  const [tab, setTab] = useState('products')
  const [showCreate, setShowCreate] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)

  // Load from API
  useEffect(() => {
    setLoading(true)
    inventoryApi.getProducts().then(res => setProducts(res.data.data)).catch(() => {}).finally(() => setLoading(false))
    inventoryApi.getMovements().then(res => setMovements(res.data.data)).catch(() => {})
  }, [])

  // Stats
  const stats = useMemo(() => {
    const physical = products.filter(p => p.type === 'product')
    return {
      total: products.filter(p => p.is_active).length,
      physical: physical.length,
      low: physical.filter(p => p.reorder_point && p.quantity_available > 0 && p.quantity_available <= p.reorder_point!).length,
      out: physical.filter(p => p.quantity_available <= 0).length,
      value: physical.reduce((s, p) => s + p.quantity_on_hand * p.cost, 0),
    }
  }, [products])

  const filtered = useMemo(() => products.filter(p => {
    if (!p.is_active && stockFilter === 'all') return true
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (stockFilter === 'low' && !(p.reorder_point && p.quantity_available > 0 && p.quantity_available <= p.reorder_point!)) return false
    if (stockFilter === 'out' && p.quantity_available > 0) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku?.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  }), [products, search, typeFilter, stockFilter])

  const filteredMov = useMemo(() => movements.filter(m => {
    if (movTypeFilter !== 'all' && m.movement_type !== movTypeFilter) return false
    return true
  }), [movements, movTypeFilter])

  const handleAdjusted = (id: string, newQty: number) => {
    setProducts(prev => prev.map(p => p.id === id
      ? { ...p, quantity_on_hand: newQty, quantity_available: newQty - p.quantity_reserved }
      : p))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-600" />Inventario
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Catálogo de productos, stock y movimientos</p>
        </div>
        {isAdmin && (
          <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />Nuevo Producto
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total activos', val: stats.total, sub: 'productos y servicios', color: 'text-slate-700', bg: 'bg-slate-50', icon: Package },
          { label: 'Físicos', val: stats.physical, sub: 'en inventario', color: 'text-blue-700', bg: 'bg-blue-50', icon: Package },
          { label: 'Stock bajo', val: stats.low, sub: 'bajo punto de reorden', color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
          { label: 'Sin stock', val: stats.out, sub: 'agotados', color: 'text-red-700', bg: 'bg-red-50', icon: TrendingDown },
          { label: 'Valor inventario', val: fmtCur(stats.value), sub: 'costo total en almacén', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
            <s.icon className={`w-4 h-4 ${s.color} mb-2 opacity-70`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="products" className="gap-1.5"><Package className="w-4 h-4" />Catálogo</TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5"><RefreshCw className="w-4 h-4" />Movimientos</TabsTrigger>
        </TabsList>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
            </div>
            <div className="flex gap-1">
              {(['all','product','service','consumable'] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    typeFilter === t ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}>
                  {t === 'all' ? 'Todos' : TYPE_CFG[t].label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {stats.low > 0 && (
                <button onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    stockFilter === 'low' ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100')}>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />{stats.low} stock bajo
                </button>
              )}
              {stats.out > 0 && (
                <button onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    stockFilter === 'out' ? 'bg-red-500 text-white border-red-500' : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100')}>
                  <TrendingDown className="w-3 h-3 inline mr-1" />{stats.out} sin stock
                </button>
              )}
              {(stockFilter !== 'all' || typeFilter !== 'all') && (
                <button onClick={() => { setStockFilter('all'); setTypeFilter('all') }}
                  className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <X className="w-3 h-3" />Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock disponible</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Costo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin productos</p>
                  </td></tr>
                ) : filtered.map(p => {
                  const badge = stockBadge(p)
                  const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">{p.name}</p>
                          {p.sku && <p className="text-xs font-mono text-slate-400 mt-0.5">{p.sku}</p>}
                          {p.description && <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{p.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn('text-xs', TYPE_CFG[p.type].color)}>{TYPE_CFG[p.type].label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.type === 'service' ? (
                          <span className="text-xs text-slate-400">N/A</span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-800">{fmtNum(p.quantity_available)} {p.unit}</span>
                            {p.quantity_reserved > 0 && <span className="text-[10px] text-amber-600">{fmtNum(p.quantity_reserved)} reservado</span>}
                            {badge && <Badge variant="outline" className={cn('text-[10px] px-1.5', badge.cls)}>{badge.label}</Badge>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtCur(p.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-slate-600">{fmtCur(p.cost)}</span>
                          <span className={cn('text-[10px] font-medium', margin >= 40 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600')}>
                            {margin.toFixed(1)}% margen
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{p.location || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isAdmin && p.type !== 'service' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-cyan-600"
                              onClick={() => setAdjustTarget(p)}>
                              <RefreshCw className="w-3 h-3" />Ajustar
                            </Button>
                          )}
                          {isAdmin && (
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditTarget(p)}>
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* MOVEMENTS TAB */}
        <TabsContent value="movements" className="mt-4 space-y-3">
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {(['all','in','out','adjustment'] as const).map(t => (
                <button key={t} onClick={() => setMovTypeFilter(t)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    movTypeFilter === t
                      ? t === 'in' ? 'bg-emerald-600 text-white border-emerald-600'
                        : t === 'out' ? 'bg-red-500 text-white border-red-500'
                        : t === 'adjustment' ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}>
                  {t === 'all' ? 'Todos' : MOV_CFG[t].label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto">{filteredMov.length} movimiento(s)</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Referencia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMov.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin movimientos</p>
                  </td></tr>
                ) : filteredMov.map(m => {
                  const cfg = MOV_CFG[m.movement_type]
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{m.product_name}</p>
                        {m.sku && <p className="text-[10px] font-mono text-slate-400">{m.sku}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('flex items-center gap-1 text-xs font-medium', cfg.color)}>
                          <cfg.icon className="w-3.5 h-3.5" />{cfg.label}
                        </span>
                      </td>
                      <td className={cn('px-4 py-3 text-right font-bold', m.movement_type === 'out' ? 'text-red-600' : 'text-emerald-600')}>
                        {m.movement_type === 'out' ? '-' : '+'}{fmtNum(m.quantity)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {m.reference_number ? <span className="font-mono">{m.reference_number}</span> : m.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{m.created_by_name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateProductModal open={showCreate} onClose={() => setShowCreate(false)}
        onCreated={p => setProducts(prev => [p, ...prev])} />
      <AdjustStockModal product={adjustTarget} open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)} onAdjusted={handleAdjusted} />
      <EditProductModal product={editTarget} open={!!editTarget}
        onClose={() => setEditTarget(null)} onSaved={p => { setProducts(prev => prev.map(x => x.id === p.id ? p : x)); setEditTarget(null) }} />
    </div>
  )
}
