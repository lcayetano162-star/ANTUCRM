// ============================================
// ANTU CRM - Opportunities Page
// Pipeline de oportunidades (Kanban)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpportunityDetailModal, ProductDetailModal } from '@/components/opportunities/OpportunityDetailModal';
import { OpportunityCloseModal } from '@/components/opportunities/OpportunityCloseModal';
import { OpportunityFormModal } from '@/components/opportunities/OpportunityFormModal';
import { useCustomerCredit } from '@/hooks/useCustomerCredit';
import { useReceivables } from '@/hooks/useReceivables';
import { useCustomersWithAI } from '@/hooks/useCustomersWithAI';
import { useInvoices } from '@/hooks/useInvoices';
import { useInventory } from '@/hooks/useInventory';
import {
  Plus, MoreHorizontal, Calendar,
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  Sparkles, Zap, Brain, Search,
  Target, Lightbulb, FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

// ============================================
// MOCK OPPORTUNITIES
// ============================================

type OpportunityStage = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
type PipelineStage = 'Calificar' | 'Desarrollar' | 'Proponer' | 'Cerrar' | 'Cerrada Ganada' | 'Cerrada Perdida';

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
  disponibilidad: string;
  tiempoEntrega: string;
}

interface Opportunity {
  id: string;
  name: string;
  company: string;
  customerId: string;
  value: number;
  probability: number;
  stage: OpportunityStage;
  pipelineStage: PipelineStage;
  expectedCloseDate: string;
  assignedTo: string;
  lastActivity: string;
  aiScore: number;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  competidor?: string;
  marcaEquipos?: string;
  clienteResponsable?: string;
  fechaCreacion?: string;
  products?: Product[];
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'OP-01-2025',
    name: 'Renovación Flota Impresoras Q1 2026',
    company: 'Corporación Dominicana de Impresión',
    customerId: 'CLI-001',
    value: 450000,
    probability: 75,
    stage: 'negotiation',
    pipelineStage: 'Proponer',
    expectedCloseDate: '2026-03-15',
    assignedTo: 'María González',
    lastActivity: 'Hace 2 horas',
    aiScore: 92,
    description: 'Renovación completa de flota de impresoras para todas las sucursales.',
    contactName: 'Carlos Méndez',
    contactEmail: 'cmendez@cdi.com.do',
    contactPhone: '809-555-0101',
    competidor: 'Canon',
    marcaEquipos: 'HP Color LaserJet Pro',
    clienteResponsable: 'Carlos Méndez',
    fechaCreacion: '2025-01-15',
  },
  {
    id: 'OP-02-2025',
    name: 'Expansión Operaciones Financieras',
    company: 'Grupo Financiero XYZ',
    customerId: 'CLI-002',
    value: 750000,
    probability: 90,
    stage: 'proposal',
    pipelineStage: 'Desarrollar',
    expectedCloseDate: '2026-03-01',
    assignedTo: 'Juan Pérez',
    lastActivity: 'Ayer',
    aiScore: 88,
    description: 'Expansión de operaciones con nuevos equipos de impresión segura.',
    contactName: 'Ana Rodríguez',
    contactEmail: 'arodriguez@xyz.com.do',
    contactPhone: '809-555-0202',
    competidor: 'Xerox',
    marcaEquipos: 'HP LaserJet Enterprise',
    clienteResponsable: 'Ana Rodríguez',
    fechaCreacion: '2025-02-01',
  },
  {
    id: 'OP-03-2026',
    name: 'Cotización Equipos Industriales',
    company: 'Industrias ABC',
    customerId: 'CLI-003',
    value: 45000,
    probability: 60,
    stage: 'contacted',
    pipelineStage: 'Calificar',
    expectedCloseDate: '2026-03-10',
    assignedTo: 'Carlos Rodríguez',
    lastActivity: 'Hace 3 días',
    aiScore: 45,
    description: 'Cotización para equipos industriales de alta capacidad.',
    contactName: 'Pedro Santos',
    contactEmail: 'psantos@abc.com.do',
    contactPhone: '809-555-0303',
    competidor: 'Ricoh',
    marcaEquipos: 'HP LaserJet Pro',
    clienteResponsable: 'Pedro Santos',
    fechaCreacion: '2025-02-20',
  },
  {
    id: 'OP-04-2025',
    name: 'Renovación Contrato Editorial',
    company: 'Editorial Nacional',
    customerId: 'CLI-004',
    value: 25000,
    probability: 85,
    stage: 'negotiation',
    pipelineStage: 'Proponer',
    expectedCloseDate: '2026-03-20',
    assignedTo: 'Ana Martínez',
    lastActivity: 'Hace 5 días',
    aiScore: 68,
    description: 'Renovación anual del contrato de servicios editoriales.',
    contactName: 'Luisa García',
    contactEmail: 'lgarcia@editorial.com.do',
    contactPhone: '809-555-0404',
    competidor: 'Epson',
    marcaEquipos: 'HP Color LaserJet Pro',
    clienteResponsable: 'Luisa García',
    fechaCreacion: '2025-01-10',
  },
  {
    id: 'OP-05-2025',
    name: 'Nuevo Contrato Imprenta',
    company: 'Imprenta Central',
    customerId: 'CLI-005',
    value: 120000,
    probability: 40,
    stage: 'new',
    pipelineStage: 'Calificar',
    expectedCloseDate: '2026-04-15',
    assignedTo: 'Juan Pérez',
    lastActivity: 'Hace 1 semana',
    aiScore: 55,
    description: 'Nuevo contrato para servicios de impresión comercial.',
    contactName: 'Miguel Torres',
    contactEmail: 'mtorres@imprenta.com.do',
    contactPhone: '809-555-0505',
    competidor: 'Brother',
    marcaEquipos: 'HP LaserJet Pro',
    clienteResponsable: 'Miguel Torres',
    fechaCreacion: '2025-03-01',
  },
  {
    id: 'OP-06-2025',
    name: 'Campaña Publicitaria Anual',
    company: 'Publicidad Moderna SA',
    customerId: 'CLI-006',
    value: 180000,
    probability: 30,
    stage: 'new',
    pipelineStage: 'Calificar',
    expectedCloseDate: '2026-04-01',
    assignedTo: 'María González',
    lastActivity: 'Hace 4 horas',
    aiScore: 42,
    description: 'Campaña publicitaria anual con materiales impresos.',
    contactName: 'Sofia Luna',
    contactEmail: 'sluna@publicidad.com.do',
    contactPhone: '809-555-0606',
    competidor: 'Lexmark',
    marcaEquipos: 'HP Color LaserJet Pro',
    clienteResponsable: 'Sofia Luna',
    fechaCreacion: '2025-03-15',
  },
  {
    id: 'OP-01-2024',
    name: 'Actualización Servidores Q3 2024',
    company: 'Tech Solutions LLC',
    customerId: 'CLI-007',
    value: 850000,
    probability: 100,
    stage: 'closed-won',
    pipelineStage: 'Cerrada Ganada',
    expectedCloseDate: '2024-08-30',
    assignedTo: 'Carlos Valdez',
    lastActivity: 'Hace 1 año',
    aiScore: 95,
    description: 'Renovación completa de infraestructura de servidores. Proyecto finalizado.',
    contactName: 'Ing. Romero',
    contactEmail: 'aromero@techsolutions.com',
    contactPhone: '809-555-0707',
    competidor: 'Dell',
    marcaEquipos: 'HP Enterprise',
    clienteResponsable: 'Ing. Romero',
    fechaCreacion: '2024-05-10',
  },
];

