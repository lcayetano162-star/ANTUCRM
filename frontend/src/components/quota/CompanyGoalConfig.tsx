// ============================================
// ANTU CRM - Company Goal Configuration
// Meta empresarial y distribución
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, Users, Target, Save, CheckCircle2 } from 'lucide-react';
import type { CompanyGoal } from '@/types/quota';

interface CompanyGoalConfigProps {
  goal: CompanyGoal;
  onUpdate: (updates: Partial<CompanyGoal>) => void;
  onUpdateRevenueType: (id: string, percentage: number) => void;
  onSave: () => void;
}

export function CompanyGoalConfig({ goal, onUpdate, onUpdateRevenueType, onSave }: CompanyGoalConfigProps) {
  const totalRevenuePercentage = goal.revenueTypes.reduce((sum, rt) => sum + rt.percentage, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            Meta Global de la Empresa
          </CardTitle>
          <Badge variant="outline" className="text-xs">Admin / Gerente General</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ingreso Total Objetivo */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Ingreso Total Objetivo</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
            <Input
              type="number"
              value={goal.totalRevenue}
              onChange={(e) => onUpdate({ totalRevenue: parseInt(e.target.value) || 0 })}
              className="pl-8 text-lg font-semibold"
            />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(goal.totalRevenue)}
          </p>
        </div>

        {/* Desglose por tipo de ingreso */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Desglose por Tipo de Ingreso</Label>
            <Badge 
              variant={totalRevenuePercentage === 100 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {totalRevenuePercentage === 100 ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> 100%</>
              ) : (
                `Suma: ${totalRevenuePercentage}%`
              )}
            </Badge>
          </div>

          <div className="space-y-3">
            {goal.revenueTypes.map((rt) => (
              <div key={rt.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700">{rt.name}</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatCurrency(rt.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={rt.percentage}
                      onChange={(e) => onUpdateRevenueType(rt.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <span className="text-sm text-slate-500">%</span>
                  <div className="flex-1">
                    <Progress value={rt.percentage} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por región */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Distribución por Región/Mercado</Label>
            <span className="text-xs text-slate-500">Opcional</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {goal.regions.map((region) => (
              <div key={region.id} className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-700 mb-1">{region.name}</p>
                <p className="text-lg font-bold text-slate-800">{formatCurrency(region.amount)}</p>
                <p className="text-xs text-slate-500">({region.percentage}%)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Metas de actividad globales */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-slate-700">Metas de Actividades Globales (Benchmarks)</Label>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg text-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-700">{goal.activityBenchmarks.callsPerMonth}</p>
              <p className="text-xs text-slate-600">Llamadas/vendedor/mes</p>
            </div>
            
            <div className="p-4 bg-violet-50 rounded-lg text-center">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-violet-700">{goal.activityBenchmarks.meetingsPerMonth}</p>
              <p className="text-xs text-slate-600">Reuniones/vendedor/mes</p>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-lg text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{goal.activityBenchmarks.opportunitiesPerMonth}</p>
              <p className="text-xs text-slate-600">Oportunidades nuevas/mes</p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{goal.activityBenchmarks.conversionRateTarget}%</p>
              <p className="text-xs text-slate-600">Tasa de conversión objetivo</p>
            </div>
          </div>
        </div>

        <Button onClick={onSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Guardar Meta Empresarial
        </Button>
      </CardContent>
    </Card>
  );
}

export default CompanyGoalConfig;
