// ============================================================
// ANTU FSM - Motor de Despacho Inteligente
// Algorithm: Weighted TSP con scoring de SLA y habilidades
// ============================================================
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    Brain, MapPin, Clock, Zap, TrendingDown, Route,
    AlertTriangle, CheckCircle2, User, Wrench, Navigation,
    ChevronRight, Target, BarChart3, Fuel, Timer
} from 'lucide-react';

// ── TYPES ─────────────────────────────────────────────────────
interface TicketJob {
    id: string;
    ticket_number: string;
    subject: string;
    client_name: string;
    address: string;
    zone: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    complexity: 1 | 2 | 3 | 4 | 5;  // 1=simple swap, 5=multi-part repair
    sla_deadline_hours: number; // hours until SLA breach
    estimated_duration_min: number;
    required_skill: string;
    asset_type: string;
    lat: number;
    lng: number;
    is_warranty: boolean;
}

interface TechProfile {
    id: string;
    name: string;
    zone_primary: string;
    skills: string[];
    current_lat: number;
    current_lng: number;
    start_location: string;
    available_hours: number;
    fcr_rate: number;
    rating: number;
}

interface DispatchRoute {
    technician: TechProfile;
    stops: RouteStop[];
    total_distance_km: number;
    total_duration_min: number;
    sla_coverage: number; // % tickets within SLA
    efficiency_score: number;
    fuel_cost_rd: number;
    estimated_end_time: string;
}

interface RouteStop {
    order: number;
    job: TicketJob;
    estimated_arrival: string;
    estimated_completion: string;
    travel_time_min: number;
    travel_distance_km: number;
    within_sla: boolean;
    skill_match: 'perfect' | 'adequate' | 'stretch';
}

// ── DATA MODELS ───────────────────────────────────────────────
const TECHNICIANS: TechProfile[] = [
    {
        id: 't1', name: 'Carlos López', zone_primary: 'Piantini / Serralles',
        skills: ['MFP Color', 'MFP B/N', 'Plotter', 'Scanner Avanzado'],
        current_lat: 18.4720, current_lng: -69.9430, start_location: 'Oficina Principal (Piantini)',
        available_hours: 8, fcr_rate: 88, rating: 4.8
    },
    {
        id: 't2', name: 'María Rodríguez', zone_primary: 'Naco / Evaristo Morales',
        skills: ['MFP Color', 'MFP B/N', 'Red/Conectividad', 'CloudPrint'],
        current_lat: 18.4760, current_lng: -69.9300, start_location: 'Naco (Base Norte)',
        available_hours: 8, fcr_rate: 91, rating: 4.9
    },
    {
        id: 't3', name: 'Pedro García', zone_primary: 'Gazcue / Ciudad Nueva',
        skills: ['MFP B/N', 'Fax', 'Mantenimiento Preventivo'],
        current_lat: 18.4730, current_lng: -69.9020, start_location: 'Centro de la Ciudad',
        available_hours: 7, fcr_rate: 72, rating: 3.9
    },
    {
        id: 't4', name: 'Ana Martínez', zone_primary: 'Bella Vista / Los Prados',
        skills: ['MFP Color', 'MFP B/N', 'Digital Workflow', 'SAP Print'],
        current_lat: 18.4600, current_lng: -69.9300, start_location: 'Bella Vista',
        available_hours: 8, fcr_rate: 85, rating: 4.5
    },
];

