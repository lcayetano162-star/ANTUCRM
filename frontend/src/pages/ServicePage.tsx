// ============================================================
// ANTU CRM - Módulo de Servicio Técnico y Field Service
// ============================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Wrench, Plus, Search, X, CheckCircle2,
    Package, User, PenLine, ClipboardList,
    BarChart3, PlayCircle, Brain, Phone,
    Pause, CheckSquare, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { serviceDeskApi, clientsApi, usersApi, inventoryApi } from '@/services/api';
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
    created_at: string; resolved_at?: string; client_signature?: string; signed_at?: string;
}
interface WorkOrder {
    id: string; work_order_number: string; technician_name?: string;
    technician_id?: string; status: WOStatus; scheduled_date?: string;
    diagnosis?: string; execution_details?: string; parts_count: number;
    parts_total_cost: number; created_at: string;
}
interface Part {
    id: string; product_name: string; product_sku?: string;
    quantity: number; unit_cost: number; is_warranty: boolean; current_stock?: number;
}
interface Tech { id: string; name: string; role: string; }
interface Client { id: string; name: string; }
interface Product { id: string; name: string; sku: string; price: number; quantity_on_hand: number; }

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

const fmtDate = (s?: string) => {
    if (!s) return '—';
    return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s));
};

// ── TICKET CARD ───────────────────────────────────────────────
function TicketCard({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
    const { t } = useLanguage();
    const p = PRIORITY_CFG[ticket.priority];
    const s = STATUS_CFG[ticket.status];
    return (
        <button onClick={onClick} className={cn('w-full text-left border rounded-xl p-3.5 transition-all hover:shadow-sm',
            active ? 'border-cyan-600 bg-cyan-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white')}>
            <div className="flex items-start gap-2.5">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', p.dot)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] font-mono text-slate-400">{ticket.ticket_number}</p>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 flex-shrink-0', s.color)}>{t(s.label)}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-0.5 leading-tight">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.client_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', p.badge)}>{t(p.label)}</Badge>
                        {ticket.assigned_to_name
                            ? <span className="text-[10px] text-slate-400 flex items-center gap-1"><User className="w-2.5 h-2.5" />{ticket.assigned_to_name}</span>
                            : <span className="text-[10px] text-rose-400 font-medium">{t('Sin asignar')}</span>
                        }
                    </div>
                </div>
            </div>
        </button>
    );
}

