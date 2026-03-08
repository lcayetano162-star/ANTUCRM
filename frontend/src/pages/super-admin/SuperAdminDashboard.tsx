import { useEffect, useState, useCallback } from 'react'
import {
  Building2, Users, DollarSign, Globe, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, CheckCircle2, XCircle, ChevronDown,
  Eye, EyeOff, Zap, Activity, RefreshCw, Shield
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { superAdminApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalTenants: number; activeTenants: number; trialTenants: number
  suspendedTenants: number; totalPlans: number; totalUsers: number
  monthlyRecurringRevenue: number; tenantsGrowth: number; revenueGrowth: number
}

interface RevDay   { date: string; revenue: number }
interface SLAStats { resolved: number; total: number; pct: number; avgHours: number }
interface IntegStatus { service_name: string; last_status: string; last_sync_at?: string; last_status_code?: number }
interface ActionItem  { type: string; title: string; description: string; count: number; href: string; severity: 'high' | 'medium' | 'low' }
interface TenantItem  { id: string; name: string; status: string; plan_name: string; user_count: number }
interface RecentTenant { id: string; name: string; slug: string; status: string; plan_name: string; created_at: string; owner_email: string }

// ─── Glassmorphism card base ──────────────────────────────────────────────────

function GlassCard({ className, children, glow }: { className?: string; children: React.ReactNode; glow?: string }) {
  return (
    <div className={cn(
      'relative rounded-2xl border border-white/20 bg-white/70 backdrop-blur-md shadow-xl shadow-black/5 overflow-hidden',
      className
    )}>
      {glow && (
        <div className={cn('absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none', glow)} />
      )}
      {children}
    </div>
  )
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function PulseDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn(
        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
        ok ? 'bg-emerald-400' : 'bg-rose-400'
      )} />
      <span className={cn(
        'relative inline-flex rounded-full h-2.5 w-2.5',
        ok ? 'bg-emerald-500' : 'bg-rose-500'
      )} />
    </span>
  )
}

// ─── SLA Radial gauge label ───────────────────────────────────────────────────

