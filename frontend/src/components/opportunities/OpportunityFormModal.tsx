import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Briefcase,
    Building2,
    Calendar,
    User,
    Target
} from 'lucide-react';
import { SearchAutocomplete } from '@/components/ui/search-autocomplete';

interface OpportunityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (opportunity: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers?: any[];
}

export function OpportunityFormModal({ isOpen, onClose, onSave, initialData, customers }: OpportunityFormModalProps) {
    const { user } = useAuth();
    const defaultAssignee = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Vendedor Actual' : 'Vendedor Actual';

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        value: '',
        expectedCloseDate: '',
        competidor: '',
        marcaEquipos: '',
        description: '',
        assignedTo: defaultAssignee,
        pipelineStage: 'Calificar',
        customerId: '',
        govId: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    company: initialData.company || '',
                    value: initialData.value ? String(initialData.value) : '',
                    expectedCloseDate: initialData.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    competidor: initialData.competidor || '',
                    marcaEquipos: initialData.marcaEquipos || '',
                    description: initialData.description || '',
                    assignedTo: initialData.assignedTo || 'Vendedor Actual',
                    pipelineStage: initialData.pipelineStage || 'Calificar',
                    customerId: initialData.customerId || '',
                    govId: initialData.govId || ''
                });
            } else {
                setFormData({
                    name: '',
                    company: '',
                    value: '',
                    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    competidor: '',
                    marcaEquipos: '',
                    description: '',
                    assignedTo: defaultAssignee,
                    pipelineStage: 'Calificar',
                    customerId: '',
                    govId: ''
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData, defaultAssignee]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name?.trim() || !formData.company?.trim() || !formData.value) {
            toast.error('Completa los campos obligatorios');
            return;
        }

        if (initialData) {
            // Update existing
            const updatedOpp = {
                ...initialData,
                name: formData.name,
                company: formData.company,
                value: Number(formData.value) || 0,
                pipelineStage: formData.pipelineStage,
                expectedCloseDate: formData.expectedCloseDate,
                assignedTo: formData.assignedTo,
                description: formData.description,
                competidor: formData.competidor,
                marcaEquipos: formData.marcaEquipos,
                govId: formData.govId,
            };
            onSave(updatedOpp);
            toast.success('Oportunidad actualizada exitosamente');
        } else {
            // Create new
            const newOpp = {
                id: `opp-${Date.now()}`,
                name: formData.name,
                company: formData.company,
                customerId: formData.customerId || `CLI-${Math.floor(Math.random() * 1000)}`,
                value: Number(formData.value) || 0,
                probability: 10,
                stage: 'new',
                pipelineStage: formData.pipelineStage,
                expectedCloseDate: formData.expectedCloseDate,
                assignedTo: formData.assignedTo,
                lastActivity: 'Recién creado',
                aiScore: Math.floor(Math.random() * 30) + 40,
                description: formData.description,
                competidor: formData.competidor,
                marcaEquipos: formData.marcaEquipos,
                govId: formData.govId,
                fechaCreacion: new Date().toISOString().split('T')[0]
            };
            onSave(newOpp);
            toast.success('Oportunidad creada exitosamente');
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl block text-left">
                {/* 1. Header with friction-less clean look */}
                <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                            <Briefcase className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Gestión de Pipeline</p>
                            <DialogTitle className="font-bold text-slate-800 text-lg m-0">
                                {initialData ? 'Editar Oportunidad' : 'Crear Nueva Oportunidad'}
                            </DialogTitle>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Core Data Block */}
                        <div className="space-y-5">
                            <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                                Información Principal
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Title */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        Título del Negocio <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Renovación de Flota 2026"
                                        className="h-11 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg"
                                        required
                                    />
                                </div>

                                {/* Customer Selection */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        Cliente Asociado <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <SearchAutocomplete
                                            options={customers ? customers.map(c => ({
                                                value: c.id,
                                                label: c.name,
                                                description: c.rnc || c.legalName,
                                                icon: <Building2 className="w-4 h-4 text-slate-400" />
                                            })) : []}
                                            value={formData.customerId || undefined}
                                            onChange={(val) => {
                                                const cust = customers?.find(c => c.id === val);
                                                setFormData({
                                                    ...formData,
                                                    customerId: val,
                                                    company: cust?.name || formData.company
                                                });
                                            }}
                                            placeholder="Buscar cliente..."
                                            triggerClassName="h-11 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Value */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        Valor Estimado <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">RD$</div>
                                        <Input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            placeholder="0.00"
                                            className="h-11 pl-12 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Closing Date */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        Fecha de Cierre
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="date"
                                            value={formData.expectedCloseDate}
                                            onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                                            className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Assignee (auto filled) */}
                                <div className="space-y-1.5 md:col-span-2 hidden">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        Responsable
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                            className="h-11 pl-10"
                                            readOnly
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* Governmental Process Line (MVP) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                                        ID de Proceso Gubernamental (Opcional)
                                    </Label>
                                    <div className="flex gap-2 relative">
                                        <Input
                                            value={formData.govId}
                                            onChange={(e) => setFormData({ ...formData, govId: e.target.value })}
                                            placeholder="Ej. MSP-CCC-LPN-2026-0001"
                                            className="h-11 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">Si se especifica, podrá sincronizar requisitos mágicamente usando IA desde el detalle.</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Strategy Block */}
                        <div className="space-y-5 bg-slate-50/50 -mx-6 px-6 py-6 pb-2 border-y border-slate-50">
                            <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                                <Target className="w-5 h-5 text-teal-400" />
                                Estrategia Comercial
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Competitor */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Competidor Principal</Label>
                                    <Select
                                        value={formData.competidor}
                                        onValueChange={(value) => setFormData({ ...formData, competidor: value })}
                                    >
                                        <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg">
                                            <SelectValue placeholder="Seleccionar competidor..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                            <SelectItem value="Ricoh Dom">Ricoh Dom</SelectItem>
                                            <SelectItem value="DUSA">DUSA</SelectItem>
                                            <SelectItem value="Distosa">Distosa</SelectItem>
                                            <SelectItem value="CSI">CSI</SelectItem>
                                            <SelectItem value="PBS">PBS</SelectItem>
                                            <SelectItem value="Kyodom">Kyodom</SelectItem>
                                            <SelectItem value="Toner depot">Toner depot</SelectItem>
                                            <SelectItem value="All Office">All Office</SelectItem>
                                            <SelectItem value="Compu Office">Compu Office</SelectItem>
                                            <SelectItem value="SDOC">SDOC</SelectItem>
                                            <SelectItem value="Otros">Otros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Brands */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Marca Actual</Label>
                                    <Select
                                        value={formData.marcaEquipos}
                                        onValueChange={(value) => setFormData({ ...formData, marcaEquipos: value })}
                                    >
                                        <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-lg">
                                            <SelectValue placeholder="Seleccionar marca..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                            <SelectItem value="Ricoh">Ricoh</SelectItem>
                                            <SelectItem value="HP">HP</SelectItem>
                                            <SelectItem value="Toshiba">Toshiba</SelectItem>
                                            <SelectItem value="Xerox">Xerox</SelectItem>
                                            <SelectItem value="Kyocera">Kyocera</SelectItem>
                                            <SelectItem value="Canon">Canon</SelectItem>
                                            <SelectItem value="Lexmark">Lexmark</SelectItem>
                                            <SelectItem value="Otros">Otros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Contexto de la negociación</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Necesidades puntuales del cliente, objeciones esperadas, ventajas nuestras..."
                                        className="min-h-[100px] resize-none bg-white border-slate-200 focus-visible:ring-teal-400 shadow-sm rounded-xl text-sm leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* 4. Dual-Action CTA Footer */}
                <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose} className="font-semibold text-slate-500 hover:text-slate-700 h-11 px-6">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="opportunity-form"
                        className="bg-teal-400 hover:bg-teal-500 text-white font-bold px-8 shadow-lg shadow-teal-400/30 transition-all flex items-center gap-2 h-11 rounded-lg"
                    >
                        {initialData ? 'Actualizar Oportunidad' : 'Crear Oportunidad'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
