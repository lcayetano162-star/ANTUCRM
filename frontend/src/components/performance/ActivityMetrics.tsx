// ============================================
// ANTU CRM - Activity Metrics Component
// Métricas de actividades del mes
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Users, Mail, Plane, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityMetricsProps {
  calls: { current: number; target: number; percentage: number };
  meetings: { current: number; target: number; percentage: number };
  emails: { current: number; target: number; percentage: number };
  visits: { current: number; target: number; percentage: number };
  opportunitiesCreated: { current: number; target: number; percentage: number; value: number };
  teamPosition: number;
  teamTotal: number;
  teamAverage: number;
}

interface ActivityCardProps {
  icon: React.ReactNode;
  title: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
}

function ActivityCard({ icon, title, current, target, percentage, color }: ActivityCardProps) {
  const remaining = target - current;
  
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
        <Badge 
          variant={percentage >= 80 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {percentage}%
        </Badge>
      </div>
      
      <div className="mb-2">
        <span className="text-2xl font-bold text-slate-800">{current}</span>
        <span className="text-lg text-slate-400">/{target}</span>
      </div>
      
      <p className="text-sm text-slate-500 mb-3">{title}</p>
      
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444'
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Meta: {target}</span>
        <span className="text-slate-500">Faltan: {remaining}</span>
      </div>
      
      <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-600 hover:text-slate-800">
        Registrar
      </Button>
    </div>
  );
}

export function ActivityMetrics({
  calls,
  meetings,
  emails,
  visits,
  opportunitiesCreated,
  teamPosition,
  teamTotal,
  teamAverage
}: ActivityMetricsProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-sky-600" />
          </div>
          Actividades del Mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grid de actividades */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActivityCard
            icon={<Phone className="w-5 h-5 text-blue-600" />}
            title="Llamadas"
            current={calls.current}
            target={calls.target}
            percentage={calls.percentage}
            color="bg-blue-100"
          />
          <ActivityCard
            icon={<Users className="w-5 h-5 text-violet-600" />}
            title="Reuniones"
            current={meetings.current}
            target={meetings.target}
            percentage={meetings.percentage}
            color="bg-violet-100"
          />
          <ActivityCard
            icon={<Mail className="w-5 h-5 text-emerald-600" />}
            title="Emails"
            current={emails.current}
            target={emails.target}
            percentage={emails.percentage}
            color="bg-emerald-100"
          />
          <ActivityCard
            icon={<Plane className="w-5 h-5 text-amber-600" />}
            title="Visitas"
            current={visits.current}
            target={visits.target}
            percentage={visits.percentage}
            color="bg-amber-100"
          />
        </div>
        
        {/* Oportunidades creadas */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Oportunidades Creadas</h4>
                <p className="text-sm text-slate-500">Este mes</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-indigo-600">{opportunitiesCreated.current}</span>
              <span className="text-lg text-slate-400">/{opportunitiesCreated.target}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(opportunitiesCreated.percentage, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-slate-600">{opportunitiesCreated.percentage}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-slate-500">Valor total: </span>
              <span className="font-semibold text-emerald-600">
                RD${(opportunitiesCreated.value / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Ver oportunidades
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Crear nueva
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Comparativa vs equipo */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            <h4 className="font-semibold text-slate-700">Comparativa vs Equipo</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{teamPosition}°</p>
              <p className="text-xs text-slate-500">de {teamTotal} vendedores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{teamAverage}%</p>
              <p className="text-xs text-slate-500">Promedio equipo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">+{Math.round(((calls.percentage + meetings.percentage + emails.percentage + visits.percentage) / 4) - teamAverage)}%</p>
              <p className="text-xs text-slate-500">vs promedio</p>
            </div>
          </div>
          
          <Button variant="link" size="sm" className="w-full mt-3 text-slate-600 hover:text-slate-800">
            Ver leaderboard completo
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityMetrics;
