// ============================================================
// ANTU FSM - Technician Field Mobile View
// All real-world scenarios a field tech faces:
//   ✅ Normal closure + digital signature
//   🔧 Missing parts → Waiting + return note
//   👤 Customer not available → Reschedule
//   ⬆️ Escalation to Level 2
//   ➕ Create ticket for additional equipment found onsite
//   ⏱️ Live job timer
//   📷 Photo evidence (simulated)
//   📦 Parts from inventory
// ============================================================
import { useState, useEffect } from 'react';
import {
    CheckCircle2, Package, User, AlertTriangle, Plus,
    Phone, ChevronRight, Camera, Wrench,
    ArrowUpCircle, MapPin, Timer,
    CheckSquare, Navigation, FileText, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── TYPES ─────────────────────────────────────────────────────
type FieldStatus =
    | 'En_Camino'       // Travelling to site
    | 'En_Sitio'        // Arrived, working
    | 'Esperando_Partes'// Need part, will return
    | 'Cliente_Ausente' // Customer not home
    | 'Resuelto'        // Fixed, awaiting signature
    | 'Cerrado'         // Signed off
    | 'Escalado';       // Escalated to L2

interface FieldTicket {
    id: string;
    ticket_number: string;
    subject: string;
    client_name: string;
    contact_phone: string;
    address: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    asset_model: string;
    asset_serial?: string;
    is_warranty: boolean;
    estimated_duration_min: number;
    complexity: 1 | 2 | 3 | 4 | 5;
    sla_deadline: string; // time string like "11:30"
    field_status: FieldStatus;
    diagnosis?: string;
    parts_needed?: string;
    signature?: string;
    notes?: string;
    start_time?: number; // timestamp
    eta?: string;
    order: number;
}

interface Part {
    id: string; name: string; sku: string; stock: number; price: number;
}

// ── DEMO DATA ─────────────────────────────────────────────────
const AVAILABLE_PARTS: Part[] = [
    { id: 'p1', name: 'Drum Unit C300 Color', sku: 'DRUM-C300', stock: 2, price: 2800 },
    { id: 'p2', name: 'Feed Roller Kit', sku: 'FDR-ROL', stock: 5, price: 850 },
    { id: 'p3', name: 'Fusor B620 Pro', sku: 'FSR-B620', stock: 1, price: 5400 },
    { id: 'p4', name: 'Tóner Negro 8500pg', sku: 'TON-BK', stock: 8, price: 1200 },
    { id: 'p5', name: 'Bandeja Papel Cassette', sku: 'CS-A4-02', stock: 3, price: 650 },
];

const DEMO_TECHS: { id: string; name: string; avatar: string; today_tickets: FieldTicket[] }[] = [
    {
        id: 't1', name: 'Carlos López', avatar: 'CL',
        today_tickets: [
            {
                id: 'ft1', order: 1, ticket_number: 'TKT-202603-0001',
                subject: 'Impresora MFP-C300 no imprime en color',
                client_name: 'Grupo Empresarial Torres', contact_phone: '809-555-1001',
                address: 'Av. Abraham Lincoln 304, Piantini', priority: 'Critical',
                asset_model: 'MFP-C300 Color A3', asset_serial: 'SN-2024-00123',
                is_warranty: true, estimated_duration_min: 75, complexity: 3,
                sla_deadline: '11:00', field_status: 'En_Sitio', eta: '09:15',
                diagnosis: 'Drum unit defectuosa. Rayas en impresión color.', start_time: Date.now() - 1800000,
            },
            {
                id: 'ft2', order: 2, ticket_number: 'TKT-202603-0006',
                subject: 'Atascos de papel en bandeja 2',
                client_name: 'Clínica San José', contact_phone: '809-555-2002',
                address: 'Av. Tiradentes 45, Naco', priority: 'High',
                asset_model: 'MFP-B620 Pro', asset_serial: 'SN-2025-00789',
                is_warranty: false, estimated_duration_min: 90, complexity: 3,
                sla_deadline: '13:00', field_status: 'En_Camino', eta: '11:30',
            },
            {
                id: 'ft3', order: 3, ticket_number: 'TKT-202603-0010',
                subject: 'Mantenimiento preventivo trimestral',
                client_name: 'Hotel Las Américas', contact_phone: '809-555-3003',
                address: 'Av. George Washington 501, Miramar', priority: 'Low',
                asset_model: 'MFP-C300', is_warranty: false, estimated_duration_min: 120, complexity: 2,
                sla_deadline: '17:00', field_status: 'En_Camino', eta: '14:00',
            },
        ]
    },
    {
        id: 't2', name: 'María Rodríguez', avatar: 'MR',
        today_tickets: [
            {
                id: 'ft4', order: 1, ticket_number: 'TKT-202603-0008',
                subject: 'Configuración scan-to-SharePoint + Red',
                client_name: 'Constructora del Caribe', contact_phone: '809-555-4004',
                address: 'Av. Gustavo Mejía Ricart 54, Bella Vista', priority: 'Medium',
                asset_model: 'MFP-C450 Enterprise', is_warranty: false,
                estimated_duration_min: 60, complexity: 2, sla_deadline: '12:00',
                field_status: 'Resuelto', eta: '09:00',
                diagnosis: 'Red configurada. Scan-to-SharePoint activo. Cliente satisfecho.',
            },
            {
                id: 'ft5', order: 2, ticket_number: 'TKT-202603-0011',
                subject: 'Plotter no reconoce rollo A0',
                client_name: 'Arq. & Diseño Dominicano', contact_phone: '809-555-5005',
                address: 'Av. 27 de Febrero 223, Evaristo Morales', priority: 'Medium',
                asset_model: 'HP DesignJet T650', is_warranty: true,
                estimated_duration_min: 45, complexity: 2, sla_deadline: '15:00',
                field_status: 'En_Camino', eta: '12:30',
            },
        ]
    },
];

// ── HELPERS ───────────────────────────────────────────────────
const PRIORITY = {
    Critical: { dot: 'bg-red-500 animate-pulse', text: 'Crítico', badge: 'bg-red-100 text-red-700 border-red-200' },
    High: { dot: 'bg-orange-500', text: 'Alto', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
    Medium: { dot: 'bg-amber-400', text: 'Medio', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    Low: { dot: 'bg-slate-300', text: 'Bajo', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const STATUS_INFO: Record<FieldStatus, { label: string; color: string; icon: string }> = {
    En_Camino: { label: 'En Camino', color: 'bg-blue-100 text-blue-700', icon: '🚗' },
    En_Sitio: { label: 'En Sitio', color: 'bg-indigo-100 text-indigo-700', icon: '🔧' },
    Esperando_Partes: { label: 'Esp. Partes', color: 'bg-amber-100 text-amber-700', icon: '📦' },
    Cliente_Ausente: { label: 'Cliente Ausente', color: 'bg-slate-100 text-slate-600', icon: '🚪' },
    Resuelto: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
    Cerrado: { label: 'Cerrado', color: 'bg-slate-100 text-slate-400', icon: '🔒' },
    Escalado: { label: 'Escalado L2', color: 'bg-purple-100 text-purple-700', icon: '⬆️' },
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

// ── TICKET ACTION MODAL ────────────────────────────────────────
function ActionModal({
    ticket, onClose, onUpdate
}: {
    ticket: FieldTicket;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<FieldTicket>) => void;
}) {
    const [mode, setMode] = useState<
        'menu' | 'complete' | 'parts' | 'absent' | 'escalate' | 'create_ticket' | 'arrived'
    >('menu');
    const [signature, setSignature] = useState('');
    const [diagnosis, setDiagnosis] = useState(ticket.diagnosis || '');
    const [partNote, setPartNote] = useState('');
    const [selectedPart, setSelectedPart] = useState('');
    const [absentNote, setAbsentNote] = useState('');
    const [escalateReason, setEscalateReason] = useState('');
    const [csat, setCsat] = useState(0);
    const [newTicket, setNewTicket] = useState({ subject: '', asset: '', notes: '' });

    const elapsed = useElapsedTimer(ticket.start_time);

    const doArrive = () => {
        onUpdate(ticket.id, { field_status: 'En_Sitio', start_time: Date.now() });
        toast.success('✅ Llegada registrada. Temporizador iniciado.');
        onClose();
    };

    const doComplete = () => {
        if (!signature.trim()) { toast.error('Firma del cliente requerida'); return; }
        onUpdate(ticket.id, { field_status: 'Cerrado', signature, diagnosis, notes: `CSAT: ${csat}/5` });
        toast.success(`✅ Ticket cerrado. Firma: ${signature}. CSAT ${csat}/5 ⭐`);
        onClose();
    };

    const doNeedPart = () => {
        const part = AVAILABLE_PARTS.find(p => p.id === selectedPart);
        onUpdate(ticket.id, {
            field_status: 'Esperando_Partes',
            parts_needed: part ? `${part.name} (${part.sku})` : partNote,
            notes: `Técnico requiere pieza para completar. ${partNote}`
        });
        toast.warning(`📦 Ticket marcado "Esperando Partes". ${part?.stock === 0 ? 'Sin stock — se solicitará.' : 'Pieza reservada.'}`);
        onClose();
    };

    const doAbsent = () => {
        onUpdate(ticket.id, {
            field_status: 'Cliente_Ausente',
            notes: `Cliente no disponible. ${absentNote}. Programar revisita.`
        });
        toast.info('🚪 Cliente ausente registrado. Supervisor notificado para reprogramar.');
        onClose();
    };

    const doEscalate = () => {
        if (!escalateReason.trim()) { toast.error('Describe el motivo de la escalada'); return; }
        onUpdate(ticket.id, {
            field_status: 'Escalado',
            notes: `Escalado L2: ${escalateReason}`
        });
        toast.info('⬆️ Ticket escalado al equipo L2. Supervisor notificado.');
        onClose();
    };

    const doCreateTicket = () => {
        if (!newTicket.subject || !newTicket.asset) { toast.error('Asunto y equipo son obligatorios'); return; }
        const num = `TKT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        toast.success(`✅ Ticket ${num} creado para ${ticket.client_name}`);
        onClose();
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
                    <p className="text-xs text-slate-400">{ticket.client_name} · {ticket.address}</p>
                </DialogHeader>

                {/* MENU */}
                {mode === 'menu' && (
                    <div className="space-y-2 py-2">
                        {ticket.field_status === 'En_Camino' && (
                            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 gap-3 text-base justify-start pl-5" onClick={doArrive}>
                                <MapPin className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-bold">Estoy en el Cliente</p>
                                    <p className="text-xs opacity-80">Registrar llegada e iniciar temporizador</p>
                                </div>
                            </Button>
                        )}
                        {(ticket.field_status === 'En_Sitio') && (
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
                                        <p className="text-xs opacity-80">Firma digital + calificación CSAT</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 border-amber-200 hover:bg-amber-50 text-amber-700" onClick={() => setMode('parts')}>
                                    <Package className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Necesito una Pieza</p>
                                        <p className="text-xs opacity-80">Marcar "Esperando Partes" — volveré con la pieza</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="w-full h-14 gap-3 text-base justify-start pl-5 border-purple-200 hover:bg-purple-50 text-purple-700" onClick={() => setMode('escalate')}>
                                    <ArrowUpCircle className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-bold">Escalar a Nivel 2</p>
                                        <p className="text-xs opacity-80">Requiere técnico especialista</p>
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
                                    <p className="text-xs opacity-80">Llegué al local pero no hay nadie</p>
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
                            <label className="text-sm font-semibold text-slate-700">Diagnóstico / Trabajo realizado</label>
                            <textarea
                                className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Describe el trabajo realizado..."
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Satisfacción del cliente (CSAT)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} onClick={() => setCsat(n)}
                                        className={cn('flex-1 h-10 rounded-lg border-2 text-base transition-all flex items-center justify-center',
                                            csat >= n ? 'border-amber-400 bg-amber-50' : 'border-slate-200')}>
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            {csat > 0 && <p className="text-xs text-center text-slate-500">{['', 'Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'][csat]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                ✍️ Firma del cliente (nombre completo)
                            </label>
                            <Input
                                placeholder="Escriba nombre completo..."
                                value={signature}
                                onChange={e => setSignature(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2 text-xs text-slate-500">
                            <Camera className="w-4 h-4 flex-shrink-0" />
                            <span>Foto de evidencia (toca para acceder a cámara)</span>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atrás</Button>
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={doComplete} disabled={!signature || csat === 0}>
                                ✅ Cerrar Ticket
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* NEED PARTS */}
                {mode === 'parts' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            El ticket quedará en <strong>"Esperando Partes"</strong>. El supervisor verá que necesitas regresar con la pieza.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Pieza del inventario</label>
                            <select
                                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                                value={selectedPart}
                                onChange={e => setSelectedPart(e.target.value)}
                            >
                                <option value="">— Seleccionar del catálogo —</option>
                                {AVAILABLE_PARTS.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.stock > 0 ? p.stock + ' un.' : '⚠️ Sin stock'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedPart === '' && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold">O describe la pieza</label>
                                <Input placeholder="Nombre / código de la pieza necesaria" value={partNote} onChange={e => setPartNote(e.target.value)} />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Nota para supervisor</label>
                            <textarea
                                className="w-full min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none"
                                placeholder="Información adicional para el despacho de la pieza..."
                                onChange={e => setPartNote(p => p + ' ' + e.target.value)}
                            />
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atrás</Button>
                            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={doNeedPart} disabled={!selectedPart && !partNote}>
                                📦 Confirmar
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* CUSTOMER ABSENT */}
                {mode === 'absent' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            El ticket quedará abierto y el supervisor programará una nueva visita. Se notificará al cliente.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">¿Qué pasó?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Local cerrado', 'No hubo respuesta', 'Cliente canceló', 'Dirección incorrecta'].map(opt => (
                                    <button key={opt} onClick={() => setAbsentNote(opt)}
                                        className={cn('rounded-lg border py-2.5 text-sm transition-all',
                                            absentNote === opt ? 'border-slate-600 bg-slate-100 font-semibold' : 'border-slate-200 text-slate-600')}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atrás</Button>
                            <Button className="flex-1" variant="secondary" onClick={doAbsent} disabled={!absentNote}>
                                🚪 Registrar Ausencia
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* ESCALATE */}
                {mode === 'escalate' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
                            Un técnico L2 o especialista recibirá este ticket. Documenta bien el problema.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Motivo de escalada</label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {[
                                    'Requiere técnico certificado en placa electrónica',
                                    'Falla en componente de alto voltaje',
                                    'Error de firmware / actualización requerida',
                                    'Problema de red / integración empresarial',
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
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atrás</Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={doEscalate} disabled={!escalateReason}>
                                ⬆️ Escalar
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* CREATE NEW TICKET ONSITE */}
                {mode === 'create_ticket' && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            📍 El ticket se creará para <strong>{ticket.client_name}</strong> y quedará asignado a ti para hoy.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Problema encontrado</label>
                            <Input placeholder="Ej: Tóner bajo en MFP B/N piso 3" value={newTicket.subject} onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))} />
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
                            <Button variant="outline" className="flex-1" onClick={() => setMode('menu')}>Atrás</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={doCreateTicket} disabled={!newTicket.subject || !newTicket.asset}>
                                ➕ Crear Ticket
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── JOB CARD ──────────────────────────────────────────────────
function JobCard({ ticket, onAction, isActive }: {
    ticket: FieldTicket;
    onAction: (t: FieldTicket) => void;
    isActive: boolean;
}) {
    const s = STATUS_INFO[ticket.field_status];
    const elapsed = useElapsedTimer(isActive && ticket.start_time ? ticket.start_time : undefined);
    const isDone = ['Cerrado', 'Escalado'].includes(ticket.field_status);

    return (
        <div className={cn(
            'rounded-2xl border p-4 space-y-3 transition-all',
            isActive ? 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/10 bg-white' :
                isDone ? 'border-slate-200 bg-slate-50 opacity-60' :
                    ticket.priority === 'Critical' ? 'border-red-200 bg-red-50/50' :
                        'border-slate-200 bg-white'
        )}>
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                        isActive ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-600')}>
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

            {/* Client & Location */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{ticket.address}</span>
            </div>

            {/* Equipment */}
            <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600">{ticket.asset_model}</span>
                {ticket.is_warranty && (
                    <Badge variant="outline" className="text-[10px] px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">🛡 Garantía</Badge>
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

            {/* ETA (en camino) */}
            {ticket.field_status === 'En_Camino' && ticket.eta && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                    <Navigation className="w-3.5 h-3.5" /> ETA: <strong>{ticket.eta}</strong>
                    <span className="mx-1">·</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    SLA: <strong className="text-red-600">{ticket.sla_deadline}</strong>
                </div>
            )}

            {/* Diagnosis / Notes */}
            {ticket.diagnosis && (
                <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 leading-relaxed">
                    🔍 {ticket.diagnosis}
                </div>
            )}
            {ticket.parts_needed && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                    📦 Pieza requerida: <strong>{ticket.parts_needed}</strong>
                </div>
            )}
            {ticket.notes && ticket.field_status === 'Cerrado' && ticket.signature && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800">
                    ✍️ Firmado por: <strong>{ticket.signature}</strong> · {ticket.notes}
                </div>
            )}

            {/* Action button */}
            {!isDone && (
                <Button
                    className={cn(
                        'w-full h-11 gap-2 rounded-xl font-semibold',
                        ticket.field_status === 'En_Camino' ? 'bg-indigo-600 hover:bg-indigo-700' :
                            ticket.field_status === 'Resuelto' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                ticket.field_status === 'En_Sitio' ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]' :
                                    'bg-slate-700 hover:bg-slate-800'
                    )}
                    onClick={() => onAction(ticket)}
                >
                    {ticket.field_status === 'En_Camino' ? <><MapPin className="w-4 h-4" />Llegué al cliente</> :
                        ticket.field_status === 'Resuelto' ? <><CheckSquare className="w-4 h-4" />Obtener Firma</> :
                            ticket.field_status === 'En_Sitio' ? <><FileText className="w-4 h-4" />Acciones del Sitio</> :
                                <><ChevronRight className="w-4 h-4" />Ver opciones</>}
                </Button>
            )}
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function TechMobileView() {
    const [selectedTechId, setSelectedTechId] = useState('t1');
    const [tickets, setTickets] = useState<Map<string, FieldTicket[]>>(
        new Map(DEMO_TECHS.map(t => [t.id, [...t.today_tickets]]))
    );
    const [actionTicket, setActionTicket] = useState<FieldTicket | null>(null);

    const tech = DEMO_TECHS.find(t => t.id === selectedTechId)!;
    const myTickets = tickets.get(selectedTechId) || [];
    const activeTicket = myTickets.find(t => t.field_status === 'En_Sitio');
    const pending = myTickets.filter(t => !['Cerrado', 'Escalado'].includes(t.field_status));
    const done = myTickets.filter(t => ['Cerrado', 'Escalado', 'Cliente_Ausente'].includes(t.field_status));

    const updateTicket = (id: string, updates: Partial<FieldTicket>) => {
        setTickets(prev => {
            const copy = new Map(prev);
            const list = (copy.get(selectedTechId) || []).map(t =>
                t.id === id ? { ...t, ...updates } : t
            );
            copy.set(selectedTechId, list);
            return copy;
        });
    };

    const closedCount = done.length;
    const slaRisk = myTickets.filter(t => {
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
                        <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                        Vista de Campo — Técnico
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Interfaz optimizada para móvil · Todos los escenarios de campo</p>
                </div>

                {/* Tech selector */}
                <select
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white font-medium text-slate-700"
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                >
                    {DEMO_TECHS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* Phone mockup frame */}
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
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">
                                            {tech.avatar}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{tech.name}</p>
                                            <p className="text-[10px] text-slate-400">ANTU FSM · Hoy</p>
                                        </div>
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
                                        <p className="font-bold text-slate-800">{closedCount}/{myTickets.length}</p>
                                        <p className="text-slate-400">cerrados</p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="bg-white px-5 pb-3">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                        style={{ width: `${(closedCount / myTickets.length) * 100}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>{closedCount} completados</span>
                                    <span>{pending.length} pendientes</span>
                                </div>
                            </div>

                            {/* Current job highlight */}
                            <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ height: '580px' }}>
                                {activeTicket && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">🔧 Trabajo Activo</p>
                                        <JobCard ticket={activeTicket} onAction={setActionTicket} isActive />
                                    </div>
                                )}

                                {pending.filter(t => t.id !== activeTicket?.id).length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📋 Cola del Día</p>
                                        {pending.filter(t => t.id !== activeTicket?.id).map(t => (
                                            <div key={t.id} className="mb-3">
                                                <JobCard ticket={t} onAction={setActionTicket} isActive={false} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {done.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">✅ Completados</p>
                                        {done.map(t => (
                                            <div key={t.id} className="mb-3">
                                                <JobCard ticket={t} onAction={() => { }} isActive={false} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side panel: scenario legend */}
                <div className="flex-1 space-y-4">
                    <Card className="border-slate-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Escenarios cubiertos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { icon: '🚗', status: 'En Camino', desc: 'Técnico en tránsito — puede registrar llegada o cliente ausente', color: 'bg-blue-50 border-blue-200' },
                                { icon: '🔧', status: 'Trabajando', desc: 'Temporizador activo — acciones: completar, pieza, escalar, crear ticket adicional', color: 'bg-indigo-50 border-indigo-200' },
                                { icon: '✅', status: 'Completado', desc: 'Debe obtener firma digital del cliente + calificación CSAT (1-5 ⭐)', color: 'bg-emerald-50 border-emerald-200' },
                                { icon: '📦', status: 'Esperando Pieza', desc: 'Técnico identificó pieza faltante — ticket queda abierto para revisita', color: 'bg-amber-50 border-amber-200' },
                                { icon: '🚪', status: 'Cliente Ausente', desc: 'Nadie en el local — supervisor reprograma sin costo para el técnico', color: 'bg-slate-50 border-slate-200' },
                                { icon: '⬆️', status: 'Escalado L2', desc: 'Requiere especialista — ticket transferido con diagnóstico completo', color: 'bg-purple-50 border-purple-200' },
                                { icon: '➕', status: 'Nuevo Ticket Campo', desc: 'Técnico descubre otro equipo con problema — crea ticket in-situ', color: 'bg-teal-50 border-teal-200' },
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
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Estadísticas de hoy</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-2xl font-bold text-emerald-700">{closedCount}</p>
                                    <p className="text-xs text-emerald-600">Cerrados</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                    <p className="text-2xl font-bold text-blue-700">{pending.length}</p>
                                    <p className="text-xs text-blue-600">Pendientes</p>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-xl">
                                    <p className="text-2xl font-bold text-amber-700">
                                        {myTickets.filter(t => t.field_status === 'Esperando_Partes').length}
                                    </p>
                                    <p className="text-xs text-amber-600">Esp. Partes</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-xl">
                                    <p className="text-2xl font-bold text-red-700">{slaRisk}</p>
                                    <p className="text-xs text-red-600">Riesgo SLA</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action modal */}
            {actionTicket && (
                <ActionModal
                    ticket={actionTicket}
                    onClose={() => setActionTicket(null)}
                    onUpdate={updateTicket}
                />
            )}
        </div>
    );
}
