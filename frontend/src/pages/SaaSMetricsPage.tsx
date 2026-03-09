// ============================================
// ANTU CRM - SaaS Metrics Dashboard
// MRR, Churn, LTV, CAC, NRR, Magic Number
// ============================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Tabs not used yet
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Repeat,
  Target,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

// ============================================
// MOCK SAAS METRICS DATA
// ============================================

const SAAS_METRICS = {
  mrr: {
    current: 84750,
    previous: 78900,
    change: 7.4,
    breakdown: {
      starter: 14500,
      professional: 45800,
      enterprise: 24450,
    },
  },
  arr: {
    current: 1017000,
    previous: 946800,
    change: 7.4,
  },
  churn: {
    logo: 2.3,
    revenue: 1.8,
    industry: 5.0,
    trend: -0.5,
  },
  ltv: {
    current: 8400,
    cac: 2100,
    ratio: 4.0,
    target: 3.0,
  },
  cac: {
    current: 2100,
    previous: 1950,
    change: 7.7,
    payback: 8,
  },
  nrr: {
    current: 118,
    target: 120,
    expansion: 23,
    contraction: 5,
  },
  magicNumber: {
    current: 0.82,
    target: 0.75,
    status: 'good',
  },
  customers: {
    total: 342,
    new: 18,
    churned: 8,
    active: 334,
  },
};

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  target?: number;
  current?: number;
}

function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  color,
  trend = 'neutral',
  target,
  current,
}: MetricCardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card className="border-slate-100 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-6 h-6 text-white" />
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
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
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
        {target !== undefined && current !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">vs Target ({target}%)</span>
              <span
                className={cn(
                  'font-medium',
                  current >= target ? 'text-emerald-600' : 'text-amber-600'
                )}
              >
                {current}%
              </span>
            </div>
            <Progress value={(current / target) * 100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MRR BREAKDOWN CHART
// ============================================

function MRRBreakdown() {
  const { mrr } = SAAS_METRICS;
  const total = mrr.current;

  const tiers = [
    { name: 'Starter', value: mrr.breakdown.starter, color: 'bg-slate-400' },
    { name: 'Professional', value: mrr.breakdown.professional, color: 'bg-[var(--color-primary)]' },
    { name: 'Enterprise', value: mrr.breakdown.enterprise, color: 'bg-violet-500' },
  ];

  return (
    <Card className="border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">MRR Breakdown</CardTitle>
        <CardDescription>By pricing tier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const percentage = ((tier.value / total) * 100).toFixed(1);
            return (
              <div key={tier.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{tier.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      ${tier.value.toLocaleString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', tier.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Total MRR</span>
            <span className="text-xl font-bold text-[var(--color-primary)]">
              ${total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CUSTOMER METRICS
// ============================================

function CustomerMetrics() {
  const { customers } = SAAS_METRICS;

  return (
    <Card className="border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Customer Metrics</CardTitle>
        <CardDescription>This month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Total Customers</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{customers.total}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600">New</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">+{customers.new}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-rose-600">Churned</span>
            </div>
            <p className="text-2xl font-bold text-rose-700">-{customers.churned}</p>
          </div>
          <div className="p-4 bg-[var(--primary-50)] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-primary)]">Active</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-primary)]">
              {customers.active}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN SAAS METRICS PAGE
// ============================================

export function SaaSMetricsPage() {
  const { t } = useTranslation();
  const { mrr, arr, churn, ltv, cac, nrr, magicNumber } = SAAS_METRICS;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t('saas.metrics.title')}
          </h1>
          <p className="text-slate-500 mt-1">
            Key SaaS metrics and KPIs
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-600">
          <Calendar className="w-3 h-3 mr-1" />
          Last updated: Today
        </Badge>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={formatCurrency(mrr.current)}
          subtitle="Monthly Recurring Revenue"
          change={mrr.change}
          changeLabel="vs last month"
          icon={DollarSign}
          color="bg-[var(--color-primary)]"
          trend="up"
        />
        <MetricCard
          title="ARR"
          value={formatCurrency(arr.current)}
          subtitle="Annual Recurring Revenue"
          change={arr.change}
          changeLabel="vs last year"
          icon={Calendar}
          color="bg-violet-500"
          trend="up"
        />
        <MetricCard
          title="Churn Rate"
          value={`${churn.revenue}%`}
          subtitle="Revenue churn (Logo: {churn.logo}%)"
          change={churn.trend}
          changeLabel="vs industry avg (5%)"
          icon={TrendingDown}
          color="bg-rose-500"
          trend="up"
        />
        <MetricCard
          title="LTV:CAC"
          value={ltv.ratio.toFixed(1)}
          subtitle={`LTV ${formatCurrency(ltv.current)} / CAC ${formatCurrency(cac.current)}`}
          target={ltv.target}
          current={ltv.ratio}
          icon={Target}
          color="bg-emerald-500"
          trend="up"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="NRR"
          value={`${nrr.current}%`}
          subtitle="Net Revenue Retention"
          target={nrr.target}
          current={nrr.current}
          icon={Repeat}
          color="bg-sky-500"
          trend={nrr.current >= nrr.target ? 'up' : 'neutral'}
        />
        <MetricCard
          title="CAC Payback"
          value={`${cac.payback} months`}
          subtitle="Customer Acquisition Cost"
          change={cac.change}
          changeLabel="vs last quarter"
          icon={Zap}
          color="bg-amber-500"
          trend="down"
        />
        <MetricCard
          title="Magic Number"
          value={magicNumber.current.toFixed(2)}
          subtitle="Sales efficiency ratio"
          icon={TrendingUp}
          color={magicNumber.current >= magicNumber.target ? 'bg-emerald-500' : 'bg-amber-500'}
          trend={magicNumber.current >= magicNumber.target ? 'up' : 'neutral'}
        />
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRBreakdown />
        <CustomerMetrics />
      </div>

      {/* Benchmarks */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">SaaS Benchmarks</CardTitle>
          <CardDescription>How you compare to industry standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { metric: 'LTV:CAC', value: '4.0x', target: '>3.0x', status: 'good' },
              { metric: 'Payback', value: '8mo', target: '<12mo', status: 'good' },
              { metric: 'NRR', value: '118%', target: '>120%', status: 'warning' },
              { metric: 'Churn', value: '1.8%', target: '<5%', status: 'good' },
            ].map((item) => (
              <div
                key={item.metric}
                className={cn(
                  'p-4 rounded-xl border',
                  item.status === 'good'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                )}
              >
                <p className="text-sm text-slate-500">{item.metric}</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    item.status === 'good' ? 'text-emerald-700' : 'text-amber-700'
                  )}
                >
                  {item.value}
                </p>
                <p className="text-xs text-slate-400">Target: {item.target}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SaaSMetricsPage;