// ── TICKET DETAIL PANEL ───────────────────────────────────────
function TicketDetail({
    ticket, techs, products, onUpdated
}: {
    ticket: Ticket; techs: Tech[]; products: Product[];
    onUpdated: (t: Ticket) => void;
}) {
    const { t } = useLanguage();
    const { isServiceSupervisor } = useAuthStore();
    const [tab, setTab] = useState('info');
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [showWOForm, setShowWOForm] = useState(false);
    const [showPartForm, setShowPartForm] = useState(false);
    const [signature, setSignature] = useState('');
    const [selectedWO, setSelectedWO] = useState<string | null>(null);
    const [techId, setTechId] = useState(ticket.assigned_to || '');
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [saving, setSaving] = useState(false);
    const [closing, setClosing] = useState(false);

    // Load full ticket detail + work orders on mount
    useEffect(() => {
        setLoadingDetail(true);
        setStatus(ticket.status);
        setTechId(ticket.assigned_to || '');
        serviceDeskApi.getById(ticket.id)
            .then(res => {
                const detail = res.data;
                setWorkOrders(detail.work_orders || []);
            })
            .catch(() => setWorkOrders([]))
            .finally(() => setLoadingDetail(false));
    }, [ticket.id]);

    const handleAssign = async () => {
        setSaving(true);
        try {
            const updated = await serviceDeskApi.update(ticket.id, { assigned_to: techId || null });
            const tech = techs.find(t => t.id === techId);
            onUpdated({ ...ticket, ...updated.data, assigned_to: techId || undefined, assigned_to_name: tech?.name });
            toast.success(techId ? `Asignado a ${tech?.name}` : 'Asignación removida');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al asignar técnico');
        } finally { setSaving(false); }
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        try {
            await serviceDeskApi.update(ticket.id, { status: newStatus });
            setStatus(newStatus);
            onUpdated({ ...ticket, status: newStatus });
            toast.success(`Estado → ${STATUS_CFG[newStatus].label}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al cambiar estado');
        }
    };

    const handleCloseWithSig = async () => {
        if (signature.trim().length < 2) { toast.error('Escribe el nombre completo del cliente'); return; }
        setClosing(true);
        try {
            const res = await serviceDeskApi.close(ticket.id, signature.trim());
            onUpdated({ ...ticket, ...res.data, status: 'Closed', client_signature: signature.trim(), signed_at: new Date().toISOString() });
            toast.success('Ticket cerrado con firma digital');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al cerrar el ticket');
        } finally { setClosing(false); }
    };

    const handleCreateWO = async (data: { technician_id: string; scheduled_date: string; diagnosis: string }) => {
        try {
            const res = await serviceDeskApi.createWO(ticket.id, data);
            setWorkOrders(prev => [...prev, { ...res.data, parts_count: 0, parts_total_cost: 0 }]);
            setShowWOForm(false);
            toast.success(`${res.data.work_order_number} creada`);
            onUpdated({ ...ticket, status: status === 'Open' || status === 'Pending' ? 'In_Progress' : status });
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear orden de trabajo');
        }
    };

    const handleUpdateWO = async (woId: string, newStatus: WOStatus) => {
        try {
            await serviceDeskApi.updateWO(woId, { status: newStatus });
            setWorkOrders(prev => prev.map(w => w.id === woId ? { ...w, status: newStatus } : w));
            toast.success(`Orden ${newStatus === 'Completed' ? 'completada' : 'actualizada'}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al actualizar orden');
        }
    };

    const handleConsumePart = async (woId: string, product_id: string, quantity: number, is_warranty: boolean) => {
        try {
            const res = await serviceDeskApi.consumePart(woId, { product_id, quantity, is_warranty });
            const part = res.data;
            setParts(prev => [...prev, part]);
            setWorkOrders(prev => prev.map(w => w.id === woId ? { ...w, parts_count: w.parts_count + 1 } : w));
            if (!is_warranty) {
                toast.success(`${part.product_name} descontado del inventario`);
                if (part.current_stock === 0) {
                    setTimeout(() => toast.warning('Stock agotado — ticket marcado "Esperando Partes"'), 600);
                    setStatus('Waiting_Parts');
                    onUpdated({ ...ticket, status: 'Waiting_Parts' });
                }
            } else {
                toast.info(`${part.product_name} cubierta por garantía — sin cargo`);
            }
            setShowPartForm(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al consumir pieza');
        }
    };

    const currentStatus = status;
    const canClose = currentStatus === 'Resolved' && !ticket.client_signature;
    const openWO = workOrders.filter(w => w.status === 'In_Progress').length;
    const totalParts = parts.filter(p => !p.is_warranty).reduce((s, p) => s + p.quantity * p.unit_cost, 0);

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
                        <Badge variant="outline" className={cn('text-sm px-3 py-1', PRIORITY_CFG[ticket.priority].badge)}>{t(PRIORITY_CFG[ticket.priority].label)}</Badge>
                        <Badge variant="secondary" className={cn('text-sm px-3 py-1', STATUS_CFG[currentStatus].color)}>{t(STATUS_CFG[currentStatus].label)}</Badge>
                    </div>
                </div>

                {/* Quick status buttons */}
                {currentStatus !== 'Closed' && (
                    <div className="flex flex-wrap gap-1.5">
                        {currentStatus === 'Open' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleStatusChange('In_Progress')}><PlayCircle className="w-3 h-3" />{t('Iniciar')}</Button>}
                        {currentStatus === 'In_Progress' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleStatusChange('Pending')}><Pause className="w-3 h-3" />{t('Pausar')}</Button>}
                        {currentStatus !== 'Resolved' && currentStatus !== 'Waiting_Parts' && currentStatus !== 'Closed' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange('Resolved')}><CheckSquare className="w-3 h-3" />{t('Resolver')}</Button>
                        )}
                        {canClose && (
                            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setTab('firma')}>
                                <PenLine className="w-3 h-3" />{t('Cerrar con Firma')}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-shrink-0 bg-slate-50 mx-6 mt-4 h-10">
                    <TabsTrigger value="info" className="text-sm px-4">Info</TabsTrigger>
                    <TabsTrigger value="asignacion" className="text-sm px-4">{t('Técnico')}</TabsTrigger>
                    <TabsTrigger value="workorders" className="text-sm px-4">
                        {t('Órdenes')} {workOrders.length > 0 && <span className="ml-1 bg-slate-200 rounded-full px-1.5 text-xs">{workOrders.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="piezas" className="text-sm px-4">
                        {t('Piezas')} {parts.length > 0 && <span className="ml-1 bg-slate-200 rounded-full px-1.5 text-xs">{parts.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="firma" className="text-sm px-4">{t('Firma')}</TabsTrigger>
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
                                        <div className="flex justify-between"><span className="text-slate-500">Creado:</span><span className="font-medium text-slate-700">{fmtDate(ticket.created_at)}</span></div>
                                        {ticket.resolved_at && <div className="flex justify-between"><span className="text-slate-500">Resuelto:</span><span className="font-medium text-slate-700">{fmtDate(ticket.resolved_at)}</span></div>}
                                        <div className="flex justify-between"><span className="text-slate-500">Estado:</span><Badge variant="secondary" className={cn('text-xs', STATUS_CFG[currentStatus].color)}>{STATUS_CFG[currentStatus].label}</Badge></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Prioridad:</span><Badge variant="outline" className={cn('text-xs', PRIORITY_CFG[ticket.priority].badge)}>{PRIORITY_CFG[ticket.priority].label}</Badge></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Técnico:</span><span className="font-medium text-slate-700">{ticket.assigned_to_name || <span className="text-rose-500 font-medium">Sin asignar</span>}</span></div>
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
                                        <p>🔖 <span className="font-medium text-slate-700">{workOrders.length}</span> orden(es) de trabajo</p>
                                        <p>📎 #{ticket.ticket_number}</p>
                                        {totalParts > 0 && <p>💰 RD$ {totalParts.toLocaleString('es-DO')} en piezas</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ASIGNACIÓN */}
                    <TabsContent value="asignacion" className="px-6 py-4 mt-0">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {isServiceSupervisor ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User className="w-4 h-4" />Asignar o Reasignar Técnico</label>
                                        <select
                                            className="w-full h-11 rounded-lg border border-slate-200 px-3 text-base bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            value={techId}
                                            onChange={e => setTechId(e.target.value)}
                                        >
                                            <option value="">— Sin asignar —</option>
                                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700 h-11 text-base" onClick={handleAssign} disabled={saving}>
                                            {saving ? 'Guardando...' : 'Confirmar Asignación'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tu Asignación</p>
                                        <p className="text-sm text-slate-600">Este ticket está asignado a tu usuario. La reasignación la realiza el supervisor.</p>
                                    </div>
                                )}
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
                                        <p className="text-xs text-rose-500 mt-1">{isServiceSupervisor ? 'Asigna un técnico para procesar este ticket' : 'El supervisor asignará un técnico'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* WORK ORDERS */}
                    <TabsContent value="workorders" className="px-6 py-4 mt-0 space-y-3">
                        <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 gap-1.5 h-9" onClick={() => setShowWOForm(true)}>
                            <Plus className="w-3.5 h-3.5" />Nueva Orden de Trabajo
                        </Button>
                        {loadingDetail ? (
                            <div className="text-center py-6 text-slate-400 text-sm">Cargando...</div>
                        ) : workOrders.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin órdenes de trabajo</p>
                            </div>
                        ) : workOrders.map(wo => (
                            <div key={wo.id} className={cn('border rounded-lg p-3 space-y-2 cursor-pointer transition-colors', selectedWO === wo.id ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200 hover:border-slate-300')}
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
                                        {wo.status === 'Scheduled' && (
                                            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1"
                                                onClick={() => handleUpdateWO(wo.id, 'In_Progress')}>
                                                <PlayCircle className="w-3 h-3" />Iniciar
                                            </Button>
                                        )}
                                        {wo.status === 'In_Progress' && (
                                            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 text-emerald-600 border-emerald-200"
                                                onClick={() => handleUpdateWO(wo.id, 'Completed')}>
                                                <CheckCircle2 className="w-3 h-3" />Completar
                                            </Button>
                                        )}
                                        {wo.status !== 'Completed' && wo.status !== 'Cancelled' && (
                                            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 text-blue-600 border-blue-200"
                                                onClick={() => { setSelectedWO(wo.id); setTab('piezas'); }}>
                                                <Package className="w-3 h-3" />Agregar Pieza
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </TabsContent>

                    {/* PIEZAS */}
                    <TabsContent value="piezas" className="px-6 py-4 mt-0 space-y-3">
                        {workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length > 0 ? (
                            <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 gap-1.5 h-9" onClick={() => setShowPartForm(true)}>
                                <Plus className="w-3.5 h-3.5" />Consumir Pieza / Repuesto
                            </Button>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                Crea una orden de trabajo activa para consumir piezas
                            </div>
                        )}
                        {parts.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin piezas consumidas</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {parts.map(part => (
                                    <div key={part.id} className="border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                {part.product_sku && <p className="text-xs font-mono text-slate-400">{part.product_sku}</p>}
                                                <p className="text-sm font-medium text-slate-700">{part.product_name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Cant: {part.quantity} × RD$ {part.unit_cost.toLocaleString('es-DO')}</p>
                                            </div>
                                            {part.is_warranty
                                                ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Garantía</Badge>
                                                : <span className="text-xs font-bold text-slate-700">RD$ {(part.quantity * part.unit_cost).toLocaleString('es-DO')}</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                                <div className="bg-slate-50 rounded-lg p-3 text-sm font-bold text-right text-slate-800">
                                    Total facturable: RD$ {totalParts.toLocaleString('es-DO')}
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
                                    {currentStatus !== 'Resolved' && <p className="text-xs text-rose-600 font-medium mt-2">⚠️ El ticket debe estar en estado "Resuelto" para poder cerrarlo.</p>}
                                </div>
                                <Input placeholder="Nombre completo del cliente" value={signature} onChange={e => setSignature(e.target.value)} className="h-12 text-base" />
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" onClick={handleCloseWithSig}
                                    disabled={closing || !signature.trim() || openWO > 0 || currentStatus !== 'Resolved'}>
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
                    <NewWOForm
                        ticket={ticket} techs={techs}
                        onSave={handleCreateWO}
                        onCancel={() => setShowWOForm(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* MODAL: Consumir Pieza */}
            <Dialog open={showPartForm} onOpenChange={setShowPartForm}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-4 h-4" />Consumir Pieza del Inventario</DialogTitle></DialogHeader>
                    <ConsumePartForm
                        warranty={ticket.asset_under_warranty}
                        products={products}
                        activeWOs={workOrders.filter(w => w.status === 'In_Progress' || w.status === 'Scheduled')}
                        onConfirm={handleConsumePart}
                        onCancel={() => setShowPartForm(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── NEW WO FORM ───────────────────────────────────────────────
function NewWOForm({ ticket, techs, onSave, onCancel }: {
    ticket: Ticket; techs: Tech[];
    onSave: (data: { technician_id: string; scheduled_date: string; diagnosis: string }) => Promise<void>;
    onCancel: () => void;
}) {
    const [techId, setTechId] = useState(ticket.assigned_to || '');
    const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    const [diagnosis, setDiagnosis] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        await onSave({ technician_id: techId, scheduled_date: date, diagnosis }).finally(() => setSaving(false));
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
                <textarea className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Describe el problema observado..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={save} disabled={saving}>
                    {saving ? 'Creando...' : 'Crear Orden'}
                </Button>
            </DialogFooter>
        </div>
    );
}

// ── CONSUME PART FORM ─────────────────────────────────────────
function ConsumePartForm({ warranty, products, activeWOs, onConfirm, onCancel }: {
    warranty?: boolean;
    products: Product[];
    activeWOs: WorkOrder[];
    onConfirm: (woId: string, product_id: string, quantity: number, is_warranty: boolean) => Promise<void>;
    onCancel: () => void;
}) {
    const [selectedWO, setSelectedWO] = useState(activeWOs[0]?.id || '');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isWarranty, setIsWarranty] = useState(false);
    const [saving, setSaving] = useState(false);
    const prod = products.find(p => p.id === selectedProduct);

    const confirm = async () => {
        if (!selectedWO || !selectedProduct) return;
        setSaving(true);
        await onConfirm(selectedWO, selectedProduct, quantity, isWarranty).finally(() => setSaving(false));
    };

    return (
        <div className="space-y-4 py-2">
            {activeWOs.length > 1 && (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Orden de Trabajo</label>
                    <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={selectedWO} onChange={e => setSelectedWO(e.target.value)}>
                        {activeWOs.map(wo => <option key={wo.id} value={wo.id}>{wo.work_order_number}</option>)}
                    </select>
                </div>
            )}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Producto / Repuesto</label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                    <option value="">— Seleccionar producto —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.quantity_on_hand})</option>)}
                </select>
            </div>
            {prod && (
                <div className={cn('rounded-lg p-3 border', prod.quantity_on_hand <= 1 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
                    <p className="text-sm font-medium text-slate-700">{prod.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">SKU: {prod.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-xs font-medium', prod.quantity_on_hand === 0 ? 'text-red-600' : prod.quantity_on_hand <= 2 ? 'text-amber-600' : 'text-emerald-600')}>
                            Stock disponible: {prod.quantity_on_hand} un.
                        </span>
                        <span className="text-sm font-bold text-slate-800">RD$ {Number(prod.price).toLocaleString('es-DO')}</span>
                    </div>
                    {prod.quantity_on_hand === 0 && !isWarranty && <p className="text-xs text-red-600 font-medium mt-1">⚠️ Sin stock disponible</p>}
                </div>
            )}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Cantidad</label>
                <Input type="number" min={1} max={prod?.quantity_on_hand || 999} value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-24" />
            </div>
            {warranty && (
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-600" checked={isWarranty} onChange={e => setIsWarranty(e.target.checked)} />
                    <div>
                        <p className="text-sm font-medium text-slate-700">Cubierto por garantía</p>
                        <p className="text-xs text-slate-500">No se descuenta del inventario ni se cobra al cliente</p>
                    </div>
                </label>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700"
                    onClick={confirm}
                    disabled={saving || !selectedWO || !selectedProduct || (!isWarranty && prod?.quantity_on_hand === 0)}>
                    {saving ? 'Procesando...' : isWarranty ? '🛡️ Registrar (Garantía)' : '📦 Consumir del Inventario'}
                </Button>
            </DialogFooter>
        </div>
    );
}

// ── CREATE TICKET MODAL ───────────────────────────────────────
function CreateTicketModal({ open, onClose, onCreated, clients, techs }: {
    open: boolean; onClose: () => void; onCreated: (t: Ticket) => void;
    clients: Client[]; techs: Tech[];
}) {
    const { t } = useLanguage();
    const { isServiceSupervisor } = useAuthStore();
    const [form, setForm] = useState({
        subject: '', description: '', priority: 'Medium' as Priority,
        client_id: '', assigned_to: '',
        asset_model: '', asset_serial: '', asset_under_warranty: false
    });
    const [loading, setLoading] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    ).slice(0, 20);

    const submit = async () => {
        if (!form.subject.trim()) { toast.error('El asunto es obligatorio'); return; }
        if (!form.client_id) { toast.error('Selecciona un cliente'); return; }
        setLoading(true);
        try {
            const payload: any = {
                subject: form.subject,
                description: form.description || undefined,
                priority: form.priority,
                client_id: form.client_id,
                asset_model: form.asset_model || undefined,
                asset_serial: form.asset_serial || undefined,
                asset_under_warranty: form.asset_under_warranty,
            };
            if (isServiceSupervisor && form.assigned_to) payload.assigned_to = form.assigned_to;

            const res = await serviceDeskApi.create(payload);
            const ticket = res.data;
            const client = clients.find(c => c.id === form.client_id);
            const tech = techs.find(t => t.id === form.assigned_to);
            toast.success(`Ticket ${ticket.ticket_number} creado`);
            onCreated({
                ...ticket,
                client_name: client?.name || ticket.client_name || '',
                assigned_to_name: tech?.name,
                work_orders_count: 0
            });
            onClose();
            setForm({ subject: '', description: '', priority: 'Medium', client_id: '', assigned_to: '', asset_model: '', asset_serial: '', asset_under_warranty: false });
            setClientSearch('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear el ticket');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center"><Wrench className="w-4 h-4 text-cyan-600" /></div>
                        {t('Nuevo Ticket de Soporte')}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Client selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Cliente *</label>
                        <Input placeholder="Buscar cliente..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); set('client_id', ''); }} className="h-9" />
                        {clientSearch && !form.client_id && filteredClients.length > 0 && (
                            <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto bg-white shadow-sm">
                                {filteredClients.map(c => (
                                    <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                        onClick={() => { set('client_id', c.id); setClientSearch(c.name); }}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {form.client_id && (
                            <p className="text-xs text-emerald-600 font-medium">✓ Cliente seleccionado</p>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Asunto *</label>
                        <Input placeholder="Describe el problema brevemente" value={form.subject} onChange={e => set('subject', e.target.value)} />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Descripción</label>
                        <textarea className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Síntomas, error codes, observaciones..." value={form.description} onChange={e => set('description', e.target.value)} />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Prioridad</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map(p => (
                                <button key={p} type="button" onClick={() => set('priority', p)}
                                    className={cn('rounded-lg border py-1.5 text-xs font-medium transition-all', form.priority === p ? PRIORITY_CFG[p].badge + ' border-current' : 'border-slate-200 text-slate-500')}>
                                    {t(PRIORITY_CFG[p].label)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asset info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Modelo del equipo</label>
                            <Input placeholder="Ej: MFP-C300" value={form.asset_model} onChange={e => set('asset_model', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Número de serie</label>
                            <Input placeholder="Ej: SN-2024-001" value={form.asset_serial} onChange={e => set('asset_serial', e.target.value)} />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-cyan-600" checked={form.asset_under_warranty} onChange={e => set('asset_under_warranty', e.target.checked)} />
                        <span className="text-sm text-slate-600">Equipo en garantía</span>
                    </label>

                    {/* Tech assignment (supervisor only) */}
                    {isServiceSupervisor && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Asignar Técnico</label>
                            <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                                <option value="">— Sin asignar —</option>
                                {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t('Cancelar')}</Button>
                    <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit} disabled={loading}>
                        {loading ? t('Creando...') : t('Crear Ticket')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export function ServicePage() {
    const { t } = useLanguage();
    const { isServiceSupervisor, isServiceTech } = useAuthStore();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selected, setSelected] = useState<Ticket | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [mainTab, setMainTab] = useState('tickets');
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Shared data loaded once
    const [techs, setTechs] = useState<Tech[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const loadTickets = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params: any = { page: p, limit: 50 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (search) params.search = search;
            const res = await serviceDeskApi.getAll(params);
            setTickets(res.data.data || []);
            setTotal(res.data.total || 0);
            setPage(p);
            if (!selected && res.data.data?.length > 0) setSelected(res.data.data[0]);
        } catch {
            toast.error('Error cargando tickets');
        } finally { setLoading(false); }
    }, [statusFilter, search]);

    // Load tickets whenever filters change
    useEffect(() => {
        const timer = setTimeout(() => loadTickets(1), search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [loadTickets]);

    // Load shared data on mount
    useEffect(() => {
        // Load users for tech selector
        usersApi.getAll()
            .then(res => {
                const users = res.data?.users || res.data || [];
                setTechs(users.map((u: any) => ({
                    id: u.id,
                    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                    role: u.role
                })));
            })
            .catch(() => {});

        // Load clients for ticket creation
        clientsApi.getAll({ limit: 200 })
            .then(res => {
                const rows = res.data?.data || res.data || [];
                setClients(rows.map((c: any) => ({ id: c.id, name: c.name })));
            })
            .catch(() => {});

        // Load inventory products for parts
        inventoryApi.getProducts({ limit: 200 })
            .then(res => {
                const rows = res.data?.data || res.data || [];
                setProducts(rows.map((p: any) => ({
                    id: p.id, name: p.name, sku: p.sku || '',
                    price: parseFloat(p.price) || 0,
                    quantity_on_hand: parseInt(p.quantity_on_hand) || 0
                })));
            })
            .catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        // Tickets are already filtered server-side, but apply client-side status filter for critical
        if (statusFilter === 'Critical' as any) return tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed');
        return tickets;
    }, [tickets, statusFilter]);

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
                        <Wrench className="w-6 h-6 text-cyan-600" />{t('Servicio Técnico')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {total > 0 ? `${total} tickets en total` : 'Gestión de Servicio Técnico y Soporte en Campo'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isServiceSupervisor && stats.unassigned > 0 && (
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-xs">
                            ⚠️ {stats.unassigned} sin asignar
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => loadTickets(1)} className="border-slate-200">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2" onClick={() => setShowCreate(true)}>
                        <Plus className="w-4 h-4" />{t('Nuevo Ticket')}
                    </Button>
                </div>
            </div>

            {/* KPI Counters */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {[
                    { label: t('Abiertos'), val: stats.open, color: 'bg-blue-100 text-blue-700', filter: 'Open' as TicketStatus },
                    { label: t('En Proceso'), val: stats.in_progress, color: 'bg-indigo-100 text-indigo-700', filter: 'In_Progress' as TicketStatus },
                    { label: t('Esp. Partes'), val: stats.waiting, color: 'bg-amber-100 text-amber-700', filter: 'Waiting_Parts' as TicketStatus },
                    { label: t('Críticos'), val: stats.critical, color: 'bg-red-100 text-red-700', filter: 'Critical' as any },
                ].map(s => (
                    <button key={s.filter} onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                            statusFilter === s.filter ? s.color + ' border-current' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}>
                        {s.val} {s.label}
                    </button>
                ))}
                {statusFilter !== 'all' && (
                    <button onClick={() => setStatusFilter('all')} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                        <X className="w-3 h-3" />{t('Limpiar')}
                    </button>
                )}
            </div>

            {/* Main tabs */}
            <Tabs value={mainTab} onValueChange={setMainTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex-shrink-0 bg-slate-100 w-fit">
                    <TabsTrigger value="tickets" className="gap-1.5"><ClipboardList className="w-4 h-4" />{t('Tickets')}</TabsTrigger>
                    {isServiceSupervisor && (
                        <TabsTrigger value="dispatch" className="gap-1.5"><Brain className="w-4 h-4" />{t('Despacho IA')}</TabsTrigger>
                    )}
                    <TabsTrigger value="field" className="gap-1.5"><Phone className="w-4 h-4" />{t('Vista Técnico')}</TabsTrigger>
                    {isServiceSupervisor && (
                        <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="w-4 h-4" />{t('Productividad')}</TabsTrigger>
                    )}
                </TabsList>

                {/* TICKETS SPLIT VIEW */}
                <TabsContent value="tickets" className="flex-1 min-h-0 mt-3">
                    <div className="flex gap-4 h-full">
                        {/* List */}
                        <div className="w-[340px] flex-shrink-0 flex flex-col gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Buscar ticket, cliente..." value={search}
                                    onChange={e => setSearch(e.target.value)} className="pl-10 h-10 text-base" />
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="space-y-2 pr-1">
                                    {loading ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30 animate-spin" />
                                            <p className="text-sm">{t('Cargando tickets...')}</p>
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">{t('Sin tickets')}</p>
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
                                ? <TicketDetail key={selected.id} ticket={selected} techs={techs} products={products} onUpdated={updateTicket} />
                                : <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <ClipboardList className="w-16 h-16 mb-3 opacity-20" />
                                    <p className="font-medium">{t('Selecciona un ticket')}</p>
                                    {tickets.length === 0 && !loading && (
                                        <Button onClick={() => setShowCreate(true)} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
                                            <Plus className="w-4 h-4 mr-2" />Crear primer ticket
                                        </Button>
                                    )}
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

            <CreateTicketModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                clients={clients}
                techs={techs}
                onCreated={t => {
                    setTickets(prev => [t, ...prev]);
                    setSelected(t);
                    setTotal(prev => prev + 1);
                }}
            />
        </div>
    );
}

export default ServicePage;
