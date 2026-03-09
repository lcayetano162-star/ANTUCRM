// ============================================
// ANTU CRM - Team Assignment
// Asignación de cuotas a equipos
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Trash2, PieChart, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import type { TeamQuota } from '@/types/quota';

interface TeamAssignmentProps {
  teams: TeamQuota[];
  companyTotal: number;
  onUpdateTeam: (id: string, updates: Partial<TeamQuota>) => void;
  onAddTeam: () => void;
  onRemoveTeam: (id: string) => void;
  onSave: () => void;
}

const managers = [
  'Eduardo Sanchez',
  'Marlin Ramos',
  'Ricardo Alarcon',
  'Sofia Vergara',
  'Gerente General'
];

export function TeamAssignment({
  teams,
  companyTotal,
  onUpdateTeam,
  onAddTeam,
  onRemoveTeam,
  onSave
}: TeamAssignmentProps) {
  const teamsTotal = teams.reduce((sum, t) => sum + t.annualQuota, 0);
  const percentageUsed = Math.round((teamsTotal / companyTotal) * 100);
  const remaining = companyTotal - teamsTotal;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Asignación de Cuotas a Equipos
          </CardTitle>
          <Badge variant="outline" className="text-xs">Gerente / Admin</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Meta Empresarial: {formatCurrency(companyTotal)} |
          <span className={remaining === 0 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
            {remaining === 0 ? ' Asignación completa' : ` Restante: ${formatCurrency(remaining)}`}
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progreso de asignación */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progreso de asignación</span>
            <span className={percentageUsed === 100 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
              {percentageUsed}%
            </span>
          </div>
          <Progress
            value={percentageUsed}
            className="h-3"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Asignado: {formatCurrency(teamsTotal)}</span>
            <span>Meta: {formatCurrency(companyTotal)}</span>
          </div>
        </div>

        {/* Método de asignación */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Método de Asignación</Label>
          <Select defaultValue="MANUAL">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUAL">Manual (Ingreso directo por equipo)</SelectItem>
              <SelectItem value="PERCENTAGE">Por porcentaje del total</SelectItem>
              <SelectItem value="HISTORICAL">Basado en histórico (automático)</SelectItem>
              <SelectItem value="TERRITORY">Por potencial de mercado (territorio)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de equipos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Equipos</Label>
            <Button variant="outline" size="sm" onClick={onAddTeam} className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Equipo
            </Button>
          </div>

          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={team.id} className="p-4 border rounded-lg bg-white hover:border-indigo-300 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                      <span className="text-lg font-bold text-slate-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={team.name}
                          onChange={(e) => onUpdateTeam(team.id, { name: e.target.value })}
                          className="w-40 font-bold text-slate-800 border-none bg-transparent h-7 px-0 focus-visible:ring-0"
                          placeholder="Nombre del Equipo"
                        />
                        <Input
                          value={team.territory}
                          onChange={(e) => onUpdateTeam(team.id, { territory: e.target.value })}
                          className="w-32 text-xs text-slate-500 border-none bg-transparent h-5 px-0 focus-visible:ring-0"
                          placeholder="Territorio (Norte, Sur, etc.)"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTeam(team.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gerente Responsable</Label>
                    <Select
                      value={team.managerName || ""}
                      onValueChange={(value) => onUpdateTeam(team.id, { managerName: value })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Sin supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">% del Total</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={team.percentageOfTotal}
                        onChange={(e) => {
                          const percentage = parseInt(e.target.value) || 0;
                          onUpdateTeam(team.id, {
                            percentageOfTotal: percentage,
                            annualQuota: Math.round((companyTotal * percentage) / 100),
                          });
                        }}
                        className="h-9 pr-6 text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cuota Anual</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <Input
                        type="number"
                        value={team.annualQuota}
                        onChange={(e) => {
                          const amount = parseInt(e.target.value) || 0;
                          onUpdateTeam(team.id, {
                            annualQuota: amount,
                            percentageOfTotal: Math.round((amount / companyTotal) * 100),
                          });
                        }}
                        className="h-9 pl-5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mensual Estimado</Label>
                    <p className="text-sm font-bold text-indigo-600">
                      {formatCurrency(team.monthlyQuota)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3 h-3" />
                  <span>{team.members.length} vendedores</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validación */}
        {percentageUsed !== 100 && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${percentageUsed === 100 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            {percentageUsed === 100 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${percentageUsed === 100 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {percentageUsed === 100 ? 'Validación exitosa' : 'Validación pendiente'}
              </p>
              <p className={`text-sm ${percentageUsed === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {percentageUsed === 100
                  ? 'La suma de cuotas de equipos coincide con la meta empresarial.'
                  : `La suma de equipos (${percentageUsed}%) no coincide con la meta empresarial (100%). ${remaining > 0 ? `Faltan ${formatCurrency(remaining)} por asignar.` : `Excedente de ${formatCurrency(Math.abs(remaining))}.`}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Gráfico de distribución simple */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Distribución por Equipo</span>
          </div>
          <div className="flex h-8 rounded-full overflow-hidden">
            {teams.map((team, index) => {
              const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
              return (
                <div
                  key={team.id}
                  style={{
                    width: `${team.percentageOfTotal}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                  className="h-full flex items-center justify-center text-xs text-white font-medium"
                  title={`${team.name}: ${team.percentageOfTotal}%`}
                >
                  {team.percentageOfTotal >= 15 && `${team.percentageOfTotal}%`}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {teams.map((team, index) => {
              const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
              return (
                <div key={team.id} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-xs text-slate-600">{team.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={onSave}
          className="w-full gap-2"
          disabled={percentageUsed !== 100}
        >
          <Save className="w-4 h-4" />
          Guardar Asignaciones
        </Button>
      </CardContent>
    </Card>
  );
}

export default TeamAssignment;
