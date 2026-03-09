// ============================================
// ANTU CRM - Activities Hook
// Gestión de actividades con notificaciones en tiempo real
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  Activity,
  ActivityType,
  ActivityStatus,
  ActivityStats,
  SnoozeOption
} from '@/types/activity';


// ============================================
// MOCK DATA - Actividades de ejemplo
// ============================================

const generateMockActivities = (): Activity[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: '1',
      title: 'Llamar a cliente Juan Pérez',
      description: 'Seguimiento de propuesta enviada',
      type: 'CALL',
      status: 'OVERDUE',
      priority: 'HIGH',
      dueDate: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
      dueTime: '10:00',
      reminderMinutes: 15,
      customerId: '1',
      customerName: 'Juan Pérez',
      opportunityId: '1',
      opportunityName: 'Canon MFP',
      opportunityAmount: 45000,
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Enviar propuesta formal',
      description: 'Documento de cotización para 3 equipos',
      type: 'EMAIL',
      status: 'OVERDUE',
      priority: 'HIGH',
      dueDate: new Date(today.getTime() - 5 * 60 * 60 * 1000), // 5 horas atrás
      dueTime: '07:00',
      reminderMinutes: 15,
      customerId: '2',
      customerName: 'Corp. Dominicana',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Reunión de seguimiento',
      description: 'Revisión de contrato de renta',
      type: 'MEETING',
      status: 'OVERDUE',
      priority: 'MEDIUM',
      dueDate: new Date(today.getTime() - 20 * 60 * 60 * 1000), // Ayer
      dueTime: '16:00',
      reminderMinutes: 15,
      customerId: '3',
      customerName: 'María González',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 72 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      id: '4',
      title: 'Preparar presentación',
      description: 'Demo de nuevos equipos multifuncionales',
      type: 'TASK',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000), // En 2 horas
      dueTime: '14:30',
      reminderMinutes: 15,
      customerId: '4',
      customerName: 'Constructora del Caribe',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: '5',
      title: 'Visita técnica',
      description: 'Instalación de equipo nuevo',
      type: 'VISIT',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000), // En 4 horas
      dueTime: '16:30',
      reminderMinutes: 15,
      customerId: '5',
      customerName: 'Hotel Tropical',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: '6',
      title: 'Enviar recordatorio de pago',
      description: 'Factura vencida #12345',
      type: 'WHATSAPP',
      status: 'PENDING',
      priority: 'LOW',
      dueDate: new Date(today.getTime() + 6 * 60 * 60 * 1000), // En 6 horas
      dueTime: '18:30',
      reminderMinutes: 15,
      customerId: '1',
      customerName: 'Juan Pérez',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      id: '7',
      title: 'Revisar inventario',
      description: 'Verificar stock de consumibles',
      type: 'TASK',
      status: 'POSTPONED',
      priority: 'LOW',
      dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Mañana
      dueTime: '09:00',
      reminderMinutes: 15,
      postponedUntil: new Date(today.getTime() + 2 * 60 * 60 * 1000),
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '8',
      title: 'Llamada de seguimiento',
      description: 'Verificar satisfacción del cliente',
      type: 'CALL',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: new Date(today.getTime() - 8 * 60 * 60 * 1000),
      dueTime: '08:00',
      reminderMinutes: 15,
      completedAt: new Date(today.getTime() - 7 * 60 * 60 * 1000),
      customerId: '2',
      customerName: 'Corp. Dominicana',
      assignedTo: 'user1',
      assignedToName: 'Vendedor 1',
      createdAt: new Date(today.getTime() - 36 * 60 * 60 * 1000),
      updatedAt: new Date(today.getTime() - 7 * 60 * 60 * 1000),
    },
  ];
};

// ============================================
// HOOK
// ============================================

interface UseActivitiesReturn {
  activities: Activity[];
  stats: ActivityStats;
  overdueActivities: Activity[];
  upcomingActivities: Activity[];
  todayActivities: Activity[];
  loading: boolean;

  // Actions
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  completeActivity: (id: string) => void;
  snoozeActivity: (id: string, option: SnoozeOption, customMinutes?: number) => void;
  ignoreActivity: (id: string) => void;
  startActivity: (id: string) => void;

  // Alerts
  showAlertForActivity: (activity: Activity) => void;
  dismissAlert: (activityId: string) => void;

