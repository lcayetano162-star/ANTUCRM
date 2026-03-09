// ============================================
// ANTU CRM - Team View Component
// Vista de equipo para gerentes
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Download, FileText, TrendingUp, TrendingDown, Minus, Search, ArrowRight } from 'lucide-react';
import type { TeamMember } from '@/types/performance';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TeamViewProps {
  teamMembers: TeamMember[];
  getQuotaColor: (p: number) => string;
}

export function TeamView({ teamMembers, getQuotaColor }: TeamViewProps) {
  const navigate = useNavigate();
  const sortedMembers = [...teamMembers].sort((a, b) => b.percentage - a.percentage);
  const teamTotal = teamMembers.reduce((acc, m) => acc + m.achieved, 0);
  const teamQuota = teamMembers.reduce((acc, m) => acc + m.quota, 0);
  const teamPercentage = Math.round((teamTotal / teamQuota) * 100);

  const getTrendIcon = (trend: TeamMember['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${position + 1}°`;
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            Desempeño del Equipo
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar vendedor..."
                className="pl-9 w-48"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Territorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="norte">Norte</SelectItem>
                <SelectItem value="sur">Sur</SelectItem>
                <SelectItem value="este">Este</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen del equipo */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-500 mb-1">Cuota Total</p>
              <p className="text-xl font-bold text-slate-700">RD${(teamQuota / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Alcanzado</p>
              <p className="text-xl font-bold text-emerald-600">RD${(teamTotal / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Cumplimiento</p>
              <p className="text-xl font-bold" style={{ color: getQuotaColor(teamPercentage) }}>
                {teamPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de equipo */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Pos</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Vendedor</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Cuota</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Real</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">%</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Activ.</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Tend.</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, index) => {
                const color = getQuotaColor(member.percentage);
                return (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <span className="text-lg">{getMedal(index)}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-700">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600">
                      RD${(member.quota / 1000).toFixed(0)}K
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-slate-700">
                      RD${(member.achieved / 1000).toFixed(0)}K
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                          borderColor: color
                        }}
                        variant="outline"
                      >
                        {member.percentage}%
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={cn(
                        "text-sm font-medium",
                        member.activitiesPercentage >= 80 ? "text-emerald-600" :
                          member.activitiesPercentage >= 50 ? "text-amber-600" : "text-red-600"
                      )}>
                        {member.activitiesPercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {getTrendIcon(member.trend)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600">
                      RD${(member.pipeline / 1000).toFixed(0)}K
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico de dispersión simple */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">
            Matriz de Desempeño: Actividades vs Resultados
          </h4>
          <div className="relative h-48 bg-white rounded-lg border border-slate-200 p-4">
            {/* Ejes */}
            <div className="absolute left-4 top-4 bottom-8 w-px bg-slate-300" />
            <div className="absolute left-4 right-4 bottom-8 h-px bg-slate-300" />

            {/* Labels */}
            <span className="absolute left-1 top-2 text-xs text-slate-400 -rotate-90 origin-left">% Cuota</span>
            <span className="absolute right-2 bottom-2 text-xs text-slate-400">% Actividades</span>

            {/* Cuadrantes */}
            <div className="absolute inset-4 flex">
              <div className="flex-1 border-r border-b border-dashed border-slate-200 relative">
                <span className="absolute top-1 left-1 text-xs text-slate-300">Baja Act. / Bajo Res.</span>
              </div>
              <div className="flex-1 border-b border-dashed border-slate-200 relative">
                <span className="absolute top-1 right-1 text-xs text-slate-300">Alta Act. / Bajo Res.</span>
              </div>
            </div>
            <div className="absolute inset-4 flex mt-[calc(50%-8px)]">
              <div className="flex-1 border-r border-dashed border-slate-200 relative">
                <span className="absolute bottom-1 left-1 text-xs text-slate-300">Baja Act. / Alto Res.</span>
              </div>
              <div className="flex-1 relative">
                <span className="absolute bottom-1 right-1 text-xs text-emerald-500 font-medium">✓ Ideal</span>
              </div>
            </div>

            {/* Puntos */}
            {sortedMembers.map((member, index) => {
              const x = (member.activitiesPercentage / 100) * 100;
              const y = (member.percentage / 100) * 100;
              const size = Math.max(12, Math.min(24, member.pipeline / 20000));

              return (
                <div
                  key={member.id}
                  className="absolute rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `calc(4px + ${x}% - ${size / 2}px)`,
                    bottom: `calc(32px + ${y}% - ${size / 2}px)`,
                    width: size,
                    height: size,
                    backgroundColor: getQuotaColor(member.percentage)
                  }}
                  title={`${member.name}: ${member.percentage}% cuota, ${member.activitiesPercentage}% actividades`}
                >
                  {index < 3 && (index + 1)}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Tamaño del círculo = valor de pipeline
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/vendedores')}>
            <FileText className="w-4 h-4" />
            Ver detalle por vendedor
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/settings/quotas')}>
            Configurar metas
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamView;
