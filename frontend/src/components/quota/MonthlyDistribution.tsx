// ============================================
// ANTU CRM - Monthly Distribution
// Distribución de cuotas por mes (estacionalidad)
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Sun, Snowflake, Leaf, Save } from 'lucide-react';
import type { MonthlyDistribution, TeamQuota } from '@/types/quota';

interface MonthlyDistributionProps {
  distribution: MonthlyDistribution[];
  teams: TeamQuota[];
  onUpdateDistribution: (month: number, teamId: string, amount: number) => void;
  onSave: () => void;
}

const getSeasonIcon = (month: number) => {
  // Año fiscal Abril-Marzo
  if (month >= 4 && month <= 6) return <Sun className="w-4 h-4 text-amber-500" />; // Primavera
  if (month >= 7 && month <= 9) return <Leaf className="w-4 h-4 text-emerald-500" />; // Verano
  if (month >= 10 && month <= 12) return <TrendingUp className="w-4 h-4 text-indigo-500" />; // Otoño (alta)
  return <Snowflake className="w-4 h-4 text-sky-500" />; // Invierno
};

const getSeasonName = (month: number) => {
  if (month >= 4 && month <= 6) return 'Q1 - Arranque';
  if (month >= 7 && month <= 9) return 'Q2 - Crecimiento';
  if (month >= 10 && month <= 12) return 'Q3 - Temporada Alta';
  return 'Q4 - Cierre';
};

export function MonthlyDistributionPanel({ 
  distribution, 
  teams, 
  onSave 
}: MonthlyDistributionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalPercentage = distribution.reduce((sum, d) => sum + d.percentageOfYear, 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            Configuración de Períodos de Venta
          </CardTitle>
          <Badge variant="outline" className="text-xs">Opcional</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Distribución anual con factores de estacionalidad
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Opciones de distribución */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Ajuste por Temporada/Meses</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors bg-indigo-50 border-indigo-200">
              <input
                type="radio"
                name="seasonality"
                defaultChecked
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm">No, cuotas mensuales iguales</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="seasonality"
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm">Sí, configurar distribución por mes</span>
            </label>
          </div>
        </div>

        {/* Tabla de distribución mensual */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Mes</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase">% Anual</th>
                {teams.map((team) => (
                  <th key={team.id} className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase">
                    {team.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distribution.map((month, index) => {
                const isQuarterStart = index % 3 === 0;
                return (
                  <tr 
                    key={month.month} 
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isQuarterStart ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {getSeasonIcon(month.month)}
                        <div>
                          <p className="font-medium text-slate-700">{month.monthName} &apos;{month.month >= 4 ? '25' : '26'}</p>
                          {isQuarterStart && (
                            <p className="text-xs text-slate-400">{getSeasonName(month.month)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={month.percentageOfYear}
                          className="w-16 text-center"
                          readOnly
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </td>
                    {teams.map((team) => (
                      <td key={team.id} className="py-3 px-2 text-right">
                        <span className="text-sm font-medium text-slate-700">
                          {formatCurrency(month.teamAmounts[team.id] || 0)}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-semibold">
                <td className="py-3 px-2 text-slate-700">TOTAL</td>
                <td className="py-3 px-2 text-center">
                  <Badge variant={totalPercentage === 100 ? 'default' : 'destructive'}>
                    {totalPercentage}%
                  </Badge>
                </td>
                {teams.map((team) => (
                  <td key={team.id} className="py-3 px-2 text-right text-slate-700">
                    {formatCurrency(team.annualQuota)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Factores de estacionalidad */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Factores de Estacionalidad</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Temporada Alta</p>
                <p className="text-xs text-slate-500">Oct-Dic: +20%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Crecimiento</p>
                <p className="text-xs text-slate-500">Jul-Sep: Base</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Arranque</p>
                <p className="text-xs text-slate-500">Abr-Jun: Base</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Temporada Baja</p>
                <p className="text-xs text-slate-500">Feb-Mar: -20%</p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Guardar Distribución Mensual
        </Button>
      </CardContent>
    </Card>
  );
}

export default MonthlyDistributionPanel;