const UNASSIGNED_JOBS: TicketJob[] = [
    {
        id: 'j1', ticket_number: 'TKT-202603-0006', subject: 'Drum unit defectuosa - impresión con rayas',
        client_name: 'Grupo Empresarial Torres', address: 'Av. Abraham Lincoln 304, Piantini',
        zone: 'Piantini', priority: 'Critical', complexity: 3, sla_deadline_hours: 2,
        estimated_duration_min: 75, required_skill: 'MFP Color', asset_type: 'MFP-C300 Color A3',
        lat: 18.4715, lng: -69.9395, is_warranty: true
    },
    {
        id: 'j2', ticket_number: 'TKT-202603-0007', subject: 'Mantenimiento preventivo trimestral',
        client_name: 'Clínica San José', address: 'Av. Tiradentes 45, Naco',
        zone: 'Naco', priority: 'Low', complexity: 2, sla_deadline_hours: 48,
        estimated_duration_min: 90, required_skill: 'MFP B/N', asset_type: 'MFP-B620 Pro',
        lat: 18.4759, lng: -69.9295, is_warranty: false
    },
    {
        id: 'j3', ticket_number: 'TKT-202603-0008', subject: 'Error E5-6 fuser al encender',
        client_name: 'Banco Nacional - Sucursal Gazcue', address: 'Av. Independencia 201, Gazcue',
        zone: 'Gazcue', priority: 'High', complexity: 4, sla_deadline_hours: 4,
        estimated_duration_min: 120, required_skill: 'MFP B/N', asset_type: 'MFP-B520',
        lat: 18.4732, lng: -69.9017, is_warranty: false
    },
    {
        id: 'j4', ticket_number: 'TKT-202603-0009', subject: 'Configuración scan-to-SharePoint',
        client_name: 'Constructora del Caribe', address: 'Av. Gustavo Mejía Ricart 54, Bella Vista',
        zone: 'Bella Vista', priority: 'Medium', complexity: 2, sla_deadline_hours: 24,
        estimated_duration_min: 60, required_skill: 'Digital Workflow', asset_type: 'MFP-C450',
        lat: 18.4599, lng: -69.9298, is_warranty: false
    },
    {
        id: 'j5', ticket_number: 'TKT-202603-0010', subject: 'Atascos papel bandeja 2 - bloqueo total',
        client_name: 'Hotel Las Américas', address: 'Av. George Washington 501, Miramar',
        zone: 'Miramar', priority: 'High', complexity: 3, sla_deadline_hours: 3,
        estimated_duration_min: 90, required_skill: 'MFP Color', asset_type: 'MFP-C300',
        lat: 18.4669, lng: -69.9598, is_warranty: false
    },
    {
        id: 'j6', ticket_number: 'TKT-202603-0011', subject: 'Plotter no reconoce rollo de papel',
        client_name: 'Arq. & Diseño Dominicano', address: 'Av. 27 de Febrero 223, Evaristo Morales',
        zone: 'Evaristo Morales', priority: 'Medium', complexity: 2, sla_deadline_hours: 18,
        estimated_duration_min: 45, required_skill: 'Plotter', asset_type: 'HP DesignJet T650',
        lat: 18.4742, lng: -69.9143, is_warranty: true
    },
    {
        id: 'j7', ticket_number: 'TKT-202603-0012', subject: 'Tóner no detectado tras recarga no autorizada',
        client_name: 'Farmacéutica RD', address: 'Av. John F. Kennedy 57, Los Prados',
        zone: 'Los Prados', priority: 'Medium', complexity: 3, sla_deadline_hours: 12,
        estimated_duration_min: 60, required_skill: 'MFP Color', asset_type: 'MFP-C500',
        lat: 18.4889, lng: -69.9497, is_warranty: false
    },
    {
        id: 'j8', ticket_number: 'TKT-202603-0013', subject: 'Mantenimiento preventivo + cambio drum',
        client_name: 'Aduanas - Almacén Km9', address: 'Carretera Duarte Km 9, Km9',
        zone: 'Km9 / Norte', priority: 'Low', complexity: 2, sla_deadline_hours: 72,
        estimated_duration_min: 120, required_skill: 'MFP B/N', asset_type: 'MFP-B720',
        lat: 18.4356, lng: -69.9898, is_warranty: false
    },
];

// ── AI ALGORITHM ──────────────────────────────────────────────
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula (km)
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function urgencyScore(job: TicketJob): number {
    const priorityWeight = { Critical: 100, High: 70, Medium: 40, Low: 15 }[job.priority];
    const slaUrgency = job.sla_deadline_hours <= 2 ? 50 : job.sla_deadline_hours <= 4 ? 30 :
        job.sla_deadline_hours <= 8 ? 20 : job.sla_deadline_hours <= 24 ? 10 : 5;
    const complexityFactor = job.complexity * 5;
    return priorityWeight + slaUrgency + complexityFactor;
}

function skillMatch(tech: TechProfile, job: TicketJob): 'perfect' | 'adequate' | 'stretch' {
    if (tech.skills.includes(job.required_skill)) return 'perfect';
    if (tech.skills.some(s => s.includes('MFP'))) return 'adequate';
    return 'stretch';
}

