// ============================================
// ANTU CRM - Módulo de Vendedores
// Dashboard de ventas por vendedor individual
// Acceso: ADMIN y MANAGER únicamente
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Award,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  User,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import { useQuotaConfig } from '@/hooks/useQuotaConfig';
import { useAuth } from '@/hooks/useAuth';
import { Users as UsersIcon } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface FunnelStage {
  name: string;
  value: number;
  count: number;
  conversion: number | null;
  avgDays: number | null;
}

interface AIInsight {
  type: 'warning' | 'opportunity' | 'forecast';
  message: string;
  suggestion: string;
  action: string;
}

interface SalesData {
  kpis: {
    pipelineTotal: { value: number; change: number; previous: number };
    cierreMes: { actual: number; cuota: number; percentage: number };
    tasaConversion: { value: number; change: number; previous: number };
    promedioDeal: { value: number; change: number; previous: number };
  };
  funnel: {
    stages: FunnelStage[];
  };
  nextMonth: {
    cuota: number;
    pipeline: number;
    coverage: number;
    weighted: {
      alto: { value: number; probability: number };
      medio: { value: number; probability: number };
      bajo: { value: number; probability: number };
    };
    forecast: { min: number; max: number; confidence: number };
  };
  topVendedores: { name: string; value: number; percentage: number }[];
  aiInsights: AIInsight[];
}

interface Vendedor {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  active: boolean;
  joinDate: string;
}

// ============================================
// MOCK DATA - VENDEDORES
// ============================================

const VENDEDORES_FALLBACK: Vendedor[] = [
  {
    id: 'v1',
    name: 'María García',
    email: 'maria.garcia@antu.crm',
    phone: '809-555-0101',
    role: 'Vendedor Senior',
    active: true,
    joinDate: '2023-03-15',
  },
  {
    id: 'v2',
    name: 'Juan Pérez',
    email: 'juan.perez@antu.crm',
    phone: '809-555-0102',
    role: 'Vendedor',
    active: true,
    joinDate: '2023-06-20',
  },
  {
    id: 'v3',
    name: 'Carlos López',
    email: 'carlos.lopez@antu.crm',
    phone: '809-555-0103',
    role: 'Vendedor',
    active: true,
    joinDate: '2024-01-10',
  },
  {
    id: 'v4',
    name: 'Ana Martínez',
    email: 'ana.martinez@antu.crm',
    phone: '809-555-0104',
    role: 'Vendedora',
    active: true,
    joinDate: '2024-05-15',
  },
];

// ============================================
// MOCK DATA - SALES BY VENDEDOR
// ============================================

