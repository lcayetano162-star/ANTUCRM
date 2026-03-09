// ============================================
// ANTU CRM - Módulo de Inventario con IA
// Control inteligente de stock y almacén
// Integración con Oportunidades y Cotizaciones
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  DollarSign,
  BarChart3,
  History,
  Truck,
  Edit2,
  MoreVertical,
  Sparkles,
  Brain,
  ChevronRight,
  Archive,
  Trash2,
  ClipboardList,
  CheckSquare,
  Check,
  ChevronsUpDown,
  Printer,
  LayoutGrid,
  List
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type ProductStatus = 'active' | 'inactive' | 'discontinued';
type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer' | 'reservation' | 'release';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  listPrice: number;
  // Multi-level & Printing Costs
  printingCosts?: {
    bwCostPerPage: number;
    colorCostPerPage: number;
    recommendedClickRateBw: number;
    recommendedClickRateColor: number;
  };
  priceTiers?: {
    distributor: number;
    wholesale: number;
  };
  type?: string;
  status: ProductStatus;
  images?: string[];
  // Stock
  stock: {
    physical: number;
    reserved: number;
    available: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
  };
  location: {
    warehouse: string;
    zone: string;
    shelf: string;
  };
  // AI Insights
  aiForecast?: {
    daysUntilStockout: number;
    suggestedOrderQty: number;
    confidence: number;
    factors: string[];
  };
  lastUpdated: Date;
}

interface InventoryMovement {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost?: number;
  totalCost?: number;
  sourceType: string;
  sourceId?: string;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: Date;
}

export type LogisticsStatus = 'PENDING_PREP' | 'READY_DISPATCH' | 'INVOICED';

export interface InventoryOrder {
  id: string;
  originName: string;
  opportunityId: string;
  salesperson: string;
  requestDate: Date;
  status: LogisticsStatus;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    availableBeforeAlloc: number;
  }[];
}

// ============================================
// MOCK DATA - PRODUCTS
// ============================================

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: 'HP-664-N',
    name: 'Tinta HP 664 Negro Original',
    description: 'Cartucho de tinta negra HP 664 para impresoras DeskJet',
    category: 'Consumibles > Tinta > HP',
    brand: 'HP',
    unit: 'unidad',
    costPrice: 450,
    salePrice: 890,
    listPrice: 950,
    priceTiers: {
      distributor: 700,
      wholesale: 790,
    },
    type: 'ink',
    status: 'active',
    stock: {
      physical: 15,
      reserved: 12,
      available: 3,
      minStock: 10,
      maxStock: 50,
      reorderPoint: 15,
    },
    location: {
      warehouse: 'Almacén Principal',
      zone: 'A',
      shelf: 'A-12',
    },
    aiForecast: {
      daysUntilStockout: 12,
      suggestedOrderQty: 30,
      confidence: 87,
      factors: ['Temporada escolar', 'Tendencia creciente +15%', 'Lead time proveedor +3 días'],
    },
    lastUpdated: new Date(2026, 1, 25),
  },
  {
    id: 'p2',
    sku: 'CAN-LBP-6030',
    name: 'Toner Canon LBP-6030',
    description: 'Toner compatible Canon imageCLASS LBP6030',
    category: 'Consumibles > Toner > Canon',
    brand: 'Canon',
    unit: 'unidad',
    costPrice: 1200,
    salePrice: 2100,
    listPrice: 2300,
    type: 'toner-bn',
    status: 'active',
    stock: {
      physical: 45,
      reserved: 8,
      available: 37,
      minStock: 20,
      maxStock: 100,
      reorderPoint: 30,
    },
    location: {
      warehouse: 'Almacén Principal',
      zone: 'A',
      shelf: 'A-15',
    },
    lastUpdated: new Date(2026, 1, 28),
  },
  {
    id: 'p3',
    sku: 'PA-A4-500',
    name: 'Papel Bond A4 500 hojas',
    description: 'Resma de papel bond tamaño carta, 500 hojas',
    category: 'Papelería > Papel > Bond',
    brand: 'MultiMarca',
    unit: 'resma',
    costPrice: 180,
    salePrice: 320,
    listPrice: 350,
    status: 'active',
    stock: {
      physical: 150,
      reserved: 50,
      available: 100,
      minStock: 200,
      maxStock: 1000,
      reorderPoint: 250,
    },
    location: {
      warehouse: 'Almacén Principal',
      zone: 'B',
      shelf: 'B-05',
    },
    aiForecast: {
      daysUntilStockout: 28,
      suggestedOrderQty: 500,
      confidence: 82,
      factors: ['Demanda estable', 'Lead time 5 días'],
    },
    lastUpdated: new Date(2026, 1, 27),
  },
  {
    id: 'p4',
    sku: 'HP-LJP-M404',
    name: 'Impresora HP LaserJet Pro M404',
    description: 'Impresora láser monocromática profesional',
    category: 'Equipos > Impresoras > Láser',
    brand: 'HP',
    unit: 'unidad',
    costPrice: 18500,
    salePrice: 26000,
    listPrice: 28900,
    priceTiers: {
      distributor: 21000,
      wholesale: 23500,
    },
    printingCosts: {
      bwCostPerPage: 0.15,
      colorCostPerPage: 0.85,
      recommendedClickRateBw: 0.50,
      recommendedClickRateColor: 2.50,
    },
    type: 'printer-bn',
    status: 'active',
    stock: {
      physical: 8,
      reserved: 3,
      available: 5,
      minStock: 5,
      maxStock: 20,
      reorderPoint: 8,
    },
    location: {
      warehouse: 'Almacén Principal',
      zone: 'C',
      shelf: 'C-01',
    },
    aiForecast: {
      daysUntilStockout: 18,
      suggestedOrderQty: 15,
      confidence: 91,
      factors: ['Alta demanda Q1', 'Campaña marketing activa'],
    },
    lastUpdated: new Date(2026, 1, 26),
  },
  {
    id: 'p5',
    sku: 'CLIPS-33MM',
    name: 'Clips para papel 33mm (caja 100)',
    description: 'Clips metálicos para papel, caja de 100 unidades',
    category: 'Papelería > Clips y Grapas',
    brand: 'Genérico',
    unit: 'caja',
    costPrice: 45,
    salePrice: 85,
    listPrice: 95,
    status: 'active',
    stock: {
      physical: 500,
      reserved: 0,
      available: 500,
      minStock: 100,
      maxStock: 1000,
      reorderPoint: 150,
    },
    location: {
      warehouse: 'Almacén Principal',
      zone: 'D',
      shelf: 'D-20',
    },
    lastUpdated: new Date(2026, 1, 20),
  },
];

