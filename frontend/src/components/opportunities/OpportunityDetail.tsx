import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OpportunityCreditPanel } from '@/components/credit/OpportunityCreditPanel';
import type { CreditStatus } from '@/components/credit/CreditBadge';
import {
  ArrowLeft, Edit, CheckCircle, Phone, Mail,
  Calendar, User, Building2, FileText,
  MessageSquare, TrendingUp, Clock, AlertCircle,
  Package, Truck, RefreshCw, AlertTriangle
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  createdBy: string;
  createdAt: string;
}

interface OpportunityDetailProps {
  opportunity: {
    id: string;
    name: string;
    company: string;
    customerId: string;
    value: number;
    probability: number;
    stage: string;
    expectedCloseDate: string;
    assignedTo: string;
    assignedToId?: string;
    lastActivity: string;
    aiScore: number;
    description?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
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
  erpStatus?: {
    status: 'pending' | 'syncing' | 'success' | 'failed';
    invoiceNumber?: string;
    inventoryStatus?: string;
    dispatchStatus?: string;
    lastSyncAttempt?: string;
    errorMessage?: string;
  };
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
  activities?: Activity[];
  onBack: () => void;
  onEdit: () => void;
  onClose: () => void;
  onRequestCredit: () => void;
  onContactCustomer: () => void;
  onRetrySync?: () => void;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'call',
    description: 'Llamada de seguimiento - Cliente interesado en propuesta',
    createdBy: 'María González',
    createdAt: '2026-02-28T14:30:00',
  },
  {
    id: '2',
    type: 'email',
    description: 'Cotización enviada por correo',
    createdBy: 'María González',
    createdAt: '2026-02-27T10:15:00',
  },
  {
    id: '3',
    type: 'meeting',
    description: 'Reunión de presentación de producto',
    createdBy: 'Juan Pérez',
    createdAt: '2026-02-25T09:00:00',
  },
  {
    id: 'erp-1',
    type: 'status_change',
    description: 'ERP: Estatus cambiado a PICKING_IN_PROGRESS',
    createdBy: 'Sistema ERP',
    createdAt: '2026-03-03T10:30:00',
  },
  {
    id: '4',
    type: 'status_change',
    description: 'Estado cambiado de "Contactado" a "Propuesta"',
    createdBy: 'María González',
    createdAt: '2026-02-24T16:45:00',
  },
];

