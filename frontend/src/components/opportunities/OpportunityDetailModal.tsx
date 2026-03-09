import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Calendar, Building2, Clock, Check, ChevronRight,
  FileText, Package, Truck,
  User, CheckCircle2, Edit3, XCircle, Phone, Mail, CheckSquare, Bell, MapPin, MessageCircle, ArrowRight, Sparkles, Loader2
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { ACTIVITY_TYPE_CONFIG } from '@/types/activity';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

type OpportunityStage = 'Calificar' | 'Desarrollar' | 'Proponer' | 'Cerrar' | 'Cerrada Ganada' | 'Cerrada Perdida';
type TabType = 'Resumen' | 'CPQ' | 'Integración ERP' | 'Historial y Actividades';

interface Product {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioFinal: number;
  subtotal: number;
  itbis: number;
  totalLinea: number;
  imagen?: string;
  disponibilidad: string;
  tiempoEntrega: string;
}

interface StageHistory {
  etapa: OpportunityStage;
  fecha: string | null;
  completada: boolean;
  actual?: boolean;
}

interface Client {
  id: string;
  nombre: string;
  responsable: string;
  fechaCreacion: string;
}

interface Opportunity {
  id: string;
  titulo: string;
  cliente: Client;
  valorEstimado: number;
  moneda: string;
  fechaCierreEstimada: string;
  etapaActual: OpportunityStage;
  probabilidad: number;
  competidor: string;
  marcaEquipos: string;
  descripcion: string;
  govId?: string;
  cotizacionActivaId?: string;
  cotizaciones: string[];
  productosCount: number;
  productosTotal: number;
  products?: Product[];
  historialEtapa: StageHistory[];
  createdAt: string;
  updatedAt: string;
}

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange?: (newStage: OpportunityStage) => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
  onEdit?: () => void;
  onViewProducts?: () => void;
  onViewCustomer?: (customerId: string) => void;
  erpStatus?: {
    status: 'pending' | 'syncing' | 'success' | 'failed';
    invoiceNumber?: string;
    inventoryStatus?: string;
    dispatchStatus?: string;
    lastSyncAttempt?: string;
    errorMessage?: string;
  };
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
  onRetrySync?: () => void;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_OPPORTUNITY: Opportunity = {
  id: 'OPP-2026-0042',
  titulo: 'Renovación Equipos de Impresión',
  cliente: {
    id: 'CLI-001',
    nombre: 'Soluciones Gráficas SRL',
    responsable: 'Juan Pérez',
    fechaCreacion: '2026-01-14',
  },
  valorEstimado: 234000,
  moneda: 'DOP',
  fechaCierreEstimada: '2026-12-14',
  etapaActual: 'Proponer',
  probabilidad: 75,
  competidor: 'Canon',
  marcaEquipos: 'HP Color LaserJet Pro',
  descripcion: 'Venta de 3 impresoras láser color para oficina',
  cotizacionActivaId: 'COT-2026-0089',
  cotizaciones: ['COT-2026-0089', 'COT-2026-0075'],
  productosCount: 3,
  productosTotal: 234000,
  historialEtapa: [
    { etapa: 'Calificar', fecha: '2026-01-14', completada: true },
    { etapa: 'Desarrollar', fecha: '2026-02-01', completada: true },
    { etapa: 'Proponer', fecha: '2026-03-01', completada: true, actual: true },
    { etapa: 'Cerrar', fecha: null, completada: false },
  ],
  createdAt: '2026-01-14',
  updatedAt: '2026-03-01',
};

const STAGES: OpportunityStage[] = ['Calificar', 'Desarrollar', 'Proponer', 'Cerrar'];

/* STAGE_REQUIREMENTS removed as per user request */

// ============================================
// HELPER FUNCTIONS
// ============================================

