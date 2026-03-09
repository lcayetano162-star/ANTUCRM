import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, CheckSquare, Clock, Users, Target, Activity, TrendingUp, Phone } from 'lucide-react';
import { api } from '@/lib/api';

export function ActivityGoalsConfig() {
    const [isLoading, setIsLoading] = useState(false);
    const [goals, setGoals] = useState({
        seller: {
            weeklyVisits: 10,
            weeklyCalls: 80,
            newOpps: 5,
            speedToLead: 60,
            followUpRate: 95
        },
        manager: {
            pipelineHealth: 85,
            coachingSessions: 4,
            forecastAccuracy: 10,
            teamQuota: 100
        }
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const year = new Date().getFullYear();
                const res = await api.get<any>(`/quotas/sales-ops?year=${year}`);
                if (res) {
                    setGoals({
                        seller: res.seller,
                        manager: res.manager
                    });
                }
            } catch (err) {
                console.error('Error fetching sales ops config:', err);
                toast.error('Error al cargar configuración de ventas');
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const year = new Date().getFullYear();
            await api.post('/quotas/sales-ops', {
                year,
                period: 'ANNUAL',
                seller: goals.seller,
                manager: goals.manager
            });
            toast.success('Metas de Actividad (Sales Ops) guardadas exitosamente y aplicadas al Tenant.');
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error al guardar la configuración.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
                        Configuración de Sales Ops
                    </h2>
                    <p className="text-sm text-slate-500">Métricas adelantadas y leading indicators para Ejecutivos y Gerentes</p>
                </div>
                <Button disabled={isLoading} onClick={handleSave} className="gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                    <Save className="w-4 h-4" /> {isLoading ? 'Guardando...' : 'Aplicar a Vendedores y Gerentes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Ejecutivos de Ventas */}
                <Card className="border-t-4 border-t-[var(--color-primary)]">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            Para Ejecutivos de Ventas (Reps)
                        </CardTitle>
                        <CardDescription>Metas operativas semanales y mensuales requeridas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold">Visitas Presenciales</Label>
                                <p className="text-xs text-slate-500">O reuniones virtuales programadas por semana</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.seller.weeklyVisits}
                                onChange={e => setGoals({ ...goals, seller: { ...goals.seller, weeklyVisits: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> Llamadas</Label>
                                <p className="text-xs text-slate-500">Volumen de llamadas requeridas por semana</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.seller.weeklyCalls}
                                onChange={e => setGoals({ ...goals, seller: { ...goals.seller, weeklyCalls: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold">Nuevas Oportunidades</Label>
                                <p className="text-xs text-slate-500">Volumen requerido generado por mes</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.seller.newOpps}
                                onChange={e => setGoals({ ...goals, seller: { ...goals.seller, newOpps: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Speed to Lead (Mins)</Label>
                                <p className="text-xs text-slate-500">Tiempo máximo de primera respuesta</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.seller.speedToLead}
                                onChange={e => setGoals({ ...goals, seller: { ...goals.seller, speedToLead: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold">Follow-Up Rate (%)</Label>
                                <p className="text-xs text-slate-500">% minimo de opps abiertas con próximos pasos (Next steps)</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.seller.followUpRate}
                                onChange={e => setGoals({ ...goals, seller: { ...goals.seller, followUpRate: Number(e.target.value) } })}
                            />
                        </div>

                    </CardContent>
                </Card>

                {/* Gerentes de Ventas */}
                <Card className="border-t-4 border-t-slate-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-slate-400" />
                            Para Gerentes y Liderazgo (Managers)
                        </CardTitle>
                        <CardDescription>KPIs de liderazgo y gestión de pipeline del equipo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-500" /> Pipeline Health (%)</Label>
                                <p className="text-xs text-slate-500">% del pipeline de su equipo al día con tareas</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.manager.pipelineHealth}
                                onChange={e => setGoals({ ...goals, manager: { ...goals.manager, pipelineHealth: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold">Sesiones de Coaching (1:1)</Label>
                                <p className="text-xs text-slate-500">Revisiones de pipeline hechas en el mes</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.manager.coachingSessions}
                                onChange={e => setGoals({ ...goals, manager: { ...goals.manager, coachingSessions: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold">Max Forecast Error (%)</Label>
                                <p className="text-xs text-slate-500">Margen de error +- entre proyección y cierre real</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.manager.forecastAccuracy}
                                onChange={e => setGoals({ ...goals, manager: { ...goals.manager, forecastAccuracy: Number(e.target.value) } })}
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_120px] gap-4 items-center p-3 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Team Quota Attainment (%)</Label>
                                <p className="text-xs text-slate-500">Umbral mínimo exigido sumando todo el equipo</p>
                            </div>
                            <Input
                                type="number"
                                value={goals.manager.teamQuota}
                                onChange={e => setGoals({ ...goals, manager: { ...goals.manager, teamQuota: Number(e.target.value) } })}
                            />
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