const MOCK_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'm1',
    type: 'reservation',
    productId: 'p1',
    productName: 'Tinta HP 664 Negro',
    productSku: 'HP-664-N',
    quantity: -5,
    stockBefore: 15,
    stockAfter: 10,
    sourceType: 'OPPORTUNITY',
    sourceId: 'opp-1234',
    userId: 'u1',
    userName: 'Juan Pérez',
    notes: 'Reserva para oportunidad "Renovación Equipos"',
    createdAt: new Date(2026, 1, 28, 10, 30),
  },
  {
    id: 'm2',
    type: 'entry',
    productId: 'p1',
    productName: 'Tinta HP 664 Negro',
    productSku: 'HP-664-N',
    quantity: 20,
    stockBefore: 15,
    stockAfter: 35,
    unitCost: 450,
    totalCost: 9000,
    sourceType: 'PURCHASE_ORDER',
    sourceId: 'OC-056',
    userId: 'u3',
    userName: 'Carlos López',
    notes: 'Entrada completa OC-056, Distribuidora Central',
    createdAt: new Date(2026, 1, 25, 14, 0),
  },
  {
    id: 'm3',
    type: 'exit',
    productId: 'p1',
    productName: 'Tinta HP 664 Negro',
    productSku: 'HP-664-N',
    quantity: -3,
    stockBefore: 18,
    stockAfter: 15,
    unitCost: 450,
    totalCost: 1350,
    sourceType: 'SALE',
    sourceId: 'FAC-889',
    userId: 'u1',
    userName: 'Juan Pérez',
    notes: 'Venta a Soluciones Gráficas SRL',
    createdAt: new Date(2026, 1, 20, 11, 15),
  },
  {
    id: 'm4',
    type: 'adjustment',
    productId: 'p1',
    productName: 'Tinta HP 664 Negro',
    productSku: 'HP-664-N',
    quantity: -2,
    stockBefore: 20,
    stockAfter: 18,
    sourceType: 'ADJUSTMENT',
    sourceId: 'AJ-012',
    userId: 'u4',
    userName: 'Ana Martínez',
    notes: 'Merma por vencimiento (fecha: 01/2026)',
    createdAt: new Date(2026, 1, 20, 9, 0),
  },
];

const MOCK_ORDERS: InventoryOrder[] = [
  {
    id: 'ORD-1001',
    originName: 'Soluciones Gráficas SRL - Renovación',
    opportunityId: 'opp-1234',
    salesperson: 'Juan Pérez',
    requestDate: new Date(2026, 2, 4, 10, 15),
    status: 'PENDING_PREP',
    items: [
      {
        productId: 'p4',
        productName: 'Impresora HP LaserJet Pro M404',
        sku: 'HP-LJP-M404',
        quantity: 2,
        unitPrice: 26000,
        availableBeforeAlloc: 5,
      },
      {
        productId: 'p1',
        productName: 'Tinta HP 664 Negro Original',
        sku: 'HP-664-N',
        quantity: 5,
        unitPrice: 890,
        availableBeforeAlloc: 15,
      }
    ]
  },
  {
    id: 'ORD-1002',
    originName: 'Estudio de Diseño Beta - Equipamiento',
    opportunityId: 'opp-1235',
    salesperson: 'Ana Martínez',
    requestDate: new Date(2026, 2, 3, 14, 20),
    status: 'INVOICED',
    items: [
      {
        productId: 'p3',
        productName: 'Papel Bond A4 500 hojas',
        sku: 'PA-A4-500',
        quantity: 10,
        unitPrice: 320,
        availableBeforeAlloc: 100,
      }
    ]
  }
];

// ============================================
// UTILS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ============================================
// AI INSIGHT BADGE
// ============================================