const ActivityTypeIcon = ({ type, className }: { type: string; className?: string }) => {
  const config = ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG];
  if (!config) return <CheckSquare className={className} />;

  const iconMap: Record<string, React.ElementType> = {
    Phone, Mail, Users: User, CheckSquare, Bell, MapPin, MessageCircle
  };

  const Icon = iconMap[config.icon] || CheckSquare;
  return <Icon className={className} style={{ color: config.color }} />;
};

const formatCurrency = (value: number, currency: string = 'DOP') => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysInStage = (updatedAt: string): number => {
  const target = new Date(updatedAt);
  const today = new Date();
  const diffTime = today.getTime() - target.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

// ============================================
// MAIN COMPONENT
// ============================================

export function OpportunityDetailModal({
  opportunity = MOCK_OPPORTUNITY,
  isOpen,
  onClose,
  onStageChange,
  onMarkWon,
  onMarkLost,
  onEdit,
  onViewProducts,
  onViewCustomer,
  erpStatus = { status: 'pending' },
}: OpportunityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Resumen');
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isSyncingGov, setIsSyncingGov] = useState(false);
  const [syncPhase, setSyncPhase] = useState(0);
  const { activities } = useActivities();

  // Simulate Gov Syncing Delay with phases
  const handleGovSync = () => {
    setIsSyncingGov(true);
    setSyncPhase(1); // Navegando...
    setTimeout(() => {
      setSyncPhase(2); // Descargando pliego...
      setTimeout(() => {
        setSyncPhase(3); // Analizando IA...
        setTimeout(() => {
          setIsSyncingGov(false);
          setSyncPhase(0);
          toast.success('Checklist Legal sincronizado desde Compras Públicas');
        }, 6000);
      }, 3000);
    }, 2000);
  };

  if (!opportunity) return null;

  const linkedActivities = activities.filter(a => a.opportunityId === opportunity.id || a.opportunityName === opportunity.titulo);

  const currentStageIndex = STAGES.indexOf(opportunity.etapaActual);
  const actualStageIndex = currentStageIndex === -1 ? STAGES.length : currentStageIndex;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-5xl max-h-[95vh] p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl flex flex-col">

          {/* 1. Hero Header */}
          <div className="bg-white px-6 md:px-8 py-6 border-b border-slate-200 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2.5">
                  <Badge variant="outline" className="text-[10px] font-bold tracking-widest text-slate-500 bg-slate-100/50 border-none uppercase px-2.5 py-0.5 rounded-full">
                    Oportunidad
                  </Badge>
                  <span className="text-xs font-semibold text-slate-400">ID: {opportunity.id}</span>
                </div>

                <h1 className="text-2xl md:text-[26px] font-bold text-slate-800 tracking-tight leading-tight mb-3.5">
                  {opportunity.titulo}
                </h1>

                <div className="flex items-center gap-6">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-colors group/cust"
                    onClick={() => onViewCustomer?.(opportunity.cliente.id)}
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center group-hover/cust:bg-white transition-colors">
                      <Building2 className="w-3.5 h-3.5 text-slate-600 group-hover/cust:text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover/cust:text-indigo-700">{opportunity.cliente.nombre}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-0.5 leading-none">Cierre Estimado</span>
                      <span className="text-sm font-medium text-slate-800 leading-none">{formatDate(opportunity.fechaCierreEstimada)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[240px]">
                <div className="flex flex-col items-end justify-center bg-emerald-50/50 px-5 py-3 rounded-xl border border-emerald-100/50">
                  <span className="text-[11px] uppercase font-medium text-emerald-600/70 tracking-wider mb-1">Monto Estimado</span>
                  <div className="flex items-baseline justify-end gap-1.5 w-full">
                    <span className="text-xs font-medium text-emerald-500">{opportunity.moneda}</span>
                    <span className="text-[24px] font-bold tracking-tight text-emerald-700">
                      {formatCurrency(opportunity.valorEstimado, opportunity.moneda).replace(opportunity.moneda, '').trim()}
                    </span>
                  </div>
                </div>
                {opportunity.govId ? (
                  <Button
                    onClick={handleGovSync}
                    disabled={isSyncingGov}
                    variant="outline"
                    className="w-full bg-blue-50/50 hover:bg-blue-100/80 text-blue-700 border border-blue-200 font-bold shadow-sm h-[42px] rounded-lg text-sm relative overflow-hidden group transition-all"
                  >
                    {isSyncingGov && (
                      <div className="absolute inset-0 bg-blue-100 flex items-center justify-center animate-pulse z-0" />
                    )}
                    <span className="flex items-center gap-2 relative z-10 w-full justify-center">
                      {isSyncingGov ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-[12px] truncate">
                            {syncPhase === 1 && "Navegando al portal..."}
                            {syncPhase === 2 && "Descargando Pliego..."}
                            {syncPhase === 3 && "IA analizando 47-25..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="truncate">Sincronizar Compras RD</span>
                        </>
                      )}
                    </span>
                  </Button>
                ) : (
                  <Button onClick={onViewProducts} variant="outline" className="w-full bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-200 font-bold shadow-sm h-9 rounded-lg text-sm">
                    <Package className="w-4 h-4 mr-2" />
                    Ver Productos Cargados
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Chevron Path Bar (Solid Entangled Pills) */}
          <div className="bg-[#F8FAFC] px-8 py-6 border-b border-slate-200 shrink-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-stretch min-w-[500px] h-[52px]">
                {STAGES.map((stage, idx) => {
                  const isCompleted = idx < actualStageIndex || opportunity.etapaActual.includes('Ganada');
                  const isCurrent = idx === actualStageIndex && !opportunity.etapaActual.includes('Ganada') && !opportunity.etapaActual.includes('Perdida');

                  let bgClass = "";
                  if (stage === 'Calificar') {
                    bgClass = isCompleted || isCurrent ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-white text-slate-500 hover:bg-purple-50/50 border border-slate-200";
                  } else if (stage === 'Desarrollar') {
                    bgClass = isCompleted || isCurrent ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-white text-slate-500 hover:bg-sky-50/50 border border-slate-200";
                  } else if (stage === 'Proponer') {
                    bgClass = isCompleted || isCurrent ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white text-slate-500 hover:bg-amber-50/50 border border-slate-200";
                  } else if (stage === 'Cerrar') {
                    bgClass = isCompleted || isCurrent ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white text-slate-500 hover:bg-emerald-50/50 border border-slate-200";
                  }

                  // Superposition with lower z-index and negative left margin to "entangle" pills
                  const zIndex = 40 - (idx * 10);

                  return (
                    <div
                      key={stage}
                      className={cn(
                        "flex items-center flex-1 cursor-pointer relative transition-all duration-200 rounded-full group",
                        idx !== 0 && "-ml-5 pl-8",
                        idx === 0 && "pl-4",
                        "pr-6",
                        bgClass
                      )}
                      style={{ zIndex }}
                      onClick={() => {
                        if (opportunity.etapaActual !== stage) {
                          onStageChange?.(stage);
                        }
                      }}
                    >
                      <div className="flex flex-1 items-center justify-center gap-2 h-full">
                        {isCompleted && <Check className="w-5 h-5 opacity-80" />}
                        {isCurrent && (
                          <div className="w-3 h-3 rounded-full border-2 border-inherit flex items-center justify-center opacity-80 bg-current shadow-[0_0_8px_currentColor]" />
                        )}
                        <span className="text-[14px] font-bold tracking-wider uppercase">
                          {stage}
                        </span>
                      </div>

                      {/* Current Stage Indicator Text */}
                      {isCurrent && (
                        <div className="absolute top-16 left-0 right-0 flex justify-center w-full z-50">
                          <span className="text-[12px] font-bold text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-200 shadow-sm whitespace-nowrap">
                            Activa por {getDaysInStage(opportunity.updatedAt)} días
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Tabbed Interface */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex flex-col h-full pl-8 pr-8 pt-6">
              <TabsList className="bg-slate-200/50 p-1 rounded-xl h-auto self-start mb-6">
                {(['Resumen', 'CPQ', 'Integración ERP', 'Historial y Actividades'] as TabType[]).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={cn(
                      'px-6 py-2.5 text-sm font-bold rounded-lg transition-all',
                      'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
                      'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="flex-1 -mx-8 px-8">
                <div className="pb-8">
                  {/* Resumen Tab */}
                  <TabsContent value="Resumen" className="mt-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Detalles */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-indigo-500" />
                              Detalles Técnicos
                            </h3>
                            {opportunity.products && opportunity.products.length > 0 && (
                              <Button
                                onClick={() => setIsProductDetailOpen(true)}
                                variant="outline"
                                size="sm"
                                className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              >
                                <Package className="w-4 h-4 mr-2" />
                                Ver Productos Cargados ({opportunity.products.length})
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valor Sincronizado</span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-indigo-700">{formatCurrency(opportunity.productosTotal, opportunity.moneda)}</span>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] py-0">Sincronizado</Badge>
                              </div>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Marca Principal</span>
                              <span className="text-sm font-medium text-slate-800">{opportunity.marcaEquipos}</span>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Competencia</span>
                              <span className="text-sm font-medium text-slate-800">{opportunity.competidor}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción del Negocio</span>
                              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {opportunity.descripcion}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contactos */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-500" />
                            Contactos Clave
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                  {opportunity.cliente.responsable.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{opportunity.cliente.responsable}</p>
                                  <p className="text-xs text-slate-500">Tomador de Decisión</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Acciones</h3>
                          <div className="space-y-2">
                            {currentStageIndex >= 0 && currentStageIndex < STAGES.length - 1 && (
                              <Button
                                onClick={() => onStageChange?.(STAGES[currentStageIndex + 1])}
                                className="w-full justify-start bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold h-11 border border-indigo-200 shadow-sm transition-colors"
                              >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Avanzar a: {STAGES[currentStageIndex + 1]}
                              </Button>
                            )}
                            <Button onClick={onMarkWon} className="w-full justify-start bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold h-11 border-0 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar como Ganada
                            </Button>

                            {/* Warehouse Integration Trigger */}
                            {opportunity.etapaActual.includes('Ganada') && (
                              <Button
                                onClick={() => {
                                  // En una app real, esto haría una llamada a la API
                                  // y crearía el registro en Inventario > Pedidos y Reservas
                                  alert('OPORTUNIDAD GANADA\n\n1. Reserva de equipos enviada a Inventario (Soft Allocation).\n2. Solicitud enviada a Facturación (Validación de Crédito).\n\nUna vez facturado (NCF), Inventario procederá al Despacho y la cuenta pasará automáticamente a CxC.');
                                  onClose();
                                }}
                                className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 border-0 shadow-sm"
                              >
                                <Package className="w-4 h-4 mr-2" />
                                Enviar a Almacén (Generar Pedido)
                              </Button>
                            )}

                            <Button onClick={onMarkLost} variant="outline" className="w-full justify-start bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200 font-bold h-11 shadow-sm">
                              <XCircle className="w-4 h-4 mr-2" />
                              Marcar como Perdida
                            </Button>
                            <Button variant="ghost" onClick={onEdit} className="w-full justify-start text-slate-600 hover:bg-slate-100 h-11">
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar Registro
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* CPQ Tab */}
                  <TabsContent value="CPQ" className="mt-0 outline-none">
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Configure, Price, Quote (CPQ)</h3>
                      <p className="text-slate-500 max-w-md mb-6">
                        Gestiona la paleta de productos, precios y descuentos asociados a esta oportunidad.
                      </p>
                      <Button onClick={onViewProducts} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8">
                        Abrir Editor de Cotización
                      </Button>
                    </div>
                  </TabsContent>

                  {/* ERP Tab */}
                  <TabsContent value="Integración ERP" className="mt-0 outline-none">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <Truck className="w-6 h-6 text-indigo-600" />
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Estado de Logística y Facturación</h3>
                          <p className="text-sm text-slate-500">Sincronización en tiempo real con SAP B1</p>
                        </div>
                        <div className="ml-auto">
                          {erpStatus?.status === 'success' && <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 font-bold">Sincronizado</Badge>}
                          {erpStatus?.status === 'failed' && <Badge className="bg-rose-100 text-rose-800 px-3 py-1 font-bold">Fallo de Sincronización</Badge>}
                          {erpStatus?.status === 'pending' && <Badge className="bg-slate-100 text-slate-600 px-3 py-1 font-bold">Pendiente</Badge>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Facturación</span>
                          <span className="text-base font-bold text-slate-800">{erpStatus?.invoiceNumber || 'No generada'}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Almacén (Picking)</span>
                          <span className="text-base font-bold text-slate-800">{erpStatus?.inventoryStatus || 'Pendiente'}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Despacho</span>
                          <span className="text-base font-bold text-slate-800">{erpStatus?.dispatchStatus || 'Pendiente'}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Historial Tab */}
                  <TabsContent value="Historial y Actividades" className="mt-0 outline-none">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[400px]">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Actividades Asociadas
                      </h3>

                      {linkedActivities.length > 0 ? (
                        <div className="space-y-4">
                          {linkedActivities.map((activity) => {
                            const config = ACTIVITY_TYPE_CONFIG[activity.type as keyof typeof ACTIVITY_TYPE_CONFIG] || ACTIVITY_TYPE_CONFIG.MEETING;

                            let statusBadge = null;
                            if (activity.status === 'COMPLETED') statusBadge = <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-auto">Completada</Badge>;
                            else if (activity.status === 'OVERDUE') statusBadge = <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 ml-auto">Vencida</Badge>;
                            else if (activity.status === 'IN_PROGRESS') statusBadge = <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-auto">En Progreso</Badge>;
                            else statusBadge = <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 ml-auto">Pendiente</Badge>;

                            return (
                              <div key={activity.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow bg-slate-50/50">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-slate-200 bg-white" style={{ boxShadow: `0 4px 10px -2px ${config.color}20` }}>
                                  <ActivityTypeIcon type={activity.type} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex items-start justify-between gap-4 mb-1">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{activity.title}</h4>
                                    {statusBadge}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-2">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {formatDate(activity.dueDate.toString())}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3.5 h-3.5" />
                                      {activity.dueTime}
                                    </span>
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-lg mt-1">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 mt-12 flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <MessageCircle className="w-10 h-10 text-slate-300 mb-3" />
                          <h4 className="font-bold text-slate-700 mb-1">Sin actividades</h4>
                          <p className="text-sm">No existen eventos pendientes ni pasados para este negocio.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent >
      </Dialog >

      <ProductDetailModal
        products={opportunity.products || []}
        isOpen={isProductDetailOpen}
        onClose={() => setIsProductDetailOpen(false)}
        quoteTotal={opportunity.productosTotal}
        currency={opportunity.moneda}
      />
    </>);
}

// ============================================
// PRODUCT DETAIL MODAL (No changes)
// ============================================

interface ProductDetailModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  quoteTotal: number;
  currency: string;
}

export function ProductDetailModal({
  products,
  isOpen,
  onClose,
  quoteTotal,
  currency,
}: ProductDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Productos Cargados</h2>
              <p className="text-xs text-slate-500">Detalle de items sincronizados desde la cotización</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Total Cotizado</p>
            <p className="text-xl font-bold text-indigo-700">{formatCurrency(quoteTotal, currency)}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">No hay productos cargados para esta oportunidad</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Item / SKU</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Cant.</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Precio</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="font-mono text-[10px] border-slate-200 text-slate-600">
                            {p.sku}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{p.descripcion}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                            {p.cantidad}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-slate-600">
                            {formatCurrency(p.precioUnitario, currency)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-indigo-700">
                            {formatCurrency(p.totalLinea, currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <Button onClick={onClose} variant="outline" className="font-bold border-slate-300">
            Cerrar Ventana
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OpportunityDetailModal;
