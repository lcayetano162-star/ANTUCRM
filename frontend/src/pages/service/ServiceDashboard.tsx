// ============================================================
// ANTU CRM - Service Dashboard (Supervisor View)
// KPIs: MTTR, SLA Compliance, Technician Productivity
// ============================================================
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Package, AlertTriangle, Star, UserX, RefreshCw } from 'lucide-react';
import { serviceDeskApi } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface TechRow {
    id: string;
    name: string;
    open_count: number;
    closed_today: number;
}

interface StatsResponse {
    total_open: number;
    critical_open: number;
    waiting_parts_count: number;
    avg_resolution_hours: number | null;
    resolved_this_month: number;
    unassigned_count: number;
    scope: 'team' | 'own';
    technicians: TechRow[];
}

function KpiBox({ label, value, sub, icon: Icon, color, alert }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; color: string; alert?: boolean;
}) {
    return (
        <Card className={cn('border', alert ? 'border-red-200 bg-red-50' : 'border-slate-100')}>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className={cn('text-2xl font-bold', alert ? 'text-red-700' : 'text-slate-800')}>{value}</p>
                    <p className="text-xs text-slate-500 leading-tight">{label}</p>
                    {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export function ServiceDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await serviceDeskApi.getStats();
            setStats(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error cargando estadísticas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStats(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('Cargando estadísticas...')}</span>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
                <p className="text-sm text-red-500">{error || t('Sin datos')}</p>
                <button onClick={loadStats} className="text-xs text-cyan-600 underline">{t('Reintentar')}</button>
            </div>
        );
    }

    const avgMttr = stats.avg_resolution_hours != null
        ? parseFloat(stats.avg_resolution_hours.toFixed(1))
        : null;

    const techs = [...stats.technicians].sort((a, b) => b.closed_today - a.closed_today);

    return (
        <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiBox label={t('Tickets Abiertos')} value={stats.total_open} icon={AlertTriangle} color="bg-blue-100 text-blue-600" />
                <KpiBox label={t('Críticos Abiertos')} value={stats.critical_open} icon={AlertTriangle} color="bg-red-100 text-red-600" alert={Number(stats.critical_open) > 0} />
                <KpiBox label={t('Sin Asignar')} value={stats.unassigned_count} icon={UserX} color="bg-orange-100 text-orange-600" alert={Number(stats.unassigned_count) > 0} />
                <KpiBox label={t('Resueltos este Mes')} value={stats.resolved_this_month} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
                <KpiBox label={t('Tiempo Prom. Resolución')} value={avgMttr != null ? `${avgMttr}h` : '—'} sub={t('Tickets cerrados')} icon={Clock} color="bg-indigo-100 text-indigo-600" />
                <KpiBox label={t('Esperando Partes')} value={stats.waiting_parts_count} icon={Package} color="bg-amber-100 text-amber-600" />
            </div>

            {/* Technician Table */}
            {stats.scope === 'team' && (
                <Card className="border-slate-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            {t('Carga de Técnicos')}
                        </CardTitle>
                        <p className="text-xs text-slate-400">{t('Tickets abiertos y cerrados hoy por técnico')}</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        {techs.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-8">{t('No hay técnicos registrados')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                                            <th className="text-left px-4 py-2">#</th>
                                            <th className="text-left px-4 py-2">{t('Técnico')}</th>
                                            <th className="text-center px-4 py-2">{t('Abiertos')}</th>
                                            <th className="text-center px-4 py-2">{t('Cerrados Hoy')}</th>
                                            <th className="text-center px-4 py-2">{t('Carga')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {techs.map((t, i) => {
                                            const total = Number(t.open_count) + Number(t.closed_today);
                                            const loadPct = total > 0 ? Math.round((Number(t.open_count) / total) * 100) : 0;
                                            const loadColor = loadPct >= 80 ? 'bg-red-400' : loadPct >= 50 ? 'bg-amber-400' : 'bg-emerald-500';
                                            return (
                                                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                                            i === 0 ? 'bg-amber-100 text-amber-700' :
                                                                i === 1 ? 'bg-slate-100 text-slate-600' :
                                                                    i === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                                                        )}>
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-200 to-cyan-300 flex items-center justify-center text-xs font-bold text-cyan-600">
                                                                {t.name.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <span className="font-medium text-slate-700">{t.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">{t.open_count}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium text-emerald-600">{t.closed_today}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={cn('h-full rounded-full transition-all', loadColor)} style={{ width: `${loadPct}%` }} />
                                                            </div>
                                                            <span className="text-xs text-slate-500 w-8 text-right">{loadPct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
