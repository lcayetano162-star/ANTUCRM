import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Brain, Target, AlertTriangle, TrendingDown, TrendingUp, DollarSign,
    PackageX, Users, ShieldAlert, Zap, Banknote, Briefcase, Activity, Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ReportsPage() {
    const [analyzing, setAnalyzing] = useState(false);

    const handleRefresh = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setAnalyzing(false);
            toast.success('Análisis de IA actualizado con datos en tiempo real');
        }, 1500);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header CSO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(94,217,207)] to-[rgb(75,201,191)] flex items-center justify-center shadow-lg shadow-[rgba(94,217,207,0.3)]">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Dirección Ejecutiva AI</h1>
                        <p className="text-slate-500 font-medium">Análisis transversal de fuentes integradas. Modo CSO (Chief Strategy Officer).</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => toast.success('Reporte exportado a PDF')}>
                        <Printer className="w-4 h-4" />
                        Exportar
                    </Button>
                    <Button
                        onClick={handleRefresh}
                        className="gap-2 bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
                        disabled={analyzing}
                    >
                        <Zap className={cn("w-4 h-4", analyzing && "animate-pulse")} />
                        {analyzing ? 'Sintetizando...' : 'Actualizar Estrategia'}
                    </Button>
                </div>
            </div>

            {/* Radar de Riesgos y Oportunidades */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="col-span-1 lg:col-span-3 border-l-4 border-l-amber-500 bg-amber-50/30 overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                            <Target className="w-5 h-5 text-amber-600" />
                            Radar de Dirección: Acciones Críticas de HOY
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-3 items-start border-r border-amber-200/50 pr-4">
                                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Riesgo de Liquidez</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        El 40% de la deuda histórica del <strong>Cliente Grupo Alfa</strong> (US$ 24,500) venció ayer. Tienen un acuerdo pendiente en oportunidades por US$ 12,000. <strong>Detener despacho hasta pago parcial.</strong>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start border-r border-amber-200/50 pr-4">
                                <PackageX className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Fuga por Inventario</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        3 oportunidades por US$ 8,400 estancadas por falta de inventario del producto SK-900. Reasignar inventario de zona norte o perderemos venta segura esta semana.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Alerta Churn de Valor</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        <strong>TechCorp RD</strong> representa el 12% de facturación histórica anual, pero no tienen Oportunidades activas hace 64 días. Llama sugerida del CEO para control de satisfacción.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Flujo de Caja Predictivo */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-24 h-24 text-[rgb(94,217,207)]" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-[rgb(94,217,207)]" />
                            Visión de Flujo de Caja
                        </CardTitle>
                        <CardDescription>Cruce: Oportunidades x Cuentas por Cobrar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Flujo Seguro (CxC al día)</p>
                                <p className="text-2xl font-black text-slate-800">US$ 54,200</p>
                            </div>
                            <div className="p-4 bg-[rgba(94,217,207,0.1)] rounded-xl border border-[rgba(94,217,207,0.3)]">
                                <p className="text-xs text-[rgb(75,201,191)] font-bold mb-1 uppercase tracking-wider">Cierres inminentes ({'>'}80%)</p>
                                <p className="text-2xl font-black text-slate-800">US$ 31,500</p>
                            </div>
                        </div>
                        <div className="mt-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-2">CSO Forecast Antigravity:</h4>
                            <p className="text-sm text-slate-600">
                                La proyección real de entrada neta para cierre de mes suma <strong>US$ 78,000</strong> (ajustando mora histórica del 12%). El optimismo de ventas marca US$ 95k, pero la realidad de cobranza exige cautela.
                            </p>
                            <div className="mt-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estrategia de Cobro Sugerida:</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg border-l-2 border-[rgb(94,217,207)]">
                                        <span className="font-medium">1. Comercial del Sur</span>
                                        <span className="text-slate-500">US$ 15K (32 días)</span>
                                        <Badge variant="outline" className="text-[10px] bg-white">Maximiza flujo</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg border-l-2 border-amber-400">
                                        <span className="font-medium">2. Retail Beta</span>
                                        <span className="text-slate-500">US$ 8.2K (45 días)</span>
                                        <Badge variant="outline" className="text-[10px] bg-white">DSO Riesgoso</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Eficiencia Comercial */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24 text-[rgb(94,217,207)]" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[rgb(94,217,207)]" />
                            Eficiencia Comercial Neta
                        </CardTitle>
                        <CardDescription>Métricas de Margen de Contribución y Salud de Cartera</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                                <Badge className="absolute -top-2.5 right-4 bg-emerald-100 text-emerald-700 border-emerald-200 shadow-none">Top Performer Real</Badge>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Carlos Méndez</h4>
                                        <p className="text-xs text-slate-500">Volumen Ventas: Rango #3</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600">32% Margen Líquido</p>
                                        <p className="text-xs font-semibold text-slate-500">DSO: 18 días</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                                    <span className="font-bold text-[rgb(75,201,191)]">CSO Insight:</span> No es quien más factura, pero quien trae mejor flujo de caja rápido y rentabilidad. Clona sus tácticas de cierre de trato.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                                <Badge className="absolute -top-2.5 right-4 bg-rose-100 text-rose-700 border-rose-200 shadow-none">Riesgo de Cartera</Badge>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Ana Rodríguez</h4>
                                        <p className="text-xs text-slate-500">Volumen Ventas: Rango #1</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-amber-600">14% Margen Líquido</p>
                                        <p className="text-xs font-semibold text-slate-500">DSO: 54 días</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                                    <span className="font-bold text-amber-600">Alerta de Riesgo:</span> Tasa de cierre alta a costa de altos descuentos y promesas laxas de pago. Revisar cartera de clientes hoy.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Facturación y Churn */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-slate-900" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-[rgb(94,217,207)]" />
                            Facturación vs Riesgo de Fuga
                        </CardTitle>
                        <CardDescription>Cruce: Ingresos Históricos x Inactividad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1 p-3 bg-slate-50 rounded-lg text-center">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Promedio Global</h4>
                                <p className="text-xl font-bold text-slate-800">US$ 1,840</p>
                            </div>
                            <div className="flex-1 p-3 bg-slate-50 rounded-lg text-center">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ingresos vs Meta Mensual</h4>
                                <p className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1">
                                    84% <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                Detección Temprana de Churn
                            </h4>
                            <p className="text-xs text-slate-600 mb-3">
                                Cuentas recurrentes en facturación histórica (Top 20%) sin interacción comercial registrada u oportunidades nuevas en más de 60 días.
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                    <span className="font-medium text-slate-700">Constructora Valle</span>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200">82 Días Inactivo</Badge>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-700">Medical Supplies Co.</span>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">65 Días Inactivo</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventario vs Ventas */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Briefcase className="w-24 h-24 text-slate-900" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackageX className="w-5 h-5 text-[rgb(94,217,207)]" />
                            Correlación Inventario/Ventas
                        </CardTitle>
                        <CardDescription>Costo de Oportunidad y Capital Estancado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Oportunidades Perdidas</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-slate-800">4</p>
                                    <p className="text-xs font-bold text-rose-500">Por Quiebre Stock</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Capital Estancado ('Dead')</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-slate-800">US$ 42K</p>
                                    <p className="text-xs font-bold text-slate-500">&gt; 120 días</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[rgba(94,217,207,0.05)] border border-[rgba(94,217,207,0.2)] rounded-xl">
                            <h4 className="font-bold text-slate-800 text-sm mb-2">Plan de Optimización Inteligente:</h4>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(94,217,207)] mt-1.5" />
                                    <span><strong>Liquidación inmediata:</strong> Famílias C-300 y C-400 no han rotado. Lanzar venta cruzada (bundling) con el producto estrella (A-100) al 30% de descuento. <strong>Liberaría US$ 15k de capital esta semana.</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    <span><strong>Alerta de Compra:</strong> El SKU "Motor Trifásico" está en 5 cotizaciones abiertas (US$ 28k pot.) pero solo quedan 2 en almacén. Ejecutar P.O urgente a proveedor.</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

export default ReportsPage;
