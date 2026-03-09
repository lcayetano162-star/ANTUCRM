import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft, Phone, Mail, Calendar, DollarSign, FileText,
  AlertTriangle, CheckCircle, TrendingDown, Building,
  MessageSquare, HandshakeIcon, Scale, Send
} from 'lucide-react';
import type { Receivable, CollectionAction } from '@/types/receivables';

interface CollectionManagementProps {
  receivable: Receivable;
  onBack: () => void;
  onAddAction: (receivableId: string, action: Omit<CollectionAction, 'id' | 'date'>) => void;
  onRegisterPayment: (receivableId: string, amount: number, method: string, reference?: string) => void;
  defaultTab?: string;
}

export function CollectionManagement({ receivable, onBack, onAddAction, onRegisterPayment, defaultTab = 'overview' }: CollectionManagementProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(receivable.balance.toString());
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [actionType] = useState<CollectionAction['type']>('PHONE_CALL');
  const [actionDescription, setActionDescription] = useState('');
  const [actionResult, setActionResult] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'CRITICAL':
        return 'text-white bg-red-900 border-red-900';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getEscalationColor = (level: string) => {
    switch (level) {
      case 'STANDARD':
        return 'bg-blue-100 text-blue-800';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800';
      case 'AGGRESSIVE':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getActionIcon = (type: CollectionAction['type']) => {
    switch (type) {
      case 'EMAIL':
      case 'EMAIL_REMINDER':
        return <Mail className="h-4 w-4" />;
      case 'PHONE_CALL':
        return <Phone className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'VISIT':
        return <Building className="h-4 w-4" />;
      case 'FORMAL_LETTER':
      case 'LEGAL_NOTICE':
        return <FileText className="h-4 w-4" />;
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="h-4 w-4" />;
      case 'PAYMENT_AGREEMENT':
        return <HandshakeIcon className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleRegisterPayment = () => {
    onRegisterPayment(receivable.id, Number(paymentAmount), paymentMethod, paymentReference);
    setPaymentDialogOpen(false);
  };

  const handleAddAction = () => {
    onAddAction(receivable.id, {
      type: actionType,
      description: actionDescription,
      result: actionResult,
      performedBy: 'Ana Cobros',
      performedById: 'COL001',
    });
    setActionDialogOpen(false);
    setActionDescription('');
    setActionResult('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de Cobro</h2>
            <p className="text-sm text-slate-500">
              {receivable.invoiceNumber} | {receivable.customerName} | RNC: {receivable.customerRNC}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getRiskColor(receivable.aiPrediction.riskLevel)}>
            {receivable.aiPrediction.riskLevel === 'LOW' ? 'Bajo Riesgo' :
              receivable.aiPrediction.riskLevel === 'MEDIUM' ? 'Riesgo Medio' :
                receivable.aiPrediction.riskLevel === 'HIGH' ? 'Alto Riesgo' : 'Riesgo Crítico'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen & Predicción IA</TabsTrigger>
          <TabsTrigger value="history">Historial de Gestión</TabsTrigger>
          <TabsTrigger value="actions">Acciones Rápidas</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de la Factura */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Información de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Número</Label>
                    <p className="font-medium">{receivable.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Emisión</Label>
                    <p>{receivable.issueDate}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Vencimiento</Label>
                    <p className={receivable.daysOverdue > 0 ? 'text-red-600 font-medium' : ''}>
                      {receivable.dueDate}
                      {receivable.daysOverdue > 0 && ` (vencida ${receivable.daysOverdue} días)`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Estado</Label>
                    <Badge variant={receivable.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                      {receivable.status === 'OVERDUE' ? 'VENCIDA' : receivable.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Monto total</span>
                    <span className="font-medium">{formatCurrency(receivable.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Pagado</span>
                    <span className="text-emerald-600">{formatCurrency(receivable.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="font-medium">Saldo pendiente</span>
                    <span className="text-xl font-bold text-slate-900">{formatCurrency(receivable.balance)}</span>
                  </div>
                </div>

                {receivable.paymentAgreement && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="font-medium text-indigo-900 flex items-center gap-2">
                      <HandshakeIcon className="h-4 w-4" />
                      Acuerdo de Pago Activo
                    </p>
                    <p className="text-sm text-indigo-700 mt-1">
                      {receivable.paymentAgreement.installments} cuotas de {formatCurrency(receivable.paymentAgreement.installmentAmount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Predicción IA */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-purple-600" />
                  Predicción IA de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Probabilidad */}
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500">Probabilidad de pago</span>
                    <Badge className={getRiskColor(receivable.aiPrediction.riskLevel)}>
                      {receivable.aiPrediction.paymentProbability >= 80 ? 'ALTA' :
                        receivable.aiPrediction.paymentProbability >= 50 ? 'MEDIA' : 'BAJA'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${receivable.aiPrediction.paymentProbability >= 80 ? 'bg-emerald-500' :
                            receivable.aiPrediction.paymentProbability >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${receivable.aiPrediction.paymentProbability}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{receivable.aiPrediction.paymentProbability}%</span>
                  </div>
                </div>

                {/* Fecha estimada */}
                {receivable.aiPrediction.estimatedPaymentDate && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Fecha estimada de pago</p>
                      <p className="font-medium">{receivable.aiPrediction.estimatedPaymentDate}</p>
                    </div>
                  </div>
                )}

                {/* Confianza */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <CheckCircle className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Confianza de la predicción</p>
                    <p className="font-medium">{receivable.aiPrediction.confidence}% (basado en {receivable.collectionActions.length} acciones históricas)</p>
                  </div>
                </div>

                {/* Factores de riesgo */}
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Factores de Riesgo Detectados:
                  </p>
                  <ul className="space-y-1 text-sm">
                    {receivable.aiPrediction.riskFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-700">
                        <span>•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nivel de escalamiento */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Nivel de escalamiento recomendado:</span>
                  <Badge className={getEscalationColor(receivable.aiPrediction.escalationLevel)}>
                    {receivable.aiPrediction.escalationLevel === 'STANDARD' ? 'Estándar' :
                      receivable.aiPrediction.escalationLevel === 'MODERATE' ? 'Moderado' :
                        receivable.aiPrediction.escalationLevel === 'AGGRESSIVE' ? 'Agresivo' : 'Urgente'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan de Cobro Recomendado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Plan de Cobro Recomendado por IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{receivable.aiPrediction.recommendedAction}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">HOY</p>
                    <p className="text-sm font-medium">Llamada directa al CFO</p>
                    <p className="text-xs text-slate-500 mt-1">No al contacto usual</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">SI NO PAGA EN 3 DÍAS</p>
                    <p className="text-sm font-medium">Visita presencial</p>
                    <p className="text-xs text-slate-500 mt-1">80% efectividad histórica</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">SI NO PAGA EN 7 DÍAS</p>
                    <p className="text-sm font-medium">Carta formal de cobro</p>
                    <p className="text-xs text-slate-500 mt-1">Mencionar suspensión</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">SI NO PAGA EN 15 DÍAS</p>
                    <p className="text-sm font-medium">Cobro judicial</p>
                    <p className="text-xs text-slate-500 mt-1">Suspender línea de crédito</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Gestión y Comunicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receivable.collectionActions.map((action) => (
                  <div key={action.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center">
                        {getActionIcon(action.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{action.description}</span>
                        <span className="text-sm text-slate-500">{action.date}</span>
                      </div>
                      {action.result && (
                        <p className="text-sm text-slate-600">{action.result}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        Por: {action.performedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Actions */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                      <Phone className="h-6 w-6" />
                      <span>Registrar Llamada</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Llamada</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={actionDescription}
                          onChange={(e) => setActionDescription(e.target.value)}
                          placeholder="Detalles de la llamada..."
                        />
                      </div>
                      <div>
                        <Label>Resultado</Label>
                        <Input
                          value={actionResult}
                          onChange={(e) => setActionResult(e.target.value)}
                          placeholder="Ej: Promesa de pago para..."
                        />
                      </div>
                      <Button onClick={handleAddAction} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Guardar Acción
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Mail className="h-6 w-6" />
                  <span>Enviar Email</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Programar Visita</span>
                </Button>

                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-emerald-500 text-emerald-600">
                      <DollarSign className="h-6 w-6" />
                      <span>Registrar Pago</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Pago</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Monto</Label>
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Método de pago</Label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          <option value="TRANSFER">Transferencia</option>
                          <option value="CHECK">Cheque</option>
                          <option value="CASH">Efectivo</option>
                          <option value="DEPOSIT">Depósito</option>
                          <option value="CARD">Tarjeta</option>
                        </select>
                      </div>
                      <div>
                        <Label>Referencia</Label>
                        <Input
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Número de referencia..."
                        />
                      </div>
                      <Button onClick={handleRegisterPayment} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Registrar Pago
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <HandshakeIcon className="h-6 w-6" />
                  <span>Acuerdo de Pago</span>
                </Button>

                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-red-500 text-red-600">
                  <Scale className="h-6 w-6" />
                  <span>Cobro Judicial</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