  // Filters
  filterByStatus: (status: ActivityStatus) => Activity[];
  filterByType: (type: ActivityType) => Activity[];
  filterByDate: (date: Date) => Activity[];
  searchActivities: (query: string) => Activity[];
}

// ============================================
// GLOBAL STATE PARA SINCRONIZAR ENTRE HOOKS
// ============================================
let globalActivitiesCache: Activity[] | null = null;
const activitiesListeners = new Set<(activities: Activity[]) => void>();

const loadGlobalActivities = (): Activity[] => {
  try {
    const saved = localStorage.getItem('antu_activities');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        dueDate: new Date(item.dueDate),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        ...(item.postponedUntil && { postponedUntil: new Date(item.postponedUntil) }),
        ...(item.completedAt && { completedAt: new Date(item.completedAt) }),
        ...(item.ignoredAt && { ignoredAt: new Date(item.ignoredAt) }),
      }));
    }
  } catch (e) {
    console.error('Error loading activities from localStorage', e);
  }
  const mockData = generateMockActivities();
  localStorage.setItem('antu_activities', JSON.stringify(mockData));
  return mockData;
};

const notifyActivitiesChange = (activities: Activity[]) => {
  globalActivitiesCache = activities;
  localStorage.setItem('antu_activities', JSON.stringify(activities));
  activitiesListeners.forEach((listener) => listener(activities));
};

