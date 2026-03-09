// ============================================
// ANTU CRM - Activity Calendar View
// Vista de calendario de actividades
// ============================================

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Bell,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import type { Activity, ActivityType } from '@/types/activity';
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
// PROPS
// ============================================

interface ActivityCalendarViewProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ActivityCalendarView({
  activities,
  onActivityClick,
}: ActivityCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Days from previous month to show
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysFromPrevMonth = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Monday start

    // Total days to show (6 weeks = 42 days)
    const totalDays = 42;

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      activities: Activity[];
    }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        activities: getActivitiesForDate(date),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        activities: getActivitiesForDate(date),
      });
    }

    // Next month days
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        activities: getActivitiesForDate(date),
      });
    }

    return days;
  }, [currentDate, activities]);

  function getActivitiesForDate(date: Date): Activity[] {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.dueDate);
      return (
        activityDate.getDate() === date.getDate() &&
        activityDate.getMonth() === date.getMonth() &&
        activityDate.getFullYear() === date.getFullYear()
      );
    });
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Hoy
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {calendarData.map((day, index) => (
            <div
              key={index}
              className={cn(
                'min-h-[120px] p-2 border-b border-r border-slate-100',
                !day.isCurrentMonth && 'bg-slate-50/50',
                isToday(day.date) && 'bg-cyan-50/30'
              )}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday(day.date)
                      ? 'bg-cyan-500 text-white'
                      : !day.isCurrentMonth
                      ? 'text-slate-400'
                      : 'text-slate-700'
                  )}
                >
                  {day.date.getDate()}
                </span>
                {day.activities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {day.activities.length}
                  </Badge>
                )}
              </div>

              {/* Activities */}
              <div className="space-y-1">
                {day.activities.slice(0, 3).map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => onActivityClick(activity)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                      activity.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : activity.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <ActivityTypeIcon type={activity.type} className="w-3 h-3" />
                      {activity.dueTime} {activity.title}
                    </span>
                  </button>
                ))}
                {day.activities.length > 3 && (
                  <button
                    onClick={() => {
                      // Show all activities for this day
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
                  >
                    +{day.activities.length - 3} más
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200" />
          <span className="text-slate-600">Vencida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-slate-600">Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
          <span className="text-slate-600">Pendiente</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityCalendarView;
