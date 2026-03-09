// ============================================
// ANTU CRM - Contacts Page (Módulo Clientes)
// Dashboard Fortune 500 con AI Insights, Scoring, Acciones Masivas
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActivities } from '@/hooks/useActivities';
// import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Edit,
  Trash2,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Briefcase,
  Building2,
  LayoutGrid,
  List,
  User,
  Calendar,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type ContactStatus = 'active' | 'inactive' | 'prospect' | 'customer' | 'churned';
type AIInsightType = 'CRITICAL_ALERT' | 'FOLLOW_UP' | 'OPPORTUNITY' | 'ENGAGEMENT' | 'RISK';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile?: string;
  company: {
    id: string;
    name: string;
    industry?: string;
  };
  position: string;
  department?: string;
  location: string;
  status: ContactStatus;
  score: number;
  isMainContact: boolean;
  hasWhatsApp: boolean;
  lastActivity: {
    date: string;
    type: string;
    description: string;
    daysAgo: number;
  };
  pendingTasks: number;
  opportunities: {
    count: number;
    totalValue: number;
  };
  tags: string[];
  assignedTo: string;
  createdAt: string;
}

interface AIInsight {
  id: string;
  type: AIInsightType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  contactId?: string;
  action: {
    label: string;
    route?: string;
  };
}

interface ContactKPIs {
  total: number;
  active: number;
  prospects: number;
  customers: number;
  churned: number;
  mainContacts: number;
  withOpportunities: number;
  newThisMonth: number;
}

// ============================================
// MOCK DATA - CONTACTS
// ============================================

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@techcorp.com',
    phone: '+1 809-555-0123',
    mobile: '+1 809-555-0124',
    company: { id: 'c1', name: 'TechCorp Solutions', industry: 'Tecnología' },
    position: 'Director de Ventas',
    department: 'Comercial',
    location: 'Santo Domingo',
    status: 'active',
    score: 92,
    isMainContact: true,
    hasWhatsApp: true,
    lastActivity: { date: '2026-02-28T10:30:00Z', type: 'Llamada', description: 'Seguimiento de propuesta', daysAgo: 0 },
    pendingTasks: 2,
    opportunities: { count: 3, totalValue: 450000 },
    tags: ['VIP', 'Decision Maker', 'Tech'],
    assignedTo: 'Juan Pérez',
    createdAt: '2025-08-15T00:00:00Z',
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@solgraficas.com',
    phone: '+1 809-555-0456',
    company: { id: 'c2', name: 'Soluciones Gráficas SRL', industry: 'Impresión' },
    position: 'Gerente General',
    department: 'Dirección',
    location: 'Santiago',
    status: 'customer',
    score: 88,
    isMainContact: true,
    hasWhatsApp: true,
    lastActivity: { date: '2026-02-27T14:00:00Z', type: 'Email', description: 'Cotización enviada', daysAgo: 1 },
    pendingTasks: 1,
    opportunities: { count: 2, totalValue: 125000 },
    tags: ['Cliente', 'Recurrente'],
    assignedTo: 'María García',
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: '3',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@distcaribe.com',
    phone: '+1 809-555-0789',
    mobile: '+1 809-555-0790',
    company: { id: 'c3', name: 'Distribuidora del Caribe', industry: 'Logística' },
    position: 'Director de Compras',
    department: 'Operaciones',
    location: 'Puerto Plata',
    status: 'prospect',
    score: 72,
    isMainContact: false,
    hasWhatsApp: false,
    lastActivity: { date: '2026-02-25T09:00:00Z', type: 'Reunión', description: 'Primera reunión de descubrimiento', daysAgo: 3 },
    pendingTasks: 3,
    opportunities: { count: 1, totalValue: 85000 },
    tags: ['Nuevo Lead', 'Calificado'],
    assignedTo: 'Carlos López',
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: '4',
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@softwaresol.com',
    phone: '+1 809-555-0321',
    company: { id: 'c4', name: 'Software Solutions RD', industry: 'Software' },
    position: 'CEO',
    department: 'Dirección',
    location: 'Santo Domingo',
    status: 'customer',
    score: 95,
    isMainContact: true,
    hasWhatsApp: true,
    lastActivity: { date: '2026-02-28T08:15:00Z', type: 'WhatsApp', description: 'Confirmación de reunión', daysAgo: 0 },
    pendingTasks: 0,
    opportunities: { count: 4, totalValue: 680000 },
    tags: ['VIP', 'Enterprise', 'Referidor'],
    assignedTo: 'Juan Pérez',
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: '5',
    firstName: 'Luis',
    lastName: 'Santos',
    email: 'luis.santos@constructora.com',
    phone: '+1 809-555-0654',
    company: { id: 'c5', name: 'Constructora del Norte', industry: 'Construcción' },
    position: 'Gerente de Proyectos',
    department: 'Proyectos',
    location: 'La Vega',
    status: 'inactive',
    score: 45,
    isMainContact: false,
    hasWhatsApp: true,
    lastActivity: { date: '2026-02-10T11:00:00Z', type: 'Email', description: 'Sin respuesta', daysAgo: 18 },
    pendingTasks: 0,
    opportunities: { count: 0, totalValue: 0 },
    tags: ['En Riesgo'],
    assignedTo: 'María García',
    createdAt: '2024-11-20T00:00:00Z',
  },
  {
    id: '6',
    firstName: 'Carmen',
    lastName: 'Díaz',
    email: 'carmen.diaz@farmacia.com',
    phone: '+1 809-555-0987',
    mobile: '+1 809-555-0988',
    company: { id: 'c6', name: 'Farmacias Unidos', industry: 'Salud' },
    position: 'Gerente de Sucursal',
    department: 'Operaciones',
    location: 'San Cristóbal',
    status: 'active',
    score: 78,
    isMainContact: true,
    hasWhatsApp: true,
    lastActivity: { date: '2026-02-26T16:30:00Z', type: 'Llamada', description: 'Pedido de información', daysAgo: 2 },
    pendingTasks: 1,
    opportunities: { count: 1, totalValue: 45000 },
    tags: ['Retail', 'Salud'],
    assignedTo: 'Carlos López',
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '7',
    firstName: 'Pedro',
    lastName: 'Fernández',
    email: 'pedro.fernandez@agroindustrial.com',
    phone: '+1 809-555-1111',
    company: { id: 'c7', name: 'AgroIndustrial del Este', industry: 'Agricultura' },
    position: 'Director Comercial',
    department: 'Ventas',
    location: 'Higüey',
    status: 'prospect',
    score: 68,
    isMainContact: true,
    hasWhatsApp: false,
    lastActivity: { date: '2026-02-20T10:00:00Z', type: 'Email', description: 'Propuesta enviada', daysAgo: 8 },
    pendingTasks: 2,
    opportunities: { count: 1, totalValue: 120000 },
    tags: ['En Seguimiento'],
    assignedTo: 'Juan Pérez',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: '8',
    firstName: 'Sofía',
    lastName: 'Reyes',
    email: 'sofia.reyes@hotelcaribe.com',
    phone: '+1 809-555-2222',
    mobile: '+1 809-555-2223',
    company: { id: 'c8', name: 'Hotel Caribe Premium', industry: 'Turismo' },
    position: 'Gerente de Ventas',
    department: 'Comercial',
    location: 'Punta Cana',
    status: 'churned',
    score: 35,
    isMainContact: true,
    hasWhatsApp: true,
    lastActivity: { date: '2025-12-15T09:00:00Z', type: 'Llamada', description: 'Cancelación de servicio', daysAgo: 75 },
    pendingTasks: 0,
    opportunities: { count: 0, totalValue: 0 },
    tags: ['Churned', 'Recuperar'],
    assignedTo: 'María García',
    createdAt: '2023-02-01T00:00:00Z',
  },
];

