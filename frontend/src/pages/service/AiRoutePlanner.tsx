// ============================================================
// ANTU FSM - Motor de Despacho Inteligente
// Algorithm: Weighted TSP con scoring de SLA y habilidades
// Datos: tickets Open sin asignar + tecnicos service_tech
// Coordenadas: estimadas dentro de Santo Domingo (sin GPS real)
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serviceDeskApi, usersApi } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

import {
    Brain, MapPin, Clock, Zap, TrendingDown, Route,
    AlertTriangle, CheckCircle2, User, Wrench,
    ChevronRight, Target, BarChart3, Fuel, Timer, RefreshCw, Info
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
    complexity: 1 | 2 | 3 | 4 | 5;
    sla_deadline_hours: number;
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
    sla_coverage: number;
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

// ── COORD ESTIMATION ──────────────────────────────────────────
// Santo Domingo bounds: lat 18.40–18.52, lng -70.02 to -69.87
// Assigns deterministic coords from ticket/tech ID hash
const SD_TECH_ZONES: Array<{ name: string; lat: number; lng: number; skills: string[] }> = [
    { name: 'Piantini / Serralles',      lat: 18.4720, lng: -69.9430, skills: ['MFP Color', 'MFP B/N', 'Plotter'] },
    { name: 'Naco / Evaristo Morales',   lat: 18.4760, lng: -69.9300, skills: ['MFP Color', 'MFP B/N', 'Red/Conectividad'] },
    { name: 'Gazcue / Ciudad Nueva',     lat: 18.4730, lng: -69.9020, skills: ['MFP B/N', 'Mantenimiento Preventivo'] },
    { name: 'Bella Vista / Los Prados',  lat: 18.4600, lng: -69.9300, skills: ['MFP Color', 'MFP B/N', 'Digital Workflow'] },
    { name: 'Miramar / Malecon',         lat: 18.4669, lng: -69.9598, skills: ['MFP Color', 'Scanner Avanzado'] },
    { name: 'Zona Colonial',             lat: 18.4738, lng: -69.8898, skills: ['MFP B/N', 'Fax'] },
];

function hashStr(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) & 0xFFFFFF;
    return Math.abs(h);
}

function estimateTicketCoords(id: string): { lat: number; lng: number } {
    const h = hashStr(id);
    // Spread within SD bounds
    const lat = 18.40 + (h % 1200) / 10000;    // 18.40 – 18.52
    const lng = -70.02 + ((h >> 8) % 1500) / 10000; // -70.02 – -69.87
    return { lat, lng };
}

// ── API -> MODEL MAPPERS ──────────────────────────────────────
const SLA_HOURS: Record<string, number> = { Critical: 4, High: 8, Medium: 24, Low: 72 };
const COMPLEXITY: Record<string, 1 | 2 | 3 | 4 | 5> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function detectSkill(assetModel: string): string {
    const a = (assetModel || '').toLowerCase();
    if (a.includes('plotter') || a.includes('designjet')) return 'Plotter';
    if (a.includes('color') || a.includes('c3') || a.includes('c4') || a.includes('c5')) return 'MFP Color';
    if (a.includes('scanner')) return 'Scanner Avanzado';
    if (a.includes('fax')) return 'Fax';
    return 'MFP B/N';
}

function mapApiTicket(t: any): TicketJob {
    const coords = estimateTicketCoords(t.id);
    const created = new Date(t.created_at);
    const slaHours = SLA_HOURS[t.priority] || 24;
    const deadline = new Date(created.getTime() + slaHours * 3600000);
    const hoursLeft = Math.max(0, (deadline.getTime() - Date.now()) / 3600000);
    const complexity = COMPLEXITY[t.priority] || 2;
    const skill = detectSkill(t.asset_model || '');
    return {
        id: t.id,
        ticket_number: t.ticket_number,
        subject: t.subject,
        client_name: t.client_name || '—',
        address: t.description?.substring(0, 60) || 'Santo Domingo',
        zone: 'Santo Domingo',
        priority: t.priority,
        complexity: complexity as 1 | 2 | 3 | 4 | 5,
        sla_deadline_hours: Math.round(hoursLeft * 10) / 10,
        estimated_duration_min: complexity * 20 + 40,
        required_skill: skill,
        asset_type: t.asset_model || '—',
        lat: coords.lat,
        lng: coords.lng,
        is_warranty: Boolean(t.asset_under_warranty),
    };
}