const SALES_BY_VENDEDOR: Record<string, SalesData> = {
  v1: {
    kpis: {
      pipelineTotal: { value: 980000, change: 22, previous: 803279 },
      cierreMes: { actual: 450000, cuota: 400000, percentage: 112 },
      tasaConversion: { value: 28.5, change: 4.2, previous: 24.3 },
      promedioDeal: { value: 52000, change: 12, previous: 46429 },
    },
    funnel: {
      stages: [
        { name: 'Calificar', value: 520000, count: 22, conversion: 31.8, avgDays: 4 },
        { name: 'Desarrollar', value: 380000, count: 14, conversion: 28.6, avgDays: 10 },
        { name: 'Proponer', value: 280000, count: 8, conversion: 50, avgDays: 7 },
        { name: 'Cerrar', value: 180000, count: 5, conversion: 40, avgDays: 12 },
        { name: 'Ganada', value: 450000, count: 2, conversion: null, avgDays: null },
      ],
    },
    nextMonth: {
      cuota: 450000,
      pipeline: 680000,
      coverage: 151,
      weighted: {
        alto: { value: 320000, probability: 70 },
        medio: { value: 240000, probability: 52 },
        bajo: { value: 120000, probability: 30 },
      },
      forecast: { min: 380000, max: 450000, confidence: 85 },
    },
    topVendedores: [],
    aiInsights: [
      {
        type: 'opportunity',
        message: 'María está 12% por encima de su cuota mensual',
        suggestion: 'Reconocer su desempeño y asignar leads adicionales',
        action: 'Ver detalle',
      },
      {
        type: 'warning',
        message: 'Tiene 2 oportunidades en "Cerrar" >20 días',
        suggestion: 'Coaching para acelerar cierre de deals',
        action: 'Ver oportunidades',
      },
      {
        type: 'forecast',
        message: 'Forecast: 85% probabilidad de superar cuota próximo mes',
        suggestion: 'Pipeline saludable con buena distribución',
        action: 'Ver análisis',
      },
    ],
  },
  v2: {
    kpis: {
      pipelineTotal: { value: 720000, change: 8, previous: 666667 },
      cierreMes: { actual: 380000, cuota: 400000, percentage: 95 },
      tasaConversion: { value: 22.3, change: -1.5, previous: 23.8 },
      promedioDeal: { value: 42000, change: -3, previous: 43299 },
    },
    funnel: {
      stages: [
        { name: 'Calificar', value: 380000, count: 16, conversion: 25, avgDays: 6 },
        { name: 'Desarrollar', value: 280000, count: 10, conversion: 20, avgDays: 14 },
        { name: 'Proponer', value: 180000, count: 4, conversion: 25, avgDays: 9 },
        { name: 'Cerrar', value: 120000, count: 2, conversion: 50, avgDays: 18 },
        { name: 'Ganada', value: 380000, count: 2, conversion: null, avgDays: null },
      ],
    },
    nextMonth: {
      cuota: 400000,
      pipeline: 520000,
      coverage: 130,
      weighted: {
        alto: { value: 220000, probability: 68 },
        medio: { value: 180000, probability: 45 },
        bajo: { value: 120000, probability: 25 },
      },
      forecast: { min: 280000, max: 350000, confidence: 72 },
    },
    topVendedores: [],
    aiInsights: [
      {
        type: 'warning',
        message: 'Juan está 5% por debajo de su cuota',
        suggestion: 'Necesita cerrar 1 deal de RD$ 20K+ para alcanzar meta',
        action: 'Ver oportunidades',
      },
      {
        type: 'opportunity',
        message: 'Tasa de conversión Calificar→Desarrollar es 25%',
        suggestion: 'Oportunidad de mejora en qualifying vs 31% promedio',
        action: 'Ver análisis',
      },
      {
        type: 'forecast',
        message: 'Forecast: 72% probabilidad de alcanzar cuota',
        suggestion: 'Pipeline necesita más oportunidades en etapa alta',
        action: 'Ver forecast',
      },
    ],
  },
  v3: {
    kpis: {
      pipelineTotal: { value: 450000, change: -5, previous: 473684 },
      cierreMes: { actual: 290000, cuota: 350000, percentage: 83 },
      tasaConversion: { value: 19.8, change: -2.1, previous: 21.9 },
      promedioDeal: { value: 38000, change: -8, previous: 41304 },
    },
    funnel: {
      stages: [
        { name: 'Calificar', value: 240000, count: 12, conversion: 16.7, avgDays: 7 },
        { name: 'Desarrollar', value: 180000, count: 8, conversion: 25, avgDays: 16 },
        { name: 'Proponer', value: 120000, count: 3, conversion: 33.3, avgDays: 10 },
        { name: 'Cerrar', value: 80000, count: 2, conversion: 50, avgDays: 20 },
        { name: 'Ganada', value: 290000, count: 1, conversion: null, avgDays: null },
      ],
    },
    nextMonth: {
      cuota: 350000,
      pipeline: 380000,
      coverage: 109,
      weighted: {
        alto: { value: 140000, probability: 62 },
        medio: { value: 120000, probability: 42 },
        bajo: { value: 120000, probability: 22 },
      },
      forecast: { min: 180000, max: 240000, confidence: 65 },
    },
    topVendedores: [],
    aiInsights: [
      {
        type: 'warning',
        message: 'Carlos está 17% por debajo de su cuota',
        suggestion: 'Revisar pipeline y asignar más leads calificados',
        action: 'Ver pipeline',
      },
      {
        type: 'warning',
        message: 'Tiempo promedio en etapa "Desarrollar" es 16 días',
        suggestion: 'vs 12 días promedio → Oportunidad de coaching',
        action: 'Ver análisis',
      },
      {
        type: 'forecast',
        message: 'Forecast: 65% probabilidad de alcanzar cuota',
        suggestion: 'Necesita aumentar pipeline en etapas tempranas',
        action: 'Ver forecast',
      },
    ],
  },
  v4: {
    kpis: {
      pipelineTotal: { value: 380000, change: 35, previous: 281481 },
      cierreMes: { actual: 220000, cuota: 250000, percentage: 88 },
      tasaConversion: { value: 24.1, change: 5.3, previous: 18.8 },
      promedioDeal: { value: 35000, change: 15, previous: 30435 },
    },
    funnel: {
      stages: [
        { name: 'Calificar', value: 200000, count: 10, conversion: 30, avgDays: 5 },
        { name: 'Desarrollar', value: 150000, count: 6, conversion: 33.3, avgDays: 11 },
        { name: 'Proponer', value: 100000, count: 3, conversion: 33.3, avgDays: 8 },
        { name: 'Cerrar', value: 60000, count: 2, conversion: 50, avgDays: 14 },
        { name: 'Ganada', value: 220000, count: 1, conversion: null, avgDays: null },
      ],
    },
    nextMonth: {
      cuota: 280000,
      pipeline: 320000,
      coverage: 114,
      weighted: {
        alto: { value: 120000, probability: 65 },
        medio: { value: 100000, probability: 48 },
        bajo: { value: 100000, probability: 28 },
      },
      forecast: { min: 160000, max: 200000, confidence: 70 },
    },
    topVendedores: [],
    aiInsights: [
      {
        type: 'opportunity',
        message: 'Ana muestra crecimiento del 35% en pipeline',
        suggestion: 'Excelente progreso para vendedora nueva',
        action: 'Ver detalle',
      },
      {
        type: 'forecast',
        message: 'Forecast: 70% probabilidad de alcanzar cuota',
        suggestion: 'Tendencia positiva, continuar apoyo',
        action: 'Ver forecast',
      },
    ],
  },
  v5: {
    kpis: {
      pipelineTotal: { value: 120000, change: 0, previous: 120000 },
      cierreMes: { actual: 80000, cuota: 150000, percentage: 53 },
      tasaConversion: { value: 15.2, change: 0, previous: 15.2 },
      promedioDeal: { value: 28000, change: -5, previous: 29474 },
    },
    funnel: {
      stages: [
        { name: 'Calificar', value: 80000, count: 5, conversion: 20, avgDays: 8 },
        { name: 'Desarrollar', value: 60000, count: 3, conversion: 0, avgDays: 20 },
        { name: 'Proponer', value: 40000, count: 1, conversion: 0, avgDays: 12 },
        { name: 'Cerrar', value: 20000, count: 0, conversion: 0, avgDays: 0 },
        { name: 'Ganada', value: 80000, count: 0, conversion: null, avgDays: null },
      ],
    },
    nextMonth: {
      cuota: 150000,
      pipeline: 140000,
      coverage: 93,
      weighted: {
        alto: { value: 40000, probability: 55 },
        medio: { value: 50000, probability: 38 },
        bajo: { value: 50000, probability: 20 },
      },
      forecast: { min: 50000, max: 80000, confidence: 45 },
    },
    topVendedores: [],
    aiInsights: [
      {
        type: 'warning',
        message: 'Pedro está 47% por debajo de su cuota',
        suggestion: 'Necesita mentoring intensivo y más leads',
        action: 'Ver plan de acción',
      },
      {
        type: 'warning',
        message: 'Pipeline insuficiente para próximo mes',
        suggestion: 'Asignar leads adicionales y revisar proceso',
        action: 'Ver pipeline',
      },
    ],
  },
};

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  progress?: number;
  onClick?: () => void;
}

