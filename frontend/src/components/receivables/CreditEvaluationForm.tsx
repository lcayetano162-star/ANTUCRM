import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Brain, FileCheck, TrendingUp, Users, Building, AlertCircle, CheckCircle, XCircle, ArrowLeft, Download } from 'lucide-react';
import type { CreditRequest } from '@/types/receivables';

interface CreditEvaluationFormProps {
  request: CreditRequest;
  onApprove: (requestId: string, approvedAmount: number, conditions?: string[], comments?: string) => void;
  onReject: (requestId: string, reason: string) => void;
  onCancel: () => void;
}

export function CreditEvaluationForm({ request, onApprove, onReject, onCancel }: CreditEvaluationFormProps) {
  const [decision, setDecision] = useState<'APPROVE' | 'CONDITIONAL' | 'REJECT' | null>(null);
  const [approvedAmount, setApprovedAmount] = useState(request.requestedAmount);
  const [conditions, setConditions] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PAYMENT_HISTORY':
        return <TrendingUp className="h-4 w-4" />;
      case 'FINANCIAL':
        return <Building className="h-4 w-4" />;
      case 'BEHAVIOR':
        return <Users className="h-4 w-4" />;
      case 'SECTOR':
        return <Building className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PAYMENT_HISTORY':
        return 'Histórico Pagos';
      case 'FINANCIAL':
        return 'Financiero';
      case 'BEHAVIOR':
        return 'Comportamiento';
      case 'SECTOR':
        return 'Sectorial';
      default:
        return category;
    }
  };

  const handleApprove = () => {
    const selectedConditions: string[] = [];
    if (conditions.includes('reduce')) selectedConditions.push(`Monto reducido a ${formatCurrency(approvedAmount)}`);
    if (conditions.includes('guarantee')) selectedConditions.push('Requerir garantía');
    if (conditions.includes('shorten')) selectedConditions.push('Plazo reducido a 15 días');
    if (conditions.includes('review')) selectedConditions.push('Revisión trimestral');

    onApprove(request.id, approvedAmount, selectedConditions, comments);
  };

  const handleReject = () => {
    onReject(request.id, rejectionReason);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Evaluación de Solicitud de Crédito</h2>
          <p className="text-sm text-slate-500">
            Cliente: {request.customerName} | RNC: {request.customerRNC}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información y Análisis IA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Solicitud */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Monto solicitado</Label>
                  <p className="text-lg font-semibold">{formatCurrency(request.requestedAmount)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Solicitado por</Label>
                  <p className="font-medium">{request.requestedBy} (Vendedor)</p>
                </div>
                <div>
                  <Label className="text-slate-500">Fecha de solicitud</Label>
                  <p>{request.requestDate}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Motivo</Label>
                  <p>{request.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis IA */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Análisis IA de Riesgo Crediticio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Principal */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-slate-500">Score Predictivo</p>
                  <p className="text-3xl font-bold text-slate-900">{request.aiScore}/100</p>
                </div>
                <Badge className={`text-lg px-4 py-2 ${getRiskColor(request.riskLevel)}`}>
                  Riesgo {request.riskLevel === 'LOW' ? 'BAJO' : request.riskLevel === 'MEDIUM' ? 'MEDIO' : 'ALTO'}
                </Badge>
              </div>

              {/* Factores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {request.aiFactors.map((factor, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border text-center">
                    <div className="flex justify-center mb-2 text-slate-500">
                      {getCategoryIcon(factor.category)}
                    </div>
                    <p className="text-xs text-slate-500">{getCategoryLabel(factor.category)}</p>
                    <p className={`text-lg font-bold ${factor.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {factor.score}/{factor.maxScore}
                    </p>
                  </div>
                ))}
              </div>

              {/* Factores Clave */}
              <div className="p-4 bg-white rounded-lg border">
                <p className="font-medium mb-2">Factores Clave (Análisis IA):</p>
                <ul className="space-y-1 text-sm">
                  {request.aiFactors.map((factor, idx) => (
                    <li key={idx} className={`flex items-start gap-2 ${factor.positive ? 'text-emerald-700' : 'text-amber-700'}`}>
                      <span>{factor.positive ? '✓' : '⚠'}</span>
                      <span>{factor.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recomendación IA */}
              <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
                <p className="font-medium text-purple-900 mb-1">Recomendación IA:</p>
                <p className="text-sm text-purple-800">{request.aiRecommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documentación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Documentación Requerida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {request.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Checkbox checked={doc.verified} disabled />
                    <span className="flex-1 text-sm font-medium text-slate-700">{doc.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      id="download-btn"
                      className="h-8 w-8 text-slate-500 hover:text-violet-600"
                      onClick={() => {
                        if (!doc.url) {
                          toast.error("El archivo no tiene contenido.");
                          return;
                        }

                        try {
                          const fileName = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;

                          if (doc.url.startsWith('data:')) {
                            const [header, base64Data] = doc.url.split(',');
                            const mimeMatch = header.match(/:(.*?);/);
                            const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';

                            const binaryStr = atob(base64Data);
                            const bytes = new Uint8Array(binaryStr.length);
                            for (let i = 0; i < binaryStr.length; i++) {
                              bytes[i] = binaryStr.charCodeAt(i);
                            }

                            const blob = new Blob([bytes], { type: mimeType });
                            const blobUrl = URL.createObjectURL(blob);

                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = fileName;
                            document.body.appendChild(link);
                            link.click();

                            setTimeout(() => {
                              document.body.removeChild(link);
                              URL.revokeObjectURL(blobUrl);
                            }, 500);

                            toast.success(`Descargando: ${fileName}`);
                          } else {
                            fetch(doc.url)
                              .then(res => res.blob())
                              .then(blob => {
                                const blobUrl = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.style.display = 'none';
                                link.href = blobUrl;
                                link.download = fileName;
                                document.body.appendChild(link);
                                link.click();
                                setTimeout(() => {
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(blobUrl);
                                }, 500);
                                toast.success(`Descargando: ${fileName}`);
                              })
                              .catch(() => {
                                const link = document.createElement('a');
                                link.href = doc.url!;
                                link.download = fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              });
                          }
                        } catch (err) {
                          console.error('Error en descarga:', err);
                          toast.error('Error al procesar el archivo.');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Decisión */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decisión del Analista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opciones de decisión */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={decision === 'APPROVE'}
                    onChange={() => setDecision('APPROVE')}
                    className="h-4 w-4"
                  />
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Aprobar</span>
                </Label>

                <Label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="CONDITIONAL"
                    checked={decision === 'CONDITIONAL'}
                    onChange={() => setDecision('CONDITIONAL')}
                    className="h-4 w-4"
                  />
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Aprobar condicionado</span>
                </Label>

                <Label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={decision === 'REJECT'}
                    onChange={() => setDecision('REJECT')}
                    className="h-4 w-4"
                  />
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Rechazar</span>
                </Label>
              </div>

              <Separator />

              {/* Campos condicionales */}
              {(decision === 'APPROVE' || decision === 'CONDITIONAL') && (
                <div className="space-y-4">
                  <div>
                    <Label>Monto aprobado</Label>
                    <Input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  {decision === 'CONDITIONAL' && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Checkbox
                            checked={conditions.includes('reduce')}
                            onCheckedChange={(checked) => {
                              if (checked) setConditions([...conditions, 'reduce']);
                              else setConditions(conditions.filter(c => c !== 'reduce'));
                            }}
                          />
                          Reducir monto
                        </Label>
                        <Label className="flex items-center gap-2">
                          <Checkbox
                            checked={conditions.includes('guarantee')}
                            onCheckedChange={(checked) => {
                              if (checked) setConditions([...conditions, 'guarantee']);
                              else setConditions(conditions.filter(c => c !== 'guarantee'));
                            }}
                          />
                          Requerir garantía
                        </Label>
                        <Label className="flex items-center gap-2">
                          <Checkbox
                            checked={conditions.includes('shorten')}
                            onCheckedChange={(checked) => {
                              if (checked) setConditions([...conditions, 'shorten']);
                              else setConditions(conditions.filter(c => c !== 'shorten'));
                            }}
                          />
                          Acortar plazo a 15 días
                        </Label>
                        <Label className="flex items-center gap-2">
                          <Checkbox
                            checked={conditions.includes('review')}
                            onCheckedChange={(checked) => {
                              if (checked) setConditions([...conditions, 'review']);
                              else setConditions(conditions.filter(c => c !== 'review'));
                            }}
                          />
                          Revisión trimestral
                        </Label>
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Comentarios</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Agregar comentarios..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    APROBAR CRÉDITO
                  </Button>
                </div>
              )}

              {decision === 'REJECT' && (
                <div className="space-y-4">
                  <div>
                    <Label>Motivo del rechazo</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indicar motivo del rechazo..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleReject}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    RECHAZAR SOLICITUD
                  </Button>
                </div>
              )}

              {!decision && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Seleccione una decisión para continuar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}
