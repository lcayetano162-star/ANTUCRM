// ============================================
// MOBILE TASKS - Task management for mobile
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle2,
  Circle,
  Clock,
  Phone,
  Users,
  FileText,
  Calendar,
  Flag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDate, formatDistanceToNow } from '@/lib/utils';

type TaskType = 'call' | 'meeting' | 'task' | 'followup' | 'email';
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  dueDate: string;
  dueTime?: string;
  clientName?: string;
  opportunityTitle?: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

const TASK_ICONS: Record<TaskType, typeof Phone> = {
  call: Phone,
  meeting: Users,
  task: FileText,
  followup: Clock,
  email: FileText
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

export function MobileTasks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    try {
      const response = await api.get(`/mobile/tasks?filter=${activeTab}`);
      setTasks(response.data);
    } catch (error) {
      toast({ title: 'Error cargando tareas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await api.post(`/mobile/tasks/${taskId}/complete`);
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      ));
      toast({ title: '✓ Tarea completada', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error al completar tarea', variant: 'destructive' });
    }
  };

  const getTaskIcon = (type: TaskType) => {
    const Icon = TASK_ICONS[type];
    return <Icon className="w-5 h-5" />;
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128C7E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          label="Pendientes" 
          value={stats.total - stats.completed} 
          color="text-orange-600" 
        />
        <StatCard 
          label="Completadas" 
          value={stats.completed} 
          color="text-green-600" 
        />
        <StatCard 
          label="Urgentes" 
          value={stats.highPriority} 
          color="text-red-600" 
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="completed">Hechas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task}
            onComplete={() => completeTask(task.id)}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No hay tareas {activeTab === 'today' ? 'para hoy' : activeTab === 'upcoming' ? 'próximas' : 'completadas'}</p>
          </div>
        )}
      </div>

      {/* Add Task FAB */}
      <Button
        onClick={() => navigate('/activities?new=true')}
        className="fixed bottom-24 right-4 rounded-full w-14 h-14 shadow-lg bg-[#128C7E] hover:bg-[#075E54]"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  
  return (
    <Card className={`border-0 shadow-sm ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onComplete}
            disabled={task.completed}
            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
              task.completed 
                ? 'bg-[#128C7E] border-[#128C7E] text-white' 
                : 'border-gray-300 hover:border-[#128C7E]'
            }`}
          >
            {task.completed && <CheckCircle2 className="w-4 h-4" />}
          </button>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${
                task.completed ? 'bg-gray-100 text-gray-400' : 'bg-[#128C7E]/10 text-[#128C7E]'
              }`}>
                {getTaskIcon(task.type)}
              </span>
              <h3 className={`font-medium truncate ${task.completed ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </h3>
            </div>
            
            {(task.clientName || task.opportunityTitle) && (
              <p className="text-sm text-gray-500 mt-1 ml-10">
                {task.clientName || task.opportunityTitle}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2 ml-10">
              <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                <Flag className="w-3 h-3 inline mr-1" />
                {PRIORITY_LABELS[task.priority]}
              </span>
              
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? 'Vencida' : formatDistanceToNow(new Date(task.dueDate))}
              </span>
              
              {task.dueTime && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.dueTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileTasks;