function SLACenterLabel({ viewBox, pct }: any) {
  const { cx, cy } = viewBox
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" className="fill-slate-800 text-3xl font-bold" fontSize={28} fontWeight={700}>{pct}%</tspan>
      <tspan x={cx} dy="22" className="fill-slate-400 text-xs" fontSize={12}>SLA</tspan>
    </text>
  )
}

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV_CFG = {
  high:   { dot: 'bg-rose-500',   ring: 'ring-rose-200',   label: 'bg-rose-50 text-rose-700 border-rose-200',   icon: XCircle },
  medium: { dot: 'bg-amber-500',  ring: 'ring-amber-200',  label: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  low:    { dot: 'bg-blue-400',   ring: 'ring-blue-200',   label: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Activity },
}

// ─── Revenue tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl border border-slate-100 px-4 py-3 text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-violet-700">{formatCurrency(payload[0].value, 'USD')}/día</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [stats, setStats]             = useState<Stats>({ totalTenants: 0, activeTenants: 0, trialTenants: 0, suspendedTenants: 0, totalPlans: 0, totalUsers: 0, monthlyRecurringRevenue: 0, tenantsGrowth: 0, revenueGrowth: 0 })
  const [recentTenants, setRecent]    = useState<RecentTenant[]>([])
  const [revenueByDay, setRevenue]    = useState<RevDay[]>([])
  const [slaStats, setSLA]            = useState<SLAStats>({ resolved: 0, total: 0, pct: 100, avgHours: 0 })
  const [integrations, setInteg]      = useState<IntegStatus[]>([])
  const [actionItems, setActions]     = useState<ActionItem[]>([])
  const [tenantList, setTenantList]   = useState<TenantItem[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [simMode, setSimMode]         = useState<TenantItem | null>(null)
  const [simOpen, setSimOpen]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await superAdminApi.getDashboard()
      const d = res.data
      if (d?.stats)          setStats(d.stats)
      if (d?.recentTenants)  setRecent(d.recentTenants)
      if (d?.revenueByDay)   setRevenue(d.revenueByDay)
      if (d?.slaStats)       setSLA(d.slaStats)
      if (d?.integrationStatus) setInteg(d.integrationStatus)
      if (d?.actionItems)    setActions(d.actionItems)
      if (d?.tenantList)     setTenantList(d.tenantList)
      setLastUpdated(new Date())
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'No se pudo cargar el dashboard', variant: 'destructive' })
    } finally { setIsLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  // ── Format revenue chart X axis ─────────────────────────────────────────────
  const formatDay = (d: string) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })

  // ── SLA radial data ──────────────────────────────────────────────────────────
  const slaData = [{ name: 'SLA', value: slaStats.pct, fill: slaStats.pct >= 90 ? '#10b981' : slaStats.pct >= 70 ? '#f59e0b' : '#f43f5e' }]

  // ── Status badge ─────────────────────────────────────────────────────────────
  const StatusBadge = ({ s }: { s: string }) => ({
    active:    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">Activo</Badge>,
    trial:     <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Trial</Badge>,
    suspended: <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-xs">Suspendido</Badge>,
  }[s] ?? <Badge variant="secondary" className="text-xs">{s}</Badge>)

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Actualizado {lastUpdated.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={load} className="border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Actualizar
          </Button>

          {/* Simulation Mode */}
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setSimOpen(v => !v)}
              className={cn(
                'gap-1.5 transition-all',
                simMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              )}
            >
              {simMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {simMode ? `Vista: ${simMode.name}` : 'Modo Simulación'}
              <ChevronDown className={cn('w-3 h-3 transition-transform', simOpen && 'rotate-180')} />
            </Button>
            {simOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl shadow-black/10 z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seleccionar tenant</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {simMode && (
                    <button onClick={() => { setSimMode(null); setSimOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 text-rose-600 text-sm border-b border-slate-100">
                      <XCircle className="w-4 h-4" />
                      Salir de simulación
                    </button>
                  )}
                  {tenantList.map(t => (
                    <button key={t.id}
                      onClick={() => { setSimMode(t); setSimOpen(false) }}
                      className={cn('w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-50 text-left transition-colors',
                        simMode?.id === t.id && 'bg-violet-50')}>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.plan_name} · {t.user_count} usuarios</p>
                      </div>
                      <StatusBadge s={t.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Simulation banner ── */}
      {simMode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-800">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Modo Simulación activo: <span className="font-bold">{simMode.name}</span></p>
            <p className="text-xs text-amber-700">Estás viendo el contexto de este tenant. Tu sesión de Super Admin está intacta.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setSimMode(null)}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs">
            Salir
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BENTO GRID
          Row 1: KPI strip (4 mini cards)
          Row 2: Revenue chart (col-span-2) | SLA gauge | Integrations
          Row 3: Action Center (col-span-2) | Recent tenants (col-span-2)
      ════════════════════════════════════════════════════════════════════════ */}

      {/* ── Row 1: KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'MRR', value: formatCurrency(stats.monthlyRecurringRevenue, 'USD'), sub: `${stats.tenantsGrowth > 0 ? '+' : ''}${stats.tenantsGrowth}% vs mes ant.`, icon: DollarSign, glow: 'bg-emerald-400', color: 'text-emerald-600', bg: 'bg-emerald-50', trend: stats.tenantsGrowth, href: '/super-admin/billing' },
          { title: 'Empresas activas', value: formatNumber(stats.activeTenants), sub: `${stats.trialTenants} en trial`, icon: Building2, glow: 'bg-violet-400', color: 'text-violet-600', bg: 'bg-violet-50', href: '/super-admin/tenants' },
          { title: 'Usuarios globales', value: formatNumber(stats.totalUsers), sub: 'En todos los tenants', icon: Globe, glow: 'bg-blue-400', color: 'text-blue-600', bg: 'bg-blue-50', href: '/super-admin/users' },
          { title: 'Planes disponibles', value: formatNumber(stats.totalPlans), sub: `${stats.suspendedTenants} suspendidos`, icon: Users, glow: 'bg-amber-400', color: 'text-amber-600', bg: 'bg-amber-50', href: '/super-admin/plans' },
        ].map(k => (
          <Link key={k.title} to={k.href}>
            <GlassCard className="p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full" glow={k.glow}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{k.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <p className="text-xs text-slate-400">{k.sub}</p>
                    {k.trend !== undefined && k.trend !== 0 && (
                      <span className={cn('flex items-center text-xs font-semibold', k.trend > 0 ? 'text-emerald-600' : 'text-rose-500')}>
                        {k.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(k.trend)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
                  <k.icon className={cn('w-5 h-5', k.color)} />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* ── Row 2: Revenue + SLA + Integrations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

        {/* Revenue area chart — col-span-3 */}
        <GlassCard className="lg:col-span-3 p-5" glow="bg-violet-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Flujo de Ingresos</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 30 días (MRR diario)</p>
            </div>
            <Badge className="bg-violet-50 text-violet-700 border-violet-200 border text-xs">
              {formatCurrency(stats.monthlyRecurringRevenue, 'USD')}/mes
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* SLA gauge — col-span-2 */}
        <GlassCard className="lg:col-span-2 p-5 flex flex-col" glow={slaStats.pct >= 90 ? 'bg-emerald-400' : 'bg-rose-400'}>
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-800">Service SLA</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tickets resueltos a tiempo</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={150}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={210} endAngle={-30} data={slaData}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-8" fill="#0f172a" fontSize={28} fontWeight={700}>{slaStats.pct}%</tspan>
                  <tspan x="50%" dy="22" fill="#94a3b8" fontSize={11}>SLA</tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
            <div>
              <p className="text-slate-400">Resueltos</p>
              <p className="font-bold text-emerald-600">{slaStats.resolved}</p>
            </div>
            <div>
              <p className="text-slate-400">Total tickets</p>
              <p className="font-bold text-slate-700">{slaStats.total}</p>
            </div>
          </div>
        </GlassCard>

        {/* Integration status — col-span-2 */}
        <GlassCard className="lg:col-span-2 p-5" glow="bg-blue-400">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Estado de Integraciones</h3>
          <p className="text-xs text-slate-400 mb-4">Conectores ERP activos</p>
          {integrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Zap className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Sin integraciones activas</p>
              <Link to="/integrations" className="text-xs text-violet-600 hover:underline mt-1">Configurar</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map(i => {
                const ok = i.last_status === 'ok'
                const labels: Record<string, string> = { alegra: 'Alegra', odoo: 'Odoo', quickbooks: 'QuickBooks', dgii: 'DGII' }
                return (
                  <div key={i.service_name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <PulseDot ok={ok} />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{labels[i.service_name] ?? i.service_name}</p>
                        {i.last_sync_at && (
                          <p className="text-xs text-slate-400">{new Date(i.last_sync_at).toLocaleDateString('es-DO')}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                      {ok ? '200 OK' : i.last_status_code ?? 'Error'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Row 3: Action Center + Recent Tenants ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Action Center */}
        <GlassCard className="p-5" glow="bg-rose-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Centro de Acciones
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tareas que requieren atención inmediata</p>
            </div>
            {actionItems.length > 0 && (
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionItems.length} pendiente{actionItems.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Todo en orden</p>
              <p className="text-xs text-slate-400 mt-1">No hay acciones urgentes pendientes</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {actionItems.map((item) => {
                const cfg = SEV_CFG[item.severity]
                const Icon = cfg.icon
                return (
                  <Link key={item.type} to={item.href}
                    className="flex items-start gap-3 p-3.5 rounded-xl border bg-white/60 hover:bg-white hover:shadow-md transition-all group">
                    <span className={cn('mt-0.5 w-2 h-2 rounded-full shrink-0 ring-4 ring-offset-1', cfg.dot, cfg.ring)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <Badge className={cn('text-xs border', cfg.label)}>
                          <Icon className="w-2.5 h-2.5 mr-1" />
                          {item.severity === 'high' ? 'Urgente' : item.severity === 'medium' ? 'Moderado' : 'Bajo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 shrink-0 mt-0.5 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* Recent tenants */}
        <GlassCard className="p-5" glow="bg-blue-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Empresas Recientes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimas registradas en la plataforma</p>
            </div>
            <Link to="/super-admin/tenants"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium hover:underline">
              Ver todas →
            </Link>
          </div>

          {recentTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Building2 className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Sin empresas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTenants.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  {/* Avatar initial */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                    <p className="text-xs text-slate-400 truncate">{t.owner_email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge s={t.status} />
                    <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('es-DO')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Row 4: Quick actions strip ── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Nueva Empresa', desc: 'Registrar tenant', href: '/super-admin/tenants', icon: Building2, cls: 'text-violet-600 bg-violet-50', hover: 'hover:border-violet-200 hover:shadow-violet-100' },
            { label: 'Gestionar Planes', desc: 'Ver facturación', href: '/super-admin/billing', icon: DollarSign, cls: 'text-emerald-600 bg-emerald-50', hover: 'hover:border-emerald-200 hover:shadow-emerald-100' },
            { label: 'Configurar SMTP', desc: 'Email & ajustes', href: '/super-admin/settings', icon: Zap, cls: 'text-blue-600 bg-blue-50', hover: 'hover:border-blue-200 hover:shadow-blue-100' },
            { label: 'Auditoría', desc: 'Logs del sistema', href: '/super-admin/logs', icon: Activity, cls: 'text-amber-600 bg-amber-50', hover: 'hover:border-amber-200 hover:shadow-amber-100' },
          ].map(a => (
            <Link key={a.label} to={a.href}
              className={cn('flex items-center gap-3 p-4 bg-white/70 backdrop-blur rounded-xl border border-slate-200 hover:shadow-lg transition-all', a.hover)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', a.cls.split(' ')[1])}>
                <a.icon className={cn('w-5 h-5', a.cls.split(' ')[0])} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-400">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Click-outside to close sim dropdown */}
      {simOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSimOpen(false)} />
      )}
    </div>
  )
}
