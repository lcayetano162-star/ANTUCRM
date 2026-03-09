// ============================================
// ANTU CRM - Activity Types
// Sistema de Actividades con Notificaciones
// ============================================

export type ActivityType = 
  | 'CALL' 
  | 'EMAIL' 
  | 'MEETING' 
  | 'TASK' 
  | 'REMINDER' 
  | 'VISIT' 
  | 'WHATSAPP';

export type ActivityStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'POSTPONED' 
  | 'OVERDUE' 
  | 'IGNORED';

export type ActivityPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type SnoozeOption = 
  | '15_MIN' 
  | '30_MIN' 
  | '1_HOUR' 
  | '3_HOURS' 
  | 'TOMORROW' 
  | 'CUSTOM';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueDate: Date;
  dueTime: string;
  reminderMinutes: number; // Minutos antes para alerta (default: 15)
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
  opportunityAmount?: number;
  assignedTo: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  postponedUntil?: Date;
  ignoredAt?: Date;
  isAlertShown?: boolean;
  alertShownAt?: Date;
}

export interface ActivityFilter {
  status?: ActivityStatus[];
  type?: ActivityType[];
  priority?: ActivityPriority[];
  assignedTo?: string;
  customerId?: string;
  opportunityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface ActivityStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  postponed: number;
  today: number;
  thisWeek: number;
}

export interface SnoozeDuration {
  label: string;
  value: SnoozeOption;
  minutes: number;
}

export const SNOOZE_OPTIONS: SnoozeDuration[] = [
  { label: '15 minutos', value: '15_MIN', minutes: 15 },
  { label: '30 minutos', value: '30_MIN', minutes: 30 },
  { label: '1 hora', value: '1_HOUR', minutes: 60 },
  { label: '3 horas', value: '3_HOURS', minutes: 180 },
  { label: 'Mañana', value: 'TOMORROW', minutes: 1440 },
];

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { 
  label: string; 
  icon: string; 
  color: string; 
  bgColor: string;
}> = {
  CALL: { 
    label: 'Llamada', 
    icon: 'Phone', 
    color: '#3B82F6', 
    bgColor: '#EFF6FF' 
  },
  EMAIL: { 
    label: 'Email', 
    icon: 'Mail', 
    color: '#10B981', 
    bgColor: '#ECFDF5' 
  },
  MEETING: { 
    label: 'Reunión', 
    icon: 'Users', 
    color: '#8B5CF6', 
    bgColor: '#F5F3FF' 
  },
  TASK: { 
    label: 'Tarea', 
    icon: 'CheckSquare', 
    color: '#6B7280', 
    bgColor: '#F9FAFB' 
  },
  REMINDER: { 
    label: 'Recordatorio', 
    icon: 'Bell', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB' 
  },
  VISIT: { 
    label: 'Visita', 
    icon: 'MapPin', 
    color: '#F97316', 
    bgColor: '#FFF7ED' 
  },
  WHATSAPP: { 
    label: 'WhatsApp', 
    icon: 'MessageCircle', 
    color: '#059669', 
    bgColor: '#ECFDF5' 
  },
};

export const ACTIVITY_STATUS_CONFIG: Record<ActivityStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  PENDING: { 
    label: 'Pendiente', 
    color: '#6B7280', 
    bgColor: '#F3F4F6' 
  },
  IN_PROGRESS: { 
    label: 'En progreso', 
    color: '#3B82F6', 
    bgColor: '#EFF6FF' 
  },
  COMPLETED: { 
    label: 'Completada', 
    color: '#10B981', 
    bgColor: '#ECFDF5' 
  },
  POSTPONED: { 
    label: 'Pospuesta', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB' 
  },
  OVERDUE: { 
    label: 'Vencida', 
    color: '#EF4444', 
    bgColor: '#FEF2F2' 
  },
  IGNORED: { 
    label: 'Ignorada', 
    color: '#9CA3AF', 
    bgColor: '#F9FAFB' 
  },
};

export const PRIORITY_CONFIG: Record<ActivityPriority, { 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  HIGH: { 
    label: 'Alta', 
    color: '#EF4444', 
    bgColor: '#FEF2F2' 
  },
  MEDIUM: { 
    label: 'Media', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB' 
  },
  LOW: { 
    label: 'Baja', 
    color: '#10B981', 
    bgColor: '#ECFDF5' 
  },
};
