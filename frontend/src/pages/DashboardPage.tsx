// ============================================
// ANTU CRM - Dashboard de Ventas
// SOLO métricas de ventas - KPIs, Pipeline, Forecast
// ============================================

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { cn, formatCurrency as globalFormatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Clock,
  Award,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import { useQuotaConfig } from '@/hooks/useQuotaConfig';

// ============================================
// MOCK DATA - SALES METRICS
// ============================================

const SALES_DATA = {
  kpis: {
    pipelineTotal: {
      value: 2400000,
      change: 15,
      previous: 2086957,
    },
    cierreMes: {
      actual: 890000,
      cuota: 1200000,
      percentage: 74,
    },
    tasaConversion: {
      value: 24.5,
      change: 3.2,
      previous: 21.3,
    },
    promedioDeal: {
      value: 45000,
      change: 8,
      previous: 41667,
    },
  },
  funnel: {
    stages: [
      { name: 'Calificar', value: 1200000, count: 45, conversion: 26.7, avgDays: 5 },
      { name: 'Desarrollar', value: 980000, count: 32, conversion: 25, avgDays: 12 },
      { name: 'Proponer', value: 650000, count: 12, conversion: 41.7, avgDays: 8 },
      { name: 'Cerrar', value: 420000, count: 8, conversion: 37.5, avgDays: 15 },
      { name: 'Ganada', value: 890000, count: 3, conversion: null, avgDays: null },
    ],
  },
  nextMonth: {
    cuota: 1500000,
    pipeline: 2100000,
    coverage: 140,
    weighted: {
      alto: { value: 980000, probability: 65 },
      medio: { value: 720000, probability: 48 },
      bajo: { value: 400000, probability: 27 },
    },
    forecast: { min: 1150000, max: 1380000, confidence: 78 },
  },
  topVendedores: [
    { name: 'María García', value: 450000, percentage: 120 },
    { name: 'Juan Pérez', value: 380000, percentage: 95 },
    { name: 'Carlos López', value: 290000, percentage: 72 },
  ],
  aiInsights: [
    {
      type: 'warning',
      message: 'Tienes 3 oportunidades en "Proponer" >30 días sin actividad',
      suggestion: 'Contactar esta semana con oferta de valor agregado',
      action: 'Ver oportunidades',
    },
    {
      type: 'opportunity',
      message: 'Tu tasa de conversión Calificar→Desarrollar es 26%',
      suggestion: 'vs 35% del sector → Oportunidad de mejora en qualifying',
      action: 'Ver análisis',
    },
    {
      type: 'forecast',
      message: 'Forecast: 85% probabilidad de cerrar RD$ 890K este mes',
      suggestion: 'Necesitas 1 deal más de RD$ 310K para cuota. Focus en oportunidades en negociación',
      action: 'Ver oportunidades',
    },
  ],
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
                isNegative && 'bg-rose-50 text-rose-600',
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
                isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400'
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
                    : 'bg-rose-100 [&>div]:bg-rose-500'
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
  stage: {
    name: string;
    value: number;
    count: number;
    conversion: number | null;
    avgDays: number | null;
  };
  maxValue: number;
  isLast?: boolean;
  onClick?: () => void;
}

function FunnelStage({ stage, maxValue, isLast, onClick }: FunnelStageProps) {
  const width = (stage.value / maxValue) * 100;

  return (
    <div className="relative">
      {/* Stage Bar */}
      <button
        onClick={onClick}
        className="w-full group"
      >
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

      {/* Conversion Rate */}
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
              className={cn(
                'mt-2 text-xs font-medium flex items-center gap-1',
                'hover:underline',
                titleColor
              )}
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
    return '#F43F5E';
  };

  const color = getColor(percentage);

  return (
    <button onClick={onClick} className="w-full flex flex-col items-center cursor-pointer group">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Value arc */}
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
// MAIN DASHBOARD PAGE
// ============================================

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();

  // Redirect Super Admin to Platform Admin
  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN') {
      navigate('/admin/platform', { replace: true });
    }
  }, [user, navigate]);

  const formatCurrency = (value: number) => {
    return globalFormatCurrency(value, tenant?.currency || 'DOP');
  };

  const { data: realData, loading: dashboardLoading } = useDashboard();
  const { insights: realAIInsights } = useDashboardInsights();

  // Mapeo dinámico de KPIs del backend al frontend
  const kpis = realData ? {
    pipelineTotal: {
      value: realData.kpis.totalRevenue, // Usamos revenue ganado como base o podríamos sumar todas las opps
      change: 0,
      previous: 0,
    },
    cierreMes: {
      actual: realData.kpis.totalRevenue,
      cuota: 1200000, // Meta fija por ahora, debería venir de la tabla Quotas
      percentage: Math.round((realData.kpis.totalRevenue / 1200000) * 100) || 0,
    },
    tasaConversion: {
      value: realData.kpis.totalDeals > 0 ? 25 : 0, // Estimado simple
      change: 0,
      previous: 0,
    },
    promedioDeal: {
      value: realData.kpis.totalDeals > 0 ? Math.round(realData.kpis.totalRevenue / realData.kpis.totalDeals) : 0,
      change: 0,
      previous: 0,
    },
  } : SALES_DATA.kpis;

  // Filtrado por Gerente: Si el usuario es MANAGER, solo ve su equipo
  const { config: quotaConfig } = useQuotaConfig();
  const userManagerName = `${user?.firstName} ${user?.lastName}`;
  const isManager = user?.role === 'SALES_MANAGER';

  // Encontrar el equipo del gerente si es manager
  const managerTeams = useMemo(() => {
    return quotaConfig.teams.filter(t => t.managerName === userManagerName);
  }, [quotaConfig.teams, userManagerName]);

  // Si es manager, ajustamos el título y opcionalmente los datos
  const dashboardTitle = isManager
    ? `Dashboard: ${managerTeams.map(t => t.name).join(', ') || 'Mi Equipo'}`
    : t('dashboard.sales.title');

  const funnel = realData?.funnel && realData.funnel.length > 0 ? {
    stages: realData.funnel.map(f => ({
      name: f.stage,
      value: f.value,
      count: f.count,
      conversion: 0,
      avgDays: 0
    }))
  } : SALES_DATA.funnel;

  const topVendedores = realData?.topVendedores || SALES_DATA.topVendedores;
  const aiInsights = realAIInsights.length > 0 ? realAIInsights.map((i: any) => ({
    type: i.type.toLowerCase().includes('risk') || i.type.toLowerCase().includes('critical') ? 'warning' : i.type.toLowerCase().includes('opp') ? 'opportunity' : 'forecast',
    message: i.title,
    suggestion: i.description,
    action: i.action?.label || 'Ver más',
    actionLink: i.action?.route || '#'
  })) : SALES_DATA.aiInsights;

  // Fallback nextMonth for now as it's more complex to calculate
  const { nextMonth } = SALES_DATA;

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{dashboardTitle}</h1>
          <p className="text-slate-500 mt-1">
            {isManager ? 'Métricas de desempeño de tu equipo directo' : t('dashboard.sales.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-[var(--primary-100)] text-[var(--color-primary)]">
            <BarChart3 className="w-3 h-3 mr-1" />
            {new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-DO', {
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </Badge>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('dashboard.sales.kpis.pipeline')}
          value={formatCurrency(kpis.pipelineTotal.value)}
          subtitle={t('dashboard.sales.kpis.pipelineSub')}
          change={kpis.pipelineTotal.change}
          changeLabel={t('dashboard.sales.kpis.vsLastMonth')}
          icon={DollarSign}
          color="bg-[var(--color-primary)]"
          trend="up"
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title={t('dashboard.sales.sections.target')}
          value={`${kpis.cierreMes.percentage}%`}
          subtitle={`${formatCurrency(kpis.cierreMes.actual)} / ${formatCurrency(kpis.cierreMes.cuota)}`}
          progress={kpis.cierreMes.percentage}
          icon={Target}
          color="bg-violet-500"
          trend={kpis.cierreMes.percentage >= 100 ? 'up' : 'neutral'}
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title={t('dashboard.sales.kpis.conversion')}
          value={`${kpis.tasaConversion.value}%`}
          subtitle="Lead → Client"
          change={kpis.tasaConversion.change}
          changeLabel={t('dashboard.sales.kpis.ppVsLastMonth')}
          icon={TrendingUp}
          color="bg-emerald-500"
          trend="up"
          onClick={() => navigate('/opportunities')}
        />
        <KPICard
          title={t('dashboard.sales.kpis.avgDeal')}
          value={formatCurrency(kpis.promedioDeal.value)}
          subtitle="Average Deal Value"
          change={kpis.promedioDeal.change}
          changeLabel={t('dashboard.sales.kpis.vsLastMonth')}
          icon={Award}
          color="bg-amber-500"
          trend="up"
          onClick={() => navigate('/opportunities')}
        />
      </div>

      {/* MIDDLE SECTION - HALF & HALF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECCIÓN 1: CIERRE MES ACTUAL VS CUOTA (Gauge) */}
        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.target')}</CardTitle>
                <CardDescription>
                  {formatCurrency(kpis.cierreMes.actual)} / {formatCurrency(kpis.cierreMes.cuota)}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
                {t('actions.view')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-2/3 max-w-[200px] mx-auto mt-2">
              <GaugeChart
                value={kpis.cierreMes.actual}
                max={kpis.cierreMes.cuota}
                label={`${kpis.cierreMes.percentage}% ${t('tasks.tabs.completed').toLowerCase()}`}
                sublabel={`Left: ${formatCurrency(kpis.cierreMes.cuota - kpis.cierreMes.actual)}`}
              />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 w-full text-center pb-2">
              <div>
                <p className="text-xs text-slate-400">Days Left</p>
                <p className="text-lg font-semibold text-slate-700">12</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pace</p>
                <p className="text-lg font-semibold text-slate-700">{formatCurrency(25800)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Opps</p>
                <p className="text-lg font-semibold text-slate-700">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 4 MOVIDA: PIPELINE MES PRóXIMO VS CUOTA */}
        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.nextMonth')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
                Forecast
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <CardDescription>
              {t('dashboard.sales.sections.nextMonthSub')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Projected Quota</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(nextMonth.cuota)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Current Pipeline</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(nextMonth.pipeline)}{' '}
                    <span className="text-emerald-600 text-xs">({nextMonth.coverage}% coverage)</span>
                  </span>
                </div>
                <Progress value={nextMonth.coverage} className="h-2" />
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center items-center h-[56px]">
                <div className="bg-emerald-50 rounded p-1.5">
                  <span className="block text-[10px] text-slate-500 mb-0.5">High {'>'}70%</span>
                  <span className="text-xs font-semibold text-emerald-700">{formatCurrency(nextMonth.weighted.alto.value)}</span>
                </div>
                <div className="bg-amber-50 rounded p-1.5">
                  <span className="block text-[10px] text-slate-500 mb-0.5">Medium</span>
                  <span className="text-xs font-semibold text-amber-700">{formatCurrency(nextMonth.weighted.medio.value)}</span>
                </div>
                <div className="bg-slate-50 rounded p-1.5">
                  <span className="block text-[10px] text-slate-500 mb-0.5">Low {'<'}30%</span>
                  <span className="text-xs font-semibold text-slate-700">{formatCurrency(nextMonth.weighted.bajo.value)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">AI Forecast:</span>
                  <span className="text-sm text-slate-600 truncate">
                    {formatCurrency(nextMonth.forecast.min)} - {formatCurrency(nextMonth.forecast.max)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Confidence Level: {nextMonth.forecast.confidence}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2: EMBUDO DE VENTAS + AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <Card
          className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => navigate('/opportunities')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.funnel')}</CardTitle>
                <CardDescription>{t('dashboard.sales.sections.funnelSub')}</CardDescription>
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
                {t('dashboard.sections.salesPipeline')}
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
                  maxValue={funnel.stages[0].value}
                  isLast={index === funnel.stages.length - 1}
                  onClick={() => navigate('/opportunities')}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.aiInsights')}</CardTitle>
                  <CardDescription>{t('dashboard.sales.sections.aiInsightsSub')}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <AIInsight
                  key={index}
                  type={insight.type as 'warning' | 'opportunity' | 'forecast'}
                  message={insight.message}
                  suggestion={insight.suggestion}
                  action={insight.action}
                  onAction={() => navigate('/opportunities')}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Last update: 5 minutes ago
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
            <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.stages')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
              {t('actions.viewAll')}
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
                    style={{ width: `${(stage.count / 45) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-sm font-medium text-slate-700">{stage.count}</span>
                <span className="text-xs text-slate-400">opps</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* SECCIÓN 5: TOP VENDEDORES */}
      <Card
        className="border-slate-200 cursor-pointer hover:shadow-lg transition-all duration-200"
        onClick={() => navigate('/vendedores')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{t('dashboard.sales.sections.performance')}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{t('dashboard.sales.sections.performanceSub')}</span>
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)]">
                {t('actions.viewAll')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topVendedores.map((vendedor, index) => (
              <div key={vendedor.name} className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0
                      ? 'bg-amber-100 text-amber-600'
                      : index === 1
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-orange-100 text-orange-600'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{vendedor.name}</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={vendedor.percentage}
                      className="h-1.5 w-24"
                    />
                    <span
                      className={cn(
                        'text-xs',
                        vendedor.percentage >= 100 ? 'text-emerald-600' : 'text-slate-500'
                      )}
                    >
                      {vendedor.percentage}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCurrency(vendedor.value)}
                </span>
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
                Acciones recomendadas basadas en tu pipeline:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-amber-100 bg-amber-50 text-amber-700"
                  onClick={() => navigate('/activities')}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Contactar 3 oportunidades en "Proponer" &gt;20 días
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-sky-100 bg-sky-50 text-sky-700"
                  onClick={() => navigate('/opportunities')}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Revisar 2 deals con probabilidad IA &lt;30%
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-emerald-100 bg-emerald-50 text-emerald-700"
                  onClick={() => navigate('/contacts')}
                >
                  <Users className="w-3 h-3 mr-1" />
                  Asignar 5 leads nuevos a vendedores con capacidad
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
