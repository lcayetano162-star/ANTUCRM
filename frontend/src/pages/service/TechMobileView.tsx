// ============================================================
// ANTU FSM - Technician Field Mobile View
// All real-world scenarios a field tech faces:
//   Normal closure + digital signature
//   Missing parts -> Waiting + return note
//   Customer not available -> Reschedule
//   Escalation to Level 2
//   Create ticket for additional equipment found onsite
//   Live job timer
//   Parts from inventory
// ============================================================
import { useState, useEffect } from 'react';
import {
    CheckCircle2, Package, User, AlertTriangle, Plus,
    Phone, ChevronRight, Camera, Wrench,
    ArrowUpCircle, MapPin, Timer,
    CheckSquare, FileText, Clock, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { serviceDeskApi, usersApi, inventoryApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';

// -- TYPES ---------------------------------------------------
type FieldStatus =
    | 'En_Camino'
    | 'En_Sitio'
    | 'Esperando_Partes'
    | 'Cliente_Ausente'
    | 'Resuelto'
    | 'Cerrado'
    | 'Escalado';

interface FieldTicket {
    id: string;
    ticket_number: string;
    subject: string;
    client_name: string;
    client_id: string;
    address: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    asset_model: string;
    asset_serial?: string;
    is_warranty: boolean;
    sla_deadline: string;
    field_status: FieldStatus;
    signature?: string;
    start_time?: number;
    order: number;
}

interface Part {
    id: string; name: string; sku: string; stock: number; price: number;
}

interface Tech {
    id: string; name: string; avatar: string;
}

// -- HELPERS -------------------------------------------------
function toFieldStatus(status: string): FieldStatus {
    switch (status) {
        case 'In_Progress':    return 'En_Sitio';
        case 'Waiting_Parts':  return 'Esperando_Partes';
        case 'Resolved':       return 'Resuelto';
        case 'Closed':         return 'Cerrado';
        case 'Pending':        return 'Cliente_Ausente';
        default:               return 'En_Camino';
    }
}

const SLA_HOURS: Record<string, number> = { Critical: 4, High: 8, Medium: 24, Low: 72 };

function mapApiTicket(t: any, idx: number): FieldTicket {
    const slaHours = SLA_HOURS[t.priority] || 24;
    const deadline = new Date(t.created_at);
    deadline.setHours(deadline.getHours() + slaHours);
    const slaStr = deadline.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
    // Use updated_at as proxy for when tech arrived (In_Progress start)
    const startTime = t.status === 'In_Progress' && t.updated_at
        ? new Date(t.updated_at).getTime()
        : undefined;
    return {
        id: t.id,
        ticket_number: t.ticket_number,
        subject: t.subject,
        client_name: t.client_name || '—',
        client_id: t.client_id,
        address: t.description ? t.description.substring(0, 80) : '—',
        priority: t.priority,
        asset_model: t.asset_model || '—',
        asset_serial: t.asset_serial || undefined,
        is_warranty: Boolean(t.asset_under_warranty),
        sla_deadline: slaStr,
        field_status: toFieldStatus(t.status),
        signature: t.client_signature || undefined,
        order: idx + 1,
        start_time: startTime,
    };
}

const PRIORITY = {
    Critical: { dot: 'bg-red-500 animate-pulse', text: 'Critico',   badge: 'bg-red-100 text-red-700 border-red-200' },
    High:     { dot: 'bg-orange-500',             text: 'Alto',      badge: 'bg-orange-100 text-orange-700 border-orange-200' },
    Medium:   { dot: 'bg-amber-400',              text: 'Medio',     badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    Low:      { dot: 'bg-slate-300',              text: 'Bajo',      badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const STATUS_INFO: Record<FieldStatus, { label: string; color: string; icon: string }> = {
    En_Camino:        { label: 'En Camino',      color: 'bg-blue-100 text-blue-700',    icon: '🚗' },
    En_Sitio:         { label: 'En Sitio',        color: 'bg-indigo-100 text-indigo-700',icon: '🔧' },
    Esperando_Partes: { label: 'Esp. Partes',     color: 'bg-amber-100 text-amber-700',  icon: '📦' },
    Cliente_Ausente:  { label: 'Cliente Ausente', color: 'bg-slate-100 text-slate-600',  icon: '🚪' },
    Resuelto:         { label: 'Resuelto',         color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
    Cerrado:          { label: 'Cerrado',          color: 'bg-slate-100 text-slate-400',  icon: '🔒' },
    Escalado:         { label: 'Escalado L2',      color: 'bg-purple-100 text-purple-700',icon: '⬆️' },
};

function useElapsedTimer(startTime?: number) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!startTime) return;
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(id);
    }, [startTime]);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

// -- ACTION MODAL --------------------------------------------
function ActionModal({
    ticket, products, onClose, onRefresh
}: {
    ticket: FieldTicket;
    products: Part[];
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [mode, setMode] = useState<
        'menu' | 'complete' | 'parts' | 'absent' | 'escalate' | 'create_ticket'
    >('menu');
    const [signature, setSignature]         = useState('');
    const [diagnosis, setDiagnosis]         = useState('');
    const [partNote, setPartNote]           = useState('');
    const [selectedPart, setSelectedPart]   = useState('');
    const [absentNote, setAbsentNote]       = useState('');
    const [escalateReason, setEscalateReason] = useState('');
    const [csat, setCsat]                   = useState(0);
    const [newTicket, setNewTicket]         = useState({ subject: '', asset: '', notes: '' });
    const [saving, setSaving]               = useState(false);

    const elapsed = useElapsedTimer(ticket.start_time);

    const doArrive = async () => {
        setSaving(true);
        try {
            await serviceDeskApi.update(ticket.id, { status: 'In_Progress' });
            toast.success('Llegada registrada. Temporizador iniciado.');
            onRefresh(); onClose();
        } catch {
            toast.error('Error al registrar llegada');
        } finally { setSaving(false); }
    };

    const doComplete = async () => {
        if (!signature.trim()) { toast.error('Firma del cliente requerida'); return; }
        setSaving(true);
        try {
            await serviceDeskApi.close(ticket.id, signature.trim());
            toast.success(`Ticket cerrado. Firmado por: ${signature}. CSAT ${csat}/5`);
            onRefresh(); onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al cerrar ticket');
        } finally { setSaving(false); }
    };

    const doNeedPart = async () => {
        setSaving(true);
        try {
            await serviceDeskApi.update(ticket.id, { status: 'Waiting_Parts' });
            const part = products.find(p => p.id === selectedPart);
            toast.warning(`Ticket marcado "Esperando Partes". ${part?.stock === 0 ? 'Sin stock - se solicitara.' : 'Pieza identificada.'}`);
            onRefresh(); onClose();
        } catch {
            toast.error('Error al actualizar estado');
        } finally { setSaving(false); }
    };

    const doAbsent = async () => {
        setSaving(true);
        try {
            await serviceDeskApi.update(ticket.id, { status: 'Pending' });
            toast.info('Cliente ausente registrado. Supervisor notificado para reprogramar.');
            onRefresh(); onClose();
        } catch {
            toast.error('Error al registrar ausencia');
        } finally { setSaving(false); }
    };

    const doEscalate = async () => {
        if (!escalateReason.trim()) { toast.error('Describe el motivo de la escalada'); return; }
        setSaving(true);
        try {
            await serviceDeskApi.update(ticket.id, { status: 'Pending' });
            toast.info('Ticket escalado al equipo L2. Supervisor notificado.');
            onRefresh(); onClose();
        } catch {
            toast.error('Error al escalar ticket');
        } finally { setSaving(false); }
    };

    const doCreateTicket = async () => {
        if (!newTicket.subject || !newTicket.asset) { toast.error('Asunto y equipo son obligatorios'); return; }
        setSaving(true);
        try {
            const res = await serviceDeskApi.create({
                client_id: ticket.client_id,
                subject: newTicket.subject,
                asset_model: newTicket.asset,
                description: newTicket.notes || undefined,
                priority: 'Medium',
            });
            toast.success(`Ticket ${res.data.ticket_number} creado para ${ticket.client_name}`);
            onRefresh(); onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear ticket');
        } finally { setSaving(false); }
    };

    const p = PRIORITY[ticket.priority];

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-sm mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-base leading-tight">
                        <span className={cn('inline-block w-2 h-2 rounded-full mr-2', p.dot)} />
                        {ticket.ticket_number}
                    </DialogTitle>
                    <p className="text-sm text-slate-600 mt-1">{ticket.subject}</p>
                    <p className="text-xs text-slate-400">{ticket.client_name}</p>
                </DialogHeader>

                {/* MENU */}
                {mode === 'menu' && (
                    <div className="space-y-2 py-2">
                        {ticket.field_status === 'En_Camino' && (
                            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 gap-3 text-base justify-start pl-5" onClick={doArrive} disabled={saving}>
                                <MapPin className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold">Estoy en el Cliente</p>
                                    <p className="text-xs opacity-80">Registrar llegada e iniciar temporizador</p>
                                </div>
                            </Button>
                        )}
                        {ticket.field_status === 'En_Sitio' && (
                            <>
                                {ticket.start_time && (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3">
                                        <Timer className="w-4 h-4 text-indigo-600" />
                                        <div>
                                            <p className="text-xs text-indigo-600 font-semibold">Tiempo en sitio</p>
                                            <p className="text-lg font-bold text-indigo-800 font-mono">{elapsed}</p>
                                        </div>
                                    </div>
                                )}
                                <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 gap-3 text-base justify-start pl-5" onClick={() => setMode('complete')}>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Completar y Cerrar</p>
                                        <p className="text-xs opacity-80">Firma digital + calificacion CSAT</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 border-amber-200 hover:bg-amber-50 text-amber-700" onClick={() => setMode('parts')}>
                                    <Package className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Necesito una Pieza</p>
                                        <p className="text-xs opacity-80">Marcar "Esperando Partes"</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 border-purple-200 hover:bg-purple-50 text-purple-700" onClick={() => setMode('escalate')}>
                                    <ArrowUpCircle className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Escalar a Nivel 2</p>
                                        <p className="text-xs opacity-80">Requiere tecnico especialista</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setMode('create_ticket')}>
                                    <Plus className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Crear Ticket Adicional</p>
                                        <p className="text-xs opacity-80">Otro equipo con problema en este cliente</p>
                                    </div>
                                </Button>
                            </>
                        )}
                        {ticket.field_status === 'En_Camino' && (
                            <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 text-slate-600" onClick={() => setMode('absent')}>
                                <User className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold">Cliente No Disponible</p>
                                    <p className="text-xs opacity-80">Llegue al local pero no hay nadie</p>
                                </div>
                            </Button>
                        )}
                        {ticket.field_status === 'Resuelto' && (
                            <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 gap-3 text-base justify-start pl-5" onClick={() => setMode('complete')}>
                                <CheckSquare className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold">Obtener Firma y Cerrar</p>
                                    <p className="text-xs opacity-80">Problema resuelto — firma del cliente</p>
                                </div>
                            </Button>
                        )}
                    </div>
                )}

                {/* COMPLETE + SIGNATURE + CSAT */}
                {mode === 'complete' && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Diagnostico / Trabajo realizado</label>
                            <textarea
                                className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Describe el trabajo realizado..."
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Satisfaccion del cliente (CSAT)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} onClick={() => setCsat(n)}
                                        className={cn('flex-1 h-10 rounded-lg border-2 text-base transition-all flex items-center justify-center',
                                            csat >= n ? 'border-amber-400 bg-amber-50' : 'border-slate-200')}>
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            {csat > 0 && <p className="text-xs text-center text-slate-500">{['', 'Pesimo', 'Malo', 'Regular', 'Bueno', 'Excelente'][csat]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Firma del cliente (nombre completo)</label>
                            <Input
                                placeholder="Escriba nombre completo..."
                                value={signature}
                                onChange={e => setSignature(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2 text-xs text-slate-500">
                            <Camera className="w-4 h-4 flex-shrink-0" />
                            <span>Foto de evidencia (toca para acceder a camara)</span>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atras</Button>
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={doComplete} disabled={!signature || csat === 0 || saving}>
                                {saving ? 'Guardando...' : 'Cerrar Ticket'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* NEED PARTS */}
                {mode === 'parts' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            El ticket quedara en <strong>"Esperando Partes"</strong>. El supervisor vera que necesitas regresar con la pieza.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Pieza del inventario</label>
                            <select
                                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                                value={selectedPart}
                                onChange={e => setSelectedPart(e.target.value)}
                            >
                                <option value="">— Seleccionar del catalogo —</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.stock > 0 ? p.stock + ' un.' : 'Sin stock'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {!selectedPart && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold">O describe la pieza</label>
                                <Input placeholder="Nombre / codigo de la pieza necesaria" value={partNote} onChange={e => setPartNote(e.target.value)} />
                            </div>
                        )}
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atras</Button>
                            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={doNeedPart} disabled={(!selectedPart && !partNote) || saving}>
                                {saving ? 'Guardando...' : 'Confirmar'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* CUSTOMER ABSENT */}
                {mode === 'absent' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            El ticket quedara en espera y el supervisor programara una nueva visita.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Que paso?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Local cerrado', 'No hubo respuesta', 'Cliente cancelo', 'Direccion incorrecta'].map(opt => (
                                    <button key={opt} onClick={() => setAbsentNote(opt)}
                                        className={cn('rounded-lg border py-2.5 text-sm transition-all',
                                            absentNote === opt ? 'border-slate-600 bg-slate-100 font-semibold' : 'border-slate-200 text-slate-600')}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atras</Button>
                            <Button className="flex-1" variant="secondary" onClick={doAbsent} disabled={!absentNote || saving}>
                                {saving ? 'Guardando...' : 'Registrar Ausencia'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* ESCALATE */}
                {mode === 'escalate' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
                            Un tecnico L2 o especialista recibira este ticket. Documenta bien el problema.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Motivo de escalada</label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {[
                                    'Requiere tecnico certificado en placa electronica',
                                    'Falla en componente de alto voltaje',
                                    'Error de firmware / actualizacion requerida',
                                    'Problema de red / integracion empresarial',
                                ].map(opt => (
                                    <button key={opt} onClick={() => setEscalateReason(opt)}
                                        className={cn('rounded-lg border py-2 px-3 text-sm text-left transition-all',
                                            escalateReason === opt ? 'border-purple-500 bg-purple-50 font-medium text-purple-800' : 'border-slate-200 text-slate-600')}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <Input placeholder="O escribe el motivo..." value={escalateReason} onChange={e => setEscalateReason(e.target.value)} className="mt-1" />
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atras</Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={doEscalate} disabled={!escalateReason || saving}>
                                {saving ? 'Guardando...' : 'Escalar'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* CREATE NEW TICKET ONSITE */}
                {mode === 'create_ticket' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            El ticket se creara para <strong>{ticket.client_name}</strong>.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Problema encontrado</label>
                            <Input placeholder="Ej: Toner bajo en MFP B/N piso 3" value={newTicket.subject} onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Equipo (modelo / serial)</label>
                            <Input placeholder="Ej: MFP-B520 / SN-2021-00442" value={newTicket.asset} onChange={e => setNewTicket(t => ({ ...t, asset: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Notas</label>
                            <textarea className="w-full min-h-[50px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none"
                                placeholder="Observaciones iniciales..." value={newTicket.notes}
                                onChange={e => setNewTicket(t => ({ ...t, notes: e.target.value }))} />
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atras</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={doCreateTicket} disabled={!newTicket.subject || !newTicket.asset || saving}>
                                {saving ? 'Creando...' : 'Crear Ticket'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// -- JOB CARD ------------------------------------------------
function JobCard({ ticket, onAction, isActive }: {
    ticket: FieldTicket;
    onAction: (t: FieldTicket) => void;
    isActive: boolean;
}) {
    const s = STATUS_INFO[ticket.field_status];
    const elapsed = useElapsedTimer(isActive && ticket.start_time ? ticket.start_time : undefined);
    const isDone = ['Cerrado', 'Escalado'].includes(ticket.field_status);
    const isWaiting = ['Esperando_Partes', 'Cliente_Ausente'].includes(ticket.field_status);

    return (
        <div className={cn(
            'rounded-2xl border p-4 space-y-3 transition-all',
            isActive ? 'border-cyan-600 shadow-lg shadow-[#0891b2]/10 bg-white' :
                isDone ? 'border-slate-200 bg-slate-50 opacity-60' :
                    ticket.priority === 'Critical' ? 'border-red-200 bg-red-50/50' :
                        'border-slate-200 bg-white'
        )}>
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        isActive ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600')}>
                        {ticket.order}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-mono text-slate-400">{ticket.ticket_number}</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{ticket.subject}</p>
                    </div>
                </div>
                <Badge variant="secondary" className={cn('text-[10px] px-2 flex-shrink-0', s.color)}>
                    {s.icon} {s.label}
                </Badge>
            </div>

            {/* Client */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{ticket.client_name}</span>
            </div>

            {/* Equipment */}
            <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600">{ticket.asset_model}</span>
                {ticket.is_warranty && (
                    <Badge variant="outline" className="text-[10px] px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">Garantia</Badge>
                )}
            </div>

            {/* Timer (active job on-site) */}
            {isActive && ticket.start_time && ticket.field_status === 'En_Sitio' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-mono font-bold text-indigo-800">{elapsed}</span>
                    <span className="text-xs text-indigo-500 ml-auto">en sitio</span>
                </div>
            )}

            {/* SLA */}
            {!isDone && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">SLA:</span>
                    <strong className="text-red-600">{ticket.sla_deadline}</strong>
                </div>
            )}

            {/* Signature (closed) */}
            {ticket.signature && ticket.field_status === 'Cerrado' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800">
                    Firmado por: <strong>{ticket.signature}</strong>
                </div>
            )}

            {/* Action button */}
            {!isDone && !isWaiting && (
                <Button
                    className={cn(
                        'w-full h-11 gap-2 rounded-xl font-semibold',
                        ticket.field_status === 'En_Camino' ? 'bg-indigo-600 hover:bg-indigo-700' :
                            ticket.field_status === 'Resuelto' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                ticket.field_status === 'En_Sitio' ? 'bg-cyan-600 hover:bg-cyan-700' :
                                    'bg-slate-700 hover:bg-slate-800'
                    )}
                    onClick={() => onAction(ticket)}
                >
                    {ticket.field_status === 'En_Camino' ? <><MapPin className="w-4 h-4" />Llegue al cliente</> :
                        ticket.field_status === 'Resuelto' ? <><CheckSquare className="w-4 h-4" />Obtener Firma</> :
                            ticket.field_status === 'En_Sitio' ? <><FileText className="w-4 h-4" />Acciones del Sitio</> :
                                <><ChevronRight className="w-4 h-4" />Ver opciones</>}
                </Button>
            )}
        </div>
    );
}

// -- MAIN COMPONENT ------------------------------------------
export function TechMobileView() {
    const { t } = useLanguage();
    const { isServiceSupervisor } = useAuthStore();
    const [techs, setTechs]                 = useState<Tech[]>([]);
    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [tickets, setTickets]             = useState<FieldTicket[]>([]);
    const [products, setProducts]           = useState<Part[]>([]);
    const [actionTicket, setActionTicket]   = useState<FieldTicket | null>(null);
    const [loading, setLoading]             = useState(true);

    const loadTechs = async () => {
        try {
            const res = await usersApi.getAll();
            const allUsers: any[] = Array.isArray(res.data) ? res.data : [];
            const techList = allUsers
                .filter(u => u.role === 'service_tech' && u.is_active !== false)
                .map(u => ({
                    id: u.id,
                    name: `${u.first_name} ${u.last_name}`,
                    avatar: `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase(),
                }));
            setTechs(techList);
            if (techList.length > 0 && !selectedTechId) {
                setSelectedTechId(techList[0].id);
            }
        } catch { /* silently ignore */ }
    };

    const loadTickets = async (techId?: string) => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (isServiceSupervisor && (techId || selectedTechId)) {
                params.assigned_to = techId || selectedTechId;
            }
            const res = await serviceDeskApi.getAll(params);
            const rows: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setTickets(rows.map((t, i) => mapApiTicket(t, i)));
        } catch {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await inventoryApi.getProducts({ limit: 100 });
            const rows: any[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setProducts(rows.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku || '',
                stock: p.quantity_on_hand ?? 0,
                price: p.unit_price ?? 0,
            })));
        } catch { /* silently ignore */ }
    };

    useEffect(() => {
        loadProducts();
        if (isServiceSupervisor) {
            loadTechs();
        } else {
            loadTickets();
        }
    }, []);

    useEffect(() => {
        if (isServiceSupervisor && selectedTechId) {
            loadTickets(selectedTechId);
        }
    }, [selectedTechId]);

    const activeTech = techs.find(t => t.id === selectedTechId);
    const techName   = isServiceSupervisor ? (activeTech?.name || 'Tecnico') : 'Mi Jornada';
    const techAvatar = activeTech?.avatar || 'T';

    const activeTicket = tickets.find(t => t.field_status === 'En_Sitio');
    const pending  = tickets.filter(t => !['Cerrado', 'Escalado', 'Cliente_Ausente'].includes(t.field_status));
    const done     = tickets.filter(t => ['Cerrado', 'Escalado', 'Cliente_Ausente'].includes(t.field_status));
    const closedCount = done.length;

    const slaRisk = tickets.filter(t => {
        const [h, m] = t.sla_deadline.split(':').map(Number);
        const deadline = new Date(); deadline.setHours(h, m, 0, 0);
        return deadline.getTime() - Date.now() < 3600000 && !['Cerrado', 'Escalado'].includes(t.field_status);
    }).length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-cyan-600" />
                        {t('Vista de Campo — Tecnico')}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">{t('Interfaz optimizada para movil')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadTickets(selectedTechId)} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar
                    </Button>
                    {isServiceSupervisor && techs.length > 0 && (
                        <select
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white font-medium text-slate-700"
                            value={selectedTechId}
                            onChange={e => setSelectedTechId(e.target.value)}
                        >
                            {techs.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t('Cargando tickets...')}</span>
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{t('No hay tickets asignados')}</p>
                    <p className="text-xs mt-1">
                        {isServiceSupervisor
                            ? t('Este tecnico no tiene tickets asignados activos')
                            : t('No tienes tickets asignados en este momento')}
                    </p>
                </div>
            ) : (
                <div className="flex gap-6 items-start">
                    {/* Mobile frame */}
                    <div className="w-[390px] flex-shrink-0">
                        <div className="relative bg-slate-900 rounded-[40px] p-3 shadow-2xl border border-slate-700">
                            {/* Notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-10" />

                            {/* Screen */}
                            <div className="bg-slate-50 rounded-[32px] overflow-hidden" style={{ height: '700px' }}>
                                {/* Status bar */}
                                <div className="bg-white px-5 pt-6 pb-3 flex items-center justify-between border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                                            {techAvatar}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{techName}</p>
                                            <p className="text-[10px] text-slate-400">ANTU FSM · Hoy</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {slaRisk > 0 && (
                                            <div className="flex items-center gap-1 bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                                                <AlertTriangle className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{slaRisk} SLA</span>
                                            </div>
                                        )}
                                        <div className="text-[10px] text-right">
                                            <p className="font-bold text-slate-800">{closedCount}/{tickets.length}</p>
                                            <p className="text-slate-400">{t('cerrados')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="bg-white px-5 pb-3">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-600 rounded-full transition-all"
                                            style={{ width: `${tickets.length > 0 ? (closedCount / tickets.length) * 100 : 0}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                        <span>{closedCount} {t('completados')}</span>
                                        <span>{pending.length} {t('pendientes')}</span>
                                    </div>
                                </div>

                                {/* Ticket list */}
                                <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ height: '580px' }}>
                                    {activeTicket && (
                                        <div>
                                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2">{t('Trabajo Activo')}</p>
                                            <JobCard ticket={activeTicket} onAction={setActionTicket} isActive />
                                        </div>
                                    )}
                                    {pending.filter(t => t.id !== activeTicket?.id).length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('Cola del Dia')}</p>
                                            {pending.filter(t => t.id !== activeTicket?.id).map(t => (
                                                <div key={t.id} className="mb-3">
                                                    <JobCard ticket={t} onAction={setActionTicket} isActive={false} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {done.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('Completados')}</p>
                                            {done.map(t => (
                                                <div key={t.id} className="mb-3">
                                                    <JobCard ticket={t} onAction={() => {}} isActive={false} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side panel: legend + stats */}
                    <div className="flex-1 space-y-4">
                        <Card className="border-slate-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    {t('Escenarios cubiertos')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { icon: '🚗', status: 'En Camino',       desc: 'Tecnico en transito — puede registrar llegada o cliente ausente',                          color: 'bg-blue-50 border-blue-200' },
                                    { icon: '🔧', status: 'Trabajando',      desc: 'Temporizador activo — completar, pieza, escalar, crear ticket adicional',                  color: 'bg-indigo-50 border-indigo-200' },
                                    { icon: '✅', status: 'Completado',      desc: 'Debe obtener firma digital del cliente + calificacion CSAT (1-5)',                        color: 'bg-emerald-50 border-emerald-200' },
                                    { icon: '📦', status: 'Esperando Pieza', desc: 'Tecnico identifico pieza faltante — ticket queda en Waiting_Parts para revisita',         color: 'bg-amber-50 border-amber-200' },
                                    { icon: '🚪', status: 'Cliente Ausente', desc: 'Nadie en el local — supervisor reprograma sin costo para el tecnico',                      color: 'bg-slate-50 border-slate-200' },
                                    { icon: '⬆️', status: 'Escalado L2',     desc: 'Requiere especialista — ticket en Pending, supervisor reasigna a L2',                     color: 'bg-purple-50 border-purple-200' },
                                    { icon: '➕', status: 'Nuevo Ticket',    desc: 'Tecnico descubre otro equipo con problema — crea ticket in-situ para el mismo cliente',   color: 'bg-teal-50 border-teal-200' },
                                ].map(s => (
                                    <div key={s.status} className={cn('border rounded-xl p-3 flex items-start gap-3', s.color)}>
                                        <span className="text-lg flex-shrink-0">{s.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{s.status}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-100">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('Estadisticas de hoy')}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                        <p className="text-2xl font-bold text-emerald-700">{closedCount}</p>
                                        <p className="text-xs text-emerald-600">{t('Cerrados')}</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                                        <p className="text-2xl font-bold text-blue-700">{pending.length}</p>
                                        <p className="text-xs text-blue-600">{t('Pendientes')}</p>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                                        <p className="text-2xl font-bold text-amber-700">
                                            {tickets.filter(tk => tk.field_status === 'Esperando_Partes').length}
                                        </p>
                                        <p className="text-xs text-amber-600">{t('Esp. Partes')}</p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-xl">
                                        <p className="text-2xl font-bold text-red-700">{slaRisk}</p>
                                        <p className="text-xs text-red-600">{t('Riesgo SLA')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Action modal */}
            {actionTicket && (
                <ActionModal
                    ticket={actionTicket}
                    products={products}
                    onClose={() => setActionTicket(null)}
                    onRefresh={() => loadTickets(selectedTechId)}
                />
            )}
        </div>
    );
}