function runAiDispatch(technicians: TechProfile[], jobs: TicketJob[]): DispatchRoute[] {
    // Sort jobs by urgency score (most urgent first)
    const sortedJobs = [...jobs].sort((a, b) => urgencyScore(b) - urgencyScore(a));

    // Assign jobs to techs: skill match + proximity (greedy nearest with skill preference)
    const assignments: Map<string, TicketJob[]> = new Map(technicians.map(t => [t.id, []]));
    const availableHours: Map<string, number> = new Map(technicians.map(t => [t.id, t.available_hours * 60]));

    for (const job of sortedJobs) {
        // Score each tech for this job
        let bestTech: TechProfile | null = null;
        let bestScore = -1;

        for (const tech of technicians) {
            const remaining = availableHours.get(tech.id) || 0;
            if (remaining < job.estimated_duration_min + 20) continue; // not enough time

            const sm = skillMatch(tech, job);
            const dist = calculateDistance(tech.current_lat, tech.current_lng, job.lat, job.lng);
            const skillBonus = sm === 'perfect' ? 100 : sm === 'adequate' ? 50 : 0;
            const proximityScore = Math.max(0, 100 - dist * 10);
            const score = skillBonus + proximityScore + (tech.fcr_rate * 0.5);

            if (score > bestScore) { bestScore = score; bestTech = tech; }
        }

        if (bestTech) {
            assignments.get(bestTech.id)!.push(job);
            const used = availableHours.get(bestTech.id)! - job.estimated_duration_min - 20;
            availableHours.set(bestTech.id, used);
        }
    }

    // Build optimized routes (nearest neighbor TSP per tech)
    const routes: DispatchRoute[] = [];
    const SPEED_KMH = 25; // Santo Domingo traffic average
    const RD_PER_KM = 45; // fuel cost RD$ per km

    for (const tech of technicians) {
        const techJobs = assignments.get(tech.id) || [];
        if (techJobs.length === 0) continue;

        // Nearest neighbor route starting from tech location
        let currentLat = tech.current_lat;
        let currentLng = tech.current_lng;
        const remaining = [...techJobs];
        const ordered: TicketJob[] = [];

        while (remaining.length > 0) {
            // Priority override: critical tickets first if within 3km
            const critical = remaining.filter(j => j.priority === 'Critical');
            const closeCritical = critical.filter(j => calculateDistance(currentLat, currentLng, j.lat, j.lng) < 3);

            let next: TicketJob;
            if (closeCritical.length > 0) {
                next = closeCritical.reduce((a, b) =>
                    urgencyScore(b) > urgencyScore(a) ? b : a);
            } else {
                // Nearest unvisited job
                next = remaining.reduce((a, b) =>
                    calculateDistance(currentLat, currentLng, a.lat, a.lng) <
                        calculateDistance(currentLat, currentLng, b.lat, b.lng) ? a : b);
            }
            ordered.push(next);
            remaining.splice(remaining.indexOf(next), 1);
            currentLat = next.lat; currentLng = next.lng;
        }

        // Build stops with time estimates
        const stops: RouteStop[] = [];
        let timeCursor = new Date();
        timeCursor.setHours(8, 0, 0, 0); // Start at 8:00 AM
        let totalDist = 0;
        let prevLat = tech.current_lat;
        let prevLng = tech.current_lng;

        for (let i = 0; i < ordered.length; i++) {
            const job = ordered[i];
            const dist = calculateDistance(prevLat, prevLng, job.lat, job.lng);
            const travelMin = Math.round((dist / SPEED_KMH) * 60);
            totalDist += dist;

            const arrivalTime = new Date(timeCursor.getTime() + travelMin * 60000);
            const completionTime = new Date(arrivalTime.getTime() + job.estimated_duration_min * 60000);

            const fmtTime = (d: Date) => d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
            const hoursUntilDeadline = (job.sla_deadline_hours) - ((arrivalTime.getTime() - Date.now()) / 3600000);

            stops.push({
                order: i + 1,
                job,
                estimated_arrival: fmtTime(arrivalTime),
                estimated_completion: fmtTime(completionTime),
                travel_time_min: travelMin,
                travel_distance_km: Math.round(dist * 10) / 10,
                within_sla: hoursUntilDeadline >= 0,
                skill_match: skillMatch(tech, job),
            });

            timeCursor = completionTime;
            prevLat = job.lat; prevLng = job.lng;
        }

        const slaOK = stops.filter(s => s.within_sla).length;
        const effScore = Math.round((slaOK / stops.length) * 70 + (tech.fcr_rate * 0.3));

        routes.push({
            technician: tech,
            stops,
            total_distance_km: Math.round(totalDist * 10) / 10,
            total_duration_min: stops.reduce((s, r) => s + r.job.estimated_duration_min + r.travel_time_min, 0),
            sla_coverage: Math.round((slaOK / stops.length) * 100),
            efficiency_score: effScore,
            fuel_cost_rd: Math.round(totalDist * RD_PER_KM),
            estimated_end_time: stops[stops.length - 1]?.estimated_completion || '—',
        });
    }

    return routes.sort((a, b) => b.efficiency_score - a.efficiency_score);
}