// ============================================
// MOCK AI INSIGHTS
// ============================================

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'ai1',
    type: 'CRITICAL_ALERT',
    priority: 'CRITICAL',
    title: 'Cliente VIP sin actividad',
    description: 'Luis Santos (Constructora del Norte) lleva 18 días sin interacción. Riesgo alto de pérdida.',
    contactId: '5',
    action: { label: 'Contactar ahora', route: '/contacts/5' },
  },
  {
    id: 'ai2',
    type: 'FOLLOW_UP',
    priority: 'HIGH',
    title: 'Seguimiento pendiente',
    description: 'Pedro Fernández está esperando respuesta sobre la propuesta enviada hace 8 días.',
    contactId: '7',
    action: { label: 'Ver propuesta', route: '/contacts/7' },
  },
  {
    id: 'ai3',
    type: 'OPPORTUNITY',
    priority: 'MEDIUM',
    title: 'Oportunidad de expansión',
    description: 'Ana Martínez tiene 4 oportunidades activas. Sugerencia: presentar nuevo módulo Enterprise.',
    contactId: '4',
    action: { label: 'Ver oportunidades', route: '/opportunities?contact=4' },
  },
  {
    id: 'ai4',
    type: 'RISK',
    priority: 'HIGH',
    title: 'Cliente en riesgo de churn',
    description: 'Sofía Reyes canceló hace 75 días. Última actividad: Cancelación de servicio.',
    contactId: '8',
    action: { label: 'Ver historial', route: '/contacts/8' },
  },
];

// ============================================
// MOCK KPIs
// ============================================

const MOCK_KPIS: ContactKPIs = {
  total: 156,
  active: 89,
  prospects: 42,
  customers: 58,
  churned: 12,
  mainContacts: 67,
  withOpportunities: 43,
  newThisMonth: 8,
};

// ============================================
// AI INSIGHT CARD COMPONENT
// ============================================

