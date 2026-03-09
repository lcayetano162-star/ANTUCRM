// ============================================
// ANTU CRM - Activity List View
// Vista de lista de actividades con filtros
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
  X,

  Phone,
  Mail,
  Users,
  CheckSquare,
  Bell,
  MapPin,
  MessageCircle,
  ArrowUpDown,
} from 'lucide-react';
import type { Activity, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';
import { ACTIVITY_TYPE_CONFIG, ACTIVITY_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/activity';

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
// PROPS
// ============================================

interface ActivityListViewProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
  onStartActivity: (activityId: string) => void;
  onCompleteActivity: (activityId: string) => void;
  onSnoozeActivity: (activityId: string) => void;
  onIgnoreActivity: (activityId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ActivityListView({
  activities,
  onActivityClick,
  onStartActivity,
  onCompleteActivity,
  onSnoozeActivity,
  onIgnoreActivity,
}: ActivityListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      searchQuery === '' ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.opportunityName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || activity.status === filterStatus;
    const matchesType = filterType === 'ALL' || activity.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    }
    // Priority sort
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const formatDate = (date: Date, time: string) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === d.toDateString();

    if (isToday) return `Hoy, ${time}`;
    if (isTomorrow) return `Mañana, ${time}`;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`;
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const config = ACTIVITY_STATUS_CONFIG[status] || ACTIVITY_STATUS_CONFIG['PENDING'];
    return (
      <Badge
        variant="outline"
        className="text-xs"
        style={{
          borderColor: config.color,
          color: config.color,
          backgroundColor: config.bgColor,
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ActivityPriority) => {
    const config = PRIORITY_CONFIG[priority];
    return (
      <Badge
        variant="outline"
        className="text-xs"
        style={{
          borderColor: config.color,
          color: config.color,
          backgroundColor: config.bgColor,
        }}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar actividad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-slate-200"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ActivityStatus | 'ALL')}
          className="h-10 px-3 rounded-md border border-slate-200 text-sm bg-white"
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="COMPLETED">Completada</option>
          <option value="POSTPONED">Pospuesta</option>
          <option value="OVERDUE">Vencida</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ActivityType | 'ALL')}
          className="h-10 px-3 rounded-md border border-slate-200 text-sm bg-white"
        >
          <option value="ALL">Todos los tipos</option>
          <option value="CALL">Llamada</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Reunión</option>
          <option value="TASK">Tarea</option>
          <option value="REMINDER">Recordatorio</option>
          <option value="VISIT">Visita</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>

        <Button
          variant="outline"
          onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
          className="gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === 'date' ? 'Por fecha' : 'Por prioridad'}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No se encontraron actividades
                </TableCell>
              </TableRow>
            ) : (
              sortedActivities.map((activity) => (
                <TableRow
                  key={activity.id}
                  onClick={() => onActivityClick(activity)}
                  className={cn(
                    'cursor-pointer hover:bg-slate-50',
                    activity.status === 'OVERDUE' && 'bg-rose-50/50'
                  )}
                >
                  <TableCell>
                    <ActivityTypeIcon type={activity.type} className="w-5 h-5" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">{activity.title}</p>
                      {activity.opportunityName && (
                        <p className="text-xs text-slate-500">{activity.opportunityName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {activity.customerName || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {formatDate(activity.dueDate, activity.dueTime)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell>{getPriorityBadge(activity.priority)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {activity.status === 'PENDING' && (
                          <DropdownMenuItem onClick={() => onStartActivity(activity.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar
                          </DropdownMenuItem>
                        )}
                        {(activity.status === 'PENDING' || activity.status === 'IN_PROGRESS') && (
                          <DropdownMenuItem onClick={() => onCompleteActivity(activity.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completar
                          </DropdownMenuItem>
                        )}
                        {activity.status !== 'COMPLETED' && activity.status !== 'IGNORED' && (
                          <DropdownMenuItem onClick={() => onSnoozeActivity(activity.id)}>
                            <Clock className="w-4 h-4 mr-2" />
                            Posponer
                          </DropdownMenuItem>
                        )}
                        {activity.status !== 'COMPLETED' && activity.status !== 'IGNORED' && (
                          <DropdownMenuItem onClick={() => onIgnoreActivity(activity.id)}>
                            <X className="w-4 h-4 mr-2" />
                            Ignorar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ActivityListView;