export function OpportunityDetail({
  opportunity,
  creditInfo,
  validationResult,
  erpStatus = {
    status: 'failed',
    errorMessage: 'Connection timeout with external ERP system (SAP_CONN_ERR_504)',
  }, // Default mock logic to showcase the new feature
  currentUser = { id: 'user-1', name: 'Ejecutivo de Ventas', role: 'admin' },
  activities = MOCK_ACTIVITIES,
  onBack,
  onEdit,
  onClose,
  onRequestCredit,
  onContactCustomer,
  onRetrySync,
}: OpportunityDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-slate-100 text-slate-700';
      case 'contacted': return 'bg-sky-100 text-sky-700';
      case 'proposal': return 'bg-blue-100 text-blue-700';
      case 'negotiation': return 'bg-violet-100 text-violet-700';
      case 'closed-won': return 'bg-emerald-100 text-emerald-700';
      case 'closed-lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'new': return 'Nuevo Lead';
      case 'contacted': return 'Contactado';
      case 'proposal': return 'Propuesta';
      case 'negotiation': return 'Negociación';
      case 'closed-won': return 'Ganado';
      case 'closed-lost': return 'Perdido';
      default: return stage;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <User className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      case 'status_change': return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-600';
      case 'email': return 'bg-emerald-100 text-emerald-600';
      case 'meeting': return 'bg-violet-100 text-violet-600';
      case 'note': return 'bg-amber-100 text-amber-600';
      case 'status_change': return 'bg-slate-100 text-slate-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    if (score >= 60) return 'bg-amber-100 text-amber-600 border-amber-200';
    return 'bg-rose-100 text-rose-600 border-rose-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    if (score >= 60) return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{opportunity.name}</h1>
            <p className="text-slate-500">{opportunity.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          {opportunity.stage !== 'closed-won' && opportunity.stage !== 'closed-lost' && (
            <Button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Cerrar como Ganada
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="col-span-2 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-1">Estado</p>
                <Badge className={getStageColor(opportunity.stage)}>
                  {getStageLabel(opportunity.stage)}
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-1">Valor</p>
                <p className="font-semibold text-slate-800">{formatCurrency(opportunity.value)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-1">Probabilidad</p>
                <p className="font-semibold text-slate-800">{opportunity.probability}%</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-1">Cierre Esperado</p>
                <p className="font-semibold text-slate-800">{formatDate(opportunity.expectedCloseDate)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="activities">Actividades</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* AI Score */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Puntuación IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${getScoreColor(opportunity.aiScore)}`}>
                      <span className="text-xl font-bold">{opportunity.aiScore}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getScoreIcon(opportunity.aiScore)}
                        <span className="font-medium">
                          {opportunity.aiScore >= 80 ? 'Alta probabilidad de cierre' :
                            opportunity.aiScore >= 60 ? 'Probabilidad media' : 'Requiere atención'}
                        </span>
                      </div>
                      <Progress value={opportunity.aiScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{opportunity.contactName || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{opportunity.contactEmail || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{opportunity.contactPhone || 'No especificado'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {opportunity.description && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Descripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{opportunity.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activities">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Historial de Actividades
                    </CardTitle>
                    <Button size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Nueva Actividad
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 pb-4 border-b border-slate-100">
                            <p className="text-slate-800">{activity.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span>{activity.createdBy}</span>
                              <span>•</span>
                              <span>{new Date(activity.createdAt).toLocaleString('es-DO')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No hay documentos adjuntos</p>
                  <Button variant="outline" className="mt-4">
                    Subir Documento
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Credit Panel & Actions */}
        <div className="space-y-6">
          {/* Módulo ERP: Logística y Facturación (Solo visible/relevante si está ganada) */}
          {opportunity.stage === 'closed-won' && (
            <Card className="border-indigo-100 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-indigo-50/50 border-b border-indigo-100">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    Logística y Facturación
                  </div>
                  {erpStatus?.status === 'success' && <Badge className="bg-emerald-100 text-emerald-700">Sincronizado</Badge>}
                  {erpStatus?.status === 'failed' && <Badge className="bg-rose-100 text-rose-700">Fallo ERP</Badge>}
                  {erpStatus?.status === 'syncing' && <Badge className="bg-amber-100 text-amber-700">Enviando...</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {erpStatus?.status === 'failed' ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-900 text-sm mb-1">Error de conexión ERP</p>
                        <p className="text-rose-700 text-xs">{erpStatus.errorMessage || 'Timeout al facturar en el ERP.'}</p>
                      </div>
                    </div>
                    {/* Solo visible para el dueño o gerencia/admin */}
                    {(currentUser?.id === opportunity.assignedToId || currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'TENANT_ADMIN') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                        onClick={onRetrySync}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-intentar Sincronización
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Nº de Factura</span>
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{erpStatus?.invoiceNumber || 'Generando...'}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Almacén (Picking)</span>
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{erpStatus?.inventoryStatus || 'Pendiente'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Despacho</span>
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{erpStatus?.dispatchStatus || 'Pendiente'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Credit Validation Panel */}
          <OpportunityCreditPanel
            opportunityAmount={opportunity.value}
            creditStatus={creditInfo.status}
            creditLimit={creditInfo.limit}
            creditAvailable={creditInfo.available}
            creditUsed={creditInfo.used}
            validationResult={validationResult}
            onRequestCredit={onRequestCredit}
            onContactCustomer={onContactCustomer}
          />

          {/* Assigned To */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Asignado a</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{opportunity.assignedTo}</p>
                  <p className="text-sm text-slate-500">Ejecutivo de Ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4 mr-2" />
                Registrar Llamada
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Reunión
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Generar Cotización
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