// ============================================
// MOCK PRODUCTS FOR QUOTE
// ============================================

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    sku: 'HP-M428FDW',
    nombre: 'HP LaserJet Pro M428fdw',
    descripcion: 'Multifuncional láser monocromática con impresión, copiado, escaneo y fax',
    cantidad: 2,
    precioUnitario: 85000,
    descuento: 5,
    precioFinal: 80750,
    subtotal: 161500,
    itbis: 29070,
    totalLinea: 190570,
    disponibilidad: 'En stock',
    tiempoEntrega: 'Inmediato',
  },
  {
    id: 'PROD-002',
    sku: 'HP-COLOR-479',
    nombre: 'HP Color LaserJet Pro M479fdw',
    descripcion: 'Impresora láser color multifuncional con Wi-Fi y doble cara automática',
    cantidad: 1,
    precioUnitario: 43500,
    descuento: 0,
    precioFinal: 43500,
    subtotal: 43500,
    itbis: 7830,
    totalLinea: 51330,
    disponibilidad: 'En stock',
    tiempoEntrega: '2 días',
  },
];

// ============================================
// STAGE CONFIGURATION
// ============================================

// ============================================
// OPPORTUNITY CARD (Premium Styling)
// ============================================

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
}

function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageBadgeProps = (stage: PipelineStage) => {
    switch (stage) {
      case 'Calificar': return { bg: 'bg-[#F4EBFF] text-[#6B21A8]', icon: Target, border: 'border-l-[#9333EA]' };
      case 'Desarrollar': return { bg: 'bg-[#E0F2FE] text-[#0369A1]', icon: Lightbulb, border: 'border-l-[#0284C7]' };
      case 'Proponer': return { bg: 'bg-[#FEF3C7] text-[#B45309]', icon: FileText, border: 'border-l-[#D97706]' };
      case 'Cerrar': return { bg: 'bg-[#D1FAE5] text-[#047857]', icon: CheckCircle2, border: 'border-l-[#059669]' };
      case 'Cerrada Ganada': return { bg: 'bg-[#D1FAE5] text-[#047857]', icon: CheckCircle2, border: 'border-l-[#059669]' };
      case 'Cerrada Perdida': return { bg: 'bg-slate-100 text-slate-500', icon: Clock, border: 'border-l-slate-400' };
      default: return { bg: 'bg-slate-50 text-slate-600', icon: Clock, border: 'border-l-slate-300' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProbability = (stage: PipelineStage) => {
    switch (stage) {
      case 'Calificar': return { text: '20%', icon: '🌱', color: 'text-slate-600 bg-slate-100' };
      case 'Desarrollar': return { text: '50%', icon: '🚀', color: 'text-blue-700 bg-blue-50' };
      case 'Proponer': return { text: '80%', icon: '🔥', color: 'text-amber-700 bg-amber-50' };
      case 'Cerrar': return { text: '95%', icon: '⚡', color: 'text-emerald-700 bg-emerald-50' };
      case 'Cerrada Ganada': return { text: '100%', icon: '🎉', color: 'text-emerald-800 bg-emerald-100' };
      default: return null;
    }
  };

  const badgeProps = getStageBadgeProps(opportunity.pipelineStage);
  const BadgeIcon = badgeProps.icon;
  const prob = getProbability(opportunity.pipelineStage);

  return (
    <div
      className={cn(
        "bg-white rounded-xl hover:-translate-y-[2px] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#E5E7EB] border-l-4 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-full",
        badgeProps.border
      )}
      onClick={onClick}
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="font-semibold text-[#1F2937] text-[17px] leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            <span className="text-slate-400 text-[11px] font-medium mr-2">{opportunity.id}</span>
            {opportunity.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {prob && (
              <div className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5", prob.color)}>
                <span>{prob.icon}</span>
                {prob.text}
              </div>
            )}
            <button
              className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1"
              onClick={(e) => { e.stopPropagation(); /* TODO: List Actions */ }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Avatar & Subtitle */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-sm">
            <span className="text-[9px] font-medium text-slate-500 tracking-wider">
              {getInitials(opportunity.company)}
            </span>
          </div>
          <p className="text-[12px] text-[#6B7280] font-medium line-clamp-1">
            {opportunity.company}
          </p>
        </div>

        {/* Data Line */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-medium text-emerald-700/70">RD$</span>
            <span className="text-[15px] font-semibold tracking-tight text-[#064E3B]">
              {formatCurrency(opportunity.value).replace('DOP', '').trim()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-semibold text-[#6B7280]">
              {new Date(opportunity.expectedCloseDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Badge (Mini-Status) */}
      <div className="px-6 py-3 border-t border-[#F3F4F6] flex items-center bg-slate-50/20">
        <Badge variant="secondary" className={cn("border-0 flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold tracking-wide uppercase shadow-none", badgeProps.bg)}>
          <BadgeIcon className="w-3.5 h-3.5" />
          {opportunity.pipelineStage}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// STAGE MAPPING (Backend Prisma enum -> Frontend types)
// ============================================

function mapBackendStage(stage: string): OpportunityStage {
  const map: Record<string, OpportunityStage> = {
    'CALIFICAR': 'new',
    'DESARROLLAR': 'contacted',
    'PROPONER': 'proposal',
    'CERRAR': 'negotiation',
    'CERRADA_GANADA': 'closed-won',
    'CERRADA_PERDIDA': 'closed-lost',
    // Frontend values pass through
    'new': 'new',
    'contacted': 'contacted',
    'proposal': 'proposal',
    'negotiation': 'negotiation',
    'closed-won': 'closed-won',
    'closed-lost': 'closed-lost',
  };
  return map[stage] || 'new';
}

function mapBackendStageToPipeline(stage: string): PipelineStage {
  const map: Record<string, PipelineStage> = {
    'CALIFICAR': 'Calificar',
    'DESARROLLAR': 'Desarrollar',
    'PROPONER': 'Proponer',
    'CERRAR': 'Cerrar',
    'CERRADA_GANADA': 'Cerrada Ganada',
    'CERRADA_PERDIDA': 'Cerrada Perdida',
    // Frontend values
    'new': 'Calificar',
    'contacted': 'Calificar',
    'proposal': 'Proponer',
    'negotiation': 'Cerrar',
    'closed-won': 'Cerrada Ganada',
    'closed-lost': 'Cerrada Perdida',
  };
  return map[stage] || 'Calificar';
}

// ============================================
// MAIN OPPORTUNITIES PAGE
// ============================================

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Load opportunities from API (multi-tenant)
  const loadOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/opportunities');
      const apiOpps = (response.opportunities || response || []).map((o: any) => ({
        id: o.id || `OP-${Math.random().toString(36).substr(2, 6)}`,
        name: o.title || o.name || 'Sin título',
        company: o.company?.name || o.company || 'Sin empresa',
        customerId: o.company?.id || o.companyId || '',
        value: o.value || o.estimatedValue || 0,
        probability: o.probability || 50,
        stage: mapBackendStage(o.stage),
        pipelineStage: mapBackendStageToPipeline(o.stage),
        expectedCloseDate: o.expectedCloseDate || new Date().toISOString(),
        assignedTo: o.assignedTo?.name || o.assignedTo || 'Sin asignar',
        lastActivity: o.lastActivity || 'Sin actividad',
        aiScore: o.aiScore || o.score || 50,
        description: o.description || '',
        contactName: o.contact?.fullName || o.contactName || '',
        contactEmail: o.contact?.email || '',
        contactPhone: o.contact?.phone || '',
        competidor: o.competitor || '',
        marcaEquipos: o.equipmentBrand || '',
        clienteResponsable: o.contact?.fullName || '',
        fechaCreacion: o.createdAt || new Date().toISOString(),
        products: o.products || [],
      }));
      setOpportunities(apiOpps);
    } catch (error: any) {
      console.warn('⚠️ Backend unreachable for opportunities, using local data:', error.message);
      const saved = localStorage.getItem('antu_opportunities');
      if (saved) {
        const parsed = JSON.parse(saved);
        setOpportunities(parsed);
      } else {
        setOpportunities(MOCK_OPPORTUNITIES);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [fiscalYear, setFiscalYear] = useState('current');
  const { getCreditByCustomerId, commitCredit } = useCustomerCredit();
  const { addReceivable } = useReceivables() as any;
  const { customers, selectCustomer } = useCustomersWithAI();
  const { createPendingInvoiceFromOpportunity } = useInvoices();
  const { createReservationFromOpportunity } = useInventory();

  const handleSaveOpportunity = async (newOpportunity: Opportunity) => {
    try {
      // Try creating via real API
      await api.post<any>('/opportunities', {
        title: newOpportunity.name,
        description: newOpportunity.description || '',
        value: newOpportunity.value,
        expectedCloseDate: newOpportunity.expectedCloseDate,
        companyId: newOpportunity.customerId || undefined,
        competitor: newOpportunity.competidor || undefined,
        equipmentBrand: newOpportunity.marcaEquipos || undefined,
      });
      toast.success('Oportunidad creada exitosamente');
      loadOpportunities();
    } catch (error: any) {
      console.warn('⚠️ Backend unreachable, creating opportunity locally:', error.message);
      // Fallback: create locally
      if (newOpportunity.id.startsWith('opp-')) {
        const year = newOpportunity.fechaCreacion
          ? new Date(newOpportunity.fechaCreacion).getFullYear()
          : new Date().getFullYear();
        let maxCounter = 0;
        opportunities.forEach(opp => {
          if (opp.id.startsWith('OP-') && opp.id.endsWith(`-${year}`)) {
            const parts = opp.id.split('-');
            if (parts.length === 3) {
              const count = parseInt(parts[1], 10);
              if (!isNaN(count) && count > maxCounter) maxCounter = count;
            }
          }
        });
        const nextCounter = maxCounter > 0 ? maxCounter + 1 : (opportunities.filter(o => o.fechaCreacion?.startsWith(year.toString())).length + 1);
        newOpportunity.id = `OP-${nextCounter.toString().padStart(2, '0')}-${year}`;
      }
      setOpportunities(prev => [newOpportunity, ...prev]);
      localStorage.setItem('antu_opportunities', JSON.stringify([newOpportunity, ...opportunities]));
      toast.success('Oportunidad creada localmente');
    }
  };

  // Filtrar oportunidades por búsqueda y etapa
  const filteredOpportunities = opportunities.filter(opp => {
    // 1. Fiscal Year Filter
    const matchesFiscalYear = fiscalYear === 'current'
      ? (opp.fechaCreacion?.startsWith('2025') || opp.fechaCreacion?.startsWith('2026'))
      : opp.fechaCreacion?.startsWith(fiscalYear);

    if (!matchesFiscalYear) return false;

    // 2. Stage Filter
    if (stageFilter !== 'all' && opp.pipelineStage !== stageFilter) {
      return false;
    }

    // 3. Search Filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opp.name.toLowerCase().includes(query) ||
      opp.company.toLowerCase().includes(query) ||
      opp.assignedTo.toLowerCase().includes(query) ||
      (opp.contactName && opp.contactName.toLowerCase().includes(query)) ||
      (opp.id && opp.id.toLowerCase().includes(query))
    );
  });

  // Oportunidades del año fiscal para las métricas base
  const fiscalOpps = opportunities.filter(opp => {
    return fiscalYear === 'current'
      ? (opp.fechaCreacion?.startsWith('2025') || opp.fechaCreacion?.startsWith('2026'))
      : opp.fechaCreacion?.startsWith(fiscalYear);
  });

  // Calcular estadísticas basadas en las etapas del flujo de ventas
  const calificarValue = fiscalOpps.filter(opp => opp.pipelineStage === 'Calificar').reduce((sum, opp) => sum + opp.value, 0);
  const desarrollarValue = fiscalOpps.filter(opp => opp.pipelineStage === 'Desarrollar').reduce((sum, opp) => sum + opp.value, 0);
  const proponerValue = fiscalOpps.filter(opp => opp.pipelineStage === 'Proponer').reduce((sum, opp) => sum + opp.value, 0);
  const cerrarValue = fiscalOpps.filter(opp => opp.pipelineStage === 'Cerrar' || opp.pipelineStage.includes('Ganada')).reduce((sum, opp) => sum + opp.value, 0);

  // AI Insights calculations
  const stalledOpps = filteredOpportunities.filter(opp => opp.probability <= 30 && opp.stage !== 'new' && !opp.stage.includes('closed'));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Obtener información de crédito para la oportunidad seleccionada
  const selectedCreditInfo = selectedOpportunity
    ? getCreditByCustomerId(selectedOpportunity.customerId)
    : undefined;

  const creditInfo = selectedCreditInfo || { status: 'NONE' as any, limit: 0, available: 0, used: 0 };

  // Validar crédito para cierre - Requisitos desactivados por petición del usuario
  const validationResult = { canClose: true, message: 'Crédito validado (Modo Flexible)', options: [] };

  // Manejar cierre de oportunidad
  const handleConfirmClose = (closeData: import('@/components/opportunities/OpportunityCloseModal').CloseData) => {
    if (!selectedOpportunity) return;

    // 1. Crear reservas de inventario si hay productos
    if (selectedOpportunity.products && selectedOpportunity.products.length > 0) {
      createReservationFromOpportunity(
        selectedOpportunity.id,
        selectedOpportunity.name,
        selectedOpportunity.products.map(p => ({ sku: p.sku || p.id, quantity: p.cantidad || 1, name: p.nombre })),
        'Sistema',
        'admin'
      );
    }

    // 2. Enviar directamente a Facturación Electrónica pendientes
    createPendingInvoiceFromOpportunity(selectedOpportunity);

    // 3. Si es a crédito, comprometer el monto y crear cuenta por cobrar
    if (closeData.paymentTerms === 'CREDIT') {
      commitCredit(selectedOpportunity.customerId, closeData.finalValue);

      addReceivable({
        invoiceId: `INV-${Date.now()}`,
        invoiceNumber: `FACT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        customerId: selectedOpportunity.customerId,
        customerName: selectedOpportunity.company,
        amount: closeData.finalValue,
        balance: closeData.finalValue,
        paidAmount: 0,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysOverdue: 0,
        status: 'PENDING',
        sellerId: 'V001',
        sellerName: 'Juan Pérez',
      });
    }

    // Actualizar la oportunidad
    setOpportunities(prev => prev.map(opp =>
      opp.id === selectedOpportunity.id
        ? {
          ...opp,
          stage: 'closed-won' as OpportunityStage,
          pipelineStage: 'Cerrada Ganada' as PipelineStage,
          value: closeData.finalValue,
        }
        : opp
    ));

    setIsCloseModalOpen(false);
    setSelectedOpportunity(null);
  };

  // Preparar datos del modal de cierre
  const closeModalOpportunity = selectedOpportunity ? {
    id: selectedOpportunity.id,
    name: selectedOpportunity.name,
    customerId: selectedOpportunity.customerId,
    customerName: selectedOpportunity.company,
    value: selectedOpportunity.value,
    stage: selectedOpportunity.stage,
  } : null;

  // Convertir oportunidad al formato del modal
  const convertToModalOpportunity = (opp: Opportunity) => {
    const STAGES_ORDER: PipelineStage[] = ['Calificar', 'Desarrollar', 'Proponer', 'Cerrar'];
    const currentIdx = STAGES_ORDER.indexOf(opp.pipelineStage);

    const stageHistory = STAGES_ORDER.map((stage, idx) => {
      const isCompleted = idx < currentIdx || opp.pipelineStage === 'Cerrada Ganada';
      const isActual = idx === currentIdx;

      return {
        etapa: stage,
        fecha: isCompleted || isActual ? (opp.fechaCreacion || opp.expectedCloseDate) : null,
        completada: isCompleted,
        actual: isActual
      };
    });

    if (opp.pipelineStage === 'Cerrada Ganada') {
      stageHistory.push({
        etapa: 'Cerrada Ganada' as PipelineStage,
        fecha: opp.expectedCloseDate,
        completada: true,
        actual: true
      });
    }

    return {
      id: opp.id,
      titulo: opp.name,
      cliente: {
        id: opp.customerId,
        nombre: opp.company,
        responsable: opp.clienteResponsable || opp.contactName || 'No asignado',
        fechaCreacion: opp.fechaCreacion || opp.expectedCloseDate,
      },
      valorEstimado: opp.value,
      moneda: 'DOP',
      fechaCierreEstimada: opp.expectedCloseDate,
      etapaActual: opp.pipelineStage,
      probabilidad: opp.probability,
      competidor: opp.competidor || 'No especificado',
      marcaEquipos: opp.marcaEquipos || 'No especificado',
      descripcion: opp.description || 'Sin descripción',
      cotizacionActivaId: `COT-${opp.id}`,
      cotizaciones: [`COT-${opp.id}`],
      productosCount: (opp.products || []).length,
      productosTotal: (opp.products || []).reduce((sum, p) => sum + p.totalLinea, 0) || opp.value,
      products: opp.products || [],
      historialEtapa: stageHistory,
      createdAt: opp.fechaCreacion || opp.expectedCloseDate,
      updatedAt: opp.expectedCloseDate,
    };
  };

  // Handle opportunity click
  const handleOpportunityClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Oportunidades
              {fiscalYear !== 'current' && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1.5 ml-2">
                  <Lock className="w-3 h-3" />
                  Archivo Histórico ({fiscalYear})
                </Badge>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Pipeline de ventas — Haz clic en una oportunidad para ver el nuevo rediseño 🚀</p>
          </div>
          {fiscalYear === 'current' && (
            <Button
              className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-semibold shadow-lg shadow-[rgba(94,217,207,0.2)] transition-all"
              onClick={() => setIsFormModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva oportunidad
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Calificar',
              value: formatCurrency(calificarValue),
              icon: Target,
              color: 'bg-[#F4EBFF] text-[#6B21A8]',
              shadow: 'hover:shadow-[0_10px_20px_-5px_rgba(147,51,234,0.15)]',
              border: 'border-[#E9D5FF]',
              stage: 'Calificar' as PipelineStage
            },
            {
              label: 'Desarrollar',
              value: formatCurrency(desarrollarValue),
              icon: Lightbulb,
              color: 'bg-[#E0F2FE] text-[#0369A1]',
              shadow: 'hover:shadow-[0_10px_20px_-5px_rgba(2,132,199,0.15)]',
              border: 'border-[#BAE6FD]',
              stage: 'Desarrollar' as PipelineStage
            },
            {
              label: 'Proponer',
              value: formatCurrency(proponerValue),
              icon: FileText,
              color: 'bg-[#FEF3C7] text-[#B45309]',
              shadow: 'hover:shadow-[0_10px_20px_-5px_rgba(217,119,6,0.15)]',
              border: 'border-[#FDE68A]',
              stage: 'Proponer' as PipelineStage
            },
            {
              label: 'Cerrar / Ganadas',
              value: formatCurrency(cerrarValue),
              icon: CheckCircle2,
              color: 'bg-[#D1FAE5] text-[#047857]',
              shadow: 'hover:shadow-[0_10px_20px_-5px_rgba(5,150,105,0.15)]',
              border: 'border-[#A7F3D0]',
              stage: 'Cerrar' as PipelineStage
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            const isSelected = stageFilter === stat.stage;
            return (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-all duration-300 border hover:-translate-y-1 bg-white",
                  stat.shadow,
                  isSelected ? `ring-2 ring-offset-2 ring-opacity-50 ring-current border-transparent ${stat.border}` : stat.border
                )}
                onClick={() => setStageFilter(isSelected ? 'all' : stat.stage)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-[#1F2937]">{stat.value.replace('DOP', '').trim()}</p>
                    <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide mt-1">{stat.label}</p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', stat.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Toolbox: Búsqueda y Filtro Superior Lineal */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="relative w-full max-w-[400px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar oportunidad por cliente o ID..."
                className="pl-10 h-10 border-0 ring-1 ring-slate-200 shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger className="w-[180px] h-10 border-0 ring-1 ring-slate-200 shadow-sm rounded-xl bg-white font-medium">
                <SelectValue placeholder="Año Fiscal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current" className="font-medium text-[var(--color-primary)]">FY2026 (Actual)</SelectItem>
                <SelectItem value="2025">FY2025 (Histórico)</SelectItem>
                <SelectItem value="2024">FY2024 (Histórico)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Business Process Flow (Solid Engangled Pills Filter Bar) */}
          <div className="bg-[#F8FAFC] rounded-[20px] shadow-sm border border-slate-200/60 p-2 overflow-x-auto">
            <div className="flex items-stretch min-w-[750px] h-[52px]">
              <button
                onClick={() => setStageFilter('all')}
                className={cn(
                  "px-8 text-[10px] font-semibold tracking-widest uppercase transition-all rounded-full shrink-0 relative z-50",
                  stageFilter === 'all'
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200"
                )}
              >
                Todas
              </button>

              {(['Calificar', 'Desarrollar', 'Proponer', 'Cerrar'] as PipelineStage[]).map((stage, idx) => {
                const isSelected = stageFilter === stage;
                const matchesFiscal = fiscalYear === 'current' ? (o: Opportunity) => o.fechaCreacion?.startsWith('2025') || o.fechaCreacion?.startsWith('2026') : (o: Opportunity) => o.fechaCreacion?.startsWith(fiscalYear);
                const val = opportunities.filter(o => o.pipelineStage === stage && matchesFiscal(o)).reduce((sum, o) => sum + o.value, 0);

                let bgClass = "";
                if (stage === 'Calificar') {
                  bgClass = isSelected ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-white text-slate-500 hover:bg-purple-50/70 border border-slate-200";
                } else if (stage === 'Desarrollar') {
                  bgClass = isSelected ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-white text-slate-500 hover:bg-sky-50/70 border border-slate-200";
                } else if (stage === 'Proponer') {
                  bgClass = isSelected ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white text-slate-500 hover:bg-amber-50/70 border border-slate-200";
                } else if (stage === 'Cerrar') {
                  bgClass = isSelected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white text-slate-500 hover:bg-emerald-50/70 border border-slate-200";
                }

                // Superposition with lower z-index and negative left margin to "entangle" pills
                const zIndex = 40 - (idx * 10);

                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center flex-1 cursor-pointer relative transition-all duration-200 rounded-full -ml-5 pl-10 pr-6 group",
                      bgClass
                    )}
                    style={{ zIndex }}
                    onClick={() => setStageFilter(isSelected ? 'all' : stage)}
                  >
                    <div className="flex flex-1 items-center justify-between gap-3 h-full">
                      <span className="text-[10px] font-semibold tracking-wider uppercase">
                        {stage}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold tracking-tight">
                          {formatCurrency(val).replace('DOP', '').trim()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CSS Component Grid (Responsive 3 Columns) */}
        <div className="bg-[#F3F4F6] rounded-2xl p-6 min-h-[400px]">
          {filteredOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => handleOpportunityClick(opp)}
                />
              ))}
            </div>
          ) : (
            <div className="w-full py-24 flex flex-col items-center justify-center text-slate-400">
              <Search className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium text-slate-500 text-lg">No se encontraron oportunidades</p>
              <p className="text-sm">Ajusta los filtros o limpia tu búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: AI Insights */}
      <div className="hidden xl:flex w-80 shrink-0 flex-col sticky top-6">
        <Card className="h-[calc(100vh-140px)] flex flex-col border-[var(--primary-100)] shadow-sm overflow-hidden bg-gradient-to-b from-[var(--primary-50)]/50 to-white">
          <CardHeader className="pb-3 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-100)] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <CardTitle className="text-[var(--color-primary)] text-base font-semibold">Antü AI Insights</CardTitle>
                <p className="text-xs text-slate-500">Métricas analíticas del pipeline</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Alerta de Recientes */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm flex gap-3 group hover:border-rose-400 transition-colors cursor-default">
              <div className="mt-0.5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-none">Acción Inmediata</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  La oportunidad <strong>"Campaña Publicitaria Anual"</strong> ha ingresado hace menos de 4 horas por un valor de {formatCurrency(180000)}. Requiere asignación de pre-ventas urgente.
                </p>
              </div>
            </div>

            {/* AI Insight 1: Movimiento de Pipeline */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-50 shadow-sm flex gap-3 group hover:border-emerald-400 transition-colors cursor-default">
              <div className="mt-0.5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-none">Tracción en Propuestas</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gerente, hoy se movieron <strong>1 oportunidad</strong> a la columna de Propuesta y Negociación, inyectando <strong>{formatCurrency(750000)}</strong> adicionales al pipeline caliente.
                </p>
              </div>
            </div>

            {/* AI Insight 2: Deals Estancados */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-50 shadow-sm flex gap-3 group hover:border-amber-400 transition-colors cursor-default">
              <div className="mt-0.5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-none">Estancamiento de Columna</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hay <strong>{stalledOpps.length}</strong> {stalledOpps.length === 1 ? 'tarjeta estancada' : 'tarjetas estancadas'} en el tablero que superaron el umbral de 72 horas sin movimiento interno de etapas. Sugerimos agendar llamadas de destranque.
                </p>
              </div>
            </div>

            {/* IA Scoring y Probabilidad */}
            <div className="bg-[rgb(94,217,207)] rounded-xl p-4 text-white relative overflow-hidden shadow-lg mt-6">
              <Zap className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-10" />
              <h4 className="text-sm font-semibold mb-2 relative z-10 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Riesgo-Probabilidad
              </h4>
              <p className="text-xs text-teal-800 bg-white/40 p-2 rounded relative z-10 leading-relaxed mb-2 font-medium">
                Alerta: 1 proyecto de alto impacto (RD$120K+) presenta probabilidad crítica menor al 50%.
              </p>
              <p className="text-[10px] text-white/90 relative z-10 uppercase tracking-wide">
                El sistema aisló estos leads (Multi-tenant Lock).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity ? convertToModalOpportunity(selectedOpportunity) : null}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOpportunity(null);
        }}
        onViewCustomer={(customerId: string) => {
          const customer = customers.find(c => c.id === customerId);
          if (customer) {
            selectCustomer(customer);
            navigate('/clients');
          }
        }}
        onStageChange={(newStage) => {
          if (selectedOpportunity) {
            const updatedOpp = { ...selectedOpportunity, pipelineStage: newStage };

            // 1. Update the master list
            setOpportunities(prev => prev.map(opp =>
              opp.id === selectedOpportunity.id ? updatedOpp : opp
            ));

            // 2. Update the selected state so the Modal re-renders instantly
            setSelectedOpportunity(updatedOpp);

            toast.success(`Etapa actualizada a: ${newStage}`);
          }
        }}
        onMarkWon={() => {
          if (selectedOpportunity) {
            setIsDetailModalOpen(false);
            setIsCloseModalOpen(true);
          }
        }}
        onMarkLost={() => {
          if (selectedOpportunity) {
            setOpportunities(prev => prev.map(opp =>
              opp.id === selectedOpportunity.id
                ? { ...opp, stage: 'closed-lost' as OpportunityStage, pipelineStage: 'Cerrada Perdida' }
                : opp
            ));
            setIsDetailModalOpen(false);
            setSelectedOpportunity(null);
          }
        }}
        onEdit={() => {
          setIsDetailModalOpen(false);
          setIsFormModalOpen(true);
        }}
        onViewProducts={() => setIsProductModalOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        products={MOCK_PRODUCTS}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        quoteTotal={MOCK_PRODUCTS.reduce((sum, p) => sum + p.totalLinea, 0)}
        currency="DOP"
      />

      {/* Form Modal */}
      <OpportunityFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          if (!isDetailModalOpen) {
            setSelectedOpportunity(null);
          }
        }}
        onSave={(opp) => {
          if (selectedOpportunity) {
            setOpportunities(prev => prev.map(o => o.id === opp.id ? opp : o));
            setSelectedOpportunity(opp);
            // Re-open detail view after edit
            setIsDetailModalOpen(true);
          } else {
            handleSaveOpportunity(opp);
          }
        }}
        initialData={selectedOpportunity}
        customers={customers}
      />

      {/* Close Modal */}
      <OpportunityCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        opportunity={closeModalOpportunity}
        creditInfo={creditInfo}
        validationResult={validationResult}
        onConfirmClose={handleConfirmClose}
        onRequestCredit={() => {/* TODO */ }}
        onChangePaymentTerms={() => {/* TODO */ }}
      />
    </div>
  );
}
