// ============================================
// ANTU CRM - Seller Assignment
// Asignación de cuotas a vendedores individuales
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
import { User, Plus, Trash2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import type { SellerQuota, TeamQuota, SellerLevel } from '@/types/quota';

interface SellerAssignmentProps {
  sellers: SellerQuota[];
  teams: TeamQuota[];
  onUpdateSeller: (id: string, updates: Partial<SellerQuota>) => void;
  onAddSeller: (teamId: string) => void;
  onRemoveSeller: (id: string) => void;
  onSave: () => void;
}

const sellerLevels: { value: SellerLevel; label: string }[] = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'ELITE', label: 'Elite' },
];

const managers = [
  'Eduardo Sanchez',
  'Marlin Ramos',
  'Ricardo Alarcon',
  'Sofia Vergara',
  'Gerente General'
];

export function SellerAssignment({
  sellers,
  teams,
  onUpdateSeller,
  onAddSeller,
  onRemoveSeller,
  onSave
}: SellerAssignmentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {teams.map((team) => {
        const teamSellers = sellers.filter((s) => s.teamId === team.id);
        const teamTotal = teamSellers.reduce((sum, s) => sum + s.annualQuota, 0);
        const percentageUsed = Math.round((teamTotal / team.annualQuota) * 100);
        const remaining = team.annualQuota - teamTotal;

        return (
          <Card key={team.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {team.name} - Asignación Individual
                </CardTitle>
                <Badge variant="outline" className="text-xs">Meta: {formatCurrency(team.annualQuota)}</Badge>
              </div>
              <p className="text-sm text-slate-500">
                <span className={remaining === 0 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {remaining === 0 ? ' Asignación completa' : ` Faltan ${formatCurrency(remaining)} para cubrir la meta del equipo.`}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progreso del equipo */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Representatividad en el equipo</span>
                  <span className={percentageUsed === 100 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {percentageUsed}%
                  </span>
                </div>
                <Progress value={percentageUsed} className="h-2" />
              </div>

              {/* Vendedores del equipo */}
              <div className="space-y-3">
                {teamSellers.map((seller) => (
                  <div key={seller.id} className="p-4 border rounded-lg bg-white hover:border-indigo-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                          <span className="text-base font-bold text-slate-600">
                            {seller.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <Input
                            value={seller.name}
                            onChange={(e) => onUpdateSeller(seller.id, { name: e.target.value })}
                            className="w-48 font-bold text-slate-800 border-none bg-transparent h-7 px-0 focus-visible:ring-0 mb-0"
                            placeholder="Nombre del Vendedor"
                          />
                          <Input
                            value={seller.email}
                            onChange={(e) => onUpdateSeller(seller.id, { email: e.target.value })}
                            className="w-56 text-xs text-slate-500 border-none bg-transparent h-5 px-0 focus-visible:ring-0"
                            placeholder="email@empresa.com"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveSeller(seller.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equipo</Label>
                        <Select
                          value={seller.teamId}
                          onValueChange={(value) => onUpdateSeller(seller.id, { teamId: value })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gerente / Supervisor</Label>
                        <Select
                          value={seller.managerName || ""}
                          onValueChange={(value) => onUpdateSeller(seller.id, { managerName: value })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Sin asignar" />
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
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nivel</Label>
                        <Select
                          value={seller.level}
                          onValueChange={(value) => onUpdateSeller(seller.id, { level: value as SellerLevel })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sellerLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">% vs Equipo</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={seller.percentageOfTeam}
                            onChange={(e) => {
                              const percentage = parseInt(e.target.value) || 0;
                              onUpdateSeller(seller.id, {
                                percentageOfTeam: percentage,
                                annualQuota: Math.round((team.annualQuota * percentage) / 100),
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
                            value={seller.annualQuota}
                            onChange={(e) => {
                              const amount = parseInt(e.target.value) || 0;
                              onUpdateSeller(seller.id, {
                                annualQuota: amount,
                                percentageOfTeam: Math.round((amount / team.annualQuota) * 100),
                              });
                            }}
                            className="h-9 pl-5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mensual Estimado</Label>
                        <p className="text-sm font-bold text-indigo-600">
                          {formatCurrency(seller.monthlyQuota)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agregar vendedor */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddSeller(team.id)}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Asignar nuevo vendedor a {team.name}
              </Button>

              {/* Validación del equipo */}
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
                      ? `La suma de vendedores coincide con la cuota del equipo.`
                      : `La suma de vendedores (${percentageUsed}%) no coincide con la cuota del equipo (100%).`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button onClick={onSave} className="w-full gap-2">
        <TrendingUp className="w-4 h-4" />
        Guardar Cuotas Individuales
      </Button>
    </div>
  );
}

export default SellerAssignment;
