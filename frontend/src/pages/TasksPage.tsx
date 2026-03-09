// ============================================
// ANTU CRM - Tasks Page
// Gestión de tareas con Health Status Indicator
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/tenant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Check,
  Trash2,
  Edit2,
} from 'lucide-react';

// ============================================
// TASK CARD COMPONENT
// ============================================

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
}

function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const isOverdue = task.status === 'PENDING' && new Date(task.dueDate) < new Date();
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-200',
    HIGH: 'bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)] border-[var(--user-highlight-opaque)]',
  };

  const statusColors = {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-sky-100 text-sky-600',
    COMPLETED: 'bg-emerald-100 text-emerald-600',
    OVERDUE: 'bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)]',
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Card
      className={cn(
        'border transition-all duration-200 hover:shadow-md',
        isOverdue
          ? 'border-[var(--user-highlight)] bg-[var(--user-highlight-opaque)]'
          : task.status === 'COMPLETED'
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-slate-200'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {task.status !== 'COMPLETED' && (
            <button
              onClick={onComplete}
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                isOverdue
                  ? 'border-rose-300 hover:border-rose-400 hover:bg-rose-100'
                  : 'border-[var(--primary-300)] hover:border-[var(--color-primary)] hover:bg-[var(--primary-50)]'
              )}
            >
              <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 text-[var(--color-primary)]" />
            </button>
          )}
          {task.status === 'COMPLETED' && (
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  'font-medium truncate',
                  task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'
                )}
              >
                {task.title}
              </h4>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] px-1.5 py-0', priorityColors[task.priority])}
                >
                  {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                </Badge>
              </div>
            </div>

            {task.description && (
              <p
                className={cn(
                  'text-sm mt-1 line-clamp-2',
                  task.status === 'COMPLETED' ? 'text-slate-300' : 'text-slate-500'
                )}
              >
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3">
              {/* Due Date */}
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  isOverdue ? 'text-[var(--user-highlight)] font-medium' : 'text-slate-400'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                {isOverdue ? `${daysOverdue} días vencida` : `Vence ${formatDate(task.dueDate)}`}
              </div>

              {/* Status */}
              <Badge variant="secondary" className={cn('text-[10px]', statusColors[task.status])}>
                {task.status === 'PENDING' && 'Pendiente'}
                {task.status === 'IN_PROGRESS' && 'En progreso'}
                {task.status === 'COMPLETED' && 'Completada'}
                {task.status === 'OVERDUE' && 'Vencida'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-[var(--user-highlight)]"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN TASKS PAGE
// ============================================

export function TasksPage() {
  const { tasks, getTasksByStatus, getOverdueTasks, completeTask, deleteTask } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksForTab = () => {
    switch (activeTab) {
      case 'pending':
        return getTasksByStatus('PENDING');
      case 'in-progress':
        return getTasksByStatus('IN_PROGRESS');
      case 'completed':
        return getTasksByStatus('COMPLETED');
      case 'overdue':
        return getOverdueTasks();
      default:
        return filteredTasks;
    }
  };

  const displayTasks = getTasksForTab();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
          <p className="text-slate-500 mt-1">Gestiona tus actividades y seguimientos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
              <Plus className="w-4 h-4 mr-2" />
              Nueva tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input placeholder="Nombre de la tarea" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input placeholder="Descripción opcional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de vencimiento</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridad</label>
                  <select className="w-full h-10 rounded-md border border-slate-200 px-3">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>
              <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
                Crear tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all">
            Todas
            <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600">
              {tasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes
            <Badge variant="secondary" className="ml-2 bg-[var(--primary-100)] text-[var(--color-primary)]">
              {getTasksByStatus('PENDING').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            En progreso
            <Badge variant="secondary" className="ml-2 bg-sky-100 text-sky-600">
              {getTasksByStatus('IN_PROGRESS').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidas
            {getOverdueTasks().length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)]">
                {getOverdueTasks().length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completadas
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-600">
              {getTasksByStatus('COMPLETED').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-3">
              {displayTasks.length > 0 ? (
                displayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-medium">No hay tareas</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {activeTab === 'all'
                      ? 'Crea tu primera tarea para comenzar'
                      : 'No hay tareas en esta categoría'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
