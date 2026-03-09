// ============================================================
// ANTU CRM - Service Dashboard (Supervisor View)
// KPIs: MTTR, FCR, SLA Compliance, Technician Productivity
// ============================================================
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, TrendingUp, AlertTriangle, Star, Phone } from 'lucide-react';

interface TechMetrics {
    id: string;
    name: string;
    avatar?: string;
    open: number;
    closed_today: number;
    mttr_hours: number;    // Mean Time To Repair
    fcr_rate: number;      // First Call Resolution %
    sla_compliance: number;// % within SLA
    second_call_rate: number;
    rating: number;        // 1-5 avg customer rating
}

interface ServiceKPIs {
    total_open: number;
    critical_open: number;
    sla_breached: number;
    avg_mttr_hours: number;
    fcr_rate: number;
    closed_today: number;
    waiting_parts: number;
}

// Demo data — replaced by API in production
const DEMO_KPIS: ServiceKPIs = {
    total_open: 24, critical_open: 3, sla_breached: 2,
    avg_mttr_hours: 4.2, fcr_rate: 78, closed_today: 11, waiting_parts: 5,
};

const DEMO_TECHNICIANS: TechMetrics[] = [
    { id: '1', name: 'Carlos López', open: 6, closed_today: 4, mttr_hours: 3.1, fcr_rate: 88, sla_compliance: 95, second_call_rate: 8, rating: 4.8 },
    { id: '2', name: 'María Rodríguez', open: 4, closed_today: 5, mttr_hours: 2.8, fcr_rate: 91, sla_compliance: 98, second_call_rate: 5, rating: 4.9 },
    { id: '3', name: 'Pedro García', open: 8, closed_today: 2, mttr_hours: 5.4, fcr_rate: 72, sla_compliance: 81, second_call_rate: 18, rating: 3.9 },
    { id: '4', name: 'Ana Martínez', open: 6, closed_today: 0, mttr_hours: 6.2, fcr_rate: 65, sla_compliance: 75, second_call_rate: 22, rating: 3.6 },
];

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

function FcrBar({ value }: { value: number }) {
    const color = value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs font-medium w-8 text-right text-slate-600">{value}%</span>
        </div>
    );
}

export function ServiceDashboard() {
    const kpis = DEMO_KPIS;
    const techs = DEMO_TECHNICIANS.sort((a, b) => b.fcr_rate - a.fcr_rate);

    return (
        <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <KpiBox label="Tickets Abiertos" value={kpis.total_open} icon={AlertTriangle} color="bg-blue-100 text-blue-600" />
                <KpiBox label="Críticos Abiertos" value={kpis.critical_open} icon={AlertTriangle} color="bg-red-100 text-red-600" alert={kpis.critical_open > 0} />
                <KpiBox label="SLA Vencidos" value={kpis.sla_breached} icon={Clock} color="bg-orange-100 text-orange-600" alert={kpis.sla_breached > 0} />
                <KpiBox label="Cerrados Hoy" value={kpis.closed_today} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
                <KpiBox label="MTTR Promedio" value={`${kpis.avg_mttr_hours}h`} sub="Mean Time To Repair" icon={Clock} color="bg-indigo-100 text-indigo-600" />
                <KpiBox label="FCR Rate" value={`${kpis.fcr_rate}%`} sub="1ra Llamada Resuelta" icon={Phone} color="bg-teal-100 text-teal-600" />
                <KpiBox label="Esperando Partes" value={kpis.waiting_parts} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
            </div>

            {/* Technician Leaderboard */}
            <Card className="border-slate-100">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        Productividad de Técnicos
                    </CardTitle>
                    <p className="text-xs text-slate-400">Ordenado por FCR (Primera Llamada Resuelta) — mejor métrica de efectividad</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                                    <th className="text-left px-4 py-2">#</th>
                                    <th className="text-left px-4 py-2">Técnico</th>
                                    <th className="text-center px-4 py-2">Abiertos</th>
                                    <th className="text-center px-4 py-2">Cerr. Hoy</th>
                                    <th className="text-center px-4 py-2">MTTR</th>
                                    <th className="px-4 py-2 min-w-[120px]">FCR Rate</th>
                                    <th className="text-center px-4 py-2">SLA OK</th>
                                    <th className="text-center px-4 py-2">2da Llamada</th>
                                    <th className="text-center px-4 py-2">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {techs.map((t, i) => (
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
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-300)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                                                    {t.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-medium text-slate-700">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">{t.open}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-emerald-600">{t.closed_today}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                                                t.mttr_hours <= 3 ? 'bg-emerald-50 text-emerald-700' :
                                                    t.mttr_hours <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            )}>
                                                {t.mttr_hours}h
                                            </span>
                                        </td>
                                        <td className="px-4 py-3"><FcrBar value={t.fcr_rate} /></td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn('text-xs font-medium',
                                                t.sla_compliance >= 90 ? 'text-emerald-600' :
                                                    t.sla_compliance >= 75 ? 'text-amber-600' : 'text-red-600'
                                            )}>
                                                {t.sla_compliance}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn('text-xs font-medium',
                                                t.second_call_rate <= 10 ? 'text-emerald-600' :
                                                    t.second_call_rate <= 15 ? 'text-amber-600' : 'text-red-600'
                                            )}>
                                                {t.second_call_rate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="flex items-center justify-center gap-0.5 text-xs font-bold text-amber-600">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                {t.rating}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><span className="font-semibold text-slate-700">MTTR</span> — Mean Time To Repair: tiempo promedio desde apertura hasta cierre</div>
                <div><span className="font-semibold text-slate-700">FCR</span> — First Call Resolution: tickets resueltos sin visita adicional</div>
                <div><span className="font-semibold text-slate-700">SLA OK</span> — % de tickets cerrados dentro del tiempo de respuesta acordado</div>
                <div><span className="font-semibold text-slate-700">2da Llamada</span> — % de tickets que volvieron a abrirse después de cerrados</div>
            </div>
        </div>
    );
}
