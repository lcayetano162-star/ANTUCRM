// ============================================
// ANTU CRM - Global Header Component
// Botón global de actividades + notificaciones + perfil
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  X,
  Calendar,
  ArrowRight,

  Phone,
  Mail,
  Users,
  CheckSquare,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Activity, SnoozeOption } from '@/types/activity';
import { ACTIVITY_TYPE_CONFIG, SNOOZE_OPTIONS } from '@/types/activity';

// ============================================
// ACTIVITY TYPE ICON COMPONENT
// ============================================

function ActivityTypeIcon({ type, className }: { type: string; className?: string }) {
  const config = ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG];
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
// OVERDUE ACTIVITIES BUTTON (Header Global)
// ============================================

function OverdueActivitiesButton() {
  const navigate = useNavigate();
  const { overdueActivities, snoozeActivity, ignoreActivity, startActivity } = useActivities();
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [snoozeDuration, setSnoozeDuration] = useState<SnoozeOption>('15_MIN');

  const count = overdueActivities.length;

  // Determine button style based on count
  const getButtonStyle = () => {
    if (count === 0) {
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-500',
        hover: 'hover:bg-emerald-200 hover:text-emerald-600',
        pulse: false,
      };
    }
    if (count <= 5) {
      return {
        bg: 'bg-rose-500',
        text: 'text-white',
        hover: 'hover:bg-rose-600',
        pulse: false,
      };
    }
    if (count <= 10) {
      return {
        bg: 'bg-rose-600',
        text: 'text-white',
        hover: 'hover:bg-rose-700',
        pulse: true,
      };
    }
    return {
      bg: 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]',
      text: 'text-white',
      hover: 'hover:bg-red-700',
      pulse: true,
    };
  };

  const style = getButtonStyle();

  const handleDoNow = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    startActivity(activity.id);
    navigate('/activities', { state: { activityId: activity.id } });
  };

  const handleSnooze = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedActivity(activity);
    setSnoozeDialogOpen(true);
  };

  const handleConfirmSnooze = () => {
    if (selectedActivity) {
      snoozeActivity(selectedActivity.id, snoozeDuration);
      setSnoozeDialogOpen(false);
      setSelectedActivity(null);
    }
  };

  const handleIgnore = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    ignoreActivity(activity.id);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  // Hide button if no overdue activities
  if (count === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium',
              style.bg,
              style.text,
              style.hover,
              style.pulse && 'animate-pulse'
            )}
            title={`${count} actividad${count > 1 ? 'es' : ''} vencida${count > 1 ? 's' : ''}`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-bold">{count}</span>
            {count > 10 && (
              <Badge variant="outline" className="ml-1 text-xs bg-white/20 border-white/40 text-white">
                ¡URGENTE!
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[450px] p-0">
          <DropdownMenuLabel className="flex items-center justify-between p-4 border-b bg-[var(--user-highlight-opaque)]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[var(--user-highlight)]" />
              <span className="font-semibold text-slate-700">
                ACTIVIDADES VENCIDAS ({count})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities', { state: { filter: 'overdue' } })}
              className="text-[var(--user-highlight)] hover:text-[var(--user-highlight-hover)] hover:bg-[var(--user-highlight-opaque)]"
            >
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuLabel>

          <div className="max-h-[400px] overflow-y-auto">
            {overdueActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>No hay actividades vencidas</p>
              </div>
            ) : (
              overdueActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <ActivityTypeIcon type={activity.type} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-[var(--user-highlight)]" />
                        <span className="text-xs text-[var(--user-highlight)] font-medium">
                          {formatTimeAgo(activity.dueDate)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Venció: {activity.dueTime}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-sm mb-1">
                        {activity.title}
                      </p>
                      {activity.opportunityName && (
                        <p className="text-xs text-slate-500 mb-1">
                          Oportunidad: {activity.opportunityName}
                          {activity.opportunityAmount && (
                            <span className="text-emerald-600 ml-1">
                              - RD$ {activity.opportunityAmount.toLocaleString()}
                            </span>
                          )}
                        </p>
                      )}
                      {activity.customerName && (
                        <p className="text-xs text-slate-400">
                          Cliente: {activity.customerName}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={(e) => handleDoNow(activity, e)}
                          className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Hacer ahora
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleSnooze(activity, e)}
                          className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Posponer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleIgnore(activity, e)}
                          className="h-7 text-xs text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-slate-50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              className="text-slate-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ir a módulo de Actividades
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="text-slate-600"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar alertas
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

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
            {selectedActivity && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800">{selectedActivity.title}</p>
                <p className="text-sm text-slate-500">{selectedActivity.customerName}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Seleccionar tiempo
              </label>
              <Select
                value={snoozeDuration}
                onValueChange={(value) => setSnoozeDuration(value as SnoozeOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNOOZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={handleConfirmSnooze}
              >
                Posponer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// NOTIFICATIONS BUTTON
// ============================================

function NotificationsButton() {
  const unreadCount = 3; // Mock

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800',
            'transition-all duration-200'
          )}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-[rgb(94,217,207)] text-white text-xs font-bold border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Marcar todas leídas
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Oportunidad ganada</p>
              <p className="text-xs text-slate-500">
                TechCorp Solutions - RD$ 125,000
              </p>
              <p className="text-xs text-slate-400 mt-1">Hace 2 horas</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Tarea vencida</p>
              <p className="text-xs text-slate-500">
                Llamar a cliente Soluciones Gráficas
              </p>
              <p className="text-xs text-slate-400 mt-1">Hace 1 día</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-100)] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Nuevo lead asignado</p>
              <p className="text-xs text-slate-500">
                Distribuidora del Caribe
              </p>
              <p className="text-xs text-slate-400 mt-1">Hace 3 horas</p>
            </div>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-[var(--color-primary)]">
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// USER MENU
// ============================================

function UserMenu() {
  const navigate = useNavigate();
  const { user, logout, originalUser, stopImpersonation } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      USER: 'Vendedor',
    };
    return labels[role] || role;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-300)] flex items-center justify-center">
            <span className="text-[var(--color-primary)] font-semibold text-sm">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-700">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400">{getRoleLabel(user?.role || '')}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
          <User className="w-4 h-4 mr-2" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {originalUser && (
          <DropdownMenuItem
            className="cursor-pointer text-amber-600 font-medium"
            onClick={stopImpersonation}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Volver a Super Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer text-[var(--user-highlight)] hover:bg-[var(--user-highlight-opaque)]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// MAIN HEADER COMPONENT
// ============================================

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { originalUser, stopImpersonation } = useAuth();

  return (
    <>
      {/* Impersonation Banner */}
      {originalUser && (
        <div className="fixed top-0 left-0 right-0 h-10 bg-slate-900 text-white z-[60] flex items-center justify-center px-4 overflow-hidden">
          <div className="flex items-center gap-4 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Modo Administración:</span>
            </div>
            <span>Estás explorando el ambiente de este Tenant</span>
            <Button
              variant="outline"
              size="sm"
              onClick={stopImpersonation}
              className="h-7 text-[10px] bg-white text-slate-900 border-none hover:bg-slate-200 ml-2"
            >
              Volver al Panel Global
            </Button>
          </div>
        </div>
      )}

      <header className={cn(
        "fixed right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center px-4 transition-all duration-300",
        originalUser ? "top-10" : "top-0",
        sidebarCollapsed ? "left-20" : "left-64"
      )}>
        {/* Logo (visible when sidebar collapsed on desktop/mobile toggle) */}
        <div
          className={cn(
            'flex items-center gap-3 mr-auto transition-all duration-300 lg:hidden',
            !sidebarCollapsed && 'hidden'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-base">A</span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Overdue Activities Button - Global */}
          <OverdueActivitiesButton />

          {/* Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcherCompact />
          </div>

          {/* Notifications */}
          <NotificationsButton />

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>
    </>
  );
}

export default Header;
