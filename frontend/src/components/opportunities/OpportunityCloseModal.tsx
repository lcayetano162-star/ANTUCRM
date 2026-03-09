import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditBadge, type CreditStatus } from '@/components/credit/CreditBadge';
import { 
  Lock, CreditCard, CheckCircle, ArrowRight, 
  TrendingUp, DollarSign, Calendar, Users
} from 'lucide-react';

interface OpportunityCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    id: string;
    name: string;
    customerId: string;
    customerName: string;
    value: number;
    stage: string;
  } | null;
  creditInfo: {
    status: CreditStatus;
    limit: number;
    available: number;
    used: number;
  };
  validationResult: {
    canClose: boolean;
    message: string;
    options: string[];
  };
  onConfirmClose: (data: CloseData) => void;
  onRequestCredit: () => void;
  onChangePaymentTerms: () => void;
}

export interface CloseData {
  finalValue: number;
  closeDate: string;
  paymentTerms: 'CREDIT' | 'CASH' | 'MIXED';
  competition: string;
  notes: string;
}

export function OpportunityCloseModal({
  isOpen,
  onClose,
  opportunity,
  creditInfo,
  validationResult,
  onConfirmClose,
  onRequestCredit,
  onChangePaymentTerms: _onChangePaymentTerms,
}: OpportunityCloseModalProps) {
  const [closeData, setCloseData] = useState<CloseData>({
    finalValue: opportunity?.value || 0,
    closeDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'CREDIT',
    competition: '',
    notes: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!opportunity) return null;

  // Si no puede cerrar a crédito, mostrar bloqueo
  if (!validationResult.canClose && closeData.paymentTerms === 'CREDIT') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-6 w-6" />
              Bloqueo de Seguridad - Crédito Requerido
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Oportunidad:</p>
              <p className="font-semibold text-slate-900">{opportunity.name}</p>
              <p className="text-sm text-slate-500">{opportunity.customerName}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">No se puede cerrar a crédito</p>
                  <p className="text-sm text-red-700 mt-1">{validationResult.message}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-slate-700">Opciones para proceder:</p>
              
              {creditInfo.status === 'NONE' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => {
                    onClose();
                    onRequestCredit();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">1. Solicitar Crédito Ahora</p>
                      <p className="text-sm text-slate-500">Demora: 3-5 días hábiles</p>
                    </div>
                  </div>
                </Button>
              )}

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3"
                onClick={() => setCloseData(prev => ({ ...prev, paymentTerms: 'CASH' }))}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 text-emerald-600" />
                  <div className="text-left">
                    <p className="font-medium">
                      {creditInfo.status === 'NONE' ? '2. ' : '1. '}
                      Cambiar a Pago Contado
                    </p>
                    <p className="text-sm text-slate-500">100% anticipado o contra entrega</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3"
                onClick={() => setCloseData(prev => ({ ...prev, paymentTerms: 'MIXED' }))}
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 mt-0.5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">
                      {creditInfo.status === 'NONE' ? '3. ' : '2. '}
                      Pago Mixto
                    </p>
                    <p className="text-sm text-slate-500">Anticipo + crédito (si aplica)</p>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3"
                onClick={onClose}
              >
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 mt-0.5 text-slate-600" />
                  <div className="text-left">
                    <p className="font-medium">
                      {creditInfo.status === 'NONE' ? '4. ' : '3. '}
                      Volver a la Oportunidad
                    </p>
                    <p className="text-sm text-slate-500">Revisar opciones más tarde</p>
                  </div>
                </div>
              </Button>
            </div>

            <div className="pt-4 border-t text-xs text-slate-500">
              <p>
                <strong>Nota:</strong> Esta validación no puede saltarse. 
                Solo el Gerente General puede aprobar excepciones con garantía escrita.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario de cierre normal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Cerrar Oportunidad como Ganada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info de la oportunidad */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Oportunidad:</p>
            <p className="font-semibold text-slate-900">{opportunity.name}</p>
            <p className="text-sm text-slate-500">{opportunity.customerName}</p>
          </div>

          {/* Validación de crédito */}
          {closeData.paymentTerms === 'CREDIT' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900">Validación de crédito exitosa</p>
                  <p className="text-sm text-emerald-700 mt-1">{validationResult.message}</p>
                  
                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Estado:</span>
                      <CreditBadge 
                        status={creditInfo.status}
                        limit={creditInfo.limit}
                        available={creditInfo.available}
                        used={creditInfo.used}
                        size="sm"
                        showDetails={false}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Disponible:</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(creditInfo.available)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Requerido:</span>
                      <span className="font-medium">{formatCurrency(closeData.finalValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor final (DOP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={closeData.finalValue}
                    onChange={(e) => setCloseData(prev => ({ ...prev, finalValue: Number(e.target.value) }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Fecha de cierre</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    value={closeData.closeDate}
                    onChange={(e) => setCloseData(prev => ({ ...prev, closeDate: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Condiciones de pago</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setCloseData(prev => ({ ...prev, paymentTerms: 'CREDIT' }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    closeData.paymentTerms === 'CREDIT' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <p className="font-medium text-sm">Crédito 30 días</p>
                  {validationResult.canClose && closeData.paymentTerms === 'CREDIT' && (
                    <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-xs">✓ Aprobado</Badge>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCloseData(prev => ({ ...prev, paymentTerms: 'CASH' }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    closeData.paymentTerms === 'CASH' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="h-5 w-5 mb-1" />
                  <p className="font-medium text-sm">Contado</p>
                  <p className="text-xs text-slate-500">Desc. 5%</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCloseData(prev => ({ ...prev, paymentTerms: 'MIXED' }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    closeData.paymentTerms === 'MIXED' 
                      ? 'bg-purple-50 border-purple-500 text-purple-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <p className="font-medium text-sm">Mixto</p>
                  <p className="text-xs text-slate-500">50/50</p>
                </button>
              </div>
            </div>

            <div>
              <Label>Competencia vencida</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={closeData.competition}
                  onChange={(e) => setCloseData(prev => ({ ...prev, competition: e.target.value }))}
                  placeholder="Ej: Xerox, Canon, HP"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Notas del cierre</Label>
              <Textarea
                value={closeData.notes}
                onChange={(e) => setCloseData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Detalles importantes del cierre..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Botones */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={() => onConfirmClose(closeData)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Cierre Ganado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