function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  color,
  trend = 'neutral',
  progress,
  onClick,
}: KPICardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card
      className={cn(
        'border-slate-200 hover:shadow-lg transition-all duration-200',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                isPositive && 'bg-emerald-50 text-emerald-600',
                isNegative && 'bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)]',
                !isPositive && !isNegative && 'bg-slate-50 text-slate-600'
              )}
            >
              {isPositive && <ArrowUpRight className="w-3 h-3" />}
              {isNegative && <ArrowDownRight className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {changeLabel && (
            <p
              className={cn(
                'text-xs mt-1',
                isPositive ? 'text-emerald-600' : isNegative ? 'text-[var(--user-highlight)]' : 'text-slate-400'
              )}
            >
              {changeLabel}
            </p>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-4">
            <Progress
              value={progress}
              className={cn(
                'h-2',
                progress >= 100
                  ? 'bg-emerald-100 [&>div]:bg-emerald-500'
                  : progress >= 70
                    ? 'bg-amber-100 [&>div]:bg-amber-500'
                    : 'bg-[var(--user-highlight-opaque)] [&>div]:bg-[var(--user-highlight)]'
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// FUNNEL STAGE COMPONENT
// ============================================

interface FunnelStageProps {
  stage: FunnelStage;
  maxValue: number;
  isLast?: boolean;
  onClick?: () => void;
}

function FunnelStage({ stage, maxValue, isLast, onClick }: FunnelStageProps) {
  const width = (stage.value / maxValue) * 100;

  return (
    <div className="relative">
      <button onClick={onClick} className="w-full group">
        <div
          className={cn(
            'relative h-16 rounded-lg transition-all duration-200',
            'bg-gradient-to-r from-[var(--primary-100)] to-[var(--primary-200)]',
            'group-hover:from-[var(--primary-200)] group-hover:to-[var(--primary-300)]',
            'flex items-center px-4'
          )}
          style={{ width: `${Math.max(width, 30)}%` }}
        >
          <div className="flex-1 text-left">
            <p className="font-semibold text-slate-800">{stage.name}</p>
            <p className="text-sm text-slate-600">
              {stage.count} opps · RD$ {(stage.value / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </button>

      {!isLast && stage.conversion !== null && (
        <div className="flex items-center gap-2 my-2 ml-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
            {stage.conversion}%
          </div>
          <span className="text-xs text-slate-400">conversión</span>
          {stage.avgDays && (
            <span className="text-xs text-slate-400">· {stage.avgDays} días promedio</span>
          )}
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}

// ============================================
// AI INSIGHT CARD
// ============================================

interface AIInsightProps {
  type: 'warning' | 'opportunity' | 'forecast';
  message: string;
  suggestion: string;
  action: string;
  onAction?: () => void;
}

function AIInsight({ type, message, suggestion, action, onAction }: AIInsightProps) {
  const config = {
    warning: {
      icon: AlertCircle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-700',
    },
    opportunity: {
      icon: Lightbulb,
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      iconColor: 'text-sky-500',
      titleColor: 'text-sky-700',
    },
    forecast: {
      icon: Target,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-700',
    },
  };

  const { icon: Icon, bg, border, iconColor, titleColor } = config[type];

  return (
    <div className={cn('p-4 rounded-xl border', bg, border)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', 'bg-white/80', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-medium', titleColor)}>{message}</p>
          <p className="text-xs text-slate-600 mt-1">{suggestion}</p>
          {onAction && (
            <button
              onClick={onAction}
              className={cn('mt-2 text-xs font-medium flex items-center gap-1', 'hover:underline', titleColor)}
            >
              {action}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// GAUGE CHART COMPONENT
// ============================================

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  onClick?: () => void;
}

function GaugeChart({ value, max, label, sublabel, onClick }: GaugeChartProps) {
  const percentage = (value / max) * 100;

  const getColor = (pct: number) => {
    if (pct >= 100) return '#10B981';
    if (pct >= 80) return '#3B82F6';
    if (pct >= 50) return '#F59E0B';
    return '#3CD7CA'; // User highlight turquoise
  };

  const color = getColor(percentage);

  return (
    <button onClick={onClick} className="w-full flex flex-col items-center cursor-pointer group">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.51} 251`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <p className="text-3xl font-bold" style={{ color }}>
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700 mt-2">{label}</p>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </button>
  );
}

// ============================================
// VENDEDOR PROFILE CARD
// ============================================

interface VendedorProfileProps {
  vendedor: Vendedor;
  data: SalesData;
}

function VendedorProfile({ vendedor, data }: VendedorProfileProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentage = data.kpis.cierreMes.percentage;
  const statusColor = percentage >= 100 ? 'bg-emerald-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[var(--user-highlight)]';
  const statusText = percentage >= 100 ? 'Superando meta' : percentage >= 80 ? 'Cerca de meta' : 'Necesita apoyo';

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{vendedor.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800">{vendedor.name}</h3>
              <Badge className={cn('text-white text-xs', statusColor)}>{statusText}</Badge>
            </div>
            <p className="text-sm text-slate-500">{vendedor.role}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {vendedor.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {vendedor.phone || 'No disponible'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-400">Pipeline</p>
            <p className="text-lg font-semibold text-slate-700">{formatCurrency(data.kpis.pipelineTotal.value)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Cierre Mes</p>
            <p className="text-lg font-semibold text-slate-700">{formatCurrency(data.kpis.cierreMes.actual)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Conversión</p>
            <p className="text-lg font-semibold text-slate-700">{data.kpis.tasaConversion.value}%</p>
          </div>
        </div>
      </CardContent >
    </Card >
  );
}

// ============================================
// MAIN VENDEDORES PAGE
// ============================================

export function VendedoresPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config: quotaConfig } = useQuotaConfig();
  const { vendedores: realVendedores, loading: teamLoading } = useTeam();
  const { insights: aiInsightsData } = useDashboardInsights();
  const userManagerName = `${user?.firstName} ${user?.lastName}`;
  const isManager = user?.role === 'SALES_MANAGER';

  // Si no hay vendedores reales (ej. base de datos vacía), usamos los de prueba para no mostrar la pantalla en blanco
  const vendedoresBase = realVendedores.length > 0 ? realVendedores : VENDEDORES_FALLBACK;

  // Filtrar por Gerente si es Manager
  const vendedoresVisibles = useMemo(() => {
    if (user?.role === 'TENANT_ADMIN') return vendedoresBase;
    if (isManager) {
      // Filtrar vendedores cuyo managerName coincide
      const managerSellerNames = quotaConfig.sellers
        .filter(s => s.managerName === userManagerName)
        .map(s => s.name.toLowerCase());

      return vendedoresBase.filter(v => managerSellerNames.includes(v.name.toLowerCase()));
    }
    return vendedoresBase;
  }, [vendedoresBase, isManager, userManagerName, quotaConfig.sellers, user?.role]);

  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'individual' | 'team'>('individual');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  // Equipos disponibles
  const availableTeams = useMemo(() => {
    if (!quotaConfig.teams || quotaConfig.teams.length === 0) return [];
    if (isManager) {
      return quotaConfig.teams.filter(t => t.managerName === userManagerName);
    }
    return quotaConfig.teams;
  }, [quotaConfig.teams, isManager, userManagerName]);

  // Sincronizar el ID seleccionado cuando cargan los vendedores
  useEffect(() => {
    if (vendedoresVisibles.length > 0 && !selectedVendedorId) {
      setSelectedVendedorId(vendedoresVisibles[0].id);
    }
  }, [vendedoresVisibles, selectedVendedorId]);

  const { data: realSalesData, loading: salesLoading } = useDashboard('month', selectedVendedorId || undefined);

  const selectedVendedor = vendedoresVisibles.find(v => v.id === selectedVendedorId) || (vendedoresVisibles.length > 0 ? vendedoresVisibles[0] : null);

  // Mapeo robusto de datos reales a la estructura del dashboard
  const salesData: SalesData = (realSalesData && realSalesData.kpis) ? {
    kpis: {
      pipelineTotal: {
        value: realSalesData.kpis.totalRevenue || 0,
        change: 0,
        previous: 0
      },
      cierreMes: {
        actual: realSalesData.kpis.totalRevenue || 0,
        cuota: 1200000,
        percentage: Math.round(((realSalesData.kpis.totalRevenue || 0) / 1200000) * 100) || 0
      },
      tasaConversion: {
        value: 25,
        change: 0,
        previous: 0
      },
      promedioDeal: {
        value: (realSalesData.kpis.totalDeals && realSalesData.kpis.totalDeals > 0)
          ? Math.round((realSalesData.kpis.totalRevenue || 0) / realSalesData.kpis.totalDeals)
          : 0,
        change: 0,
        previous: 0
      }
    },
    funnel: {
      stages: (realSalesData.funnel && realSalesData.funnel.length > 0) ? realSalesData.funnel.map((f: any) => ({
        name: f.stage || 'Desconocido',
        value: f.value || 0,
        count: f.count || 0,
        conversion: 0,
        avgDays: 0
      })) : (SALES_BY_VENDEDOR['v1']?.funnel?.stages || [])
    },
    nextMonth: {
      cuota: 1500000,
      pipeline: 2100000,
      coverage: 140,
      weighted: {
        alto: { value: 980000, probability: 65 },
        medio: { value: 720000, probability: 48 },
        bajo: { value: 400000, probability: 27 }
      },
      forecast: { min: 1150000, max: 1380000, confidence: 78 }
    },
    topVendedores: (realSalesData.topVendedores || []).map((v: any) => ({
      name: v.name || 'Desconocido',
      value: v.value || 0,
      percentage: v.percentage || 100
    })),
    aiInsights: (aiInsightsData && aiInsightsData.length > 0) ? aiInsightsData : (SALES_BY_VENDEDOR[selectedVendedorId]?.aiInsights || SALES_BY_VENDEDOR['v1']?.aiInsights || [])
  } : (SALES_BY_VENDEDOR[selectedVendedorId] || SALES_BY_VENDEDOR['v1'] || {
    kpis: { pipelineTotal: { value: 0, change: 0, previous: 0 }, cierreMes: { actual: 0, cuota: 1, percentage: 0 }, tasaConversion: { value: 0, change: 0, previous: 0 }, promedioDeal: { value: 0, change: 0, previous: 0 } },
    funnel: { stages: [] },
    nextMonth: { cuota: 0, pipeline: 0, coverage: 0, weighted: { alto: { value: 0, probability: 0 }, medio: { value: 0, probability: 0 }, bajo: { value: 0, probability: 0 } }, forecast: { min: 0, max: 0, confidence: 0 } },
    topVendedores: [],
    aiInsights: []
  } as any);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { kpis, funnel, nextMonth, aiInsights } = salesData;


  if (teamLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!selectedVendedor) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">No hay vendedores disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Desempeño por Vendedor</h1>
          <p className="text-slate-500 mt-1">
            Análisis detallado de métricas individuales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-[var(--primary-100)] text-[var(--color-primary)]">
            <BarChart3 className="w-3 h-3 mr-1" />
            {new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(new Date())}
          </Badge>

          {/* Selector de Vista (solo si hay equipos) */}
          {availableTeams.length > 0 && (
            <div className="flex items-center bg-white border border-slate-200 rounded-md p-1">
              <Button
                variant={viewMode === 'individual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('individual')}
                className="h-8 gap-1 text-xs"
              >
                <User className="w-3.5 h-3.5" />
                Individual
              </Button>
              <Button
                variant={viewMode === 'team' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('team')}
                className="h-8 gap-1 text-xs"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                Equipo
              </Button>
            </div>
          )}

          {viewMode === 'individual' ? (
            <Select value={selectedVendedorId} onValueChange={setSelectedVendedorId}>
              <SelectTrigger className="w-[240px]">
                <User className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Seleccionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedoresVisibles.map(vendedor => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vendedor.name}</span>
                      <span className="text-xs text-slate-400">- {vendedor.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-[200px]">
                <UsersIcon className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos mis equipos</SelectItem>
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Perfil del Vendedor */}
      {salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : (
        <VendedorProfile vendedor={selectedVendedor} data={salesData} />
      )}

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pipeline Total"
          value={formatCurrency(kpis.pipelineTotal.value)}
          subtitle="Valor acumulado en todas las etapas"
          change={kpis.pipelineTotal.change}
          changeLabel="vs mes anterior"
          icon={DollarSign}
          color="bg-[var(--color-primary)]"
          trend="up"
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title="Cierre Mes vs Cuota"
          value={`${kpis.cierreMes.percentage}%`}
          subtitle={`${formatCurrency(kpis.cierreMes.actual)} de ${formatCurrency(kpis.cierreMes.cuota)}`}
          progress={kpis.cierreMes.percentage}
          icon={Target}
          color="bg-violet-500"
          trend={kpis.cierreMes.percentage >= 100 ? 'up' : 'neutral'}
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title="Tasa de Conversión"
          value={`${kpis.tasaConversion.value}%`}
          subtitle="Lead → Cliente"
          change={kpis.tasaConversion.change}
          changeLabel="pp vs mes anterior"
          icon={TrendingUp}
          color="bg-emerald-500"
          trend={kpis.tasaConversion.change >= 0 ? 'up' : 'down'}
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title="Promedio por Deal"
          value={formatCurrency(kpis.promedioDeal.value)}
          subtitle="Valor promedio de oportunidades ganadas"
          change={kpis.promedioDeal.change}
          changeLabel="vs mes anterior"
          icon={Award}
          color="bg-amber-500"
          trend={kpis.promedioDeal.change >= 0 ? 'up' : 'down'}
          onClick={() => navigate('/opportunities')}
        />
      </div>

      {/* SECCIÓN 1: CIERRE Y FORECAST LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Cierre Mes Actual vs Cuota</CardTitle>
                <CardDescription>
                  {formatCurrency(kpis.cierreMes.actual)} de {formatCurrency(kpis.cierreMes.cuota)}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
                Ver detalle
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <GaugeChart
              value={kpis.cierreMes.actual}
              max={kpis.cierreMes.cuota}
              label={`${kpis.cierreMes.percentage}% completado`}
              sublabel={`Faltan: ${formatCurrency(Math.max(0, kpis.cierreMes.cuota - kpis.cierreMes.actual))}`}
            />
            <div className="mt-6 grid grid-cols-3 gap-4 w-full text-center">
              <div>
                <p className="text-xs text-slate-400">Días restantes</p>
                <p className="text-lg font-semibold text-slate-700">12</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ritmo necesario</p>
                <p className="text-lg font-semibold text-slate-700">
                  RD$ {((kpis.cierreMes.cuota - kpis.cierreMes.actual) / 12 / 1000).toFixed(1)}K/día
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Opps en cierre</p>
                <p className="text-lg font-semibold text-slate-700">
                  {funnel.stages.find(s => s.name === 'Cerrar')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pipeline Mes Próximo vs Cuota</CardTitle>
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
                Ver forecast
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <CardDescription>
              Basado en oportunidades con fecha de cierre próximo mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Cuota proyectada</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(nextMonth.cuota)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Pipeline actual</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(nextMonth.pipeline)}{' '}
                    <span className={nextMonth.coverage >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                      ({nextMonth.coverage}% coverage)
                    </span>
                  </span>
                </div>
                <Progress value={nextMonth.coverage} className="h-2" />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-3">Peso del pipeline:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Alto (&gt;70%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(nextMonth.weighted.alto.value)}</span>
                      <Badge className="bg-emerald-100 text-emerald-600 text-xs">{nextMonth.weighted.alto.probability}%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Medio (30-70%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(nextMonth.weighted.medio.value)}</span>
                      <Badge className="bg-amber-100 text-amber-600 text-xs">{nextMonth.weighted.medio.probability}%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Bajo (&lt;30%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(nextMonth.weighted.bajo.value)}</span>
                      <Badge className="bg-slate-100 text-slate-600 text-xs">{nextMonth.weighted.bajo.probability}%</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Forecast IA:</span>
                  <span className="text-sm text-slate-600">
                    {formatCurrency(nextMonth.forecast.min)} - {formatCurrency(nextMonth.forecast.max)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Confianza: {nextMonth.forecast.confidence}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2: EMBUDO DE VENTAS + AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Embudo de Ventas</CardTitle>
                <CardDescription>Pipeline por etapa con tasas de conversión</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/opportunities');
                }}
                className="text-[var(--color-primary)]"
              >
                Ver oportunidades
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnel.stages.map((stage, index) => (
                <FunnelStage
                  key={stage.name}
                  stage={stage}
                  maxValue={funnel.stages[0]?.value || 1}
                  isLast={index === funnel.stages.length - 1}
                  onClick={() => navigate('/opportunities')}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Insights de IA</CardTitle>
                  <CardDescription>Análisis personalizado para {selectedVendedor.name}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <AIInsight
                  key={index}
                  type={insight.type}
                  message={insight.message}
                  suggestion={insight.suggestion}
                  action={insight.action}
                  onAction={() => navigate('/opportunities')}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Última actualización: Hace 5 minutos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: OPORTUNIDADES POR ETAPA */}
      <Card
        className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
        onClick={() => navigate('/opportunities')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Oportunidades por Etapa</CardTitle>
            <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnel.stages.slice(0, -1).map((stage) => (
              <div key={stage.name} className="flex items-center gap-3">
                <span className="w-24 text-sm text-slate-600">{stage.name}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                    style={{ width: `${(stage.count / (funnel.stages[0]?.count || 1)) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-sm font-medium text-slate-700">{stage.count}</span>
                <span className="text-xs text-slate-400">opps</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Bottom Actions Bar */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">
                Acciones recomendadas para {selectedVendedor.name}:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-amber-100 bg-amber-50 text-amber-700"
                  onClick={() => navigate('/activities')}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Programar sesión de coaching
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-sky-100 bg-sky-50 text-sky-700"
                  onClick={() => navigate('/opportunities')}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Revisar deals en negociación
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-emerald-100 bg-emerald-50 text-emerald-700"
                  onClick={() => navigate('/contacts')}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Asignar leads adicionales
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VendedoresPage;