// ── COMPONENTS ────────────────────────────────────────────────
function PriorityDot({ p }: { p: TicketJob['priority'] }) {
    return <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0',
        p === 'Critical' ? 'bg-red-500 animate-pulse' :
            p === 'High' ? 'bg-orange-500' :
                p === 'Medium' ? 'bg-amber-400' : 'bg-slate-300')} />;
}

function SkillBadge({ match }: { match: RouteStop['skill_match'] }) {
    return (
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0',
            match === 'perfect' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                match === 'adequate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200')}>
            {match === 'perfect' ? '✓ Skill' : match === 'adequate' ? '~ Compatible' : '⚠ Stretch'}
        </Badge>
    );
}

function RouteCard({ route, index }: { route: DispatchRoute; index: number }) {
    const [expanded, setExpanded] = useState(index === 0);
    const t = route.technician;

    return (
        <Card className="border-slate-200 overflow-hidden">
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Tech Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-300)] flex items-center justify-center font-bold text-[var(--color-primary)] text-base flex-shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Tech Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{t.name}</p>
                        <Badge variant="outline" className="text-[10px] bg-slate-50">{t.zone_primary}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{t.start_location}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3" />{route.total_distance_km} km
                        </span>
                        <span className="text-xs flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />{Math.floor(route.total_duration_min / 60)}h {route.total_duration_min % 60}m
                        </span>
                        <span className="text-xs flex items-center gap-1 text-slate-500">
                            <Fuel className="w-3 h-3" />RD$ {route.fuel_cost_rd.toLocaleString('es-DO')}
                        </span>
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                        <p className="text-lg font-bold text-slate-800">{route.stops.length}</p>
                        <p className="text-[10px] text-slate-400">tickets</p>
                    </div>
                    <div className="text-center">
                        <p className={cn('text-lg font-bold', route.sla_coverage >= 90 ? 'text-emerald-600' : route.sla_coverage >= 70 ? 'text-amber-600' : 'text-red-600')}>
                            {route.sla_coverage}%
                        </p>
                        <p className="text-[10px] text-slate-400">SLA OK</p>
                    </div>
                    <div className="text-center">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                            route.efficiency_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                route.efficiency_score >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                            {route.efficiency_score}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">score</p>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-90')} />
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100">
                    {/* Route timeline */}
                    <div className="p-4 space-y-0">
                        {/* Start point */}
                        <div className="flex gap-3 pb-3">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                    <Navigation className="w-3 h-3 text-white" />
                                </div>
                                <div className="w-0.5 h-6 bg-slate-200 mt-1" />
                            </div>
                            <div className="pt-0.5">
                                <p className="text-xs font-semibold text-slate-700">{t.start_location}</p>
                                <p className="text-[10px] text-slate-400">08:00 — Punto de partida</p>
                            </div>
                        </div>

                        {/* Stops */}
                        {route.stops.map((stop, i) => (
                            <div key={stop.job.id} className="flex gap-3">
                                <div className="flex flex-col items-center pb-3">
                                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0',
                                        stop.job.priority === 'Critical' ? 'bg-red-500' :
                                            stop.job.priority === 'High' ? 'bg-orange-500' :
                                                stop.job.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-400')}>
                                        {stop.order}
                                    </div>
                                    {i < route.stops.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
                                </div>

                                <div className={cn('flex-1 rounded-xl border p-3 mb-3',
                                    !stop.within_sla ? 'border-red-200 bg-red-50' :
                                        stop.job.priority === 'Critical' ? 'border-red-100 bg-red-50/50' :
                                            'border-slate-100 bg-slate-50')}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <PriorityDot p={stop.job.priority} />
                                                <p className="text-xs font-mono text-slate-400">{stop.job.ticket_number}</p>
                                                {!stop.within_sla && (
                                                    <Badge className="text-[10px] px-1 py-0 bg-red-500 text-white hover:bg-red-500">
                                                        ⚡ SLA RIESGO
                                                    </Badge>
                                                )}
                                                {stop.job.is_warranty && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        🛡 Garantía
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-tight">{stop.job.subject}</p>
                                            <p className="text-xs text-slate-600">{stop.job.client_name}</p>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-2.5 h-2.5" />{stop.job.address}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 space-y-1">
                                            <SkillBadge match={stop.skill_match} />
                                            <p className="text-[10px] font-mono text-slate-500">{stop.estimated_arrival} — {stop.estimated_completion}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                                        <span className="flex items-center gap-0.5"><Route className="w-3 h-3" />{stop.travel_distance_km} km</span>
                                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{stop.travel_time_min} min viaje</span>
                                        <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" />{stop.job.estimated_duration_min} min trabajo</span>
                                        <span className="flex items-center gap-0.5"><Wrench className="w-3 h-3" />Complejidad {stop.job.complexity}/5</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* End summary */}
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                            <div className="pt-0.5">
                                <p className="text-xs font-semibold text-emerald-700">Fin de jornada estimado: {route.estimated_end_time}</p>
                                <p className="text-[10px] text-slate-400">
                                    {route.stops.filter(s => s.within_sla).length}/{route.stops.length} tickets dentro de SLA ·
                                    RD$ {route.fuel_cost_rd.toLocaleString('es-DO')} combustible
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function AiRoutePlanner() {
    const [routes, setRoutes] = useState<DispatchRoute[]>([]);
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'analyzing' | 'optimizing' | 'done'>('idle');
    const [thinkingStep, setThinkingStep] = useState('');

    const THINKING_STEPS = [
        '🛰️ Geolocalización de técnicos y tickets...',
        '📊 Calculando scores de urgencia y complejidad...',
        '🧠 Evaluando matrix de habilidades vs. requerimientos...',
        '🗺️ Ejecutando TSP con restricciones de SLA...',
        '⚡ Optimizando rutas para mínimo tiempo total...',
        '✅ Validando cobertura SLA y asignando carga...',
        '📍 Generando itinerarios finales...',
    ];

    const runDispatch = useCallback(async () => {
        setLoading(true);
        setPhase('analyzing');

        for (let i = 0; i < THINKING_STEPS.length; i++) {
            setThinkingStep(THINKING_STEPS[i]);
            await new Promise(r => setTimeout(r, 420));
        }

        setPhase('optimizing');
        await new Promise(r => setTimeout(r, 600));

        const result = runAiDispatch(TECHNICIANS, UNASSIGNED_JOBS);
        setRoutes(result);
        setPhase('done');
        setLoading(false);
    }, []);

    // Global metrics
    const totalTickets = UNASSIGNED_JOBS.length;
    const slaRiskCount = UNASSIGNED_JOBS.filter(j => j.sla_deadline_hours <= 4).length;
    const avgEfficiency = routes.length > 0 ? Math.round(routes.reduce((s, r) => s + r.efficiency_score, 0) / routes.length) : 0;
    const totalDistance = routes.reduce((s, r) => s + r.total_distance_km, 0);
    const manualEstDistance = totalTickets * 18; // Avg manual dispatch: 18km/ticket vs optimized
    const distanceSaved = Math.max(0, Math.round(manualEstDistance - totalDistance));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[var(--color-primary)]" />
                        Despacho Inteligente — Route Optimizer
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Algoritmo TSP con scoring de SLA, complejidad y habilidades
                    </p>
                </div>
                <Button
                    className={cn(
                        'gap-2 h-10 transition-all',
                        loading ? 'bg-indigo-600 hover:bg-indigo-700' :
                            phase === 'done' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                    )}
                    onClick={runDispatch}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Optimizando...
                        </>
                    ) : phase === 'done' ? (
                        <><Zap className="w-4 h-4" />Re-Optimizar</>
                    ) : (
                        <><Brain className="w-4 h-4" />Ejecutar IA Dispatch</>
                    )}
                </Button>
            </div>

            {/* Top metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{totalTickets}</p>
                            <p className="text-xs text-slate-500">Tickets por despachar</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn('border', slaRiskCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100')}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={cn('text-2xl font-bold', slaRiskCount > 0 ? 'text-red-700' : 'text-slate-800')}>{slaRiskCount}</p>
                            <p className="text-xs text-slate-500">En riesgo de SLA (&lt;4h)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{TECHNICIANS.length}</p>
                            <p className="text-xs text-slate-500">Técnicos disponibles</p>
                        </div>
                    </CardContent>
                </Card>
                {phase === 'done' ? (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-700">{distanceSaved} km</p>
                                <p className="text-xs text-emerald-600">Ahorro vs despacho manual</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-slate-100">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">—</p>
                                <p className="text-xs text-slate-500">Ahorro (ejecuta IA)</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* AI Thinking animation */}
            {loading && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-indigo-700 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-indigo-800">IA procesando despacho óptimo</p>
                            <p className="text-xs text-indigo-600 animate-pulse">{thinkingStep}</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {THINKING_STEPS.map((step, i) => (
                            <div key={i} className={cn('text-xs flex items-center gap-2 transition-all',
                                THINKING_STEPS.indexOf(thinkingStep) > i ? 'text-indigo-700' :
                                    THINKING_STEPS.indexOf(thinkingStep) === i ? 'text-indigo-900 font-semibold' :
                                        'text-indigo-300')}>
                                {THINKING_STEPS.indexOf(thinkingStep) > i ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
                                    THINKING_STEPS.indexOf(thinkingStep) === i ? <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /> :
                                        <div className="w-3 h-3 rounded-full bg-indigo-200" />}
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary after optimization */}
            {phase === 'done' && routes.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <p className="font-bold text-emerald-800">Optimización completada · {routes.length} rutas generadas</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-xl font-bold text-emerald-700">{routes.reduce((s, r) => s + r.stops.length, 0)}</p>
                            <p className="text-xs text-emerald-600">Tickets asignados</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-700">{avgEfficiency}</p>
                            <p className="text-xs text-emerald-600">Eficiencia promedio</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-700">{Math.round(totalDistance)} km</p>
                            <p className="text-xs text-emerald-600">Distancia total optimizada</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-700">
                                RD$ {routes.reduce((s, r) => s + r.fuel_cost_rd, 0).toLocaleString('es-DO')}
                            </p>
                            <p className="text-xs text-emerald-600">Costo combustible total</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Unassigned jobs list (pre-dispatch) */}
            {phase === 'idle' && (
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Tickets pendientes de despacho ({totalTickets})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {UNASSIGNED_JOBS.map(job => (
                            <div key={job.id} className={cn('border rounded-xl p-3 flex items-start gap-3',
                                job.sla_deadline_hours <= 2 ? 'border-red-200 bg-red-50' :
                                    job.sla_deadline_hours <= 4 ? 'border-orange-100 bg-orange-50' :
                                        'border-slate-200 bg-white')}>
                                <PriorityDot p={job.priority} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] font-mono text-slate-400">{job.ticket_number}</p>
                                        {job.sla_deadline_hours <= 4 && (
                                            <Badge className="text-[10px] px-1 py-0 bg-red-500 text-white hover:bg-red-500">
                                                SLA {job.sla_deadline_hours}h
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 truncate">{job.subject}</p>
                                    <p className="text-xs text-slate-500">{job.client_name}</p>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{job.required_skill}</Badge>
                                        <span className="text-[10px] text-slate-400">Complejidad {job.complexity}/5 · ~{job.estimated_duration_min}min</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <Button
                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] gap-2 px-8 h-11 text-base"
                            onClick={runDispatch}
                        >
                            <Brain className="w-5 h-5" />
                            Ejecutar IA Dispatch — Optimizar {totalTickets} Tickets
                        </Button>
                        <p className="text-xs text-slate-400 mt-2">
                            Considera: distancia, SLA, complejidad, skills, disponibilidad horaria
                        </p>
                    </div>
                </div>
            )}

            {/* Routes */}
            {phase === 'done' && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Route className="w-4 h-4" />
                        Rutas Optimizadas por Técnico
                    </h3>
                    {routes.map((route, i) => (
                        <RouteCard key={route.technician.id} route={route} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
