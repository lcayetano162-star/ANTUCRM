// ============================================
// ANTU CRM - Activity Alert Popup
// Popup de alerta 15 minutos antes de la actividad
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Video,
  Play,
  Check,
  User,
  Briefcase,
} from 'lucide-react';
import type { Activity, SnoozeOption } from '@/types/activity';
import { ACTIVITY_TYPE_CONFIG, SNOOZE_OPTIONS } from '@/types/activity';

// ============================================
// ACTIVITY TYPE ICON
// ============================================

function ActivityTypeIcon({ type, className }: { type: string; className?: string }) {
  const config = ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG];
  if (!config) return <CheckCircle2 className={className} />; // Changed from CheckSquare

  const iconMap: Record<string, React.ElementType> = {
    Phone,
    MapPin,
    MessageCircle,
    CheckCircle2,
    Video,
  };

  const Icon = iconMap[config.icon] || CheckCircle2; // Changed from CheckSquare
  return <Icon className={className} style={{ color: config.color }} />;
}

// ============================================
// PROPS
// ============================================

interface ActivityAlertPopupProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onDoNow: (activityId: string) => void;
  onComplete?: (activityId: string) => void;
  onSnooze: (activityId: string, option: SnoozeOption) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ActivityAlertPopup({
  activity,
  isOpen,
  onClose,
  onDoNow,
  onComplete,
  onSnooze,
}: ActivityAlertPopupProps) {
  const navigate = useNavigate();
  const [snoozeOption, setSnoozeOption] = useState<SnoozeOption>('15_MIN');
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false); // Added new state for snooze menu

  // Play sound when alert opens
  useEffect(() => {
    if (isOpen && activity) {
      // In a real app, you would play a sound here
      // const audio = new Audio('/alert-sound.mp3');
      // audio.play().catch(() => {});
    }
  }, [isOpen, activity]);

  if (!activity) return null;

  const config = ACTIVITY_TYPE_CONFIG[activity.type];

  const handleDoNow = () => {
    onDoNow(activity.id);
    onClose();
    navigate('/activities', { state: { activityId: activity.id } });
  };

  const handleSnooze = () => {
    if (showSnoozeOptions || snoozeMenuOpen) { // Adjusted condition to include snoozeMenuOpen
      onSnooze(activity.id, snoozeOption);
      setShowSnoozeOptions(false);
      setSnoozeMenuOpen(false); // Reset new state
      onClose();
    } else {
      setShowSnoozeOptions(true);
    }
  };

  const handleClose = () => {
    setShowSnoozeOptions(false);
    setSnoozeMenuOpen(false); // Reset new state
    onClose();
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    if (isToday) {
      return `Hoy, ${activity.dueTime}`;
    }

    return d.toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }) + `, ${activity.dueTime}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none shadow-[0_25px_50px_-12px_rgba(225,29,72,0.25)] rounded-[24px] bg-white">
        {/* Header - Bleeding edge, premium feel */}
        <div className="relative bg-gradient-to-br from-[#FF4D6D] to-[#D90429] px-6 py-6 overflow-hidden">
          {/* Ambient Background Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5"></div>

          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-4 text-white text-left">
              <div className="relative flex-shrink-0">
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-inner">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#FFD6E0] uppercase drop-shadow-sm mb-0.5">
                  Alerta de Actividad
                </p>
                <p className="text-[22px] font-extrabold text-white drop-shadow-md leading-tight tracking-tight flex items-center gap-2">
                  Faltan {activity.reminderMinutes} min
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 pb-7 space-y-6">

          {/* Activity Type & Title */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white"
              style={{
                backgroundColor: config?.bgColor || '#F8FAFC',
                boxShadow: `0 8px 16px -4px ${config?.color || '#94A3B8'}40`
              }}
            >
              <ActivityTypeIcon type={activity.type} className="w-6 h-6" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config?.color || '#9CA3AF' }}></span>
                {config?.label || 'Actividad'}
              </p>
              <h3 className="text-[19px] font-bold text-slate-800 leading-snug tracking-tight">
                {activity.title}
              </h3>
              {activity.description && (
                <p className="text-[13px] font-medium text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>
          </div>

          {/* Context Details (Date, Entity, etc.) */}
          <div className="grid grid-cols-1 gap-2.5 bg-slate-50/80 rounded-2xl p-4 border border-slate-100/60 shadow-inner">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-[14px] font-medium text-slate-700 tracking-tight">
                {formatDate(activity.dueDate)}
              </span>
            </div>

            {activity.opportunityName && (
              <div className="flex items-center gap-3.5 mt-0.5">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="text-[14px] font-medium text-slate-700 truncate pr-3 tracking-tight">
                    {activity.opportunityName}
                  </span>
                  {activity.opportunityAmount && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50 whitespace-nowrap">
                      DOP {activity.opportunityAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activity.customerName && (
              <div className="flex items-center gap-3.5 mt-0.5">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-[14px] font-medium text-slate-700 tracking-tight truncate">
                  {activity.customerName}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              onClick={() => setSnoozeMenuOpen(true)}
            >
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              Posponer
            </Button>
            {onComplete ? (
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                onClick={() => onComplete(activity.id)}
              >
                <Check className="w-4 h-4 mr-2" />
                Completar
              </Button>
            ) : (
              <Button
                className="flex-1 bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white shadow-lg shadow-[rgba(94,217,207,0.3)]"
                onClick={() => onDoNow(activity.id)}
              >
                <Play className="w-4 h-4 mr-2" />
                Hacer ahora
              </Button>
            )}
          </div>

          {/* Actions & Snooze */}
          <div className="pt-2">
            {showSnoozeOptions || snoozeMenuOpen ? (
              <div className="animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out">
                <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#FDE68A] shadow-sm mb-4">
                  <label className="text-[11px] font-bold text-[#b45309] uppercase tracking-widest flex items-center gap-1.5 mb-2.5 pl-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    ¿Posponer por cuánto tiempo?
                  </label>
                  <Select
                    value={snoozeOption}
                    onValueChange={(value) => setSnoozeOption(value as SnoozeOption)}
                  >
                    <SelectTrigger className="bg-white border-amber-200/60 shadow-sm transition-all focus:ring-amber-500/20 h-11 rounded-xl text-slate-700 font-medium text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {SNOOZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSnoozeOptions(false)}
                    className="flex-1 h-12 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    onClick={handleSnooze}
                    className="flex-1 h-12 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] border border-amber-500/50 hover:-translate-y-0.5 transition-all text-[13px] tracking-wide"
                  >
                    CONFIRMAR
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleDoNow}
                  className="flex-1 h-[52px] bg-gradient-to-b from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold rounded-xl shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] border border-[#059669]/50 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm text-[13px] tracking-wide"
                >
                  <Play className="w-4 h-4 mr-2 fill-white/80" />
                  HACER AHORA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSnoozeOptions(true)}
                  className="flex-1 h-[52px] font-bold bg-white text-slate-500 border-2 border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-slate-100 text-[13px] tracking-wide shadow-sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  POSPONER
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ACTIVITY ALERT MANAGER
// ============================================

interface ActivityAlertManagerProps {
  activities: Activity[];
}

export function ActivityAlertManager({ activities }: ActivityAlertManagerProps) {
  const [alertActivity, setAlertActivity] = useState<Activity | null>(null);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());

  // Check for activities that need alerting (15 min before due time)
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
          setAlertedIds((prev) => new Set(prev).add(activity.id));
        }
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activities, alertedIds]);

  const handleDoNow = (activityId: string) => {
    // Activity status will be updated by the parent component
    console.log('Do now:', activityId);
  };

  const handleSnooze = (activityId: string, option: SnoozeOption) => {
    // Activity will be snoozed by the parent component
    console.log('Snooze:', activityId, option);
  };

  const handleClose = () => {
    setAlertActivity(null);
  };

  return (
    <ActivityAlertPopup
      activity={alertActivity}
      isOpen={!!alertActivity}
      onClose={handleClose}
      onDoNow={handleDoNow}
      onSnooze={handleSnooze}
    />
  );
}

export default ActivityAlertPopup;
