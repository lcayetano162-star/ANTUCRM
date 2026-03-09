// ============================================
// ANTU CRM - Activities Module
// Sistema de Actividades con Notificaciones en Tiempo Real
// ============================================

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Calendar,
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useActivities } from '@/hooks/useActivities';
import {
  ActivityAlertPopup,
  ActivityKanbanView,
  ActivityListView,
  ActivityCalendarView,
  ActivityForm,
  ActivityResolutionModal,
} from '@/components/activities';
import type { Activity, SnoozeOption } from '@/types/activity';

// ============================================
// STATS CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: React.ElementType;
  shadow: string;
  border: string;
  isSelected?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, color, icon: Icon, shadow, border, isSelected, onClick }: StatCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 border hover:-translate-y-1 bg-white",
        shadow,
        isSelected ? `ring-2 ring-offset-2 ring-opacity-50 ring-current border-transparent ${border}` : border
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className={cn(
            "text-[15px] font-semibold tracking-tight",
            title === 'Atrasadas' ? "text-rose-600" : "text-[#1F2937]"
          )}>
            {value}
          </p>
          <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide mt-1">{title}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', color)}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivitiesPage() {
  const location = useLocation();
  const {
    activities,
    stats,
    loading,
    addActivity,
    updateActivity,
    completeActivity,
    snoozeActivity,
    ignoreActivity,
    startActivity,
  } = useActivities();

  // State
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'MEETING' | 'EMAIL' | 'CALL' | 'WHATSAPP'>('all');

  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [activityToSnooze, setActivityToSnooze] = useState<string | null>(null);
  const [snoozeOption, setSnoozeOption] = useState<SnoozeOption>('15_MIN');

  // Alert popup state
  const [alertActivity, setAlertActivity] = useState<Activity | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());

  // Check for activities needing alerts (15 min before due)
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();

      activities.forEach((activity) => {
        // Skip if already alerted
        if (alertedIds.has(activity.id)) return;

        // Skip completed, ignored, or postponed activities
        if (
          activity.status === 'COMPLETED' ||
          activity.status === 'IGNORED' ||
          (activity.status === 'POSTPONED' && activity.postponedUntil && activity.postponedUntil > now)
        ) {
          return;
        }

        // Calculate alert time (15 min before due)
        const dueDateTime = new Date(activity.dueDate);
        const [hours, minutes] = activity.dueTime.split(':').map(Number);
        dueDateTime.setHours(hours, minutes, 0, 0);

        const alertTime = new Date(dueDateTime.getTime() - activity.reminderMinutes * 60 * 1000);

        // Show alert if we're in the alert window
        if (now >= alertTime && now < dueDateTime) {
          setAlertActivity(activity);
          setAlertOpen(true);
          setAlertedIds((prev) => new Set(prev).add(activity.id));
        }
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activities, alertedIds]);

  // Handle filter from URL state
  useEffect(() => {
    const state = location.state as { filter?: string; activityId?: string };
    if (state?.filter === 'overdue') {
      // Could set a filter here
    }
    if (state?.activityId) {
      const activity = activities.find((a) => a.id === state.activityId);
      if (activity) {
        setSelectedActivity(activity);
        setIsFormOpen(true);
      }
    }
  }, [location.state, activities]);

  // Handlers
  const filteredActivities = activities.filter((activity) => {
    // Channel filter
    if (channelFilter !== 'all' && activity.type !== channelFilter) {
      return false;
    }

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (activity.title && activity.title.toLowerCase().includes(query)) ||
      (activity.description && activity.description.toLowerCase().includes(query)) ||
      (activity.customerName && activity.customerName.toLowerCase().includes(query))
    );
  });
  const handleCreateActivity = () => {
    setSelectedActivity(null);
    setIsFormOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsFormOpen(true);
  };

  const handleSaveActivity = (data: Partial<Activity>) => {
    if (selectedActivity) {
      updateActivity(selectedActivity.id, data);
      toast.success('Actividad actualizada');
    } else {
      addActivity(data as Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('Actividad creada');
    }
    setIsFormOpen(false);
  };

  const handleCompleteRequest = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setIsResolutionModalOpen(true);
    } else { // Fallback if not found locally for some reason
      completeActivity(activityId);
      toast.success('Actividad resuelta');
    }
  };

  const handleResolveActivity = (activityId: string, resolution: any, nextStep: any) => {
    // 1. Log notes to opportunity/customer history (simulated here by adding to description or similar)
    // 2. Complete current
    updateActivity(activityId, {
      status: 'COMPLETED',
      description: resolution.notes ? `${selectedActivity?.description || ''}\n\n[Resolución: ${resolution.notes}]` : selectedActivity?.description
    });

    // 3. Create next step
    addActivity(nextStep);

    toast.success('¡Actividad completada y seguimiento programado!', {
      icon: '✅',
      style: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }
    });

    setIsResolutionModalOpen(false);
    setSelectedActivity(null);
  };

  const handleSnoozeClick = (activityId: string) => {
    setActivityToSnooze(activityId);
    setSnoozeDialogOpen(true);
  };

  const handleConfirmSnooze = () => {
    if (activityToSnooze) {
      snoozeActivity(activityToSnooze, snoozeOption);
      setSnoozeDialogOpen(false);
      setActivityToSnooze(null);
    }
  };

  const handleAlertDoNow = (activityId: string) => {
    startActivity(activityId);
    setAlertOpen(false);
    setAlertActivity(null);
  };

  const handleAlertSnooze = (activityId: string, option: SnoozeOption) => {
    snoozeActivity(activityId, option);
    setAlertOpen(false);
    setAlertActivity(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(94,217,207)] to-[rgb(75,201,191)] flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">ACTIVIDADES</h1>
                <p className="text-xs text-slate-500">
                  Gestión de tareas y seguimiento comercial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateActivity}
                className="gap-2 bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-semibold shadow-lg shadow-[rgba(94,217,207,0.2)]"
              >
                <Plus className="w-4 h-4" />
                Nueva Actividad
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Stats - Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Actividades"
              value={stats.total}
              icon={TrendingUp}
              color="bg-sky-50 text-sky-700"
              shadow="hover:shadow-[0_10px_20px_-5px_rgba(2,132,199,0.15)]"
              border="border-sky-200"
            />
            <StatCard
              title="Para Hoy"
              value={stats.today}
              icon={Calendar}
              color="bg-purple-50 text-purple-700"
              shadow="hover:shadow-[0_10px_20px_-5px_rgba(147,51,234,0.15)]"
              border="border-purple-200"
            />
            <StatCard
              title="Atrasadas"
              value={stats.overdue}
              icon={AlertCircle}
              color="bg-rose-50 text-rose-700"
              shadow="hover:shadow-[0_10px_20px_-5px_rgba(225,29,72,0.15)]"
              border="border-rose-200"
            />
            <StatCard
              title="Completadas esta semana"
              value={stats.completed}
              icon={CheckCircle2}
              color="bg-emerald-50 text-emerald-700"
              shadow="hover:shadow-[0_10px_20px_-5px_rgba(5,150,105,0.15)]"
              border="border-emerald-200"
            />
          </div>

          {/* Activity Channel Filter Bar */}
          <div className="bg-[#F8FAFC] rounded-[20px] shadow-sm border border-slate-200/60 p-2 overflow-x-auto">
            <div className="flex items-stretch min-w-[750px] h-[52px]">
              <button
                onClick={() => setChannelFilter('all')}
                className={cn(
                  "px-8 text-[10px] font-semibold tracking-widest uppercase transition-all rounded-full shrink-0 relative z-50",
                  channelFilter === 'all'
                    ? "bg-slate-200/80 text-slate-800 border border-slate-300 shadow-sm"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200"
                )}
              >
                TODAS
              </button>

              {(['MEETING', 'EMAIL', 'CALL', 'WHATSAPP'] as const).map((type, idx) => {
                const isSelected = channelFilter === type;
                const channelCount = activities.filter(a => a.type === type).length;
                let bgClass = "";
                let label = "";

                if (type === 'MEETING') {
                  label = "Reunión";
                  bgClass = isSelected ? "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE] shadow-sm ring-1 ring-[#8B5CF6]/20" : "bg-white text-slate-500 hover:bg-[#F5F3FF]/70 border border-slate-200";
                } else if (type === 'EMAIL') {
                  label = "Correo";
                  bgClass = isSelected ? "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0] shadow-sm ring-1 ring-[#10B981]/20" : "bg-white text-slate-500 hover:bg-[#ECFDF5]/70 border border-slate-200";
                } else if (type === 'CALL') {
                  label = "Llamada";
                  bgClass = isSelected ? "bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE] shadow-sm ring-1 ring-[#3B82F6]/20" : "bg-white text-slate-500 hover:bg-[#EFF6FF]/70 border border-slate-200";
                } else if (type === 'WHATSAPP') {
                  label = "WhatsApp";
                  bgClass = isSelected ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] shadow-sm ring-1 ring-[#059669]/20" : "bg-white text-slate-500 hover:bg-[#ECFDF5]/70 border border-slate-200";
                }

                const zIndex = 40 - (idx * 10);

                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center flex-1 cursor-pointer relative transition-all duration-200 rounded-full -ml-5 pl-10 pr-6 group",
                      bgClass
                    )}
                    style={{ zIndex }}
                    onClick={() => setChannelFilter(isSelected ? 'all' : type)}
                  >
                    <div className="flex flex-1 items-center justify-between gap-3 h-full">
                      <span className="text-[10px] font-semibold tracking-wider uppercase">
                        {label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold tracking-tight">
                          {channelCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-cyan-600" />
                  Mis Actividades
                </CardTitle>

                <div className="flex items-center gap-4 flex-1 justify-end max-w-2xl">
                  {/* Search Bar */}
                  <div className="relative w-full max-w-sm hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Buscar actividad, cliente..."
                      className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[rgb(94,217,207)] focus-visible:border-[rgb(94,217,207)] outline-none ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg shrink-0">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                        viewMode === 'kanban'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Kanban
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                        viewMode === 'list'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      )}
                    >
                      <List className="w-4 h-4" />
                      Lista
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                        viewMode === 'calendar'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      )}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Kanban View */}
              {viewMode === 'kanban' && (
                <ActivityKanbanView
                  activities={filteredActivities}
                  onActivityClick={handleEditActivity}
                  onCompleteActivity={handleCompleteRequest}
                />
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <ActivityListView
                  activities={filteredActivities}
                  onActivityClick={handleEditActivity}
                  onStartActivity={startActivity}
                  onCompleteActivity={handleCompleteRequest}
                  onSnoozeActivity={handleSnoozeClick}
                  onIgnoreActivity={ignoreActivity}
                />
              )}

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <ActivityCalendarView
                  activities={filteredActivities}
                  onActivityClick={handleEditActivity}
                />
              )}
            </CardContent>
          </Card>
          {/* Activity Form */}
          <ActivityForm
            activity={selectedActivity}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveActivity}
          />

          {/* Activity Resolution Modal (Frictionless UX Action) */}
          <ActivityResolutionModal
            activity={selectedActivity}
            isOpen={isResolutionModalOpen}
            onClose={() => {
              setIsResolutionModalOpen(false);
              setSelectedActivity(null);
            }}
            onResolve={handleResolveActivity}
          />

          {/* Alert Popup */}
          <ActivityAlertPopup
            activity={alertActivity}
            isOpen={alertOpen}
            onClose={() => setAlertOpen(false)}
            onDoNow={handleAlertDoNow}
            onSnooze={handleAlertSnooze}
          />

          {/* Snooze Dialog */}
          <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Posponer actividad
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Seleccionar tiempo
                  </label>
                  <Select
                    value={snoozeOption}
                    onValueChange={(value) => setSnoozeOption(value as SnoozeOption)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15_MIN">15 minutos</SelectItem>
                      <SelectItem value="30_MIN">30 minutos</SelectItem>
                      <SelectItem value="1_HOUR">1 hora</SelectItem>
                      <SelectItem value="3_HOURS">3 horas</SelectItem>
                      <SelectItem value="TOMORROW">Mañana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSnoozeDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-[var(--user-highlight)] hover:bg-[var(--user-highlight-hover)]"
                    onClick={handleConfirmSnooze}
                  >
                    Posponer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div >
  );
}

export default ActivitiesPage;
