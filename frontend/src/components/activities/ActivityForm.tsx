// ============================================
// ANTU CRM - Activity Form
// Formulario para crear/editar actividades
// ============================================

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Phone,
  Mail,
  Users,
  CheckSquare,
  Bell,
  MapPin,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Briefcase,
  Flag,
} from 'lucide-react';
import type { Activity, ActivityType, ActivityPriority } from '@/types/activity';
import { ACTIVITY_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/activity';

// ============================================
// PROPS
// ============================================

interface ActivityFormProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ActivityForm({ activity, isOpen, onClose, onSave }: ActivityFormProps) {
  const isEditing = !!activity;

  // Listas para autocompletar
  const [customersList, setCustomersList] = useState<{ id: string, name: string }[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let clients: any[] = [];
        const storedCustomers = localStorage.getItem('antu_customers');
        if (storedCustomers) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clients = [...clients, ...JSON.parse(storedCustomers).map((c: any) => ({
            id: c.id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()
          }))];
        }

        const storedContacts = localStorage.getItem('antu_contacts');
        if (storedContacts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clients = [...clients, ...JSON.parse(storedContacts).map((c: any) => ({
            id: c.id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()
          }))];
        }

        // Remove empty or duplicate names simply
        const validClients = clients.filter(c => !!c.name);
        setCustomersList(validClients);

        const storedOpps = localStorage.getItem('antu_opportunities');
        if (storedOpps) {
          const parsed = JSON.parse(storedOpps);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setOpportunitiesList(parsed.map((o: any) => ({ id: o.id, name: o.title || o.name })));
        }
      } catch (e) {
        console.error('Error loading autocomplete data', e);
      }
    }
  }, [isOpen]);

  const [formData, setFormData] = useState<Partial<Activity>>({
    title: '',
    description: '',
    type: 'TASK',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: new Date(),
    dueTime: '09:00',
    reminderMinutes: 15,
    customerId: '',
    customerName: '',
    opportunityId: '',
    opportunityName: '',
  });

  // Load activity data when editing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        description: activity.description || '',
        type: activity.type,
        status: activity.status || 'PENDING',
        priority: activity.priority,
        dueDate: new Date(activity.dueDate),
        dueTime: activity.dueTime,
        reminderMinutes: activity.reminderMinutes,
        customerId: activity.customerId || '',
        customerName: activity.customerName || '',
        opportunityId: activity.opportunityId || '',
        opportunityName: activity.opportunityName || '',
      });
    } else {
      // Reset form for new activity
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        type: 'TASK',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: now,
        dueTime: `${String(now.getHours()).padStart(2, '0')}:00`,
        reminderMinutes: 15,
        customerId: '',
        customerName: '',
        opportunityId: '',
        opportunityName: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const activityTypes: ActivityType[] = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'REMINDER', 'VISIT', 'WHATSAPP'];
  const priorities: ActivityPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

  const getActivityIcon = (type: ActivityType) => {
    const config = ACTIVITY_TYPE_CONFIG[type];
    const iconMap: Record<string, React.ElementType> = {
      Phone,
      Mail,
      Users,
      CheckSquare,
      Bell,
      MapPin,
      MessageCircle,
    };
    const Icon = iconMap[config?.icon || 'CheckSquare'];
    return <Icon className="w-4 h-4" style={{ color: config?.color }} />;
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        {/* Header con Friction-less UX */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Gestión de Tareas</p>
              <DialogTitle className="font-bold text-slate-800 text-lg m-0">
                {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
              </DialogTitle>
            </div>
          </div>
        </div>

        <div className="p-6 pb-24 border-b border-slate-200 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-8">

            {/* Detalles Principales */}
            <div className="space-y-4">
              <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                Información Principal
              </label>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-500 uppercase">
                  Título de la tarea <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Llamar a cliente para seguimiento..."
                    className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-semibold text-slate-500 uppercase">
                    Tipo de Actividad <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as ActivityType })}
                  >
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg">
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                      {activityTypes.map((type) => (
                        <SelectItem key={type} value={type} className="cursor-pointer font-medium">
                          <span className="flex items-center gap-2">
                            {getActivityIcon(type)}
                            {ACTIVITY_TYPE_CONFIG[type]?.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-xs font-semibold text-slate-500 uppercase">
                    Prioridad <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as ActivityPriority })}
                  >
                    <SelectTrigger className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg">
                      <SelectValue placeholder="Seleccionar prioridad..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="cursor-pointer font-medium">
                          <span
                            className="flex items-center gap-2"
                            style={{ color: PRIORITY_CONFIG[priority].color }}
                          >
                            <Flag className="w-4 h-4" />
                            {PRIORITY_CONFIG[priority].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Fecha, Hora, y Recordatorios */}
            <div className="space-y-4">
              <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                Agendamiento
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-xs font-semibold text-slate-500 uppercase">
                    Fecha <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate ? formatDateForInput(formData.dueDate) : ''}
                      onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                      className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dueTime" className="text-xs font-semibold text-slate-500 uppercase">
                    Hora <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="dueTime"
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                      className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reminder" className="text-xs font-semibold text-slate-500 uppercase">
                    Recordatorio
                  </Label>
                  <div className="relative">
                    <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                    <Select
                      value={formData.reminderMinutes?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, reminderMinutes: parseInt(value) })}
                    >
                      <SelectTrigger className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg">
                        <SelectValue placeholder="Configurar..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-slate-100">
                        <SelectItem value="0" className="cursor-pointer">Sin recordatorio</SelectItem>
                        <SelectItem value="5" className="cursor-pointer">5 minutos antes</SelectItem>
                        <SelectItem value="10" className="cursor-pointer">10 minutos antes</SelectItem>
                        <SelectItem value="15" className="cursor-pointer">15 minutos antes</SelectItem>
                        <SelectItem value="30" className="cursor-pointer">30 minutos antes</SelectItem>
                        <SelectItem value="60" className="cursor-pointer">1 hora antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Vínculos (Cliente/Opor) y Desc */}
            <div className="space-y-4 bg-slate-50/50 -mx-6 px-6 py-6 pb-2 border-y border-slate-50">
              <label className="block text-[15px] font-bold text-slate-800 flex items-center gap-2">
                Contexto Adicional
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="customer" className="text-xs font-semibold text-slate-500 uppercase">
                    Cliente a vincular
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="customer"
                      list="customers-autocomplete"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Buscar o escribir cliente..."
                      className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg"
                    />
                    <datalist id="customers-autocomplete">
                      {customersList.map((c, i) => (
                        <option key={`cust-${c.id}-${i}`} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="opportunity" className="text-xs font-semibold text-slate-500 uppercase">
                    Oportunidad de negocio
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="opportunity"
                      list="opportunities-autocomplete"
                      value={formData.opportunityName}
                      onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                      placeholder="Buscar o escribir oportunidad..."
                      className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-lg"
                    />
                    <datalist id="opportunities-autocomplete">
                      {opportunitiesList.map((o, i) => (
                        <option key={`opp-${o.id}-${i}`} value={o.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description" className="text-xs font-semibold text-slate-500 uppercase">
                    Notas o Detalles
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Agenda de la reunión, objetivo de la llamada, preparativos..."
                    className="min-h-[100px] bg-white border-slate-200 focus-visible:ring-indigo-500 shadow-sm rounded-xl resize-none text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] flex justify-end gap-3 z-10">
          <Button type="button" variant="ghost" onClick={onClose} className="font-semibold text-slate-500 hover:text-slate-700">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="activity-form"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 h-11 rounded-lg"
          >
            {isEditing ? 'Actualizar Actividad' : 'Guardar Actividad'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ActivityForm;
