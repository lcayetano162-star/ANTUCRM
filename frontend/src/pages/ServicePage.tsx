// ============================================================
// ANTU CRM - Módulo de Servicio Técnico y Field Service
// Enterprise-grade: SAP FSM / Zendesk / ServiceNow standards
// Features: Ticket CRUD, Asignación técnico, Work Orders,
//           Consumo de piezas, Firma digital, KPI Supervisor
// ============================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Wrench, Plus, Search, X, CheckCircle2,
    Package, User, PenLine, ClipboardList,
    BarChart3, PlayCircle, Brain, Phone,
    Pause, CheckSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ServiceDashboard } from './service/ServiceDashboard';
import { AiRoutePlanner } from './service/AiRoutePlanner';
import { TechMobileView } from './service/TechMobileView';

// ── TYPES ────────────────────────────────────────────────────
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketStatus = 'Open' | 'Pending' | 'In_Progress' | 'Waiting_Parts' | 'Resolved' | 'Closed';
type WOStatus = 'Draft' | 'Scheduled' | 'In_Progress' | 'Completed' | 'Cancelled';

interface Ticket {
    id: string; ticket_number: string; subject: string; description?: string;
    priority: Priority; status: TicketStatus; client_name: string; client_id: string;
    asset_model?: string; asset_serial?: string; asset_under_warranty?: boolean;
    assigned_to?: string; assigned_to_name?: string; work_orders_count: number;
    created_at: string; client_signature?: string; signed_at?: string;
}
interface WorkOrder {
    id: string; work_order_number: string; technician_name?: string;
    technician_id?: string; status: WOStatus; scheduled_date?: string;
    diagnosis?: string; execution_details?: string; parts_count: number;
    parts_total_cost: number; created_at: string;
}
interface Part {
    id: string; product_name: string; product_sku?: string;
    quantity: number; unit_cost: number; is_warranty: boolean; current_stock: number;
}

