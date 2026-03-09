import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, AlertCircle, CheckCircle2, XCircle, TrendingUp, Users, Clock, CheckSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function SalesOpsPerformance({
    role,
    score,
    metrics
}: {
    role: 'seller' | 'manager';
    score: number;
    metrics: any;
}) {

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return 'text-emerald-500';
        if (percent >= 70) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getStatusBg = (percent: number) => {
        if (percent >= 90) return 'bg-emerald-500';
        if (percent >= 70) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getStatusIcon = (percent: number) => {
        if (percent >= 90) return <CheckCircle2 className={`w-5 h-5 ${getStatusColor(percent)}`} />;
        if (percent >= 70) return <AlertCircle className={`w-5 h-5 ${getStatusColor(percent)}`} />;
        return <XCircle className={`w-5 h-5 ${getStatusColor(percent)}`} />;
    };

    return (
        <Card className={`border-t-4 ${role === 'seller' ? 'border-t-[var(--color-primary)]' : 'border-t-slate-800'}`}>
            <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className={cn("w-5 h-5", role === 'seller' ? 'text-[var(--color-primary)]' : 'text-slate-700')} />
                            {role === 'seller' ? 'Salud de Actividad Operativa' : 'Cumplimiento de Gestión (Liderazgo)'}
                        </CardTitle>
                        <CardDescription>
                            {role === 'seller' ? 'Tu score de cumplimiento de leading indicators (Sales Ops)' : 'Tus KPIs operativos como líder del equipo de ventas'}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 font-medium mb-1">Performance Score</div>
                        <div className={cn("text-3xl font-bold flex items-center gap-2 justify-end", getStatusColor(score))}>
                            {score}
                            <span className="text-lg text-slate-400 font-normal">/ 100</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", role === 'seller' ? "lg:grid-cols-5" : "lg:grid-cols-4")}>

                    {role === 'seller' ? (
                        <>
                            {/* VENDEDORES */}
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><Users className="w-4 h-4" /> Visitas</span>
                                    <span className="font-medium">{metrics.visits.actual} / {metrics.visits.target}</span>
                                </div>
                                <Progress value={metrics.visits.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.visits.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>{metrics.visits.percent}% cumplido</span>
                                    {getStatusIcon(metrics.visits.percent)}
                                </div>
                            </div>

                            {metrics.calls && (
                                <div className="space-y-2 relative">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-slate-700 flex items-center gap-1"><Phone className="w-4 h-4" /> Llamadas</span>
                                        <span className="font-medium">{metrics.calls.actual} / {metrics.calls.target}</span>
                                    </div>
                                    <Progress value={metrics.calls.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.calls.percent)}`)} />
                                    <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                        <span>{metrics.calls.percent}% cumplido</span>
                                        {getStatusIcon(metrics.calls.percent)}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Nvas Opps</span>
                                    <span className="font-medium">{metrics.newOpps.actual} / {metrics.newOpps.target}</span>
                                </div>
                                <Progress value={metrics.newOpps.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.newOpps.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>{metrics.newOpps.percent}% alcanzado</span>
                                    {getStatusIcon(metrics.newOpps.percent)}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><Clock className="w-4 h-4" /> Speed/Lead</span>
                                    <span className="font-medium">{metrics.speedToLead.actual}m / {metrics.speedToLead.target}m</span>
                                </div>
                                {/* Lógica invertida (entre menos tiempo, mejor porcentaje) */}
                                <Progress value={metrics.speedToLead.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.speedToLead.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>{metrics.speedToLead.percent}% (Score)</span>
                                    {getStatusIcon(metrics.speedToLead.percent)}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><CheckSquare className="w-4 h-4" /> FUP Rate</span>
                                    <span className="font-medium">{metrics.followUp.actual}% / {metrics.followUp.target}%</span>
                                </div>
                                <Progress value={metrics.followUp.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.followUp.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>Opps con next step</span>
                                    {getStatusIcon(metrics.followUp.percent)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* GERENTES */}
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><Target className="w-4 h-4" /> Pipe Health</span>
                                    <span className="font-medium">{metrics.pipelineHealth.actual}% / {metrics.pipelineHealth.target}%</span>
                                </div>
                                <Progress value={metrics.pipelineHealth.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.pipelineHealth.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>Salud General</span>
                                    {getStatusIcon(metrics.pipelineHealth.percent)}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><Users className="w-4 h-4" /> Coaching</span>
                                    <span className="font-medium">{metrics.coaching.actual} / {metrics.coaching.target}</span>
                                </div>
                                <Progress value={metrics.coaching.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.coaching.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>Sesiones 1:1</span>
                                    {getStatusIcon(metrics.coaching.percent)}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Forecast Val.</span>
                                    <span className="font-medium">{metrics.forecastAccuracy.actual}% / &lt;{metrics.forecastAccuracy.target}%</span>
                                </div>
                                <Progress value={metrics.forecastAccuracy.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.forecastAccuracy.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>Margen de Error</span>
                                    {getStatusIcon(metrics.forecastAccuracy.percent)}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1"><Target className="w-4 h-4" /> Attainment</span>
                                    <span className="font-medium">{metrics.teamQuota.actual}% / {metrics.teamQuota.target}%</span>
                                </div>
                                <Progress value={metrics.teamQuota.percent} className={cn("h-2", `[&>div]:${getStatusBg(metrics.teamQuota.percent)}`)} />
                                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    <span>Cuota Equipo</span>
                                    {getStatusIcon(metrics.teamQuota.percent)}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </CardContent>
        </Card>
    )
}
