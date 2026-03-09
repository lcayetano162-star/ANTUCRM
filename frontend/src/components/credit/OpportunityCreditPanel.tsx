import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditBadge, type CreditStatus } from './CreditBadge';
import { CheckCircle, Lock, CreditCard, ArrowRight, AlertTriangle, Phone } from 'lucide-react';

interface OpportunityCreditPanelProps {
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
  onContactCustomer: () => void;
}

export function OpportunityCreditPanel({
  opportunityAmount,
  creditStatus,
  creditLimit,
  creditAvailable,
  creditUsed,
  validationResult,
  onRequestCredit,
  onContactCustomer,
}: OpportunityCreditPanelProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const usagePercentage = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  return (
    <Card className={validationResult.canClose ? 'border-emerald-200' : 'border-amber-200'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Validación de Crédito
          {validationResult.canClose ? (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del crédito */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Estado del crédito:</span>
          <CreditBadge 
            status={creditStatus} 
            limit={creditLimit}
            available={creditAvailable}
            used={creditUsed}
            size="sm"
          />
        </div>

        {/* Barra de uso */}
        {creditLimit > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Uso del crédito</span>
              <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  usagePercentage > 90 ? 'bg-red-500' : 
                  usagePercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Utilizado: {formatCurrency(creditUsed)}</span>
              <span>Límite: {formatCurrency(creditLimit)}</span>
            </div>
          </div>
        )}

        {/* Validación de monto */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500">Monto de oportunidad:</span>
            <span className="font-semibold">{formatCurrency(opportunityAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Crédito disponible:</span>
            <span className={`font-semibold ${creditAvailable >= opportunityAmount ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(creditAvailable)}
            </span>
          </div>
        </div>

        {/* Alerta de validación */}
        <Alert variant={validationResult.canClose ? 'default' : 'destructive'} className={validationResult.canClose ? 'bg-emerald-50 border-emerald-200' : ''}>
          {validationResult.canClose ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <AlertTitle className={validationResult.canClose ? 'text-emerald-900' : ''}>
            {validationResult.canClose ? 'Crédito verificado' : 'No se puede cerrar a crédito'}
          </AlertTitle>
          <AlertDescription className={validationResult.canClose ? 'text-emerald-700' : ''}>
            {validationResult.message}
          </AlertDescription>
        </Alert>

        {/* Opciones si no puede cerrar */}
        {!validationResult.canClose && validationResult.options.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Opciones para proceder:</p>
            <div className="space-y-2">
              {validationResult.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-slate-400">{idx + 1}.</span>
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          {!validationResult.canClose && creditStatus === 'NONE' && (
            <Button onClick={onRequestCredit} className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Solicitar Crédito Ahora
            </Button>
          )}
          
          {!validationResult.canClose && creditStatus === 'PENDING' && (
            <Button variant="outline" onClick={onContactCustomer} className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Contactar Cliente
            </Button>
          )}

          {validationResult.canClose && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg flex-1 justify-center">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Listo para cerrar a crédito</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para el bloqueo de cierre
interface CreditBlockModalProps {
  isOpen: boolean;
  validationResult: {
    canClose: boolean;
    message: string;
    options: string[];
  };
  onRequestCredit: () => void;
  onChangePaymentTerms: () => void;
  onCancel: () => void;
}

export function CreditBlockModal({
  isOpen,
  validationResult,
  onRequestCredit,
  onChangePaymentTerms,
  onCancel,
}: CreditBlockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <Lock className="h-8 w-8" />
          <h2 className="text-xl font-bold">Bloqueo de Seguridad - Crédito Requerido</h2>
        </div>

        <p className="text-slate-600">
          No se puede cerrar esta oportunidad como <strong>"Ganada a Crédito"</strong>:
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{validationResult.message}</p>
        </div>

        <div className="space-y-3">
          <p className="font-medium text-slate-700">Opciones para proceder:</p>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-left h-auto py-3"
              onClick={onRequestCredit}
            >
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium">1. Solicitar Crédito Ahora</p>
                  <p className="text-sm text-slate-500">Demora: 3-5 días hábiles. Se notificará al analista.</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-left h-auto py-3"
              onClick={onChangePaymentTerms}
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-medium">2. Cambiar Condiciones de Pago</p>
                  <p className="text-sm text-slate-500">Contado, anticipo parcial, o financiamiento externo.</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-left h-auto py-3"
              onClick={onCancel}
            >
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 mt-0.5 text-slate-600" />
                <div>
                  <p className="font-medium">3. Volver a la Oportunidad</p>
                  <p className="text-sm text-slate-500">Revisar opciones o esperar aprobación de crédito.</p>
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t text-xs text-slate-500">
          <p>
            <strong>Nota:</strong> Esta validación no puede saltarse. 
            Solo el Gerente General puede aprobar excepciones con garantía escrita.
          </p>
        </div>
      </div>
    </div>
  );
}