export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (!globalActivitiesCache) {
      globalActivitiesCache = loadGlobalActivities();
    }
    return globalActivitiesCache;
  });

  const loading = false;
  const [alertedActivities, setAlertedActivities] = useState<Set<string>>(new Set());

  // Initialize and Sync seamlessly between components
  useEffect(() => {
    const listener = (newActivities: Activity[]) => {
      setActivities(newActivities);
    };
    activitiesListeners.add(listener);

    // Always load fresh if it mounts to prevent staleness
    if (!globalActivitiesCache) {
      globalActivitiesCache = loadGlobalActivities();
      setActivities(globalActivitiesCache);
    }

    return () => {
      activitiesListeners.delete(listener);
    };
  }, []);

  // Check for upcoming activities every minute
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();

      activities.forEach((activity) => {
        // Skip if already alerted, completed, ignored, or postponed
        if (
          alertedActivities.has(activity.id) ||
          activity.status === 'COMPLETED' ||
          activity.status === 'IGNORED' ||
          (activity.status === 'POSTPONED' && activity.postponedUntil && activity.postponedUntil > now)
        ) {
          return;
        }

        const dueDateTime = new Date(activity.dueDate);
        const [hours, minutes] = activity.dueTime.split(':').map(Number);
        dueDateTime.setHours(hours, minutes, 0, 0);

        const alertTime = new Date(dueDateTime.getTime() - activity.reminderMinutes * 60 * 1000);

        // Show alert if we're within the alert window (15 min before due time)
        if (now >= alertTime && now < dueDateTime) {
          showAlertForActivity(activity);
          setAlertedActivities((prev) => new Set(prev).add(activity.id));
        }
      });
    };

    // Check immediately and then every minute
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);

    return () => clearInterval(interval);
  }, [activities, alertedActivities]);

  // Update overdue status every minute
  useEffect(() => {
    const checkOverdue = () => {
      const now = new Date();
      let hasChanges = false;
      const currentActs = globalActivitiesCache || [];

      const updated = currentActs.map((activity) => {
        if (activity.status === 'COMPLETED' || activity.status === 'IGNORED') {
          return activity;
        }

        const dueDateTime = new Date(activity.dueDate);
        const [hours, minutes] = activity.dueTime.split(':').map(Number);
        dueDateTime.setHours(hours, minutes, 0, 0);

        // Check if postponed
        if (activity.status === 'POSTPONED' && activity.postponedUntil) {
          // If postponed time has passed and activity is still not done, mark as overdue
          if (now > activity.postponedUntil && now > dueDateTime) {
            hasChanges = true;
            return { ...activity, status: 'OVERDUE' as const, updatedAt: now };
          }
          return activity;
        }

        // Mark as overdue if past due time
        if (now > dueDateTime && activity.status !== 'OVERDUE') {
          hasChanges = true;
          return { ...activity, status: 'OVERDUE' as const, updatedAt: now };
        }

        return activity;
      });

      if (hasChanges) {
        notifyActivitiesChange(updated);
      }
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 60000);

    return () => clearInterval(interval);
  }, []);

  // Stats
  const stats = useMemo<ActivityStats>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: activities.length,
      pending: activities.filter((a) => a.status === 'PENDING').length,
      inProgress: activities.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: activities.filter((a) => a.status === 'COMPLETED').length,
      overdue: activities.filter((a) => a.status === 'OVERDUE').length,
      postponed: activities.filter((a) => a.status === 'POSTPONED').length,
      today: activities.filter((a) => {
        const dueDate = new Date(a.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: activities.filter((a) => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= today && dueDate <= weekEnd;
      }).length,
    };
  }, [activities]);

  // Filtered lists
  const overdueActivities = useMemo(
    () => activities.filter((a) => a.status === 'OVERDUE'),
    [activities]
  );

  const upcomingActivities = useMemo(
    () => activities.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS'),
    [activities]
  );

  const todayActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activities.filter((a) => {
      const dueDate = new Date(a.dueDate);
      return dueDate.toDateString() === today.toDateString();
    });
  }, [activities]);

  // Actions
  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange([...prev, newActivity]);
    toast.success('Actividad creada exitosamente');
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      )
    );
  }, []);

  const deleteActivity = useCallback((id: string) => {
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(prev.filter((a) => a.id !== id));
    toast.success('Actividad eliminada');
  }, []);

  const completeActivity = useCallback((id: string) => {
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() }
          : a
      )
    );
    toast.success('Actividad completada');
  }, []);

  const snoozeActivity = useCallback((id: string, option: SnoozeOption, customMinutes?: number) => {
    const now = new Date();
    let minutes = 15;

    switch (option) {
      case '15_MIN': minutes = 15; break;
      case '30_MIN': minutes = 30; break;
      case '1_HOUR': minutes = 60; break;
      case '3_HOURS': minutes = 180; break;
      case 'TOMORROW': minutes = 1440; break;
      case 'CUSTOM': minutes = customMinutes || 60; break;
    }

    const postponedUntil = new Date(now.getTime() + minutes * 60 * 1000);

    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'POSTPONED', postponedUntil, updatedAt: now }
          : a
      )
    );

    // Remove from alerted set so it can alert again
    setAlertedActivities((prevSet) => {
      const newSet = new Set(prevSet);
      newSet.delete(id);
      return newSet;
    });

    toast.success(`Actividad pospuesta por ${minutes} minutos`);
  }, []);

  const ignoreActivity = useCallback((id: string) => {
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'IGNORED', ignoredAt: new Date(), updatedAt: new Date() }
          : a
      )
    );
    toast.success('Actividad ignorada');
  }, []);

  const startActivity = useCallback((id: string) => {
    const prev = globalActivitiesCache || [];
    notifyActivitiesChange(
      prev.map((a) =>
        a.id === id ? { ...a, status: 'IN_PROGRESS', updatedAt: new Date() } : a
      )
    );
    toast.success('Actividad iniciada');
  }, []);

  const showAlertForActivity = useCallback((activity: Activity) => {
    // This will be handled by the ActivityAlertPopup component
    // We just need to mark it as alerted
    console.log('Alert for activity:', activity.title);
  }, []);

  const dismissAlert = useCallback((activityId: string) => {
    setAlertedActivities((prev) => {
      const newSet = new Set(prev);
      newSet.delete(activityId);
      return newSet;
    });
  }, []);

  // Filter functions
  const filterByStatus = useCallback(
    (status: ActivityStatus) => activities.filter((a) => a.status === status),
    [activities]
  );

  const filterByType = useCallback(
    (type: ActivityType) => activities.filter((a) => a.type === type),
    [activities]
  );

  const filterByDate = useCallback(
    (date: Date) =>
      activities.filter((a) => {
        const dueDate = new Date(a.dueDate);
        return dueDate.toDateString() === date.toDateString();
      }),
    [activities]
  );

  const searchActivities = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return activities.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.description?.toLowerCase().includes(lowerQuery) ||
          a.customerName?.toLowerCase().includes(lowerQuery) ||
          a.opportunityName?.toLowerCase().includes(lowerQuery)
      );
    },
    [activities]
  );

  return {
    activities,
    stats,
    overdueActivities,
    upcomingActivities,
    todayActivities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    snoozeActivity,
    ignoreActivity,
    startActivity,
    showAlertForActivity,
    dismissAlert,
    filterByStatus,
    filterByType,
    filterByDate,
    searchActivities,
  };
}
