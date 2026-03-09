import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditBadge, type CreditStatus } from './CreditBadge';
import { Lock, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';

interface OpportunityCreditValidatorProps {
  opportunityAmount: number;
  creditStatus: CreditStatus;
  creditLimit: number;
  creditAvailable: number;
  creditUsed: number;
  validationResult: {
    canClose: boolean;
    message: string;
    options: string[];
  };
  onRequestCredit: () => void;
  onChangePaymentTerms: () => void;
  onConfirmClose: () => void;
}

export function OpportunityCreditValidator({
  opportunityAmount,
  creditStatus,
  creditLimit,
  creditAvailable,
  creditUsed,
  validationResult,
  onRequestCredit,
  onChangePaymentTerms,
  onConfirmClose,
}: OpportunityCreditValidatorProps) {
  const [showBlockModal, setShowBlockModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Si no puede cerrar, mostrar el bloqueo
  if (!validationResult.canClose) {
    return (
      <>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">No se puede cerrar a crédito</p>
              <p className="text-sm text-red-700 mt-1">{validationResult.message}</p>
              
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBlockModal(true)}
                >
                  Ver opciones
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Lock className="h-6 w-6" />
                Bloqueo de Seguridad - Crédito Requerido
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-slate-600">
                No se puede cerrar esta oportunidad como <strong>"Ganada a Crédito"</strong>:
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">{validationResult.message}</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-slate-700">Opciones para proceder:</p>
                
                {creditStatus === 'NONE' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                    onClick={() => {
                      setShowBlockModal(false);
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
                  onClick={() => {
                    setShowBlockModal(false);
                    onChangePaymentTerms();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-medium">
                        {creditStatus === 'NONE' ? '2. ' : '1. '}
                        Cambiar a Pago Contado
                      </p>
                      <p className="text-sm text-slate-500">O anticipo parcial</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setShowBlockModal(false)}
                >
                  <div className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 mt-0.5 text-slate-600" />
                    <div className="text-left">
                      <p className="font-medium">
                        {creditStatus === 'NONE' ? '3. ' : '2. '}
                        Volver a la Oportunidad
                      </p>
                      <p className="text-sm text-slate-500">Revisar opciones</p>
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
      </>
    );
  }

  // Si puede cerrar, mostrar confirmación
  return (
    <div className="space-y-4">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-emerald-900">Validación de crédito exitosa</p>
            <p className="text-sm text-emerald-700 mt-1">{validationResult.message}</p>
            
            <div className="mt-3 p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Estado del crédito:</span>
                <CreditBadge 
                  status={creditStatus} 
                  limit={creditLimit}
                  available={creditAvailable}
                  used={creditUsed}
                  size="sm"
                  showDetails={false}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Disponible:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(creditAvailable)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Requerido:</span>
                <span className="font-medium">{formatCurrency(opportunityAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={onConfirmClose}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Confirmar Cierre Ganado
      </Button>
    </div>
  );
}
