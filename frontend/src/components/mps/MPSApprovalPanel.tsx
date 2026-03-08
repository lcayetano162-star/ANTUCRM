import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, Eye, Loader2, AlertCircle,
  Calendar, User, DollarSign, Package
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { mpsCalculatorApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ApprovalRequest {
  id: string
  oportunidadId: string
  oportunidadName?: string
  quoteData: any
  requestedBy: string
  requestedByName?: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export default function MPSApprovalPanel() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadPendingApprovals()
  }, [])

  const loadPendingApprovals = async () => {
    setIsLoading(true)
    try {
      const response = await mpsCalculatorApi.getPendingApprovals()
      if (response.data.success) {
        setRequests(response.data.data || [])
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar las solicitudes',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setShowDetailDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      const response = await mpsCalculatorApi.approvePriceRequest(
        selectedRequest.id, 
        true, 
        'Aprobado por gerente de ventas'
      )

      if (response.data.success) {
        toast({
          title: 'Aprobado',
          description: 'La solicitud ha sido aprobada correctamente',
          variant: 'success'
        })
        setShowDetailDialog(false)
        loadPendingApprovals()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo aprobar la solicitud',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      const response = await mpsCalculatorApi.approvePriceRequest(
        selectedRequest.id, 
        false, 
        rejectNotes || 'Rechazado por gerente de ventas'
      )

      if (response.data.success) {
        toast({
          title: 'Rechazado',
          description: 'La solicitud ha sido rechazada',
          variant: 'default'
        })
        setShowRejectDialog(false)
        setShowDetailDialog(false)
        setRejectNotes('')
        loadPendingApprovals()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo rechazar la solicitud',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aprobaciones de Precio MPS</h2>
          <p className="text-gray-500">Gestiona las solicitudes de aprobación para niveles de precio especiales</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-800 px-4 py-2 text-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Aprobación</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No hay solicitudes de aprobación pendientes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oportunidad</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Equipos</TableHead>
                  <TableHead>Inversión</TableHead>
                  <TableHead>Cuota Mensual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.oportunidadId}</div>
                      {request.oportunidadName && (
                        <div className="text-sm text-gray-500">{request.oportunidadName}</div>
                      )}
                    </TableCell>
                    <TableCell>{request.requestedByName || request.requestedBy}</TableCell>
                    <TableCell>{formatDate(request.requestedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        {request.quoteData?.gridTotals?.totalEquipos || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        {formatCurrency(request.quoteData?.financialSummary?.inversionHardware || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {formatCurrency(request.quoteData?.financialSummary?.cuotaMensualNegocioFinal || 0)}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetail(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Detalle de Solicitud de Aprobación
                  {getStatusBadge(selectedRequest.status)}
                </DialogTitle>
                <DialogDescription>
                  Oportunidad: {selectedRequest.oportunidadId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Información General */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-gray-500">Solicitado por</Label>
                    <p className="font-medium">{selectedRequest.requestedByName || selectedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha de solicitud</Label>
                    <p className="font-medium">{formatDate(selectedRequest.requestedAt)}</p>
                  </div>
                </div>

                {/* Resumen Financiero */}
                {selectedRequest.quoteData && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Resumen de la Cotización</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Total Equipos</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {selectedRequest.quoteData.gridTotals?.totalEquipos || 0}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Inversión Hardware</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(selectedRequest.quoteData.financialSummary?.inversionHardware || 0)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Cuota Mensual Final</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(selectedRequest.quoteData.financialSummary?.cuotaMensualNegocioFinal || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Equipos */}
                {selectedRequest.quoteData?.items && (
                  <div>
                    <h4 className="font-semibold mb-2">Equipos Cotizados</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Nivel de Precio</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.quoteData.items.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.nivelPrecio === 'precio_lista' ? 'default' : 
                                item.nivelPrecio === 'precio_estrategico' ? 'secondary' : 'destructive'
                              }>
                                {item.nivelPrecio === 'precio_lista' ? 'Lista' : 
                                 item.nivelPrecio === 'precio_estrategico' ? 'Estratégico' : 'Mayorista'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.precioEquipo)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Notas de rechazo si aplica */}
                {selectedRequest.status === 'rejected' && selectedRequest.notes && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <Label className="text-red-700">Motivo del rechazo</Label>
                    <p className="text-red-600 mt-1">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              {selectedRequest.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRejectDialog(true)}
                    className="border-red-500 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprobar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Rechazo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Por favor, indica el motivo del rechazo para que el vendedor pueda ajustar la cotización.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-notes">Motivo del rechazo</Label>
              <Textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Ej: El precio estratégico no está autorizado para esta cantidad de equipos..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
