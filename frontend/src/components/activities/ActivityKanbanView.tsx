// ============================================
// ANTU CRM - Activity Kanban View
// Vista Kanban de actividades por estado
// ============================================


import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Play,
  CheckCircle2,

  Phone,
  Mail,
  Users,
  CheckSquare,
  Bell,
  MapPin,
  MessageCircle,
  AlertCircle,
  Clock4,
} from 'lucide-react';
import type { Activity, ActivityStatus, ActivityType } from '@/types/activity';
import { ACTIVITY_TYPE_CONFIG } from '@/types/activity';

// ============================================
// ACTIVITY TYPE ICON
// ============================================

function ActivityTypeIcon({ type, className }: { type: ActivityType; className?: string }) {
  const config = ACTIVITY_TYPE_CONFIG[type];
  if (!config) return <CheckSquare className={className} />;

  const iconMap: Record<string, React.ElementType> = {
    Phone,
    Mail,
    Users,
    CheckSquare,
    Bell,
    MapPin,
    MessageCircle,
  };

  const Icon = iconMap[config.icon] || CheckSquare;
  return <Icon className={className} style={{ color: config.color }} />;
}

// ============================================
// KANBAN COLUMN
// ============================================

interface KanbanColumnProps {
  title: string;
  status: ActivityStatus;
  count: number;
  activities: Activity[];
  color: string;
  onActivityClick: (activity: Activity) => void;
  onCompleteActivity: (id: string) => void;
}

function KanbanColumn({
  title,
  status,
  count,
  activities,
  color,
  onActivityClick,
  onCompleteActivity,
}: KanbanColumnProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'POSTPONED':
        return <Clock4 className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date, time: string) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === d.toDateString();

    if (isToday) return `Hoy, ${time}`;
    if (isTomorrow) return `Mañana, ${time}`;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }) + `, ${time}`;
  };

  return (
    <div className="flex flex-col flex-1 min-w-[280px] max-w-[450px] bg-slate-50 rounded-lg border border-slate-200">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 border-b rounded-t-lg"
        style={{ backgroundColor: color, borderColor: color }}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-[11px] uppercase tracking-wider">{title}</span>
        </div>
        <Badge variant="secondary" className="bg-white/50">
          {count}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-2 max-h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {activities.map((activity) => {
            const isCompleted = activity.status === 'COMPLETED';
            const isOverdue = activity.status === 'OVERDUE';

            // Channel color styling for the left border and bottom badge
            let channelColorClass = "border-slate-200 text-slate-500 bg-slate-50";
            if (activity.type === 'MEETING') channelColorClass = "border-purple-400 text-purple-700 bg-purple-50";
            else if (activity.type === 'EMAIL') channelColorClass = "border-sky-400 text-sky-700 bg-sky-50";
            else if (activity.type === 'CALL') channelColorClass = "border-amber-400 text-amber-700 bg-amber-50";
            else if (activity.type === 'WHATSAPP') channelColorClass = "border-emerald-400 text-emerald-700 bg-emerald-50";

            // Status color for the right pill
            let statusBadge = null;
            if (isOverdue) statusBadge = <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-rose-100 uppercase tracking-widest">Atrasada</span>;
            else if (isCompleted) statusBadge = <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-emerald-100 uppercase tracking-widest">Completada</span>;
            else statusBadge = <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-amber-100 uppercase tracking-widest">Pendiente</span>;

            // Simple initial extraction
            const initials = activity.customerName ? activity.customerName.substring(0, 2).toUpperCase() : 'NA';

            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick(activity)}
                className={cn(
                  'bg-white rounded-xl hover:-translate-y-[2px] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#E5E7EB] border-l-4 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-full mb-3 relative',
                  channelColorClass.split(' ')[0] // Extract just the border color
                )}
              >
                <div className="p-4 flex flex-col flex-1">
                  {/* Header: Title and Status Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold text-[#1F2937] text-[12px] leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {activity.title}
                    </h4>
                    <div className="shrink-0 mt-0.5">
                      {statusBadge}
                    </div>
                  </div>

                  {/* Identity: Avatar and Customer Name */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-sm text-[10px] font-medium text-slate-600">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#6B7280] font-medium line-clamp-1">{activity.customerName || 'Sin contacto'}</span>
                    </div>
                  </div>

                  {/* Hero Data: Date & Time */}
                  <div className="mb-4">
                    <span className="text-[14px] font-semibold tracking-tight text-slate-800">
                      {formatTime(activity.dueDate, activity.dueTime)}
                    </span>
                  </div>

                  <div className="flex-1" />

                  {/* Bottom Badge & Divider */}
                  <div className="border-t border-[#F3F4F6] pt-3 mt-1 flex items-center justify-between">
                    <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-semibold flex items-center gap-1.5 border", channelColorClass.replace(/border-\w+-400/, 'border-transparent'))}>
                      <ActivityTypeIcon type={activity.type} className="w-3.5 h-3.5" />
                      <span>{ACTIVITY_TYPE_CONFIG[activity.type]?.label}</span>
                    </div>
                    {/* Botón de Completar rápido */}
                    {!isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteActivity(activity.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 p-1.5 rounded-full shadow-sm flex items-center gap-1 absolute right-3 bottom-3"
                        title="Marcar como Completada"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ActivityKanbanViewProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
  onCompleteActivity: (id: string) => void;
}

export function ActivityKanbanView({
  activities,
  onActivityClick,
  onCompleteActivity,
}: ActivityKanbanViewProps) {
  const columns: { status: ActivityStatus; title: string; color: string }[] = [
    { status: 'PENDING', title: 'PENDIENTE', color: '#F3F4F6' },
    { status: 'IN_PROGRESS', title: 'EN PROGRESO', color: '#EFF6FF' },
    { status: 'POSTPONED', title: 'POSPUESTAS', color: '#FFFBEB' },
    { status: 'OVERDUE', title: 'VENCIDAS', color: '#FEF2F2' },
  ];

  const getActivitiesByStatus = (status: ActivityStatus) => {
    return activities.filter((a) => a.status === status);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex justify-center gap-6 min-w-[1200px] w-full px-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            count={getActivitiesByStatus(column.status).length}
            activities={getActivitiesByStatus(column.status)}
            color={column.color}
            onActivityClick={onActivityClick}
            onCompleteActivity={onCompleteActivity}
          />
        ))}
      </div>
    </div>
  );
}

export default ActivityKanbanView;
