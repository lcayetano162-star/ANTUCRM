// ============================================
// MOBILE DASHBOARD - Main mobile dashboard
// Quick actions, stats, today's tasks
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Mic, 
  Camera,
  TrendingUp,
  DollarSign,
  Users,
  Phone,
  Clock,
  ChevronRight,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { GeolocationCheckIn } from '@/components/mobile/GeolocationCheckIn';
import { VoiceRecorder } from '@/components/mobile/VoiceRecorder';
import { BusinessCardScanner } from '@/components/mobile/BusinessCardScanner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  monthlyRevenue: number;
  activeOpportunities: number;
  newLeads: number;
  todayCalls: number;
  conversionRate: number;
}

interface TodayTask {
  id: string;
  title: string;
  type: 'call' | 'meeting' | 'task' | 'followup';
  dueTime: string;
  clientName: string;
  completed: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage: string;
  probability: number;
}

export function MobileDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    requestLocation();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, tasksRes, oppsRes] = await Promise.all([
        api.get('/mobile/dashboard/stats'),
        api.get('/mobile/dashboard/tasks'),
        api.get('/mobile/dashboard/opportunities')
      ]);

      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setOpportunities(oppsRes.data);
    } catch (error) {
      toast({
        title: 'Error cargando datos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        () => console.log('Location permission denied')
      );
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await api.post(`/mobile/tasks/${taskId}/complete`);
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: true } : t
      ));
      toast({ title: '✓ Tarea completada', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error al completar tarea', variant: 'destructive' });
    }
  };

  // Quick Action Button
  const QuickAction = ({ 
    icon: Icon, 
    label, 
    color, 
    onClick 
  }: { 
    icon: any; 
    label: string; 
    color: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl transition-transform active:scale-95",
        "bg-white shadow-sm border"
      )}
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128C7E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div>
        <p className="text-gray-500 text-sm">Buenos días,</p>
        <h2 className="text-2xl font-bold text-gray-900">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={DollarSign}
            label="Ventas Mes"
            value={formatCurrency(stats.monthlyRevenue)}
            trend="+12%"
            color="bg-green-500"
          />
          <StatCard
            icon={Target}
            label="Oportunidades"
            value={stats.activeOpportunities.toString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Users}
            label="Nuevos Leads"
            value={stats.newLeads.toString()}
            color="bg-purple-500"
          />
          <StatCard
            icon={Phone}
            label="Llamadas Hoy"
            value={stats.todayCalls.toString()}
            color="bg-orange-500"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Acciones Rápidas</h3>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction
            icon={MapPin}
            label="Check-in"
            color="bg-[#128C7E]"
            onClick={() => navigate('/mobile/checkin')}
          />
          <QuickAction
            icon={Mic}
            label="Nota Voz"
            color="bg-red-500"
            onClick={() => {}}
          />
          <QuickAction
            icon={Camera}
            label="Tarjeta"
            color="bg-blue-500"
            onClick={() => {}}
          />
          <QuickAction
            icon={Phone}
            label="Llamar"
            color="bg-green-500"
            onClick={() => navigate('/mobile/clients')}
          />
        </div>
      </div>

      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Tareas de Hoy</h3>
          <button 
            onClick={() => navigate('/mobile/tasks')}
            className="text-[#128C7E] text-sm flex items-center"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay tareas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            tasks.slice(0, 3).map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onComplete={() => completeTask(task.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Hot Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Oportunidades Calientes</h3>
          <button 
            onClick={() => navigate('/mobile/opportunities')}
            className="text-[#128C7E] text-sm flex items-center"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {opportunities.slice(0, 3).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </div>

      {/* Floating Action Components */}
      <GeolocationCheckIn />
      <VoiceRecorder />
      <BusinessCardScanner />
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color 
}: { 
  icon: any; 
  label: string; 
  value: string;
  trend?: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <span className="text-xs text-green-600 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}

// Task Card Component
function TaskCard({ task, onComplete }: { task: TodayTask; onComplete: () => void }) {
  const getIcon = () => {
    switch (task.type) {
      case 'call': return Phone;
      case 'meeting': return Users;
      default: return Clock;
    }
  };
  
  const Icon = getIcon();

  return (
    <Card className={cn(
      "border-0 shadow-sm transition-all",
      task.completed && "opacity-60"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onComplete}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              task.completed 
                ? "bg-[#128C7E] border-[#128C7E] text-white" 
                : "border-gray-300 hover:border-[#128C7E]"
            )}
          >
            {task.completed && <span className="text-xs">✓</span>}
          </button>
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium truncate",
              task.completed && "line-through text-gray-500"
            )}>
              {task.title}
            </p>
            <p className="text-xs text-gray-500">
              {task.clientName} • {task.dueTime}
            </p>
          </div>
          
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="border-0 shadow-sm active:scale-[0.99] transition-transform cursor-pointer">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{opportunity.title}</p>
            <p className="text-xs text-gray-500">{opportunity.clientName}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#128C7E]">
              {formatCurrency(opportunity.value)}
            </p>
            <p className="text-xs text-gray-500">
              {opportunity.probability}% prob.
            </p>
          </div>
        </div>
        
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-full"
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileDashboard;
