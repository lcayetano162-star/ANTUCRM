// ============================================
// ANTU CRM - Fiscal Year Configuration
// Configuración del año fiscal global
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, AlertTriangle, Save } from 'lucide-react';
import type { FiscalYearConfig } from '@/types/quota';

interface FiscalYearConfigProps {
  config: FiscalYearConfig;
  onUpdate: (updates: Partial<FiscalYearConfig>) => void;
  onSave: () => void;
}

const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export function FiscalYearConfigPanel({ config, onUpdate, onSave }: FiscalYearConfigProps) {
  const isCustom = config.type === 'CUSTOM';

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            Configuración Global del Año Fiscal
          </CardTitle>
          <Badge variant="outline" className="text-xs">Solo Administrador</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de año fiscal */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Tipo de Año Fiscal</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="fiscalYearType"
                checked={!isCustom}
                onChange={() => onUpdate({ type: 'CALENDAR' })}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm">Calendario (Enero - Diciembre)</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="fiscalYearType"
                checked={isCustom}
                onChange={() => onUpdate({ type: 'CUSTOM' })}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm">Personalizado</span>
            </label>
          </div>
        </div>

        {/* Configuración personalizada */}
        {isCustom && (
          <div className="p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Inicio Año Fiscal</Label>
                <Select
                  value={config.startMonth.toString()}
                  onValueChange={(value) => onUpdate({ startMonth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Día de inicio</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={config.startDay}
                  onChange={(e) => onUpdate({ startDay: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-slate-400">↓</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Fin Año Fiscal</Label>
                <Select
                  value={config.endMonth.toString()}
                  onValueChange={(value) => onUpdate({ endMonth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Día de fin</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={config.endDay}
                  onChange={(e) => onUpdate({ endDay: parseInt(e.target.value) || 31 })}
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm font-medium text-indigo-800">
                Año Fiscal {config.year}
              </p>
              <p className="text-sm text-indigo-600">
                {config.startDay} de {months.find(m => m.value === config.startMonth)?.label} {config.year - 1} - {config.endDay} de {months.find(m => m.value === config.endMonth)?.label} {config.year}
              </p>
            </div>
          </div>
        )}

        {/* Períodos de planificación */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Períodos de Planificación</Label>
          <Select
            value="MONTHLY"
            onValueChange={(value) => console.log(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Mensual (12 períodos)</SelectItem>
              <SelectItem value="QUARTERLY">Trimestral (4 períodos)</SelectItem>
              <SelectItem value="SEMESTER">Semestral (2 períodos)</SelectItem>
              <SelectItem value="CUSTOM">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Moneda base */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Moneda Base para Cuotas</Label>
          <Select defaultValue="USD">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="DOP">DOP (RD$)</SelectItem>
              <SelectItem value="MXN">MXN ($)</SelectItem>
              <SelectItem value="COP">COP ($)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Todas las cuotas se guardan en USD, se muestran en moneda local según preferencia del usuario
          </p>
        </div>

        {/* Alerta */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Importante</p>
            <p className="text-sm text-amber-700">
              Cambiar el año fiscal afectará todos los reportes históricos y proyecciones. 
              Proceder con precaución.
            </p>
          </div>
        </div>

        <Button onClick={onSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Guardar Configuración Global
        </Button>
      </CardContent>
    </Card>
  );
}

export default FiscalYearConfigPanel;