function AIInsightCard({ title, children, type = 'info' }: { title: string; children: React.ReactNode; type?: 'urgent' | 'warning' | 'info' | 'success' }) {
  const colors = {
    urgent: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  return (
    <div className={cn('p-4 rounded-lg border', colors[type])}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ============================================
// PRODUCT CARD
// ============================================

function ProductCard({ product, onClick, canEdit }: { product: Product; onClick: () => void; canEdit: boolean }) {
  const stockStatus = product.stock.available <= product.stock.minStock
    ? { label: 'Crítico', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle }
    : product.stock.available <= product.stock.reorderPoint
      ? { label: 'Bajo', color: 'bg-amber-100 text-amber-700', icon: TrendingUp }
      : { label: 'OK', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };

  const StatusIcon = stockStatus.icon;

  return (
    <Card
      className={cn(
        'border-slate-200 cursor-pointer hover:shadow-md transition-all',
        product.stock.available <= product.stock.minStock && 'border-rose-300'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-800 truncate">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku} | {product.brand}</p>
              </div>
              <Badge className={cn('text-xs', stockStatus.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {stockStatus.label}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Disponible:</span>
                <span className={cn(
                  'ml-1 font-medium',
                  product.stock.available <= product.stock.minStock ? 'text-rose-600' : 'text-slate-700'
                )}>
                  {product.stock.available} / {product.stock.minStock} min
                </span>
              </div>
              <div>
                <span className="text-slate-400">Reservado:</span>
                <span className="ml-1 font-medium text-slate-700">{product.stock.reserved}</span>
              </div>
            </div>

            {product.aiForecast && product.stock.available <= product.stock.reorderPoint && (
              <div className="mt-3 p-2 bg-violet-50 rounded border border-violet-200">
                <div className="flex items-center gap-1 text-violet-700 text-xs">
                  <Brain className="w-3 h-3" />
                  <span>Agotamiento en {product.aiForecast.daysUntilStockout} días</span>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Costo: {formatCurrency(product.costPrice)}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Venta: {formatCurrency(product.salePrice)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MOVEMENT FORM MODAL
// ============================================

function MovementModal({
  open,
  onOpenChange,
  type,
  product: initialProduct,
  products = [],
  preSelectedProductId = '',
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  product?: Product;
  products?: Product[];
  preSelectedProductId?: string;
  onConfirm?: (productId: string, quantity: number, type: MovementType) => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSelectedProductId(preSelectedProductId);
      setQuantity('');
    }
  }, [open, preSelectedProductId]);

  const product = initialProduct || products.find(p => p.id === selectedProductId);
  const isGlobal = !initialProduct;
  const titles: Record<MovementType, string> = {
    entry: 'Entrada de Inventario',
    exit: 'Salida de Inventario',
    adjustment: 'Ajuste de Stock',
    transfer: 'Transferencia',
    reservation: 'Reserva de Stock',
    release: 'Liberar Reserva',
  };

  const icons: Record<MovementType, React.ElementType> = {
    entry: ArrowDownLeft,
    exit: ArrowUpRight,
    adjustment: RefreshCw,
    transfer: Truck,
    reservation: Archive,
    release: CheckCircle2,
  };

  const Icon = icons[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>{titles[type]}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isGlobal && (
            <div className="space-y-2 mb-4">
              <Label>Seleccione Producto *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.sku} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {product ? (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">{product.name}</p>
              <p className="text-xs text-slate-500">{product.sku}</p>
              <p className="text-xs text-slate-500 mt-1">
                Stock actual: {product.stock.physical} | Disponible: {product.stock.available}
              </p>
            </div>
          ) : isGlobal && (
            <div className="p-3 bg-rose-50 rounded-lg text-rose-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Debe seleccionar un producto para continuar.</span>
            </div>
          )}

          {(!isGlobal || product) && type === 'entry' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo de entrada</Label>
                <Select defaultValue="purchase">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra a proveedor</SelectItem>
                    <SelectItem value="return">Devolución de cliente</SelectItem>
                    <SelectItem value="adjustment">Ajuste positivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orden de compra / Documento</Label>
                <Input placeholder="OC-2024-056" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Costo unitario</Label>
                  <Input type="number" placeholder="RD$ 0.00" />
                </div>
              </div>
            </div>
          )}

          {(!isGlobal || product) && type === 'exit' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo de salida</Label>
                <Select defaultValue="sale">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venta</SelectItem>
                    <SelectItem value="return_supplier">Devolución a proveedor</SelectItem>
                    <SelectItem value="merma">Merma</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Factura / Documento</Label>
                <Input placeholder="FAC-889" />
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            </div>
          )}

          {(!isGlobal || product) && type === 'adjustment' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Stock en sistema</Label>
                <Input value={product?.stock.physical} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Stock físico contado</Label>
                <Input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merma">Merma por vencimiento</SelectItem>
                    <SelectItem value="danio">Daño físico</SelectItem>
                    <SelectItem value="error">Error de conteo anterior</SelectItem>
                    <SelectItem value="robo">Pérdida / Robo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción detallada</Label>
                <Textarea placeholder="Explique el motivo del ajuste..." rows={3} />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Ajustes mayores a RD$ 5,000 requieren aprobación de Gerencia
                </p>
              </div>
            </div>
          )}

          {(!isGlobal || product) && type === 'transfer' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Almacén Origen</Label>
                <Input value={product?.location.warehouse} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Almacén Destino</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secundario">Almacén Secundario - Zona B</SelectItem>
                    <SelectItem value="tienda">Showroom Central</SelectItem>
                    <SelectItem value="transito">En Tránsito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad a transferir</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas adicionales</Label>
            <Textarea placeholder="Notas opcionales..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            disabled={(isGlobal && !product) || (type !== 'transfer' && !quantity)}
            onClick={() => {
              if (onConfirm && product) {
                onConfirm(product.id, Number(quantity) || 0, type);
              } else {
                toast.success(`${titles[type]} procesada correctamente`);
              }
              onOpenChange(false);
            }}
          >
            Confirmar {titles[type].split(' ')[0]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DASHBOARD VIEW
// ============================================

function DashboardView({
  products,
  canEdit,
  setActiveTab,
  onMovementConfirm
}: {
  products: Product[];
  canEdit: boolean;
  setActiveTab: (tab: string) => void;
  onMovementConfirm: (productId: string, quantity: number, type: MovementType) => void;
}) {
  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (p.stock.physical * p.costPrice), 0);
    const criticalStock = products.filter(p => p.stock.available <= p.stock.minStock).length;
    const totalReserved = products.reduce((acc, p) => acc + (p.stock.reserved * p.costPrice), 0);
    const reservedCount = products.filter(p => p.stock.reserved > 0).length;

    return { totalValue, criticalStock, totalReserved, reservedCount };
  }, [products]);

  const criticalProducts = products.filter(p => p.stock.available <= p.stock.minStock);
  const aiSuggestions = products.filter(p => p.aiForecast && p.stock.available <= p.stock.reorderPoint);

  const [globalMovementType, setGlobalMovementType] = useState<MovementType | null>(null);
  const [preSelectedProductId, setPreSelectedProductId] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {aiSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-500" />
            <h3 className="font-medium text-slate-800">Insights de IA</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalProducts.length > 0 && (
              <AIInsightCard title="Stock Crítico Detectado" type="urgent">
                <p className="mb-2">{criticalProducts.length} productos debajo del punto de reorden</p>
                <ul className="space-y-1 text-xs">
                  {criticalProducts.slice(0, 3).map(p => (
                    <li key={p.id}>• {p.name}: Stock {p.stock.available}, Reorden {p.stock.reorderPoint}</li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => toast.info('Generando órdenes de compra sugeridas por IA...')}
                >
                  Generar órdenes sugeridas
                </Button>
              </AIInsightCard>
            )}
            {aiSuggestions[0]?.aiForecast && (
              <AIInsightCard title="Predicción de Agotamiento" type="warning">
                <p className="mb-2">
                  <strong>{aiSuggestions[0].name}</strong> se agotará en{' '}
                  <strong>{aiSuggestions[0].aiForecast.daysUntilStockout} días</strong>
                </p>
                <p className="text-xs mb-2">Confianza: {aiSuggestions[0].aiForecast.confidence}%</p>
                <p className="text-xs mb-2">
                  Sugerido: {aiSuggestions[0].aiForecast.suggestedOrderQty} unidades
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Cargando análisis detallado de demanda...')}
                >
                  Ver análisis completo
                </Button>
              </AIInsightCard>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Valor Total Inventario</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-emerald-600 mt-1">↑ 5% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Productos Activos</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{products.length}</p>
            <p className="text-xs text-slate-400 mt-1">3 nuevos este mes</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Stock Crítico</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.criticalStock}</p>
            <p className="text-xs text-rose-500 mt-1">Acción requerida</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Reserva Pendiente</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.totalReserved)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.reservedCount} oportunidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => setActiveTab('products')}
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => { setPreSelectedProductId(''); setGlobalMovementType('entry'); }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Entrada Inventario
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => { setPreSelectedProductId(''); setGlobalMovementType('exit'); }}
          >
            <ArrowUpRight className="w-4 h-4" />
            Salida Inventario
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => { setPreSelectedProductId(''); setGlobalMovementType('adjustment'); }}
          >
            <RefreshCw className="w-4 h-4" />
            Ajuste Rápido
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => { setPreSelectedProductId(''); setGlobalMovementType('transfer'); }}
          >
            <Truck className="w-4 h-4" />
            Transferencia
          </Button>
        </div>
      )}

      {/* Critical Stock Alert */}
      {criticalProducts.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <CardTitle className="text-lg text-rose-800">Alertas de Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <p className="font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      Stock: {p.stock.available} | Mín: {p.stock.minStock}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setPreSelectedProductId(p.id); setGlobalMovementType('entry'); }}
                    >
                      Ordenar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Movement Modal */}
      <MovementModal
        open={!!globalMovementType}
        onOpenChange={(open) => {
          if (!open) {
            setGlobalMovementType(null);
            setPreSelectedProductId('');
          }
        }}
        type={globalMovementType || 'entry'}
        products={products}
        preSelectedProductId={preSelectedProductId}
        onConfirm={onMovementConfirm}
      />
    </div>
  );
}

// ============================================
// PRODUCTS LIST VIEW
// ============================================

function ProductsListView({
  products,
  onProductClick,
  canEdit,
}: {
  products: Product[];
  onProductClick: (product: Product) => void;
  canEdit: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== 'all' && !p.category.includes(categoryFilter)) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (stockFilter === 'critical' && p.stock.available > p.stock.minStock) return false;
      if (stockFilter === 'low' && (p.stock.available > p.stock.reorderPoint || p.stock.available <= p.stock.minStock)) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, typeFilter, stockFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200 shadow-sm overflow-visible">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-2 min-w-fit items-center">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 text-slate-600">
                    <Package className="w-3.5 h-3.5 mr-2 opacity-70" />
                    <SelectValue placeholder="Tipo Producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier Tipo</SelectItem>
                    {Array.from(new Set(PRODUCT_TYPES.map(t => t.category))).map(cat => (
                      <div key={cat}>
                        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">{cat}</div>
                        {PRODUCT_TYPES.filter(t => t.category === cat).map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 text-slate-600">
                    <Filter className="w-3.5 h-3.5 mr-2 opacity-70" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Consumibles">Consumibles</SelectItem>
                    <SelectItem value="Equipos">Equipos</SelectItem>
                    <SelectItem value="Papelería">Papelería</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[120px] h-10 bg-white border-slate-200 text-slate-600">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="low">Bajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end md:self-center">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("h-8 px-3 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm font-semibold text-indigo-600" : "text-slate-500 hover:text-slate-800")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Cuadrícula
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn("h-8 px-3 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm font-semibold text-indigo-600" : "text-slate-500 hover:text-slate-800")}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[400px]">Producto / SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock Físico</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="text-right">Precio Venta</TableHead>
                <TableHead className="text-right sr-only">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  onClick={() => onProductClick(product)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                        <Package className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500 font-mono uppercase">{product.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-slate-600 border-slate-200 bg-slate-50">
                      {product.category.split(' > ')[0]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {product.stock.physical}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn(
                        "font-bold",
                        product.stock.available <= product.stock.minStock ? "text-rose-600" :
                          product.stock.available <= product.stock.reorderPoint ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {product.stock.available}
                      </span>
                      {product.stock.available <= product.stock.minStock && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(product.salePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all inline ml-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-bold text-lg">No se encontraron coincidencias</p>
            <p className="text-slate-400 text-sm mt-1">Intente ajustar los filtros o el término de búsqueda</p>
            <Button
              variant="link"
              className="mt-4 text-indigo-600"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStockFilter('all');
              }}
            >
              Borrar todos los filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// PRODUCT DETAIL VIEW
// ============================================

function ProductDetailView({
  product,
  onBack,
  canEdit,
  onMovementConfirm,
}: {
  product: Product;
  onBack: () => void;
  canEdit: boolean;
  onMovementConfirm: (productId: string, quantity: number, type: MovementType) => void;
}) {
  // @ts-ignore - Variables used in Tabs component
  const [activeTab, setActiveTab] = useState('stock');
  const [movementType, setMovementType] = useState<MovementType | null>(null);

  const stockStatus = product.stock.available <= product.stock.minStock
    ? { label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-50' }
    : product.stock.available <= product.stock.reorderPoint
      ? { label: 'Bajo', color: 'text-amber-600', bg: 'bg-amber-50' }
      : { label: 'OK', color: 'text-emerald-600', bg: 'bg-emerald-50' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">{product.name}</h2>
            <Badge className={stockStatus.bg + ' ' + stockStatus.color}>
              {stockStatus.label}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{product.sku} | {product.category}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              onClick={() => toast.info(`Editando: ${product.name}`)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-200">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.success('Producto duplicado correctamente')}>
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  onClick={() => toast.error(`Eliminando: ${product.name}...`)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Stock Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Stock por Ubicación</CardTitle>
          </div>
          <CardDescription>
            {product.location.warehouse}, Zona {product.location.zone}, Estante {product.location.shelf}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{product.stock.physical}</p>
              <p className="text-sm text-slate-500">Stock físico</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{product.stock.reserved}</p>
              <p className="text-sm text-amber-600">Reservado</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">{product.stock.available}</p>
              <p className="text-sm text-emerald-600">Disponible</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-700">{product.stock.minStock}</p>
              <p className="text-sm text-slate-500">Stock mínimo</p>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setMovementType('entry')}>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Entrada
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMovementType('exit')}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Salida
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMovementType('adjustment')}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Ajuste
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200"
                onClick={() => setMovementType('transfer')}
              >
                <Truck className="w-4 h-4 mr-2" />
                Transferir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Forecast */}
      {product.aiForecast && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" />
              <CardTitle className="text-lg text-violet-800">Predicción de IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-violet-600">Agotamiento estimado</p>
                <p className="text-xl font-bold text-violet-800">
                  {product.aiForecast.daysUntilStockout} días
                </p>
              </div>
              <div>
                <p className="text-sm text-violet-600">Sugerido ordenar</p>
                <p className="text-xl font-bold text-violet-800">
                  {product.aiForecast.suggestedOrderQty} unidades
                </p>
              </div>
              <div>
                <p className="text-sm text-violet-600">Confianza</p>
                <p className="text-xl font-bold text-violet-800">
                  {product.aiForecast.confidence}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-violet-700 font-medium mb-2">Factores considerados:</p>
              <ul className="space-y-1">
                {product.aiForecast.factors.map((factor, i) => (
                  <li key={i} className="text-sm text-violet-600 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            {canEdit && (
              <Button
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => toast.success('Orden de compra sugerida generada y enviada a revisión')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generar orden de compra sugerida
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      {canEdit && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-500" />
              <CardTitle className="text-lg">Precios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Costo</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(product.costPrice)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600">Venta</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(product.salePrice)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Lista</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(product.listPrice)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Margen: {((product.salePrice - product.costPrice) / product.salePrice * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Movement History */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Historial de Movimientos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs uppercase">Fecha</TableHead>
                <TableHead className="text-xs uppercase">Tipo</TableHead>
                <TableHead className="text-xs uppercase">Cantidad</TableHead>
                <TableHead className="text-xs uppercase">Stock</TableHead>
                <TableHead className="text-xs uppercase">Origen</TableHead>
                <TableHead className="text-xs uppercase">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_MOVEMENTS.filter(m => m.productId === product.id).map(movement => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm">{formatDateTime(movement.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      movement.type === 'entry' && 'bg-emerald-50 text-emerald-600',
                      movement.type === 'exit' && 'bg-rose-50 text-rose-600',
                      movement.type === 'adjustment' && 'bg-amber-50 text-amber-600',
                      movement.type === 'reservation' && 'bg-sky-50 text-sky-600',
                    )}>
                      {movement.type === 'entry' && 'Entrada'}
                      {movement.type === 'exit' && 'Salida'}
                      {movement.type === 'adjustment' && 'Ajuste'}
                      {movement.type === 'reservation' && 'Reserva'}
                      {movement.type === 'release' && 'Liberación'}
                      {movement.type === 'transfer' && 'Transferencia'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    'text-sm font-medium',
                    movement.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {movement.stockBefore} → {movement.stockAfter}
                  </TableCell>
                  <TableCell className="text-sm">
                    {movement.sourceId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-slate-200">
                          {movement.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-600">{movement.userName}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <MovementModal
        open={!!movementType}
        onOpenChange={(open) => !open && setMovementType(null)}
        type={movementType || 'entry'}
        product={product}
        onConfirm={onMovementConfirm}
      />
    </div>
  );
}

// ============================================
// CONSTANTS & HELPERS
// ============================================

const PRODUCT_TYPES = [
  // Impresión
  { value: "mfp-color", label: "Multifuncional Color", category: "Impresión" },
  { value: "mfp-bn", label: "Multifuncional B/N", category: "Impresión" },
  { value: "printer-color", label: "Impresora Color", category: "Impresión" },
  { value: "printer-bn", label: "Impresora B/N", category: "Impresión" },
  { value: "plotter", label: "Plotter / Formato Ancho", category: "Impresión" },
  { value: "scanner", label: "Escáner Documental", category: "Impresión" },

  // Cómputo
  { value: "laptop", label: "Laptop Corporativa", category: "Cómputo" },
  { value: "desktop", label: "PC Desktop / Workstation", category: "Cómputo" },
  { value: "monitor", label: "Monitor Profesional", category: "Cómputo" },

  // Infraestructura & Networking
  { value: "server-rack", label: "Servidor Rack", category: "Infraestructura" },
  { value: "server-tower", label: "Servidor Torre", category: "Infraestructura" },
  { value: "nas", label: "Almacenamiento NAS/SAN", category: "Infraestructura" },
  { value: "switch", label: "Switch Gestionable", category: "Networking" },
  { value: "firewall", label: "Firewall / UTM", category: "Networking" },
  { value: "access-point", label: "Access Point Industrial", category: "Networking" },

  // Suministros
  { value: "toner-bn", label: "Toner B/N", category: "Suministros" },
  { value: "toner-color", label: "Toner Color (C/M/Y)", category: "Suministros" },
  { value: "drum", label: "Unidad de Imagen / Drum", category: "Suministros" },
  { value: "ink", label: "Botella de Tinta", category: "Suministros" },

  // Energía & Servicios
  { value: "ups-online", label: "UPS Online / Doble Conv.", category: "Energía" },
  { value: "ups-standby", label: "UPS Interactiva", category: "Energía" },
  { value: "license-sw", label: "Licenciamiento Software", category: "Software" },
  { value: "warranty", label: "Extensión de Garantía", category: "Servicios" },
  { value: "acc-dock", label: "Docking Station / Adaptador", category: "Accesorios" },
];

// ============================================
// CREATE PRODUCT MODAL
// ============================================

function CreateProductModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selectedType, setSelectedType] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1240px] p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">Crear Nuevo Producto</DialogTitle>
              <p className="text-sm text-slate-500 font-medium">Define los atributos e inventario inicial del SKU</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-h-[85vh] overflow-y-auto w-full bg-slate-50/50">

          {/* ----- COLUMNA 1: INF. PRINCIPAL (6/12) ----- */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-full">
              <h4 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                Información Principal
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Nombre del Producto *</Label>
                  <Input placeholder="Ej. Impresora HP LaserJet Pro M404" className="h-11 bg-slate-50 focus-visible:ring-indigo-500 font-medium text-sm" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider">Tipo de Producto / Categoría Maestro *</Label>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-full justify-between h-10 bg-slate-50 border-indigo-100 hover:bg-white hover:border-indigo-300 transition-all font-normal text-slate-600 text-xs"
                      >
                        {selectedType
                          ? PRODUCT_TYPES.find((t) => t.value === selectedType)?.label
                          : "Buscar tipo..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl border-indigo-100" align="start">
                      <Command className="border-0">
                        <CommandInput placeholder="Filtrar..." className="h-10" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No hay coincidencias.</CommandEmpty>
                          {Array.from(new Set(PRODUCT_TYPES.map(t => t.category))).map(cat => (
                            <CommandGroup key={cat} heading={cat} className="px-2">
                              {PRODUCT_TYPES.filter(t => t.category === cat).map((type) => (
                                <CommandItem
                                  key={type.value}
                                  value={type.label}
                                  onSelect={() => {
                                    setSelectedType(type.value);
                                    setTypeOpen(false);
                                  }}
                                  className="flex items-center justify-between py-2 rounded-md cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      cat === "Impresión" ? "bg-indigo-500" :
                                        cat === "Cómputo" ? "bg-blue-500" :
                                          cat === "Infraestructura" ? "bg-amber-500" :
                                            "bg-slate-400"
                                    )} />
                                    {type.label}
                                  </div>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 text-indigo-600 font-bold",
                                      selectedType === type.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-xs">SKU *</Label>
                    <Input placeholder="Código" className="bg-slate-50 focus-visible:ring-indigo-500 text-xs h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-xs">Marca</Label>
                    <Input placeholder="Ej. HP" className="bg-slate-50 focus-visible:ring-indigo-500 text-xs h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-xs">Categoría</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-50 focus:ring-indigo-500 text-xs h-9">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipos">Hardware</SelectItem>
                        <SelectItem value="consumibles">Insumos</SelectItem>
                        <SelectItem value="papeleria">Papelería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-xs">Unidad</Label>
                    <Select defaultValue="unidad">
                      <SelectTrigger className="bg-slate-50 focus:ring-indigo-500 text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Ud.</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-slate-800 font-semibold flex items-center gap-1 text-xs"><DollarSign className="w-3 h-3 text-emerald-600" /> Costo Base</Label>
                    <Input type="number" placeholder="RD$ 0.00" className="h-10 bg-emerald-50/30 border-emerald-200 focus-visible:ring-emerald-500 font-bold text-emerald-900 text-base" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 text-[10px] uppercase text-slate-400">Descripción</Label>
                  <Textarea placeholder="Especificaciones..." rows={2} className="bg-slate-50 resize-none focus-visible:ring-indigo-500 text-[11px]" />
                </div>
              </div>
            </div>
          </div>

          {/* ----- COLUMNA 2: ESTRATEGIA DE PRECIOS (3/12) ----- */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-5 h-fit">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-800">Niveles de Venta</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                  <Label className="text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Precio de Lista</Label>
                  <Input type="number" placeholder="0.00" className="h-12 border-emerald-300 font-bold focus-visible:ring-emerald-500 text-emerald-900 text-xl" />
                </div>

                <div className="space-y-3 pt-2 font-medium">
                  <div className="space-y-1">
                    <Label className="text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">Nivel 1 (Estratégico)</Label>
                    <Input type="number" placeholder="0.00" className="bg-white h-9 border-emerald-100 focus-visible:ring-emerald-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">Nivel 2 (Proyecto)</Label>
                    <Input type="number" placeholder="0.00" className="bg-white h-9 border-emerald-100 focus-visible:ring-emerald-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">Nivel 3 (Especial)</Label>
                    <Input type="number" placeholder="0.00" className="bg-white h-9 border-emerald-100 focus-visible:ring-emerald-500 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm space-y-4">
              <h4 className="font-semibold text-amber-800 border-b border-amber-100 pb-2 flex items-center gap-2 text-sm">
                <Archive className="w-4 h-4 text-amber-600" />
                Stock Almacén
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-amber-800 text-[10px] font-bold uppercase text-slate-500">Stock Inicial</Label>
                  <Input type="number" placeholder="0" className="bg-white h-10 border-amber-200 focus-visible:ring-amber-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-600 text-[10px] font-bold uppercase text-amber-600">Alerta Mín.</Label>
                  <Input type="number" placeholder="5" className="bg-white h-10 border-amber-200 focus-visible:ring-amber-500 font-bold text-amber-700" />
                </div>
              </div>
            </div>
          </div>

          {/* ----- COLUMNA 3: SERVICIOS Y MPS (3/12) ----- */}
          <div className="lg:col-span-3 space-y-6 h-full">
            <div className="bg-[#1E293B] p-5 rounded-2xl shadow-xl space-y-5 text-white h-full border border-slate-700 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 h-fit">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  Tarifa MPS
                </h4>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px]">Click MSRP</Badge>
              </div>

              <div className="space-y-5 flex-1 pt-2">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    <Label className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Costo B/N</Label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
                    <Input type="number" placeholder="0.15" className="bg-slate-950 border-slate-700 text-white h-10 pl-7 font-mono text-sm focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <Label className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Costo Color</Label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
                    <Input type="number" placeholder="0.85" className="bg-slate-950 border-slate-700 text-white h-10 pl-7 font-mono text-sm focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="mt-auto bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 leading-relaxed italic opacity-80">
                    Valores base para facturación recurrente de clicks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">* Campos obligatorios para registro inicial</p>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-slate-600 hover:bg-slate-100" onClick={() => onOpenChange(false)}>Cancelar Operación</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-8 shadow-md"
              onClick={() => {
                toast.success('Producto creado y añadido exitosamente al almacén');
                onOpenChange(false);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar en Maestro
            </Button>
          </div>
        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
}

// ============================================
// ORDERS AND RESERVATIONS VIEWS
// ============================================

function OrdersListView({
  orders,
  onOrderClick,
}: {
  orders: InventoryOrder[];
  onOrderClick: (order: InventoryOrder) => void;
}) {
  const getStatusBadge = (status: LogisticsStatus) => {
    switch (status) {
      case 'PENDING_PREP':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pendiente Preparación</Badge>;
      case 'READY_DISPATCH':
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200">Listo para Despacho</Badge>;
      case 'INVOICED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Facturado</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Pedidos y Reservas</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por ID u Origen..." className="pl-9 bg-white" />
        </div>
      </div>

      <Card className="border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-600">ID Pedido</TableHead>
              <TableHead className="font-semibold text-slate-600">Origen</TableHead>
              <TableHead className="font-semibold text-slate-600">Vendedor</TableHead>
              <TableHead className="font-semibold text-slate-600">Fecha Solicitud</TableHead>
              <TableHead className="font-semibold text-slate-600">Estado Logístico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <TableCell className="font-medium text-slate-800">{order.id}</TableCell>
                <TableCell className="text-slate-600">{order.originName}</TableCell>
                <TableCell className="text-slate-600">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                        {order.salesperson.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {order.salesperson}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{formatDateTime(order.requestDate)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No hay pedidos pendientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrderDetailView({
  order,
  onBack,
  canEdit,
}: {
  order: InventoryOrder;
  onBack: () => void;
  canEdit: boolean;
}) {
  const getStatusBadge = (status: LogisticsStatus) => {
    switch (status) {
      case 'PENDING_PREP':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-sm">Pendiente Preparación</Badge>;
      case 'READY_DISPATCH':
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 text-sm">Listo para Despacho</Badge>;
      case 'INVOICED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm">Facturado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Pedido {order.id}</h2>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-slate-500">Origen: {order.originName} | Solicitado el {formatDateTime(order.requestDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                Artículos a Separar (Soft Allocation)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Cant. Solicitada</TableHead>
                    <TableHead className="text-center">Disponibilidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => {
                    // Logic Simulation:
                    // Soft Allocation already happened when order was placed.
                    // The availableBeforeAlloc visually shows what we had.
                    // The current Available in DB is (availableBeforeAlloc - quantity).
                    // This UI helps warehouse know if there was stock issue.
                    const isSufficient = item.availableBeforeAlloc >= item.quantity;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{item.sku}</TableCell>
                        <TableCell className="text-center font-bold text-lg">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          {isSufficient ? (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-200">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Falta Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-500" />
                Gestión Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Vendedor Asignado</p>
                <p className="text-slate-800">{order.salesperson}</p>
              </div>

              {canEdit && (
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <Button
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm transition-colors"
                    onClick={() => {
                      toast.success('Pedido preparado enviado a facturación. A la espera de NCF.', { duration: 4000 });
                      onBack();
                    }}
                    disabled={order.status === 'INVOICED'}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Confirmar Preparación (A Facturación)
                  </Button>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide shadow-md transition-colors h-11"
                    onClick={() => {
                      toast.success('¡Salida completada! Reducción de Stock (Hard Deduction) ejecutada y Cuenta pasada a CxC.', { duration: 5000 });
                      onBack();
                    }}
                    disabled={order.status !== 'INVOICED'}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Generar Conduce y Despachar
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
                    * La salida física del equipo solo se habilita tras confirmarse la facturación (NCF).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN INVENTORY PAGE
// ============================================

export function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders] = useState<InventoryOrder[]>(MOCK_ORDERS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Determinar permisos basados en rol
  const userRole = user?.role as any;
  const canEdit = userRole === 'INVENTORY_MANAGER' || userRole === 'TENANT_ADMIN' || userRole === 'PLATFORM_ADMIN';
  const canViewHistory = canEdit;

  const handleMovementConfirm = (productId: string, quantity: number, type: MovementType) => {
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id !== productId) return p;
      let newPhysical = p.stock.physical;
      let newAvailable = p.stock.available;

      if (type === 'entry') {
        newPhysical += quantity;
        newAvailable += quantity;
      } else if (type === 'exit') {
        newPhysical -= quantity;
        newAvailable -= quantity;
      } else if (type === 'adjustment') {
        newPhysical = quantity; // Consider quantity as the new absolute stock
        newAvailable = quantity - p.stock.reserved;
      }
      return {
        ...p,
        stock: {
          ...p.stock,
          physical: newPhysical,
          available: newAvailable
        }
      };
    }));

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => prev ? {
        ...prev,
        stock: {
          ...prev.stock,
          physical: type === 'adjustment' ? quantity : prev.stock.physical + (type === 'entry' ? quantity : -quantity),
          available: type === 'adjustment' ? quantity - prev.stock.reserved : prev.stock.available + (type === 'entry' ? quantity : -quantity)
        }
      } : null);
    }

    const actionName = type === 'entry' ? 'Entrada' : type === 'exit' ? 'Salida' : type === 'adjustment' ? 'Ajuste' : 'Transferencia';
    toast.success(`${actionName} de inventario procesada correctamente.`);
  };

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        canEdit={canEdit}
        onMovementConfirm={handleMovementConfirm}
      />
    );
  }

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        canEdit={canEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-slate-500 mt-1">
            Control inteligente de stock y almacén
            {canEdit && <span className="text-emerald-600 ml-2">• Gestor de Inventario</span>}
          </p>
        </div>
        {canEdit && (
          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo producto
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Pedidos y Reservas
          </TabsTrigger>
          {canViewHistory && (
            <TabsTrigger value="movements" className="gap-2">
              <History className="w-4 h-4" />
              Movimientos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardView
            products={products}
            canEdit={canEdit}
            setActiveTab={setActiveTab}
            onMovementConfirm={handleMovementConfirm}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsListView
            products={products}
            onProductClick={setSelectedProduct}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersListView
            orders={orders}
            onOrderClick={setSelectedOrder}
          />
        </TabsContent>

        {canViewHistory && (
          <TabsContent value="movements" className="mt-6">
            <Card className="border-slate-200">
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Historial completo de movimientos</p>
                <p className="text-sm text-slate-400 mt-1">
                  Registro inmutable de todas las operaciones con auditoría
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <CreateProductModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}

export default InventoryPage;