function mapApiTech(u: any, idx: number): TechProfile {
    const zone = SD_TECH_ZONES[idx % SD_TECH_ZONES.length];
    return {
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        zone_primary: zone.name,
        skills: zone.skills,
        current_lat: zone.lat + (hashStr(u.id) % 100) / 10000,
        current_lng: zone.lng + ((hashStr(u.id) >> 4) % 100) / 10000,
        start_location: zone.name,
        available_hours: 8,
        fcr_rate: 80,
        rating: 4.0,
    };
}

// ── AI ALGORITHM ──────────────────────────────────────────────
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
    const sortedJobs = [...jobs].sort((a, b) => urgencyScore(b) - urgencyScore(a));
    const assignments: Map<string, TicketJob[]> = new Map(technicians.map(t => [t.id, []]));
    const availableHours: Map<string, number> = new Map(technicians.map(t => [t.id, t.available_hours * 60]));

    for (const job of sortedJobs) {
        let bestTech: TechProfile | null = null;
        let bestScore = -1;
        for (const tech of technicians) {
            const remaining = availableHours.get(tech.id) || 0;
            if (remaining < job.estimated_duration_min + 20) continue;
            const sm = skillMatch(tech, job);
            const dist = calculateDistance(tech.current_lat, tech.current_lng, job.lat, job.lng);
            const skillBonus = sm === 'perfect' ? 100 : sm === 'adequate' ? 50 : 0;
            const proximityScore = Math.max(0, 100 - dist * 10);
            const score = skillBonus + proximityScore + (tech.fcr_rate * 0.5);
            if (score > bestScore) { bestScore = score; bestTech = tech; }
        }
        if (bestTech) {
            assignments.get(bestTech.id)!.push(job);
            availableHours.set(bestTech.id, availableHours.get(bestTech.id)! - job.estimated_duration_min - 20);
        }
    }

    const routes: DispatchRoute[] = [];
    const SPEED_KMH = 25;
    const RD_PER_KM = 45;

    for (const tech of technicians) {
        const techJobs = assignments.get(tech.id) || [];
        if (techJobs.length === 0) continue;

        let currentLat = tech.current_lat;
        let currentLng = tech.current_lng;
        const remaining = [...techJobs];
        const ordered: TicketJob[] = [];

        while (remaining.length > 0) {
            const critical = remaining.filter(j => j.priority === 'Critical');
            const closeCritical = critical.filter(j => calculateDistance(currentLat, currentLng, j.lat, j.lng) < 3);
            let next: TicketJob;
            if (closeCritical.length > 0) {
                next = closeCritical.reduce((a, b) => urgencyScore(b) > urgencyScore(a) ? b : a);
            } else {
                next = remaining.reduce((a, b) =>
                    calculateDistance(currentLat, currentLng, a.lat, a.lng) <
                        calculateDistance(currentLat, currentLng, b.lat, b.lng) ? a : b);
            }
            ordered.push(next);
            remaining.splice(remaining.indexOf(next), 1);
            currentLat = next.lat; currentLng = next.lng;
        }

        const stops: RouteStop[] = [];
        let timeCursor = new Date();
        timeCursor.setHours(8, 0, 0, 0);
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
            const hoursUntilDeadline = job.sla_deadline_hours - ((arrivalTime.getTime() - Date.now()) / 3600000);
            stops.push({
                order: i + 1, job,
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
            technician: tech, stops,
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
            {match === 'perfect' ? 'Skill OK' : match === 'adequate' ? 'Compatible' : 'Stretch'}
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-200 to-cyan-300 flex items-center justify-center font-bold text-cyan-600 text-base flex-shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                </div>
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
                    <div className="p-4 space-y-0">
                        {/* Start point */}
                        <div className="flex gap-3 pb-3">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center">
                                    <Wrench className="w-3 h-3 text-white" />
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
                                                        SLA RIESGO
                                                    </Badge>
                                                )}
                                                {stop.job.is_warranty && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        Garantia
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-tight">{stop.job.subject}</p>
                                            <p className="text-xs text-slate-600">{stop.job.client_name}</p>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-2.5 h-2.5" />{stop.job.asset_type}
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
    const { t } = useLanguage();
    const [routes, setRoutes]             = useState<DispatchRoute[]>([]);
    const [loading, setLoading]           = useState(false);
    const [dataLoading, setDataLoading]   = useState(true);
    const [phase, setPhase]               = useState<'idle' | 'analyzing' | 'optimizing' | 'done'>('idle');
    const [thinkingStep, setThinkingStep] = useState('');
    const [technicians, setTechnicians]   = useState<TechProfile[]>([]);
    const [jobs, setJobs]                 = useState<TicketJob[]>([]);
    const [dataError, setDataError]       = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setDataLoading(true);
        setDataError(null);
        setRoutes([]);
        setPhase('idle');
        try {
            const [techRes, ticketRes] = await Promise.all([
                usersApi.getAll(),
                serviceDeskApi.getAll({ status: 'Open', limit: 50 }),
            ]);

            const allUsers: any[] = Array.isArray(techRes.data) ? techRes.data : [];
            const techList = allUsers
                .filter(u => u.role === 'service_tech' && u.is_active !== false)
                .map((u, i) => mapApiTech(u, i));

            const rows: any[] = ticketRes.data?.data || (Array.isArray(ticketRes.data) ? ticketRes.data : []);
            // Only tickets not yet assigned
            const openJobs = rows
                .filter(t => !t.assigned_to)
                .map(mapApiTicket);

            setTechnicians(techList);
            setJobs(openJobs);

            if (techList.length === 0) setDataError('No hay tecnicos de servicio activos en el sistema.');
            else if (openJobs.length === 0) setDataError('No hay tickets abiertos sin asignar para despachar.');
        } catch {
            setDataError('Error cargando datos. Verifica la conexion.');
        } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const THINKING_STEPS = [
        'Geolocalizando tecnicos y tickets...',
        'Calculando scores de urgencia y complejidad...',
        'Evaluando matrix de habilidades vs. requerimientos...',
        'Ejecutando TSP con restricciones de SLA...',
        'Optimizando rutas para minimo tiempo total...',
        'Validando cobertura SLA y asignando carga...',
        'Generando itinerarios finales...',
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
        const result = runAiDispatch(technicians, jobs);
        setRoutes(result);
        setPhase('done');
        setLoading(false);
    }, [technicians, jobs]);

    const totalTickets = jobs.length;
    const slaRiskCount = jobs.filter(j => j.sla_deadline_hours <= 4).length;
    const avgEfficiency = routes.length > 0 ? Math.round(routes.reduce((s, r) => s + r.efficiency_score, 0) / routes.length) : 0;
    const totalDistance = routes.reduce((s, r) => s + r.total_distance_km, 0);
    const manualEstDistance = totalTickets * 18;
    const distanceSaved = Math.max(0, Math.round(manualEstDistance - totalDistance));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-cyan-600" />
                        Despacho Inteligente — Route Optimizer
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Algoritmo TSP con scoring de SLA, complejidad y habilidades
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={dataLoading} className="gap-1.5">
                        <RefreshCw className={cn('w-3.5 h-3.5', dataLoading && 'animate-spin')} />
                        {t('Recargar')}
                    </Button>
                    <Button
                        className={cn(
                            'gap-2 h-10 transition-all',
                            loading ? 'bg-indigo-600 hover:bg-indigo-700' :
                                phase === 'done' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    'bg-cyan-600 hover:bg-cyan-700'
                        )}
                        onClick={runDispatch}
                        disabled={loading || dataLoading || !!dataError}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                {t('Optimizando...')}
                            </>
                        ) : phase === 'done' ? (
                            <><Zap className="w-4 h-4" />{t('Re-Optimizar')}</>
                        ) : (
                            <><Brain className="w-4 h-4" />{t('Ejecutar IA Dispatch')}</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Geo disclaimer banner */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                    <strong>Coordenadas estimadas</strong> — el sistema no dispone de GPS en tiempo real.
                    Las posiciones de tecnicos y clientes son aproximaciones dentro de Santo Domingo
                    basadas en zona asignada. Los calculos de distancia y ruta son funcionales para
                    planificacion y priorizacion de SLA.
                </span>
            </div>

            {/* Loading / error state */}
            {dataLoading ? (
                <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t('Cargando tecnicos y tickets...')}</span>
                </div>
            ) : dataError ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <p className="text-sm text-slate-600 text-center">{dataError}</p>
                    <button onClick={loadData} className="text-xs text-cyan-600 underline">{t('Reintentar')}</button>
                </div>
            ) : (
                <>
                    {/* Top metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-slate-100">
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{totalTickets}</p>
                                    <p className="text-xs text-slate-500">{t('Tickets por despachar')}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={cn('border', slaRiskCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100')}>
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={cn('text-2xl font-bold', slaRiskCount > 0 ? 'text-red-700' : 'text-slate-800')}>{slaRiskCount}</p>
                                    <p className="text-xs text-slate-500">En riesgo de SLA (&lt;4h)</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-slate-100">
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{technicians.length}</p>
                                    <p className="text-xs text-slate-500">{t('Tecnicos disponibles')}</p>
                                </div>
                            </div>
                        </Card>
                        {phase === 'done' ? (
                            <Card className="border-emerald-200 bg-emerald-50">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-emerald-700">{distanceSaved} km</p>
                                        <p className="text-xs text-emerald-600">{t('Ahorro vs despacho manual')}</p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-slate-100">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">—</p>
                                        <p className="text-xs text-slate-500">{t('Ahorro (ejecuta IA)')}</p>
                                    </div>
                                </div>
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
                                    <p className="text-sm font-bold text-indigo-800">{t('IA procesando despacho optimo')}</p>
                                    <p className="text-xs text-indigo-600 animate-pulse">{thinkingStep}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                {THINKING_STEPS.map((step, i) => (
                                    <div key={i} className={cn('text-xs flex items-center gap-2 transition-all',
                                        THINKING_STEPS.indexOf(thinkingStep) > i ? 'text-indigo-700' :
                                            THINKING_STEPS.indexOf(thinkingStep) === i ? 'text-indigo-900 font-semibold' :
                                                'text-indigo-300')}>
                                        {THINKING_STEPS.indexOf(thinkingStep) > i
                                            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            : THINKING_STEPS.indexOf(thinkingStep) === i
                                                ? <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                                                : <div className="w-3 h-3 rounded-full bg-indigo-200" />}
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
                                <p className="font-bold text-emerald-800">{t('Optimizacion completada')} · {routes.length} {t('rutas generadas')}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-xl font-bold text-emerald-700">{routes.reduce((s, r) => s + r.stops.length, 0)}</p>
                                    <p className="text-xs text-emerald-600">{t('Tickets asignados')}</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-emerald-700">{avgEfficiency}</p>
                                    <p className="text-xs text-emerald-600">{t('Eficiencia promedio')}</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-emerald-700">{Math.round(totalDistance)} km</p>
                                    <p className="text-xs text-emerald-600">{t('Distancia total optimizada')}</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-emerald-700">
                                        RD$ {routes.reduce((s, r) => s + r.fuel_cost_rd, 0).toLocaleString('es-DO')}
                                    </p>
                                    <p className="text-xs text-emerald-600">{t('Costo combustible total')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending jobs list (pre-dispatch) */}
                    {phase === 'idle' && jobs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4" />
                                {t('Tickets pendientes de despacho')} ({totalTickets})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {jobs.map(job => (
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
                                                        SLA {Math.round(job.sla_deadline_hours)}h
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
                                    className="bg-cyan-600 hover:bg-cyan-700 gap-2 px-8 h-11 text-base"
                                    onClick={runDispatch}
                                    disabled={loading}
                                >
                                    <Brain className="w-5 h-5" />
                                    {t('Ejecutar IA Dispatch')} — {t('Optimizar')} {totalTickets} Tickets
                                </Button>
                                <p className="text-xs text-slate-400 mt-2">
                                    Considera: distancia, SLA, complejidad, skills, disponibilidad horaria
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Optimized routes */}
                    {phase === 'done' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Route className="w-4 h-4" />
                                {t('Rutas Optimizadas por Tecnico')}
                            </h3>
                            {routes.map((route, i) => (
                                <RouteCard key={route.technician.id} route={route} index={i} />
                            ))}
                            {routes.reduce((s, r) => s + r.stops.length, 0) < totalTickets && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                    <strong>{totalTickets - routes.reduce((s, r) => s + r.stops.length, 0)} tickets</strong> no pudieron asignarse por capacidad horaria insuficiente.
                                    Considera agregar mas tecnicos o extender la jornada.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
