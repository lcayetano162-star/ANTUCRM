// ============================================
// ANTU CRM - useTasks Hook
// Health Status Indicator para tareas vencidas
// ============================================

import { useState, useCallback, useMemo } from 'react';
import type { Task, TaskStatus, HealthMetrics, HealthStatus } from '@/types/tenant';

// ============================================
// MOCK TASKS
// ============================================

const MOCK_TASKS: Task[] = [
  {
    id: 'task_001',
    title: 'Llamar a cliente TechCorp',
    description: 'Seguimiento de propuesta enviada',
    dueDate: new Date(Date.now() + 86400000), // Mañana
    status: 'PENDING',
    priority: 'HIGH',
    assignedTo: 'user_003',
    contactId: 'contact_001',
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'task_002',
    title: 'Enviar cotización a Soluciones Gráficas',
    description: 'Cotización de impresos corporativos',
    dueDate: new Date(Date.now() - 172800000), // Hace 2 días (VENCIDA)
    status: 'PENDING',
    priority: 'HIGH',
    assignedTo: 'user_003',
    contactId: 'contact_002',
    createdAt: new Date(Date.now() - 432000000),
    updatedAt: new Date(Date.now() - 259200000),
  },
  {
    id: 'task_003',
    title: 'Reunión con prospecto Distribuidora del Caribe',
    description: 'Presentación de productos',
    dueDate: new Date(Date.now() - 432000000), // Hace 5 días (VENCIDA CRÍTICA)
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'user_003',
    contactId: 'contact_003',
    createdAt: new Date(Date.now() - 691200000),
    updatedAt: new Date(Date.now() - 518400000),
  },
  {
    id: 'task_004',
    title: 'Actualizar datos de contacto',
    description: 'Verificar información de clientes nuevos',
    dueDate: new Date(Date.now() + 259200000), // En 3 días
    status: 'IN_PROGRESS',
    priority: 'LOW',
    assignedTo: 'user_003',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'task_005',
    title: 'Seguimiento de oportunidad Software Solutions',
    description: 'Llamada de cierre',
    dueDate: new Date(Date.now() - 86400000), // Ayer (VENCIDA)
    status: 'PENDING',
    priority: 'HIGH',
    assignedTo: 'user_003',
    opportunityId: 'opp_001',
    createdAt: new Date(Date.now() - 345600000),
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'task_006',
    title: 'Preparar presentación mensual',
    description: 'Reporte de ventas del mes',
    dueDate: new Date(Date.now() + 604800000), // En 7 días
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'user_003',
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'task_007',
    title: 'Revisar inventario de productos',
    description: 'Verificar stock disponible',
    dueDate: new Date(Date.now() + 172800000), // En 2 días
    status: 'COMPLETED',
    priority: 'LOW',
    assignedTo: 'user_003',
    createdAt: new Date(Date.now() - 432000000),
    updatedAt: new Date(Date.now() - 86400000),
  },
];

// ============================================
// HEALTH STATUS CALCULATION
// ============================================

function calculateHealthStatus(tasks: Task[]): HealthMetrics {
  const now = new Date();
  
  const overdueTasks = tasks.filter(
    (task) => task.status === 'PENDING' && new Date(task.dueDate) < now
  );
  
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  const pending = tasks.filter((task) => task.status === 'PENDING').length;
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  
  // Determinar estado de salud
  let status: HealthStatus = 'HEALTHY';
  
  if (overdueTasks.length >= 3) {
    status = 'CRITICAL';
  } else if (overdueTasks.length >= 1) {
    status = 'WARNING';
  }
  
  return {
    total: tasks.length,
    completed,
    pending: pending + inProgress,
    overdue: overdueTasks.length,
    overdueTasks: overdueTasks.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ),
    status,
  };
}

// ============================================
// HOOK
// ============================================

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isLoading] = useState(false);

  // Calcular métricas de salud
  const healthMetrics = useMemo(() => calculateHealthStatus(tasks), [tasks]);

  // Obtener tareas filtradas
  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(
      (task) => task.status === 'PENDING' && new Date(task.dueDate) < now
    );
  }, [tasks]);

  const getUpcomingTasks = useCallback((days: number = 7) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 86400000);
    return tasks.filter(
      (task) =>
        task.status === 'PENDING' &&
        new Date(task.dueDate) >= now &&
        new Date(task.dueDate) <= future
    );
  }, [tasks]);

  // CRUD operations
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: 'COMPLETED' as TaskStatus, updatedAt: new Date() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // Health status indicator helpers
  const getHealthColor = useCallback((status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: 'text-emerald-500',
          pastel: 'bg-emerald-50',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: 'text-amber-500',
          pastel: 'bg-amber-50',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-100',
          text: 'text-rose-700',
          border: 'border-rose-200',
          icon: 'text-rose-500',
          pastel: 'bg-rose-50',
        };
    }
  }, []);

  const getHealthLabel = useCallback((status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return 'Todo en orden';
      case 'WARNING':
        return 'Atención requerida';
      case 'CRITICAL':
        return 'Acción urgente';
    }
  }, []);

  const getDaysOverdue = useCallback((dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  return {
    tasks,
    isLoading,
    healthMetrics,
    getTasksByStatus,
    getOverdueTasks,
    getUpcomingTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getHealthColor,
    getHealthLabel,
    getDaysOverdue,
  };
}