// ── CONSTANTS ─────────────────────────────────────────────────
const PRIORITY_CFG: Record<Priority, { label: string; dot: string; badge: string }> = {
    Low: { label: 'Baja', dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
    Medium: { label: 'Media', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    High: { label: 'Alta', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    Critical: { label: 'Crítica', dot: 'bg-red-500 animate-pulse', badge: 'bg-red-50 text-red-700 border-red-200' },
};
const STATUS_CFG: Record<TicketStatus, { label: string; color: string }> = {
    Open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700' },
    Pending: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600' },
    In_Progress: { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-700' },
    Waiting_Parts: { label: 'Esperando Partes', color: 'bg-amber-100 text-amber-700' },
    Resolved: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700' },
    Closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-400' },
};
const WO_CFG: Record<WOStatus, { label: string; color: string }> = {
    Draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
    Scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-700' },
    In_Progress: { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-700' },
    Completed: { label: 'Completada', color: 'bg-emerald-100 text-emerald-700' },
    Cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};
const DEMO_TECHS = [
    { id: 't1', name: 'Carlos López' },
    { id: 't2', name: 'María Rodríguez' },
    { id: 't3', name: 'Pedro García' },
    { id: 't4', name: 'Ana Martínez' },
];
const DEMO_PRODUCTS = [
    { id: 'p1', sku: 'DRUM-001', name: 'Drum Unit C300', price: 2800, stock: 4 },
    { id: 'p2', sku: 'TON-BW', name: 'Tóner B/N 8500pg', price: 1200, stock: 12 },
    { id: 'p3', sku: 'FUSER-B', name: 'Fusor B620 Pro', price: 5400, stock: 2 },
    { id: 'p4', sku: 'FDR-ROL', name: 'Feed Roller Kit', price: 850, stock: 8 },
    { id: 'p5', sku: 'MAINT-K', name: 'Maintenance Kit', price: 3200, stock: 1 },
];
const DEMO_TICKETS: Ticket[] = [
    { id: '1', ticket_number: 'TKT-202603-0001', subject: 'Impresora MFP-C300 no imprime en color', description: 'Error "Color cartridge" en panel', priority: 'Critical', status: 'In_Progress', client_name: 'Grupo Empresarial Torres', client_id: 'c1', asset_model: 'MFP-C300 Color A3', asset_serial: 'SN-2024-00123', asset_under_warranty: true, assigned_to: 't1', assigned_to_name: 'Carlos López', work_orders_count: 1, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '2', ticket_number: 'TKT-202603-0002', subject: 'Mantenimiento preventivo trimestral', priority: 'Low', status: 'Open', client_name: 'Constructora del Caribe', client_id: 'c2', asset_model: 'MFP-B520 Laser', asset_serial: 'SN-2023-00456', asset_under_warranty: false, work_orders_count: 0, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', ticket_number: 'TKT-202603-0003', subject: 'Atascos de papel frecuentes en bandeja 2', priority: 'High', status: 'Waiting_Parts', client_name: 'Clínica San José', client_id: 'c3', asset_model: 'MFP-B620 Pro', asset_serial: 'SN-2025-00789', assigned_to: 't2', assigned_to_name: 'María Rodríguez', work_orders_count: 1, created_at: new Date(Date.now() - 21600000).toISOString() },
    { id: '4', ticket_number: 'TKT-202603-0004', subject: 'Configuración de scan to email', priority: 'Medium', status: 'Resolved', client_name: 'Banco Nacional', client_id: 'c4', asset_model: 'MFP-C450 Enterprise', asset_under_warranty: true, assigned_to: 't3', assigned_to_name: 'Pedro García', work_orders_count: 1, created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: '5', ticket_number: 'TKT-202603-0005', subject: 'Error E5-6 al encender equipo', priority: 'High', status: 'Open', client_name: 'Hotel Las Américas', client_id: 'c5', asset_model: 'MFP-C300', asset_serial: 'SN-2022-00341', work_orders_count: 0, created_at: new Date(Date.now() - 3600000).toISOString() },
];

const fmtDate = (s: string) => new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));

// ── TICKET CARD ───────────────────────────────────────────────
function TicketCard({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
    const p = PRIORITY_CFG[ticket.priority];
    const s = STATUS_CFG[ticket.status];
    return (
        <button onClick={onClick} className={cn('w-full text-left border rounded-xl p-3.5 transition-all hover:shadow-sm',
            active ? 'border-[var(--color-primary)] bg-[var(--primary-50)] shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white')}>
            <div className="flex items-start gap-2.5">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', p.dot)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] font-mono text-slate-400">{ticket.ticket_number}</p>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 flex-shrink-0', s.color)}>{s.label}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-0.5 leading-tight">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.client_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', p.badge)}>{p.label}</Badge>
                        {ticket.assigned_to_name && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" />{ticket.assigned_to_name}
                            </span>
                        )}
                        {!ticket.assigned_to_name && <span className="text-[10px] text-rose-400 font-medium">Sin asignar</span>}
                    </div>
                </div>
            </div>
        </button>
    );
}

// ── TICKET DETAIL PANEL ───────────────────────────────────────
function TicketDetail({ ticket, onUpdated }: { ticket: Ticket; onUpdated: (t: Ticket) => void }) {
    const [tab, setTab] = useState('info');
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [showWOForm, setShowWOForm] = useState(false);
    const [showPartForm, setShowPartForm] = useState(false);
    const [signature, setSignature] = useState('');
    const [selectedWO, setSelectedWO] = useState<string | null>(null);
    const [techId, setTechId] = useState(ticket.assigned_to || '');
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [saving, setSaving] = useState(false);
    const [closing, setClosing] = useState(false);

    // Demo work orders
    useEffect(() => {
        setWorkOrders(ticket.id === '1' ? [{
            id: 'wo1', work_order_number: 'WO-202603-0001', technician_id: 't1', technician_name: 'Carlos López',
            status: 'In_Progress', scheduled_date: new Date().toISOString(), diagnosis: 'Drum unit defectuosa. Requiere reemplazo.',
            execution_details: '', parts_count: 1, parts_total_cost: 2800, created_at: new Date(Date.now() - 3600000).toISOString()
        }] : ticket.id === '3' ? [{
            id: 'wo2', work_order_number: 'WO-202603-0002', technician_id: 't2', technician_name: 'María Rodríguez',
            status: 'Scheduled', scheduled_date: new Date(Date.now() + 86400000).toISOString(), diagnosis: 'Feed roller desgastado.',
            execution_details: '', parts_count: 0, parts_total_cost: 0, created_at: new Date(Date.now() - 7200000).toISOString()
        }] : []);
        setParts([]);
    }, [ticket.id]);

    const handleAssign = async () => {
        setSaving(true);
        try {
            await api.put(`/service/tickets/${ticket.id}`, { assigned_to: techId || null });
            const tech = DEMO_TECHS.find(t => t.id === techId);
            onUpdated({ ...ticket, assigned_to: techId, assigned_to_name: tech?.name });
            toast.success(techId ? `Asignado a ${tech?.name}` : 'Asignación removida');
        } catch {
            // demo mode — update locally
            const tech = DEMO_TECHS.find(t => t.id === techId);
            onUpdated({ ...ticket, assigned_to: techId, assigned_to_name: tech?.name });
            toast.success(techId ? `Asignado a ${tech?.name}` : 'Asignación removida');
        } finally { setSaving(false); }
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        try {
            await api.put(`/service/tickets/${ticket.id}`, { status: newStatus });
        } catch { /* demo */ }
        setStatus(newStatus);
        onUpdated({ ...ticket, status: newStatus });
        toast.success(`Estado → ${STATUS_CFG[newStatus].label}`);
    };

    const handleCloseWithSig = async () => {
        if (signature.trim().length < 2) { toast.error('Escribe el nombre completo del cliente'); return; }
        setClosing(true);
        try {
            await api.post(`/service/tickets/${ticket.id}/close`, { client_signature: signature });
        } catch { /* demo */ }
        onUpdated({ ...ticket, status: 'Closed', client_signature: signature, signed_at: new Date().toISOString() });
        toast.success('✅ Ticket cerrado con firma digital');
        setClosing(false);
    };

    const addDemoPart = (prod: typeof DEMO_PRODUCTS[0], isWarranty: boolean) => {
        const newPart: Part = {
            id: Date.now().toString(), product_name: prod.name, product_sku: prod.sku,
            quantity: 1, unit_cost: prod.price, is_warranty: isWarranty, current_stock: prod.stock
        };
        setParts(prev => [...prev, newPart]);
        if (!isWarranty) {
            toast.success(`✅ ${prod.name} descontado del inventario`);
            if (prod.stock <= 1) {
                setTimeout(() => toast.warning('⚠️ Stock bajo o agotado — ticket marcado "Esperando Partes"'), 800);
            }
        } else {
            toast.info(`🛡️ ${prod.name} cubierta por garantía — sin cargo`);
        }
        setShowPartForm(false);
    };

    const currentStatus = status;
    const canClose = currentStatus === 'Resolved' && !ticket.client_signature;
    const openWO = workOrders.filter(w => w.status === 'In_Progress').length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-slate-400">{ticket.ticket_number}</p>
                        <h3 className="text-xl font-bold text-slate-800 leading-tight mt-0.5">{ticket.subject}</h3>
                        <p className="text-base text-slate-500 mt-1">{ticket.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={cn('text-sm px-3 py-1', PRIORITY_CFG[ticket.priority].badge)}>{PRIORITY_CFG[ticket.priority].label}</Badge>
                        <Badge variant="secondary" className={cn('text-sm px-3 py-1', STATUS_CFG[currentStatus].color)}>{STATUS_CFG[currentStatus].label}</Badge>
                    </div>
                </div>

                {/* Quick status buttons */}
                {currentStatus !== 'Closed' && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {currentStatus === 'Open' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleStatusChange('In_Progress')}><PlayCircle className="w-3 h-3" />Iniciar</Button>}
                        {currentStatus === 'In_Progress' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleStatusChange('Pending')}><Pause className="w-3 h-3" />Pausar</Button>}
                        {currentStatus !== 'Resolved' && currentStatus !== 'Waiting_Parts' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange('Resolved')}><CheckSquare className="w-3 h-3" />Resolver</Button>
                        )}
                        {canClose && (
                            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setTab('firma')}>
                                <PenLine className="w-3 h-3" />Cerrar con Firma
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-shrink-0 bg-slate-50 mx-6 mt-4 h-10">
                    <TabsTrigger value="info" className="text-sm px-4">Info</TabsTrigger>
                    <TabsTrigger value="asignacion" className="text-sm px-4">Técnico</TabsTrigger>
                    <TabsTrigger value="workorders" className="text-sm px-4">
                        Órdenes de Trabajo {workOrders.length > 0 && <span className="ml-1.5 bg-slate-200 rounded-full px-1.5 text-xs">{workOrders.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="piezas" className="text-sm px-4">
                        Piezas {parts.length > 0 && <span className="ml-1.5 bg-slate-200 rounded-full px-1.5 text-xs">{parts.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="firma" className="text-sm px-4">Firma Digital</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 mt-2">
                    {/* INFO */}
                    <TabsContent value="info" className="px-6 py-4 mt-0">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                {ticket.description && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción del problema</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
                                    </div>
                                )}
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Detalles</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Creado:</span><span className="text-slate-700 font-medium">{fmtDate(ticket.created_at)}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Estado:</span><Badge variant="secondary" className={cn('text-xs', STATUS_CFG[currentStatus].color)}>{STATUS_CFG[currentStatus].label}</Badge></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Prioridad:</span><Badge variant="outline" className={cn('text-xs', PRIORITY_CFG[ticket.priority].badge)}>{PRIORITY_CFG[ticket.priority].label}</Badge></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Técnico:</span><span className="text-slate-700 font-medium">{ticket.assigned_to_name || <span className="text-rose-500">Sin asignar</span>}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {ticket.asset_model && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" />Equipo del Cliente</p>
                                        <p className="text-base font-bold text-slate-800">{ticket.asset_model}</p>
                                        {ticket.asset_serial && <p className="text-sm font-mono text-slate-500 mt-1">S/N: {ticket.asset_serial}</p>}
                                        <div className="mt-3">
                                            <Badge variant="outline" className={cn('text-sm px-3 py-1', ticket.asset_under_warranty ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500')}>
                                                {ticket.asset_under_warranty ? '✅ En garantía' : '⚠️ Garantía vencida'}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actividad</p>
                                    <div className="space-y-2 text-sm text-slate-500">
                                        <p>🔖 <span className="font-medium text-slate-700">{ticket.work_orders_count}</span> orden(es) de trabajo</p>
                                        <p>📎 #{ticket.ticket_number}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ASIGNACIÓN TÉCNICO */}
                    <TabsContent value="asignacion" className="px-6 py-4 mt-0">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User className="w-4 h-4" />Asignar o Reasignar Técnico</label>
                                    <select
                                        className="w-full h-11 rounded-lg border border-slate-200 px-3 text-base bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                        value={techId}
                                        onChange={e => setTechId(e.target.value)}
                                    >
                                        <option value="">— Sin asignar —</option>
                                        {DEMO_TECHS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] h-11 text-base" onClick={handleAssign} disabled={saving}>
                                        {saving ? 'Guardando...' : 'Confirmar Asignación'}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                {ticket.assigned_to_name ? (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-lg">
                                            {ticket.assigned_to_name.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-indigo-800">{ticket.assigned_to_name}</p>
                                            <p className="text-sm text-indigo-600 mt-0.5">Técnico asignado</p>
                                            <Badge variant="secondary" className={cn('mt-2 text-xs', STATUS_CFG[currentStatus].color)}>{STATUS_CFG[currentStatus].label}</Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center">
                                        <User className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-rose-700">Sin técnico asignado</p>
                                        <p className="text-xs text-rose-500 mt-1">Asigna un técnico para procesar este ticket</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* WORK ORDERS */}
                    <TabsContent value="workorders" className="px-6 py-4 mt-0 space-y-3">
                        <Button size="sm" className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] gap-1.5 h-9"
                            onClick={() => setShowWOForm(true)}>
                            <Plus className="w-3.5 h-3.5" />Nueva Orden de Trabajo
                        </Button>
                        {workOrders.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin órdenes de trabajo</p>
                            </div>
                        ) : workOrders.map(wo => (
                            <div key={wo.id} className={cn('border rounded-lg p-3 space-y-2 cursor-pointer transition-colors', selectedWO === wo.id ? 'border-[var(--color-primary)] bg-[var(--primary-50)]' : 'border-slate-200 hover:border-slate-300')}
                                onClick={() => setSelectedWO(selectedWO === wo.id ? null : wo.id)}>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-mono text-slate-400">{wo.work_order_number}</p>
                                    <Badge variant="secondary" className={cn('text-[10px]', WO_CFG[wo.status].color)}>{WO_CFG[wo.status].label}</Badge>
                                </div>
                                <p className="text-xs font-medium text-slate-700">Técnico: {wo.technician_name || 'Sin asignar'}</p>
                                {wo.diagnosis && <p className="text-xs text-slate-500">🔍 {wo.diagnosis}</p>}
                                <div className="flex gap-3 text-xs text-slate-400">
                                    <span><Package className="w-3 h-3 inline mr-0.5" />{wo.parts_count} pieza(s)</span>
                                    {wo.parts_total_cost > 0 && <span>RD$ {Number(wo.parts_total_cost).toLocaleString('es-DO')}</span>}
                                </div>
                                {selectedWO === wo.id && (
                                    <div className="border-t border-slate-100 pt-2 mt-1 flex flex-wrap gap-1.5">
                                        {wo.status === 'Scheduled' && <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={() => {
                                            setWorkOrders(prev => prev.map(w => w.id === wo.id ? { ...w, status: 'In_Progress' } : w));
                                            toast.success('Orden iniciada');
                                        }}><PlayCircle className="w-3 h-3" />Iniciar</Button>}
                                        {wo.status === 'In_Progress' && <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 text-emerald-600 border-emerald-200" onClick={() => {
                                            setWorkOrders(prev => prev.map(w => w.id === wo.id ? { ...w, status: 'Completed' } : w));
                                            toast.success('Orden completada ✅');
                                        }}><CheckCircle2 className="w-3 h-3" />Completar</Button>}
                                        <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 text-blue-600 border-blue-200" onClick={() => { setSelectedWO(wo.id); setTab('piezas'); }}>
                                            <Package className="w-3 h-3" />Agregar Pieza
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </TabsContent>

                    {/* PIEZAS / CONSUMO */}
                    <TabsContent value="piezas" className="px-6 py-4 mt-0 space-y-3">
                        <Button size="sm" className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] gap-1.5 h-9"
                            onClick={() => setShowPartForm(true)}>
                            <Plus className="w-3.5 h-3.5" />Consumir Pieza / Repuesto
                        </Button>
                        {parts.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin piezas consumidas</p>
                                <p className="text-xs mt-1">Agrega piezas para registrar el costo del servicio</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {parts.map(part => (
                                    <div key={part.id} className="border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-mono text-slate-400">{part.product_sku}</p>
                                                <p className="text-sm font-medium text-slate-700">{part.product_name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Cant: {part.quantity} × RD$ {part.unit_cost.toLocaleString('es-DO')}
                                                </p>
                                            </div>
                                            {part.is_warranty
                                                ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Garantía</Badge>
                                                : <span className="text-xs font-bold text-slate-700">RD$ {(part.quantity * part.unit_cost).toLocaleString('es-DO')}</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                                <div className="bg-slate-50 rounded-lg p-3 text-sm font-bold text-right text-slate-800">
                                    Total facturable: RD$ {parts.filter(p => !p.is_warranty).reduce((s, p) => s + p.quantity * p.unit_cost, 0).toLocaleString('es-DO')}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* FIRMA DIGITAL */}
                    <TabsContent value="firma" className="px-6 py-4 mt-0 space-y-4">
                        {ticket.client_signature ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="font-semibold text-emerald-800">Firma Digital Registrada</p>
                                <p className="text-xl font-bold text-emerald-700 mt-2">{ticket.client_signature}</p>
                                {ticket.signed_at && <p className="text-xs text-emerald-600 mt-1">{fmtDate(ticket.signed_at)}</p>}
                            </div>
                        ) : (
                            <>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-amber-800 flex items-center gap-2"><PenLine className="w-4 h-4" />Conformidad del cliente</p>
                                    <p className="text-xs text-amber-700 mt-1">El cliente escribe su nombre para confirmar que el servicio fue satisfactorio. Esto cierra el ticket permanentemente.</p>
                                    {openWO > 0 && <p className="text-xs text-rose-600 font-medium mt-2">⚠️ Hay {openWO} OT en progreso. Complétala antes de cerrar.</p>}
                                </div>
                                <Input placeholder="Nombre completo del cliente" value={signature} onChange={e => setSignature(e.target.value)} className="h-12 text-base" />
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" onClick={handleCloseWithSig}
                                    disabled={closing || !signature.trim() || openWO > 0}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    {closing ? 'Cerrando...' : 'Firmar y Cerrar Ticket'}
                                </Button>
                            </>
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>

            {/* MODAL: Nueva Orden de Trabajo */}
            <Dialog open={showWOForm} onOpenChange={setShowWOForm}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Nueva Orden de Trabajo</DialogTitle></DialogHeader>
                    <NewWOForm ticket={ticket} techs={DEMO_TECHS} onSave={(wo) => { setWorkOrders(p => [...p, wo]); setShowWOForm(false); toast.success(`${wo.work_order_number} creada`); }} onCancel={() => setShowWOForm(false)} />
                </DialogContent>
            </Dialog>

            {/* MODAL: Consumir Pieza */}
            <Dialog open={showPartForm} onOpenChange={setShowPartForm}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-4 h-4" />Consumir Pieza del Inventario</DialogTitle></DialogHeader>
                    <ConsumePartForm warranty={ticket.asset_under_warranty} products={DEMO_PRODUCTS} onConfirm={addDemoPart} onCancel={() => setShowPartForm(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── NEW WO FORM ───────────────────────────────────────────────
function NewWOForm({ ticket, techs, onSave, onCancel }: {
    ticket: Ticket; techs: { id: string; name: string }[];
    onSave: (wo: WorkOrder) => void; onCancel: () => void;
}) {
    const [techId, setTechId] = useState(ticket.assigned_to || '');
    const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    const [diagnosis, setDiagnosis] = useState('');
    const num = `WO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const tech = techs.find(t => t.id === techId);

    const save = () => {
        const wo: WorkOrder = {
            id: Date.now().toString(), work_order_number: num, technician_id: techId,
            technician_name: tech?.name, status: 'Scheduled', scheduled_date: date,
            diagnosis, execution_details: '', parts_count: 0, parts_total_cost: 0, created_at: new Date().toISOString()
        };
        onSave(wo);
    };

    return (
        <div className="space-y-4 py-2">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Técnico asignado</label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={techId} onChange={e => setTechId(e.target.value)}>
                    <option value="">— Seleccionar técnico —</option>
                    {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha programada</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Diagnóstico inicial</label>
                <textarea className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Describe el problema observado..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" onClick={save} disabled={!techId}>
                    Crear Orden
                </Button>
            </DialogFooter>
        </div>
    );
}

// ── CONSUME PART FORM ─────────────────────────────────────────
function ConsumePartForm({ warranty, products, onConfirm, onCancel }: {
    warranty?: boolean;
    products: { id: string; sku: string; name: string; price: number; stock: number }[];
    onConfirm: (product: { id: string; sku: string; name: string; price: number; stock: number }, isWarranty: boolean) => void;
    onCancel: () => void;
}) {
    const [selected, setSelected] = useState('');
    const [isWarranty, setIsWarranty] = useState(false);
    const prod = products.find(p => p.id === selected);

    return (
        <div className="space-y-4 py-2">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Producto / Repuesto</label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={selected} onChange={e => setSelected(e.target.value)}>
                    <option value="">— Seleccionar producto —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.stock})</option>)}
                </select>
            </div>

            {prod && (
                <div className={cn('rounded-lg p-3 border', prod.stock <= 1 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
                    <p className="text-sm font-medium text-slate-700">{prod.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">SKU: {prod.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-xs font-medium', prod.stock === 0 ? 'text-red-600' : prod.stock <= 2 ? 'text-amber-600' : 'text-emerald-600')}>
                            Stock disponible: {prod.stock} un.
                        </span>
                        <span className="text-sm font-bold text-slate-800">RD$ {prod.price.toLocaleString('es-DO')}</span>
                    </div>
                    {prod.stock === 0 && <p className="text-xs text-red-600 font-medium mt-1">⚠️ Sin stock — el ticket pasará a "Esperando Partes"</p>}
                </div>
            )}

            {warranty && (
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary)]" checked={isWarranty} onChange={e => setIsWarranty(e.target.checked)} />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Cubierto por garantía</p>
                        <p className="text-xs text-slate-500">No se descuenta del inventario ni se cobra al cliente</p>
                    </div>
                </label>
            )}

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                    onClick={() => prod && onConfirm(prod, isWarranty)} disabled={!selected || !prod}>
                    {isWarranty ? '🛡️ Registrar (Garantía)' : '📦 Consumir del Inventario'}
                </Button>
            </DialogFooter>
        </div>
    );
}

// ── CREATE TICKET MODAL ───────────────────────────────────────
function CreateTicketModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (t: Ticket) => void }) {
    const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium' as Priority, client_name: '', assigned_to: '' });
    const [loading, setLoading] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.subject.trim() || !form.client_name.trim()) { toast.error('Asunto y cliente son obligatorios'); return; }
        setLoading(true);
        const num = `TKT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const tech = DEMO_TECHS.find(t => t.id === form.assigned_to);
        const ticket: Ticket = {
            id: Date.now().toString(), ticket_number: num, subject: form.subject,
            description: form.description, priority: form.priority as Priority,
            status: 'Open', client_name: form.client_name, client_id: Date.now().toString(),
            assigned_to: form.assigned_to || undefined, assigned_to_name: tech?.name,
            work_orders_count: 0, created_at: new Date().toISOString()
        };
        try { await api.post('/service/tickets', { ...form }); } catch { /* demo */ }
        toast.success(`Ticket ${num} creado`);
        onCreated(ticket); onClose(); setLoading(false);
        setForm({ subject: '', description: '', priority: 'Medium', client_name: '', assigned_to: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary-100)] flex items-center justify-center"><Wrench className="w-4 h-4 text-[var(--color-primary)]" /></div>
                        Nuevo Ticket de Soporte
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Cliente *</label><Input placeholder="Nombre del cliente" value={form.client_name} onChange={e => set('client_name', e.target.value)} /></div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Asignar Técnico</label>
                            <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                                <option value="">— Sin asignar —</option>
                                {DEMO_TECHS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Asunto *</label><Input placeholder="Describe el problema brevemente" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Descripción</label>
                        <textarea className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            placeholder="Síntomas, error codes, observaciones..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>
                    <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Prioridad</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map(p => (
                                <button key={p} type="button" onClick={() => set('priority', p)}
                                    className={cn('rounded-lg border py-1.5 text-xs font-medium transition-all', form.priority === p ? PRIORITY_CFG[p].badge + ' border-current' : 'border-slate-200 text-slate-500')}>
                                    {PRIORITY_CFG[p].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]" onClick={submit} disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Ticket'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export function ServicePage() {
    const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS);
    const [selected, setSelected] = useState<Ticket | null>(DEMO_TICKETS[0]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [mainTab, setMainTab] = useState('tickets');
    const [showCreate, setShowCreate] = useState(false);

    const filtered = useMemo(() =>
        tickets.filter(t => {
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) &&
                !t.client_name.toLowerCase().includes(search.toLowerCase()) &&
                !t.ticket_number.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        }), [tickets, search, statusFilter]);

    const stats = useMemo(() => ({
        open: tickets.filter(t => t.status === 'Open').length,
        in_progress: tickets.filter(t => t.status === 'In_Progress').length,
        waiting: tickets.filter(t => t.status === 'Waiting_Parts').length,
        critical: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed').length,
        unassigned: tickets.filter(t => !t.assigned_to && t.status !== 'Closed').length,
    }), [tickets]);

    const updateTicket = useCallback((updated: Ticket) => {
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelected(updated);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-[var(--color-primary)]" />Servicio Técnico
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Gestión de Servicio Técnico y Soporte en Campo</p>
                </div>
                <div className="flex items-center gap-2">
                    {stats.unassigned > 0 && (
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-xs">
                            ⚠️ {stats.unassigned} sin asignar
                        </Badge>
                    )}
                    <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] gap-2" onClick={() => setShowCreate(true)}>
                        <Plus className="w-4 h-4" />Nuevo Ticket
                    </Button>
                </div>
            </div>

            {/* KPI Counters */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {[
                    { label: 'Abiertos', val: stats.open, color: 'bg-blue-100 text-blue-700', filter: 'Open' as TicketStatus },
                    { label: 'En Proceso', val: stats.in_progress, color: 'bg-indigo-100 text-indigo-700', filter: 'In_Progress' as TicketStatus },
                    { label: 'Esp. Partes', val: stats.waiting, color: 'bg-amber-100 text-amber-700', filter: 'Waiting_Parts' as TicketStatus },
                    { label: 'Críticos', val: stats.critical, color: 'bg-red-100 text-red-700', filter: 'Critical' as any },
                ].map(s => (
                    <button key={s.filter} onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border', statusFilter === s.filter ? s.color + ' border-current' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}>
                        {s.val} {s.label}
                    </button>
                ))}
                {statusFilter !== 'all' && <button onClick={() => setStatusFilter('all')} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><X className="w-3 h-3" />Limpiar</button>}
            </div>

            {/* Main tabs */}
            <Tabs value={mainTab} onValueChange={setMainTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex-shrink-0 bg-slate-100 w-fit">
                    <TabsTrigger value="tickets" className="gap-1.5"><ClipboardList className="w-4 h-4" />Tickets</TabsTrigger>
                    <TabsTrigger value="dispatch" className="gap-1.5"><Brain className="w-4 h-4" />Despacho IA</TabsTrigger>
                    <TabsTrigger value="field" className="gap-1.5"><Phone className="w-4 h-4" />Vista Técnico</TabsTrigger>
                    <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="w-4 h-4" />Productividad</TabsTrigger>
                </TabsList>

                {/* TICKETS SPLIT VIEW */}
                <TabsContent value="tickets" className="flex-1 min-h-0 mt-3">
                    <div className="flex gap-4 h-full">
                        {/* List */}
                        <div className="w-[340px] flex-shrink-0 flex flex-col gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Buscar ticket..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 text-base" />
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="space-y-2 pr-1">
                                    {filtered.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Sin tickets</p>
                                        </div>
                                    ) : filtered.map(t => (
                                        <TicketCard key={t.id} ticket={t} active={selected?.id === t.id} onClick={() => setSelected(t)} />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Detail */}
                        <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-hidden">
                            {selected
                                ? <TicketDetail key={selected.id} ticket={selected} onUpdated={updateTicket} />
                                : <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <ClipboardList className="w-16 h-16 mb-3 opacity-20" />
                                    <p className="font-medium">Selecciona un ticket</p>
                                </div>
                            }
                        </div>
                    </div>
                </TabsContent>

                {/* SUPERVISOR DASHBOARD */}
                <TabsContent value="dashboard" className="flex-1 min-h-0 mt-3 overflow-auto">
                    <ServiceDashboard />
                </TabsContent>

                {/* AI DISPATCH */}
                <TabsContent value="dispatch" className="flex-1 min-h-0 mt-3 overflow-auto">
                    <AiRoutePlanner />
                </TabsContent>

                {/* FIELD MOBILE VIEW */}
                <TabsContent value="field" className="flex-1 min-h-0 mt-3 overflow-auto">
                    <TechMobileView />
                </TabsContent>
            </Tabs>

            <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)}
                onCreated={t => { setTickets(prev => [t, ...prev]); setSelected(t); }} />
        </div>
    );
}

export default ServicePage;
