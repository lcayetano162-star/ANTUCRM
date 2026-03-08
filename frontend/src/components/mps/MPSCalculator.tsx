import { useState, useEffect, useCallback } from 'react'
import { 
  Calculator, Plus, Trash2, Save, Send, AlertCircle, 
  CheckCircle, Clock, ArrowLeft, FileText, Loader2,
  Settings, Eye, XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { mpsCalculatorApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

// Tipos
export type PriceLevel = 'precio_lista' | 'precio_estrategico' | 'precio_mayorista'
export type BusinessMode = 'renta' | 'venta' | 'leasing'

export interface MPSItem {
  id: string
  codigo: string
  descripcion: string
  nivelPrecio: PriceLevel
  precioEquipo: number
  cxcBN: number
  volumenBN: number
  cxcColor: number
  volumenColor: number
  // Calculados
  servicioBN?: number
  servicioColor?: number
  mensualidadHardware?: number
  mensualidadNegocio?: number
}

export interface MPSQuoteResult {
  id: string
  oportunidadId: string
  fechaCreacion: string
  items: MPSItem[]
  gridTotals: {
    totalEquipos: number
    totalPrecioEquipos: number
    totalServicioBN: number
    totalServicioColor: number
    totalMensualidadHardware: number
    totalMensualidadNegocio: number
  }
  financialSummary: {
    periodoMeses: number
    modalidad: BusinessMode
    totalServicios: number
    inversionHardware: number
    tasaInteresAnual: number
    tasaInteresMensual: number
    cuotaHardwareFinanciado: number
    cuotaMensualNegocioFinal: number
  }
}

export interface MPSConfig {
  enabled: boolean
  requireApprovalFor: PriceLevel[]
  defaultTasaInteres: number
  defaultPlazo: number
}

interface MPSCalculatorProps {
  opportunityId?: string
  opportunityName?: string
  onBack?: () => void
  onQuoteGenerated?: (quoteData: any) => void
}

const PRICE_LEVELS: Record<PriceLevel, { label: string; requiresApproval: boolean }> = {
  precio_lista: { label: 'Precio de Lista', requiresApproval: false },
  precio_estrategico: { label: 'Precio Estratégico', requiresApproval: true },
  precio_mayorista: { label: 'Precio Mayorista', requiresApproval: true }
}

const BUSINESS_MODES: Record<BusinessMode, string> = {
  renta: 'Renta',
  venta: 'Venta',
  leasing: 'Leasing'
}

// Item vacío para agregar nuevos
const emptyItem: Omit<MPSItem, 'id'> = {
  codigo: '',
  descripcion: '',
  nivelPrecio: 'precio_lista',
  precioEquipo: 0,
  cxcBN: 0,
  volumenBN: 0,
  cxcColor: 0,
  volumenColor: 0
}

export default function MPSCalculator({ 
  opportunityId: initialOpportunityId = '', 
  opportunityName = '',
  onBack,
  onQuoteGenerated 
}: MPSCalculatorProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  // Configuración del módulo
  const [config, setConfig] = useState<MPSConfig>({
    enabled: true,
    requireApprovalFor: ['precio_estrategico', 'precio_mayorista'],
    defaultTasaInteres: 16,
    defaultPlazo: 36
  })

  // Estado del formulario
  const [oportunidadId, setOportunidadId] = useState(initialOpportunityId)
  const [modalidad, setModalidad] = useState<BusinessMode>('renta')
  const [plazoMeses, setPlazoMeses] = useState(36)
  const [tasaInteres, setTasaInteres] = useState(16)
  const [items, setItems] = useState<MPSItem[]>([])
  
  // Estado de cálculo
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationResult, setCalculationResult] = useState<MPSQuoteResult | null>(null)
  
  // Estado de aprobaciones
  const [pendingApproval, setPendingApproval] = useState(false)
  const [approvalRequest, setApprovalRequest] = useState<any>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  
  // Estado de guardado
  const [isSaving, setIsSaving] = useState(false)

  // Cargar configuración al inicio
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await mpsCalculatorApi.getConfig()
      if (response.data) {
        setConfig(response.data)
        setTasaInteres(response.data.defaultTasaInteres)
        setPlazoMeses(response.data.defaultPlazo)
      }
    } catch (error) {
      // Usar valores por defecto si no hay config
    }
  }

  // Agregar item
  const addItem = () => {
    const newItem: MPSItem = {
      ...emptyItem,
      id: crypto.randomUUID()
    }
    setItems([...items, newItem])
  }

  // Eliminar item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    // Limpiar resultado si se modifica la tabla
    if (calculationResult) {
      setCalculationResult(null)
    }
  }

  // Actualizar item
  const updateItem = (id: string, field: keyof MPSItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    // Limpiar resultado si se modifica la tabla
    if (calculationResult) {
      setCalculationResult(null)
    }
  }

  // Verificar si requiere aprobación
  const requiresApproval = useCallback((): boolean => {
    return items.some(item => 
      config.requireApprovalFor.includes(item.nivelPrecio)
    )
  }, [items, config])

  // Calcular cotización
  const handleCalculate = async () => {
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un equipo',
        variant: 'destructive'
      })
      return
    }

    if (!oportunidadId.trim()) {
      toast({
        title: 'Error',
        description: 'Debes especificar el ID de oportunidad',
        variant: 'destructive'
      })
      return
    }

    // Validar que todos los items tengan código y precio
    const invalidItems = items.filter(item => !item.codigo.trim() || item.precioEquipo <= 0)
    if (invalidItems.length > 0) {
      toast({
        title: 'Error',
        description: 'Todos los equipos deben tener código y precio válido',
        variant: 'destructive'
      })
      return
    }

    setIsCalculating(true)
    try {
      const requestData = {
        oportunidadId,
        modalidad,
        plazoMeses,
        tasaInteresAnual: tasaInteres,
        items: items.map(({ id, ...item }) => ({
          codigo: item.codigo,
          descripcion: item.descripcion,
          nivelPrecio: item.nivelPrecio,
          precioEquipo: item.precioEquipo,
          cxcBN: item.cxcBN,
          volumenBN: item.volumenBN,
          cxcColor: item.cxcColor,
          volumenColor: item.volumenColor
        }))
      }

      const response = await mpsCalculatorApi.calculate(requestData)
      
      if (response.data.success) {
        setCalculationResult(response.data.data)
        
        // Actualizar items con valores calculados
        setItems(response.data.data.items)
        
        toast({
          title: 'Éxito',
          description: 'Cotización calculada correctamente',
          variant: 'success'
        })

        // Verificar si requiere aprobación
        if (requiresApproval() && !isManager) {
          setPendingApproval(true)
          toast({
            title: 'Aprobación requerida',
            description: 'Esta cotización requiere aprobación del gerente por nivel de precio',
            variant: 'default'
          })
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al calcular la cotización',
        variant: 'destructive'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Solicitar aprobación
  const handleRequestApproval = async () => {
    if (!calculationResult) return

    setIsSaving(true)
    try {
      const response = await mpsCalculatorApi.requestPriceApproval({
        oportunidadId,
        quoteData: calculationResult,
        requestedBy: user?.id,
        requestedAt: new Date().toISOString()
      })

      if (response.data.success) {
        setApprovalRequest(response.data.data)
        toast({
          title: 'Solicitud enviada',
          description: 'La solicitud de aprobación ha sido enviada al gerente',
          variant: 'success'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al solicitar aprobación',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Generar cotización final
  const handleGenerateQuote = async () => {
    if (!calculationResult) return

    // Verificar aprobación si es necesario
    if (requiresApproval() && !isManager && !approvalRequest?.approved) {
      toast({
        title: 'Aprobación pendiente',
        description: 'Debes esperar la aprobación del gerente antes de generar la cotización',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await mpsCalculatorApi.saveQuote({
        ...calculationResult,
        approvalRequestId: approvalRequest?.id,
        generatedBy: user?.id,
        generatedAt: new Date().toISOString()
      })

      if (response.data.success) {
        toast({
          title: 'Cotización generada',
          description: 'La cotización ha sido guardada y vinculada a la oportunidad',
          variant: 'success'
        })
        
        if (onQuoteGenerated) {
          onQuoteGenerated(response.data.data)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al generar la cotización',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Recalcular cuando cambian plazo o tasa
  const handleRecalculate = async () => {
    if (!calculationResult || items.length === 0) return

    setIsCalculating(true)
    try {
      const response = await mpsCalculatorApi.recalculate({
        items: calculationResult.items,
        plazoMeses,
        tasaInteresAnual: tasaInteres,
        modalidad,
        oportunidadId
      })

      if (response.data.success) {
        setCalculationResult(response.data.data)
        setItems(response.data.data.items)
        
        toast({
          title: 'Recalculado',
          description: 'Cotización actualizada con nuevos parámetros',
          variant: 'success'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al recalcular',
        variant: 'destructive'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Renderizar nivel de precio con badge de aprobación
  const renderPriceLevel = (level: PriceLevel) => {
    const config = PRICE_LEVELS[level]
    return (
      <div className="flex items-center gap-2">
        <span>{config.label}</span>
        {config.requiresApproval && (
          <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Req. Aprob.
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              Cotizador MPS
            </h1>
            <p className="text-gray-500">
              {opportunityName ? `Oportunidad: ${opportunityName}` : 'Cotizador de equipos de impresión'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {requiresApproval() && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              Requiere Aprobación
            </Badge>
          )}
          {calculationResult && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Calculado
            </Badge>
          )}
        </div>
      </div>

      {/* Panel de Configuración */}
      <Card className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Modalidad */}
            <div className="space-y-2">
              <Label className="text-blue-100">Modalidad Negocio</Label>
              <Select value={modalidad} onValueChange={(v) => {
                setModalidad(v as BusinessMode)
                if (calculationResult) handleRecalculate()
              }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_MODES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plazo */}
            <div className="space-y-2">
              <Label className="text-blue-100">Tiempo Contrato (meses)</Label>
              <Input 
                type="number" 
                value={plazoMeses} 
                onChange={(e) => {
                  setPlazoMeses(Number(e.target.value))
                  if (calculationResult) handleRecalculate()
                }}
                className="bg-white/10 border-white/20 text-white"
                min={12}
                max={60}
              />
            </div>

            {/* Tasa de Interés */}
            <div className="space-y-2">
              <Label className="text-blue-100">Tasa de Interés (% anual)</Label>
              <Input 
                type="number" 
                value={tasaInteres} 
                onChange={(e) => {
                  setTasaInteres(Number(e.target.value))
                  if (calculationResult) handleRecalculate()
                }}
                className="bg-white/10 border-white/20 text-white"
                min={0}
                max={100}
                step={0.1}
              />
            </div>

            {/* ID Oportunidad */}
            <div className="space-y-2">
              <Label className="text-blue-100">ID Oportunidad</Label>
              <Input 
                value={oportunidadId} 
                onChange={(e) => setOportunidadId(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="OP-XXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold">Equipos a Cotizar</h3>
          <Button onClick={addItem} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Equipo
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-900">
                  <TableHead className="text-white font-semibold">Código</TableHead>
                  <TableHead className="text-white font-semibold">Descripción Item</TableHead>
                  <TableHead className="text-white font-semibold">Nivel de Precio</TableHead>
                  <TableHead className="text-white font-semibold text-right">Precio Equipo</TableHead>
                  <TableHead className="text-white font-semibold text-right">CxC B/N</TableHead>
                  <TableHead className="text-white font-semibold text-right">Volumen B/N</TableHead>
                  <TableHead className="text-white font-semibold text-right">CxC Color</TableHead>
                  <TableHead className="text-white font-semibold text-right">Volumen Color</TableHead>
                  <TableHead className="text-white font-semibold text-right">Servicio B/N</TableHead>
                  <TableHead className="text-white font-semibold text-right">Servicio Color</TableHead>
                  <TableHead className="text-white font-semibold text-right">Mensualidad Hardware</TableHead>
                  <TableHead className="text-white font-semibold text-right">Mensualidad Negocio</TableHead>
                  <TableHead className="text-white font-semibold w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      No hay equipos agregados. Haz clic en "Agregar Equipo" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <TableCell>
                        <Input 
                          value={item.codigo} 
                          onChange={(e) => updateItem(item.id, 'codigo', e.target.value)}
                          className="w-24"
                          placeholder="Código"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.descripcion} 
                          onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                          className="w-48"
                          placeholder="Descripción"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.nivelPrecio} 
                          onValueChange={(v) => updateItem(item.id, 'nivelPrecio', v as PriceLevel)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRICE_LEVELS).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {renderPriceLevel(key as PriceLevel)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.precioEquipo} 
                          onChange={(e) => updateItem(item.id, 'precioEquipo', Number(e.target.value))}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.000001"
                          value={item.cxcBN} 
                          onChange={(e) => updateItem(item.id, 'cxcBN', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.volumenBN} 
                          onChange={(e) => updateItem(item.id, 'volumenBN', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.000001"
                          value={item.cxcColor} 
                          onChange={(e) => updateItem(item.id, 'cxcColor', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.volumenColor} 
                          onChange={(e) => updateItem(item.id, 'volumenColor', Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.servicioBN !== undefined ? formatCurrency(item.servicioBN) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.servicioColor !== undefined ? formatCurrency(item.servicioColor) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.mensualidadHardware !== undefined ? formatCurrency(item.mensualidadHardware) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {item.mensualidadNegocio !== undefined ? formatCurrency(item.mensualidadNegocio) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Totales del Grid */}
          {calculationResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Equipos:</span>
                  <span className="ml-2 font-bold text-lg">{calculationResult.gridTotals.totalEquipos}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Inversión Hardware:</span>
                  <span className="ml-2 font-bold text-lg text-blue-700">
                    {formatCurrency(calculationResult.gridTotals.totalPrecioEquipos)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Total Servicio B/N:</span>
                  <span className="ml-2 font-bold">
                    {formatCurrency(calculationResult.gridTotals.totalServicioBN)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Total Servicio Color:</span>
                  <span className="ml-2 font-bold">
                    {formatCurrency(calculationResult.gridTotals.totalServicioColor)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Mens. Hardware (0%):</span>
                  <span className="ml-2 font-bold">
                    {formatCurrency(calculationResult.gridTotals.totalMensualidadHardware)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Mens. Negocio (0%):</span>
                  <span className="ml-2 font-bold">
                    {formatCurrency(calculationResult.gridTotals.totalMensualidadNegocio)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Calcular */}
      <div className="flex justify-center">
        <Button 
          onClick={handleCalculate} 
          disabled={isCalculating || items.length === 0}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Calcular Cotización
            </>
          )}
        </Button>
      </div>

      {/* Resumen Financiero */}
      {calculationResult && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900">Características del Negocio</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna izquierda - Detalles */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Período de tiempo (meses)</span>
                  <span className="font-semibold">{calculationResult.financialSummary.periodoMeses}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Modalidad Negocio</span>
                  <span className="font-semibold">{BUSINESS_MODES[calculationResult.financialSummary.modalidad]}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Servicios</span>
                  <span className="font-semibold">{formatCurrency(calculationResult.financialSummary.totalServicios)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Inversión en Hardware (PV)</span>
                  <span className="font-semibold text-lg text-blue-700">
                    {formatCurrency(calculationResult.financialSummary.inversionHardware)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tasa de Interés</span>
                  <span className="font-semibold">{calculationResult.financialSummary.tasaInteresAnual}% anual</span>
                </div>
              </div>

              {/* Columna derecha - Resultado Final */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl p-6">
                <h4 className="text-blue-200 text-sm uppercase tracking-wide mb-4">Resultado Final</h4>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-blue-200 text-sm">Cuota Hardware Financiado (PMT)</span>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculationResult.financialSummary.cuotaHardwareFinanciado)}
                    </p>
                    <p className="text-xs text-blue-300 mt-1">
                      Calculado con tasa del {calculationResult.financialSummary.tasaInteresAnual}% a {calculationResult.financialSummary.periodoMeses} meses
                    </p>
                  </div>

                  <Separator className="bg-blue-700" />

                  <div>
                    <span className="text-blue-200 text-sm">Total Servicios</span>
                    <p className="text-xl font-semibold">
                      + {formatCurrency(calculationResult.financialSummary.totalServicios)}
                    </p>
                  </div>

                  <Separator className="bg-blue-700" />

                  <div className="bg-white/10 rounded-lg p-4">
                    <span className="text-blue-200 text-sm uppercase tracking-wide">Cuota Mensual Negocio Final</span>
                    <p className="text-4xl font-bold text-white mt-2">
                      {formatCurrency(calculationResult.financialSummary.cuotaMensualNegocioFinal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firmas */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <Label className="text-gray-600">Ejecutivo de Negocios</Label>
                <div className="mt-2 border-b-2 border-gray-300 pb-2">
                  <span className="text-gray-800 font-medium">{user?.name || 'Sin asignar'}</span>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Gerente de Ventas</Label>
                <div className="mt-2 border-b-2 border-gray-300 pb-2">
                  {approvalRequest?.approved ? (
                    <span className="text-green-700 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Aprobado
                    </span>
                  ) : requiresApproval() && !isManager ? (
                    <span className="text-amber-600 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pendiente de aprobación
                    </span>
                  ) : (
                    <span className="text-gray-400">Firma requerida</span>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="mt-8 flex justify-end gap-4">
              {requiresApproval() && !isManager && !approvalRequest?.approved ? (
                <Button 
                  onClick={handleRequestApproval}
                  disabled={isSaving}
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Solicitar Aprobación
                </Button>
              ) : null}

              <Button 
                onClick={handleGenerateQuote}
                disabled={isSaving || (requiresApproval() && !isManager && !approvalRequest?.approved)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generar Cotización
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Aprobación */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitud de Aprobación de Precio</DialogTitle>
            <DialogDescription>
              Esta cotización requiere aprobación por nivel de precio especial.
            </DialogDescription>
          </DialogHeader>
          
          {calculationResult && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Detalle de la Cotización</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Oportunidad:</span>
                    <span className="ml-2 font-medium">{oportunidadId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Equipos:</span>
                    <span className="ml-2 font-medium">{calculationResult.gridTotals.totalEquipos}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Inversión Total:</span>
                    <span className="ml-2 font-medium">{formatCurrency(calculationResult.financialSummary.inversionHardware)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cuota Mensual:</span>
                    <span className="ml-2 font-medium">{formatCurrency(calculationResult.financialSummary.cuotaMensualNegocioFinal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Niveles de Precio que Requieren Aprobación
                </h4>
                <ul className="list-disc list-inside text-sm text-amber-700">
                  {items
                    .filter(item => config.requireApprovalFor.includes(item.nivelPrecio))
                    .map((item, idx) => (
                      <li key={idx}>
                        {item.codigo} - {PRICE_LEVELS[item.nivelPrecio].label} ({formatCurrency(item.precioEquipo)})
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestApproval} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