function AIInsightCard({ insight }: { insight: AIInsight }) {
  const config = {
    CRITICAL_ALERT: {
      icon: AlertCircle,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-600',
    },
    FOLLOW_UP: {
      icon: Clock,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-600',
    },
    OPPORTUNITY: {
      icon: Sparkles,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-600',
    },
    ENGAGEMENT: {
      icon: TrendingUp,
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      iconColor: 'text-sky-500',
      titleColor: 'text-sky-700',
      badge: 'bg-sky-100 text-sky-600',
    },
    RISK: {
      icon: AlertCircle,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconColor: 'text-orange-500',
      titleColor: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-600',
    },
  };

  const { icon: Icon, bg, border, iconColor, titleColor, badge } = config[insight.type];

  return (
    <div className={cn('p-3 rounded-lg border', bg, border)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/80', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', badge)}>
              {insight.priority}
            </span>
          </div>
          <p className={cn('text-sm font-medium', titleColor)}>{insight.title}</p>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{insight.description}</p>
          <button className={cn('mt-2 text-xs font-medium flex items-center gap-1 hover:underline', titleColor)}>
            {insight.action.label}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONTACT CARD COMPONENT
// ============================================

interface ContactCardProps {
  contact: Contact;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick?: () => void;
  viewMode?: 'grid' | 'list';
}

function ContactCard({ contact, selected, onSelect, onClick, viewMode = 'grid' }: ContactCardProps) {
  const statusConfig: Record<ContactStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'Activo', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    inactive: { label: 'Inactivo', color: 'text-slate-600', bg: 'bg-slate-100' },
    prospect: { label: 'Prospecto', color: 'text-amber-600', bg: 'bg-amber-100' },
    customer: { label: 'Cliente', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--primary-100)]' },
    churned: { label: 'Perdido', color: 'text-[var(--user-highlight)]', bg: 'bg-[var(--user-highlight-opaque)]' },
  };

  const status = statusConfig[contact.status];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-slate-400';
  };

  if (viewMode === 'list') {
    return (
      <Card
        onClick={onClick}
        className={cn(
          'border transition-all duration-300 group cursor-pointer overflow-hidden relative flex flex-row items-center p-3 gap-4',
          selected ? 'border-[#5ED9CF] ring-2 ring-[#5ED9CF]/20 bg-[#5ED9CF]/5' : 'border-slate-200 hover:shadow-md hover:border-[#5ED9CF]/50 bg-white'
        )}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${contact.score >= 80 ? 'from-emerald-400 to-emerald-600' : contact.score >= 50 ? 'from-amber-400 to-amber-600' : 'from-slate-300 to-slate-400'}`} />

        <div onClick={(e) => e.stopPropagation()} className="pl-3">
          <Checkbox checked={selected} onCheckedChange={() => onSelect(contact.id)} />
        </div>

        <Avatar className="w-10 h-10 border border-slate-100 shadow-sm shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-[#5ED9CF] to-[#3dbab0] text-white text-sm font-bold">
            {getInitials(contact.firstName, contact.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 flex items-center gap-6">
          <div className="w-48 shrink-0">
            <h4 className="font-bold text-slate-800 truncate flex items-center gap-1.5 text-sm">
              {contact.firstName} {contact.lastName} {contact.isMainContact && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
            </h4>
            <div className="text-xs font-medium text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" /> {contact.company.name}
            </div>
          </div>

          <div className="hidden md:flex flex-col w-48 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
              <Mail className="w-3.5 h-3.5 text-[#5ED9CF]" /> {contact.email}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 truncate mt-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone}
            </div>
          </div>

          <div className="hidden lg:flex flex-wrap gap-1.5 flex-1 items-center">
            {contact.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold shadow-sm px-2">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 3 && <span className="text-[10px] text-slate-400 font-bold ml-1">+{contact.tags.length - 3}</span>}
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 pr-2">
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100', getScoreColor(contact.score))}>
            <Sparkles className="w-3 h-3 fill-current" />
            <span className="text-xs font-black">{contact.score}</span>
          </div>
          <Badge variant="secondary" className={cn('text-[10px] uppercase font-bold tracking-wider w-20 justify-center h-6', status.bg, status.color)}>
            {status.label}
          </Badge>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 border-slate-200 shadow-xl rounded-xl">
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Phone className="w-4 h-4 mr-2" /> Llamar</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Mail className="w-4 h-4 mr-2" /> Enviar email</DropdownMenuItem>
                <div className="h-px bg-slate-100 my-1" />
                <DropdownMenuItem className="cursor-pointer font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:!bg-rose-50 hover:!text-rose-700"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'border transition-all duration-300 group cursor-pointer overflow-hidden relative flex flex-col',
        selected ? 'border-[#5ED9CF] ring-2 ring-[#5ED9CF]/20' : 'border-slate-200 hover:shadow-xl hover:border-[#5ED9CF]/50 hover:-translate-y-1'
      )}
    >
      {/* Top Banner Gradient */}
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${contact.score >= 80 ? 'from-emerald-400 to-emerald-600' :
        contact.score >= 50 ? 'from-amber-400 to-amber-600' :
          'from-slate-300 to-slate-400'
        }`} />

      <CardContent className="p-5 flex flex-col h-full bg-white flex-1">
        {/* Header: Checkbox + Status + Dropdown */}
        <div className="flex items-center justify-between mb-4">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={() => onSelect(contact.id)} />
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant="secondary" className={cn('text-[10px] uppercase font-bold tracking-wider', status.bg, status.color)}>
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 border-slate-200 shadow-xl rounded-xl">
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Phone className="w-4 h-4 mr-2" /> Llamar</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:!bg-[#5ED9CF]/10 hover:!text-[#5ED9CF] focus:!bg-[#5ED9CF]/10 focus:!text-[#5ED9CF]"><Mail className="w-4 h-4 mr-2" /> Enviar email</DropdownMenuItem>
                <div className="h-px bg-slate-100 my-1" />
                <DropdownMenuItem className="cursor-pointer font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:!bg-rose-50 hover:!text-rose-700"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Identity Group */}
        <div className="flex flex-col items-center mb-5 shrink-0">
          <Avatar className="w-16 h-16 border-2 border-slate-100 shadow-sm mb-3">
            <AvatarFallback className="bg-gradient-to-br from-[#5ED9CF] to-[#3dbab0] text-white text-xl font-bold">
              {getInitials(contact.firstName, contact.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h4 className="font-bold text-slate-800 text-lg leading-tight flex items-center justify-center gap-1.5">
              {contact.firstName} {contact.lastName}
              {contact.isMainContact && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
            </h4>
            <div className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              {contact.company.name}
            </div>
            <p className="text-xs text-[#5ED9CF] font-bold mt-0.5">{contact.position}</p>
          </div>
        </div>

        {/* Contact info Box */}
        <div className="space-y-2 mb-5 px-3 py-3 bg-slate-50/50 rounded-xl border border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5 text-[#5ED9CF]" />
            </div>
            <span className="truncate flex-1 font-medium text-slate-700">{contact.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="font-medium text-slate-700">{contact.phone}</span>
          </div>
          {contact.mobile && (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="font-medium text-slate-700">{contact.mobile}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold shadow-sm px-2">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer Metrics */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">AI Score</span>
              <div className={cn('flex items-center gap-1.5', getScoreColor(contact.score))}>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="text-sm font-black leading-none">{contact.score}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                {contact.lastActivity.daysAgo === 0 ? 'Hoy' : contact.lastActivity.daysAgo === 1 ? 'Ayer' : `Hace ${contact.lastActivity.daysAgo} días`}
                <Clock className="w-3 h-3" />
              </span>
              {contact.opportunities.count > 0 ? (
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-500" /> {contact.opportunities.count} Opps
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-300">Sin opps</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

function KPICard({ title, value, icon: Icon, color, trend }: KPICardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{title}</p>
            {trend !== undefined && (
              <p className={cn('text-xs mt-1', trend >= 0 ? 'text-emerald-600' : 'text-[var(--user-highlight)]')}>
                {trend >= 0 ? '+' : ''}{trend}% vs mes anterior
              </p>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// NEW CONTACT FORM
// ============================================

function NewContactForm({ onClose, onSave }: { onClose: () => void; onSave: (contact: Partial<Contact>) => void }) {
  const [formData, setFormData] = useState<Partial<Contact>>({
    status: 'prospect',
    isMainContact: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header Frictionless */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Gestión de Contactos</p>
            <DialogTitle className="font-bold text-slate-800 text-lg m-0">
              Crear Nuevo Contacto
            </DialogTitle>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
        <form id="contact-form" onSubmit={handleSubmit} className="space-y-8">

          {/* Detalles Principales */}
          <div className="space-y-4">
            <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
              Información Personal
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="firstName" className="text-xs font-semibold text-slate-500 uppercase">
                  Nombre <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej: Laura"
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="lastName" className="text-xs font-semibold text-slate-500 uppercase">
                  Apellido <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej: Núñez"
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 min-w-0 md:col-span-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase">
                  Email <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="laura.nunez@empresa.com"
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-500 uppercase">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 809-000-0000"
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="position" className="text-xs font-semibold text-slate-500 uppercase">
                  Cargo
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="position"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ej: Gerente de Finanzas"
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Contexto Empresarial */}
          <div className="space-y-4 bg-slate-50/50 -mx-6 px-6 py-6 pb-4 border-y border-slate-50">
            <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
              Relación Empresarial
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="company" className="text-xs font-semibold text-slate-500 uppercase">
                  Empresa Vinculada
                </Label>
                <Select
                  value={formData.company?.id}
                  onValueChange={(val) => setFormData({ ...formData, company: { id: val, name: val === 'c1' ? 'TechCorp Solutions' : val === 'c2' ? 'Soluciones Gráficas SRL' : 'Distribuidora del Caribe' } })}
                >
                  <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg">
                    <SelectValue placeholder="Seleccionar empresa vinculada..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    <SelectItem value="c1" className="cursor-pointer font-medium">TechCorp Solutions</SelectItem>
                    <SelectItem value="c2" className="cursor-pointer font-medium">Soluciones Gráficas SRL</SelectItem>
                    <SelectItem value="c3" className="cursor-pointer font-medium">Distribuidora del Caribe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-500 uppercase">
                  Estado Inicial
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    <SelectItem value="prospect" className="cursor-pointer font-medium"><span className="flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> Prospecto</span></SelectItem>
                    <SelectItem value="active" className="cursor-pointer font-medium"><span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activo</span></SelectItem>
                    <SelectItem value="customer" className="cursor-pointer font-medium"><span className="flex items-center gap-2"><Star className="w-4 h-4 text-[var(--color-primary)]" /> Cliente</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center h-full pt-6">
                <div className="flex items-center gap-3 bg-white p-3 pr-4 border border-slate-200 shadow-sm rounded-xl">
                  <Checkbox
                    id="mainContact"
                    checked={formData.isMainContact}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMainContact: !!checked })}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <Label htmlFor="mainContact" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Contacto Principal
                  </Label>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>

      {/* Action Footer Frictionless */}
      <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
        <Button type="button" variant="ghost" onClick={onClose} className="font-semibold text-slate-500 hover:text-slate-700 h-11 px-6">
          Cancelar
        </Button>
        <Button
          type="submit"
          form="contact-form"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 h-11 rounded-lg"
        >
          Guardar Contacto
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN CONTACTS PAGE
// ============================================

export function ContactsPage() {
  const { t } = useTranslation();
  const { addActivity } = useActivities();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewContact, setShowNewContact] = useState(false);
  const [selectedContactForDetails, setSelectedContactForDetails] = useState<Contact | null>(null);

  // Load contacts from API (multi-tenant: X-Tenant-ID sent automatically)
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/contacts');
      // Backend returns ContactsDashboard with contacts array
      const apiContacts = (response.contacts || response || []).map((c: any) => ({
        id: c.id,
        firstName: c.fullName?.split(' ')[0] || c.firstName || 'Sin nombre',
        lastName: c.fullName?.split(' ').slice(1).join(' ') || c.lastName || '',
        email: c.email || '',
        phone: c.phone || '',
        mobile: c.mobile || undefined,
        company: c.company || { id: 'unknown', name: 'Sin empresa' },
        position: c.jobTitle || c.position || 'N/A',
        location: c.address?.city || 'República Dominicana',
        status: c.status || 'active',
        score: c.score || 50,
        isMainContact: c.isMainContact || false,
        hasWhatsApp: c.hasWhatsApp || false,
        lastActivity: c.lastActivity || {
          date: c.updatedAt || new Date().toISOString(),
          type: 'Actualización',
          description: 'Última actualización',
          daysAgo: 0,
        },
        pendingTasks: c.pendingTasks || 0,
        opportunities: c.opportunities || { count: 0, totalValue: 0 },
        tags: (c.tags || []).map((t: any) => typeof t === 'string' ? t : t.name),
        assignedTo: c.assignedTo?.name || 'Sin asignar',
        createdAt: c.createdAt || new Date().toISOString(),
      }));
      setContacts(apiContacts);
    } catch (error: any) {
      console.warn('⚠️ Backend unreachable for contacts, using local data:', error.message);
      // Fallback to localStorage / mock data
      const saved = localStorage.getItem('antu_contacts');
      if (saved) {
        setContacts(JSON.parse(saved));
      } else {
        setContacts(MOCK_CONTACTS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleCreateContact = async (newContact: Partial<Contact>) => {
    try {
      // Try creating via the real backend API
      await api.post<any>('/contacts', {
        firstName: newContact.firstName || 'Sin nombre',
        lastName: newContact.lastName || 'Sin apellido',
        email: newContact.email || '',
        phone: newContact.phone || '',
        jobTitle: newContact.position || '',
        companyId: newContact.company?.id || undefined,
        isMainContact: !!newContact.isMainContact,
        tags: ['Nuevo'],
      });
      toast.success('Contacto creado exitosamente');
      // Reload contacts from API to get full data
      loadContacts();
    } catch (error: any) {
      console.warn('⚠️ Backend unreachable, creating contact locally:', error.message);
      // Fallback: create locally
      const contact: Contact = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: newContact.firstName || 'Sin nombre',
        lastName: newContact.lastName || 'Sin apellido',
        email: newContact.email || '',
        phone: newContact.phone || '',
        company: newContact.company || { id: 'unknown', name: 'Sin empresa' },
        position: newContact.position || 'N/A',
        location: 'Santo Domingo',
        status: newContact.status || 'prospect',
        score: 50,
        isMainContact: !!newContact.isMainContact,
        hasWhatsApp: false,
        lastActivity: {
          date: new Date().toISOString(),
          type: 'Creación',
          description: 'Contacto creado',
          daysAgo: 0,
        },
        pendingTasks: 0,
        opportunities: { count: 0, totalValue: 0 },
        tags: ['Nuevo'],
        assignedTo: 'Sin asignar',
        createdAt: new Date().toISOString(),
      };
      setContacts([contact, ...contacts]);
      localStorage.setItem('antu_contacts', JSON.stringify([contact, ...contacts]));
      toast.success('Contacto creado localmente');
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'my' && contact.assignedTo === 'Juan Pérez') ||
      (activeTab === 'with-opportunities' && contact.opportunities.count > 0) ||
      (activeTab === 'at-risk' && contact.lastActivity.daysAgo > 14);

    return matchesSearch && matchesStatus && matchesTab;
  }).sort((a, b) => {
    // 1. Prioritize active and prospect contacts
    const aIsActive = a.status === 'active' || a.status === 'prospect';
    const bIsActive = b.status === 'active' || b.status === 'prospect';

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // 2. Sort by most recent activity (fewer daysAgo = more recent = higher in list)
    return (a.lastActivity?.daysAgo ?? 999) - (b.lastActivity?.daysAgo ?? 999);
  });

  const toggleContactSelection = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('navigation.contacts')}</h1>
          <p className="text-slate-500 mt-1">Gestiona tu base de datos de contactos y prospectos</p>
        </div>
        <Dialog open={showNewContact} onOpenChange={setShowNewContact}>
          <DialogTrigger asChild>
            <Button className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo contacto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl block text-left">
            <NewContactForm
              onClose={() => setShowNewContact(false)}
              onSave={handleCreateContact}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard title="Total" value={MOCK_KPIS.total} icon={Users} color="bg-slate-500" trend={5} />
        <KPICard title="Activos" value={MOCK_KPIS.active} icon={CheckCircle2} color="bg-emerald-500" />
        <KPICard title="Prospectos" value={MOCK_KPIS.prospects} icon={Target} color="bg-amber-500" />
        <KPICard title="Clientes" value={MOCK_KPIS.customers} icon={Star} color="bg-[var(--color-primary)]" />
        <KPICard title="Principales" value={MOCK_KPIS.mainContacts} icon={Zap} color="bg-violet-500" />
        <KPICard title="Con Opps" value={MOCK_KPIS.withOpportunities} icon={BarChart3} color="bg-sky-500" />
        <KPICard title="Nuevos" value={MOCK_KPIS.newThisMonth} icon={TrendingUp} color="bg-emerald-500" trend={12} />
        <KPICard title="Perdidos" value={MOCK_KPIS.churned} icon={AlertCircle} color="bg-[var(--user-highlight-hover)]" trend={-3} />
      </div>

      {/* AI Insights */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Insights de IA</CardTitle>
              <p className="text-xs text-slate-500">Acciones recomendadas basadas en tu base de datos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_AI_INSIGHTS.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters & Tabs */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar contactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 gap-6">
                <TabsTrigger value="all" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none py-2 px-1 font-bold text-xs uppercase tracking-wider">Todos</TabsTrigger>
                <TabsTrigger value="my" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none py-2 px-1 font-bold text-xs uppercase tracking-wider">Mis contactos</TabsTrigger>
                <TabsTrigger value="with-opportunities" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none py-2 px-1 font-bold text-xs uppercase tracking-wider">Con oportunidades</TabsTrigger>
                <TabsTrigger value="at-risk" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none py-2 px-1 font-bold text-xs uppercase tracking-wider">En riesgo</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status Filter and View Mode */}
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="prospect">Prospectos</SelectItem>
                  <SelectItem value="customer">Clientes</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="churned">Perdidos</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 ml-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={cn("h-8 w-8 rounded-md transition-all shadow-none", viewMode === 'grid' ? "bg-white shadow-sm text-[#5ED9CF]" : "text-slate-400 hover:text-slate-600")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={cn("h-8 w-8 rounded-md transition-all shadow-none", viewMode === 'list' ? "bg-white shadow-sm text-[#5ED9CF]" : "text-slate-400 hover:text-slate-600")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <Card className="border-[var(--color-primary)] bg-[var(--primary-50)]">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-slate-700">
                {selectedContacts.length} contacto(s) seleccionado(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Asignar
              </Button>
              <Button variant="outline" size="sm">
                <TagIcon className="w-4 h-4 mr-2" />
                Etiquetar
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email masivo
              </Button>
              <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => setSelectedContacts([])}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Grid */}
      <div className="space-y-3">
        {/* Header with select all */}
        <div className="flex items-center gap-3 px-2">
          <Checkbox
            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
            onCheckedChange={toggleAllSelection}
          />
          <span className="text-sm text-slate-500">
            {filteredContacts.length} contacto(s) encontrado(s)
          </span>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)] mt-4">
          <div className={cn("px-1 pb-6 grid", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "grid-cols-1 gap-3")}>
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                selected={selectedContacts.includes(contact.id)}
                onSelect={toggleContactSelection}
                onClick={() => setSelectedContactForDetails(contact)}
                viewMode={viewMode}
              />
            ))}
          </div>

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">No se encontraron contactos</p>
              <p className="text-slate-400 text-sm mt-1">Intenta con otra búsqueda o filtros</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedContactForDetails} onOpenChange={(open) => !open && setSelectedContactForDetails(null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl h-[90vh] p-0 overflow-hidden bg-white border-slate-200 shadow-2xl flex flex-col">
          {selectedContactForDetails && (
            <>
              {/* Header idéntico a Oportunidades */}
              <DialogHeader className="px-5 md:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] flex items-center justify-center border border-[var(--primary-100)] shrink-0 shadow-sm text-[var(--color-primary)]">
                      <span className="font-bold text-lg">{selectedContactForDetails.firstName[0]}{selectedContactForDetails.lastName[0]}</span>
                    </div>
                    <div>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                        {selectedContactForDetails.firstName} {selectedContactForDetails.lastName}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1 md:mt-1.5 text-xs md:text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {selectedContactForDetails.company.name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{selectedContactForDetails.position}</span>
                      </div>
                    </div>
                  </div>
                  {/* Botones superiores eliminados por duplicidad */}
                </div>
              </DialogHeader>

              {/* Tabs */}
              <Tabs defaultValue="detalles" className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 border-b border-slate-100 bg-white shrink-0 overflow-x-auto hide-scrollbar">
                  <TabsList className="bg-transparent p-0 h-11 border-b-0 space-x-6 md:space-x-8">
                    <TabsTrigger value="detalles" className="px-1 py-3 text-sm font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors uppercase tracking-wider text-[11px]">
                      Detalles de Contacto
                    </TabsTrigger>
                    <TabsTrigger value="progreso" className="px-1 py-3 text-sm font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors uppercase tracking-wider text-[11px]">
                      Oportunidades
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="px-1 py-3 text-sm font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors uppercase tracking-wider text-[11px]">
                      Actividad
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 min-h-0">
                  <TabsContent value="detalles" className="m-0 border-0 p-0 outline-none">
                    <div className="p-4 md:p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Health Card Premium */}
                          <div className={`p-4 rounded-xl border shadow-sm relative overflow-hidden ${selectedContactForDetails.score >= 80 ? 'bg-emerald-50/30 border-emerald-100' :
                            selectedContactForDetails.score >= 50 ? 'bg-amber-50/30 border-amber-100' :
                              'bg-slate-50 border-slate-200'
                            }`}>
                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 blur-2xl pointer-events-none"
                              style={{ background: selectedContactForDetails.score >= 80 ? 'var(--color-emerald-100, #d1fae5)' : selectedContactForDetails.score >= 50 ? 'var(--color-amber-100, #fef3c7)' : 'var(--color-slate-100, #f1f5f9)' }} />
                            <div className="relative z-10">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div>
                                  <div className={`flex items-center gap-1.5 mb-0.5 ${selectedContactForDetails.score >= 80 ? 'text-emerald-600' :
                                    selectedContactForDetails.score >= 50 ? 'text-amber-600' :
                                      'text-rose-600'
                                    }`}>
                                    <Sparkles className="w-4 h-4 fill-current" />
                                    <h3 className="font-bold text-sm text-slate-800">Antü AI Score & Salud</h3>
                                  </div>
                                  <p className="text-xs text-slate-500 pl-6">
                                    Basado en interacciones recientes e inteligencia predictiva.
                                  </p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end pl-6 sm:pl-0">
                                  <span className={`text-2xl font-black tracking-tight leading-none ${selectedContactForDetails.score >= 80 ? 'text-emerald-600' :
                                    selectedContactForDetails.score >= 50 ? 'text-amber-600' :
                                      'text-rose-600'
                                    }`}>
                                    {selectedContactForDetails.score}
                                    <span className="text-sm text-slate-400 font-semibold ml-1">/ 100</span>
                                  </span>
                                </div>
                              </div>

                              <div className="pl-6 pr-2">
                                <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden w-full shadow-inner">
                                  <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${selectedContactForDetails.score >= 80 ? 'from-emerald-400 to-emerald-600' :
                                    selectedContactForDetails.score >= 50 ? 'from-amber-400 to-amber-600' :
                                      'from-slate-300 to-slate-400'
                                    }`} style={{ width: `${selectedContactForDetails.score}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <span>Riesgo</span>
                                  <span className={
                                    selectedContactForDetails.score >= 80 ? 'text-emerald-600' :
                                      selectedContactForDetails.score >= 50 ? 'text-amber-600' :
                                        'text-rose-600'
                                  }>
                                    {selectedContactForDetails.score >= 80 ? 'Excelente' :
                                      selectedContactForDetails.score >= 50 ? 'Regular' : 'Crítico'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info Premium Grid */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 mb-3 border-b border-slate-100 pb-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Información de Contacto
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5 font-semibold flex items-center gap-1"><Mail className="w-3 h-3" /> Email Institucional</p>
                                <p className="text-xs font-semibold text-slate-800 break-words hover:text-[var(--color-primary)] cursor-pointer transition-colors">{selectedContactForDetails.email}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5 font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono Directo</p>
                                <p className="text-xs font-semibold text-slate-800 hover:text-[var(--color-primary)] cursor-pointer transition-colors">{selectedContactForDetails.phone}</p>
                              </div>
                              {selectedContactForDetails.mobile && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5 font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3 text-emerald-500" /> Celular / WhatsApp</p>
                                  <p className="text-xs font-semibold text-slate-800 hover:text-emerald-600 cursor-pointer transition-colors">{selectedContactForDetails.mobile}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> Ubicación Fija</p>
                                <p className="text-xs font-semibold text-slate-800">{selectedContactForDetails.location}</p>
                              </div>
                            </div>
                          </div>

                          {/* Relación Comercial */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 mb-3 border-b border-slate-100 pb-2">
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              Contexto Empresarial
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Sector / Industria</p>
                                <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">{selectedContactForDetails.company.industry || 'Tecnología y Servicios'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Departamento Funcional</p>
                                <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">{selectedContactForDetails.department || selectedContactForDetails.position}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Notas del Perfil</p>
                              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                                Contacto clave para la toma de decisiones estratégicas. Muestra un nivel alto de influencia técnica en su departamento. Importante realizar un seguimiento mensual para mantener relación y ofrecer upselling de infraestructura.
                              </p>
                            </div>
                          </div>

                          {/* Quick Activity Scheduler */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 mb-4 border-b border-slate-100 pb-2">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              Agendar Seguimiento
                            </h3>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <Button
                                variant="outline"
                                className="h-14 flex flex-col items-center justify-center gap-1 bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all rounded-xl"
                                onClick={() => {
                                  addActivity({
                                    title: `Llamada de seguimiento: ${selectedContactForDetails.firstName}`,
                                    type: 'CALL',
                                    status: 'PENDING',
                                    priority: 'MEDIUM',
                                    dueDate: new Date(),
                                    dueTime: '10:00',
                                    reminderMinutes: 15,
                                    customerId: selectedContactForDetails.id,
                                    customerName: `${selectedContactForDetails.firstName} ${selectedContactForDetails.lastName}`,
                                    assignedTo: 'user1'
                                  });
                                }}
                              >
                                <Phone className="w-5 h-5 text-blue-500" />
                                <span className="text-[10px] font-bold uppercase">Llamada</span>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-14 flex flex-col items-center justify-center gap-1 bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all rounded-xl"
                                onClick={() => {
                                  addActivity({
                                    title: `Enviar correo a: ${selectedContactForDetails.firstName}`,
                                    type: 'EMAIL',
                                    status: 'PENDING',
                                    priority: 'LOW',
                                    dueDate: new Date(),
                                    dueTime: '11:00',
                                    reminderMinutes: 15,
                                    customerId: selectedContactForDetails.id,
                                    customerName: `${selectedContactForDetails.firstName} ${selectedContactForDetails.lastName}`,
                                    assignedTo: 'user1'
                                  });
                                }}
                              >
                                <Mail className="w-5 h-5 text-emerald-500" />
                                <span className="text-[10px] font-bold uppercase">Correo</span>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-14 flex flex-col items-center justify-center gap-1 bg-slate-50 border-slate-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all rounded-xl"
                                onClick={() => {
                                  addActivity({
                                    title: `Reunión presencial/virtual: ${selectedContactForDetails.firstName}`,
                                    type: 'MEETING',
                                    status: 'PENDING',
                                    priority: 'HIGH',
                                    dueDate: new Date(),
                                    dueTime: '15:00',
                                    reminderMinutes: 30,
                                    customerId: selectedContactForDetails.id,
                                    customerName: `${selectedContactForDetails.firstName} ${selectedContactForDetails.lastName}`,
                                    assignedTo: 'user1'
                                  });
                                }}
                              >
                                <Users className="w-5 h-5 text-violet-500" />
                                <span className="text-[10px] font-bold uppercase">Reunión</span>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-14 flex flex-col items-center justify-center gap-1 bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all rounded-xl"
                                onClick={() => {
                                  addActivity({
                                    title: `Mensaje WhatsApp: ${selectedContactForDetails.firstName}`,
                                    type: 'WHATSAPP',
                                    status: 'PENDING',
                                    priority: 'MEDIUM',
                                    dueDate: new Date(),
                                    dueTime: '13:00',
                                    reminderMinutes: 15,
                                    customerId: selectedContactForDetails.id,
                                    customerName: `${selectedContactForDetails.firstName} ${selectedContactForDetails.lastName}`,
                                    assignedTo: 'user1'
                                  });
                                }}
                              >
                                <MessageSquare className="w-5 h-5 text-amber-500" />
                                <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                              </Button>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">IA Sugiere</span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-700">Llamar mañana 10:00 AM</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">

                          {/* Account Details Panel */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-500 mb-1">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              Detalles de Cuenta
                            </h3>

                            <div className="space-y-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estado Inteligente</span>
                                <Badge variant="outline" className={cn("font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 w-max", selectedContactForDetails.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
                                  {selectedContactForDetails.status}
                                </Badge>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Oportunidades</span>
                                <span className="text-xs font-bold text-[var(--color-primary)]">
                                  {selectedContactForDetails.opportunities.count} Activas
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Responsable asignado</span>
                                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Avatar className="w-5 h-5"><AvatarFallback className="bg-slate-200 text-[10px] text-slate-600">{selectedContactForDetails.assignedTo.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                  {selectedContactForDetails.assignedTo}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fecha de Alta</span>
                                <span className="text-xs font-medium text-slate-700">{new Date(selectedContactForDetails.createdAt).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Segmentación y Etiquetas */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-slate-400" />
                              Segmentación
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedContactForDetails.isMainContact && (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-1 text-[10px] shadow-sm">
                                  <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" /> Principal
                                </Badge>
                              )}
                              {selectedContactForDetails.tags.map(t => (
                                <Badge key={t} variant="secondary" className="bg-slate-50 border border-slate-200 text-slate-700 font-medium px-2 py-1 text-[10px] shadow-sm">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Acciones Inmediatas
                            </h3>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full justify-start text-slate-700 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 font-medium transition-all h-9 shadow-sm border text-[11px] sm:text-[11px] px-3"
                                onClick={() => {
                                  setSelectedContactForDetails(null);
                                  setShowNewContact(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                Editar Registro Completo
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 font-medium transition-all h-9 shadow-sm border text-[11px] sm:text-[11px] px-3"
                                onClick={() => window.location.href = `mailto:${selectedContactForDetails.email}`}
                              >
                                <Mail className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                Enviar Correo
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 font-bold transition-all h-9 shadow-sm border text-[11px] sm:text-[11px] px-3"
                                onClick={() => setSelectedContactForDetails(null)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                Cerrar Ficha
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="progreso" className="m-0 border-0 outline-none">
                    <div className="p-4 md:p-6 lg:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Oportunidades de Negocio</h3>
                          <p className="text-sm text-slate-500 mt-1">Este contacto tiene {selectedContactForDetails.opportunities.count} oportunidades activas por un valor de ${selectedContactForDetails.opportunities.totalValue.toLocaleString()}</p>
                        </div>
                        <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-white shadow-sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva Oportunidad
                        </Button>
                      </div>

                      {selectedContactForDetails.opportunities.count > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {[...Array(selectedContactForDetails.opportunities.count)].map((_, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                    {i === 0 ? `Renovación de Licencias Enterprise - ${selectedContactForDetails.company.name}` : `Upselling Servicios Cloud - Fase ${i + 1}`}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> En 15 días</span>
                                    <span>•</span>
                                    <span className="font-semibold text-emerald-600">${(selectedContactForDetails.opportunities.totalValue / selectedContactForDetails.opportunities.count).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-600 font-medium">No hay oportunidades activas</p>
                          <p className="text-sm text-slate-400 mt-1">Crea una nueva oportunidad para este contacto.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="historial" className="m-0 border-0 outline-none">
                    <div className="p-4 md:p-6 lg:p-8">
                      <div className="mb-6 focus:outline-none focus:ring-0">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Historial de Actividad</h3>
                        <p className="text-sm text-slate-500 mt-1">Línea de tiempo de interacciones con {selectedContactForDetails.firstName}</p>
                      </div>

                      <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                        <div className="relative">
                          <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-slate-200 ring-4 ring-white" />
                          <p className="text-xs font-semibold text-slate-400 mb-2">Hace {selectedContactForDetails.lastActivity.daysAgo === 0 ? 'unas horas' : `${selectedContactForDetails.lastActivity.daysAgo} días`}</p>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                              {selectedContactForDetails.lastActivity.type === 'Email' ? <Mail className="w-4 h-4 text-blue-500" /> :
                                selectedContactForDetails.lastActivity.type === 'WhatsApp' ? <MessageSquare className="w-4 h-4 text-emerald-500" /> :
                                  selectedContactForDetails.lastActivity.type === 'Llamada' ? <Phone className="w-4 h-4 text-amber-500" /> :
                                    <Zap className="w-4 h-4 text-violet-500" />}
                              {selectedContactForDetails.lastActivity.type}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">{selectedContactForDetails.lastActivity.description}</p>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-white" />
                          <p className="text-xs font-semibold text-slate-400 mb-2">{new Date(selectedContactForDetails.createdAt).toLocaleDateString('es-DO', { month: 'long', day: 'numeric' })}</p>
                          <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                            <p className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Creación del Contacto
                            </p>
                            <p className="text-emerald-600/80 text-sm mt-1">El contacto fue importado o registrado en la plataforma por {selectedContactForDetails.assignedTo}.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}

// Tag icon helper
function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  );
}

export default ContactsPage;
