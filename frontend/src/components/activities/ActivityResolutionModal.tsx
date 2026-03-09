import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import {
    Phone,
    Mail,
    Users,
    MessageCircle,
    CalendarDays,
    CheckCircle2,
    PhoneCall,
    PhoneMissed,
    Voicemail,
    ThumbsUp,
    X,
} from 'lucide-react';
import type { Activity, ActivityType } from '@/types/activity';

// ============================================
// PROPS
// ============================================

interface ActivityResolutionModalProps {
    activity: Activity | null;
    isOpen: boolean;
    onClose: () => void;
    onResolve: (activityId: string, resolution: { notes: string; quickResult: string | null }, nextStep: Partial<Activity>) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ActivityResolutionModal({
    activity,
    isOpen,
    onClose,
    onResolve,
}: ActivityResolutionModalProps) {
    const [notes, setNotes] = useState('');
    const [quickResult, setQuickResult] = useState<string | null>(null);

    // Next step state
    const [nextStepType, setNextStepType] = useState<ActivityType>('CALL');
    const [nextStepDate, setNextStepDate] = useState<'tomorrow' | '3days' | 'nextWeek' | 'custom'>('tomorrow');
    const [nextStepCustomDate, setNextStepCustomDate] = useState('');
    const [nextStepSubject, setNextStepSubject] = useState('');
    // Wait, these states are better isolated or just set when opened...
    // Since we don't really want to break the rules, let's keep it simple:
    // ActivityResolutionModal should reset its state explicitly.
    // Actually, if we just want to suppress the exhaustive-deps, we can use a ref or an object.
    // But standard way is to include `activity` and ignore the internal state rules or fix the rule.
    // We'll use a `useEffect` properly and disable the rule for this specific block as it's a known pattern for modal resets.

    useEffect(() => {
        if (isOpen && activity) {
            setNotes('');
            setQuickResult(null);
            setNextStepType(activity.type === 'CALL' ? 'CALL' : 'TASK');
            setNextStepDate('tomorrow');
            setNextStepCustomDate('');
            setNextStepSubject(`Seguimiento: ${activity.title}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activity?.id]); // Only run when modal opens or activity changes

    if (!activity) return null;

    const handleSubmit = () => {
        // Validate
        if (!nextStepSubject.trim()) {
            // Basic validation, could add toast
            return;
        }

        // Calculate actual date for next step
        let calculatedDate = new Date();
        if (nextStepDate === 'tomorrow') {
            calculatedDate.setDate(calculatedDate.getDate() + 1);
        } else if (nextStepDate === '3days') {
            calculatedDate.setDate(calculatedDate.getDate() + 3);
        } else if (nextStepDate === 'nextWeek') {
            calculatedDate.setDate(calculatedDate.getDate() + 7);
        } else if (nextStepDate === 'custom' && nextStepCustomDate) {
            calculatedDate = new Date(nextStepCustomDate);
        }

        onResolve(
            activity.id,
            {
                notes: notes + (quickResult ? ` [Resultado rápido: ${quickResult}]` : ''),
                quickResult
            },
            {
                type: nextStepType,
                title: nextStepSubject,
                dueDate: calculatedDate,
                dueTime: '09:00', // Default time
                customerId: activity.customerId,
                customerName: activity.customerName,
                opportunityId: activity.opportunityId,
                opportunityName: activity.opportunityName,
                priority: activity.priority,
            }
        );
        onClose();
    };

    const getActivityIconWrapper = () => {
        switch (activity.type) {
            case 'CALL': return <Phone className="w-4 h-4 text-blue-600" />;
            case 'EMAIL': return <Mail className="w-4 h-4 text-emerald-600" />;
            case 'MEETING': return <Users className="w-4 h-4 text-violet-600" />;
            case 'WHATSAPP': return <MessageCircle className="w-4 h-4 text-green-600" />;
            default: return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">

                {/* 1. Cabecera de Contexto (Solo Lectura) */}
                <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                            {getActivityIconWrapper()}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Ejecutando Acción</p>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {activity.title}
                                {activity.customerName && (
                                    <span className="text-sm font-normal text-slate-500 border-l border-slate-300 pl-2 ml-1">
                                        {activity.customerName}
                                    </span>
                                )}
                            </h3>
                        </div>
                    </div>

                    {/* Accesos Rápidos */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
                            <span className="sr-only">Contactar</span>
                            <PhoneCall className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-6 pb-24 border-b border-slate-200 max-h-[60vh] overflow-y-auto">
                    {/* 2. Bloque de Resolución */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">
                            ¿Qué sucedió en esta interacción?
                        </label>
                        <Textarea
                            placeholder="Escribe las notas, acuerdos o resumen clave de la reunión/llamada..."
                            className="resize-none h-24 bg-white border-slate-200 focus-visible:ring-emerald-500 text-sm placeholder:text-slate-400 rounded-xl"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />

                        {/* Pills Rápidas */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                onClick={() => setQuickResult(quickResult === 'Contestó' ? null : 'Contestó')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                                    quickResult === 'Contestó' ? "bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                <ThumbsUp className="w-3.5 h-3.5" /> Contestó adecuadamente
                            </button>
                            <button
                                onClick={() => setQuickResult(quickResult === 'Buzón de Voz' ? null : 'Buzón de Voz')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                                    quickResult === 'Buzón de Voz' ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                <Voicemail className="w-3.5 h-3.5" /> Dejó mensaje en buzón
                            </button>
                            <button
                                onClick={() => setQuickResult(quickResult === 'No Contestó' ? null : 'No Contestó')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                                    quickResult === 'No Contestó' ? "bg-rose-100 text-rose-700 border border-rose-300 shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                <PhoneMissed className="w-3.5 h-3.5" /> No contestó (Sin buzón)
                            </button>
                        </div>
                    </div>

                    <div className="my-8 h-px bg-slate-100 w-full" />

                    {/* 3. El Motor de Seguimiento (The "Next Step" Engine) */}
                    <div className="space-y-5 bg-indigo-50/30 -mx-6 px-6 py-6 pb-2 border-y border-indigo-50">
                        <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-indigo-600" />
                            Programar Siguiente Acción <span className="text-xs font-normal text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 ml-2 uppercase tracking-wide">Obligatorio</span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Type Select */}
                            <div className="md:col-span-3 flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm h-10">
                                <button
                                    type="button"
                                    onClick={() => setNextStepType('CALL')}
                                    className={cn("flex-1 rounded flex items-center justify-center transition-colors", nextStepType === 'CALL' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                                    title="Llamada"
                                >
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNextStepType('MEETING')}
                                    className={cn("flex-1 rounded flex items-center justify-center transition-colors", nextStepType === 'MEETING' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                                    title="Reunión"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNextStepType('EMAIL')}
                                    className={cn("flex-1 rounded flex items-center justify-center transition-colors", nextStepType === 'EMAIL' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                                    title="Correo electrónico"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNextStepType('WHATSAPP')}
                                    className={cn("flex-1 rounded flex items-center justify-center transition-colors", nextStepType === 'WHATSAPP' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                                    title="WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Date Select */}
                            <div className="md:col-span-9 flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm h-10">
                                <button
                                    onClick={() => setNextStepDate('tomorrow')}
                                    className={cn("flex-1 text-xs font-semibold whitespace-nowrap px-2 transition-colors border-r border-slate-100", nextStepDate === 'tomorrow' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
                                >
                                    Mañana
                                </button>
                                <button
                                    onClick={() => setNextStepDate('3days')}
                                    className={cn("flex-1 text-xs font-semibold whitespace-nowrap px-2 transition-colors border-r border-slate-100", nextStepDate === '3days' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
                                >
                                    En 3 días
                                </button>
                                <button
                                    onClick={() => setNextStepDate('nextWeek')}
                                    className={cn("flex-1 text-xs font-semibold whitespace-nowrap px-2 transition-colors border-r border-slate-100", nextStepDate === 'nextWeek' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
                                >
                                    Próxima sem.
                                </button>
                                <div className={cn("flex items-center px-1", nextStepDate === 'custom' ? "bg-indigo-50" : "bg-white")}>
                                    <input
                                        type="date"
                                        className="w-[125px] h-full text-xs font-medium outline-none bg-transparent text-slate-700 px-1 cursor-pointer"
                                        value={nextStepCustomDate}
                                        onChange={(e) => {
                                            setNextStepCustomDate(e.target.value);
                                            setNextStepDate('custom');
                                        }}
                                        onClick={() => setNextStepDate('custom')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subject */}
                        <Input
                            placeholder="Asunto del siguiente paso (Ej. Llamada de cierre de condiciones)"
                            className="h-10 bg-white border-slate-200 font-medium text-slate-800 focus-visible:ring-indigo-500 shadow-sm rounded-lg"
                            value={nextStepSubject}
                            onChange={(e) => setNextStepSubject(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. Botón de Doble Acción (Dual-Action CTA) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] flex justify-end gap-3 z-10">
                    <Button variant="ghost" onClick={onClose} className="font-semibold text-slate-500 hover:text-slate-700">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!nextStepSubject.trim()}
                        className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold px-8 shadow-lg shadow-[rgba(94,217,207,0.3)] transition-all flex items-center gap-2 h-11"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Completar y Programar Siguiente
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}

export default ActivityResolutionModal;
