// Tipos para el Cotizador MPS (Managed Print Services)

// Nivel de precio del equipo
export type PriceLevel = 'precio_lista' | 'precio_estrategico' | 'precio_mayorista'

// Modalidad de negocio
export type BusinessMode = 'renta' | 'venta' | 'leasing'

// Item individual del grid de cotización
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
  // Calculados (0% interés)
  servicioBN?: number
  servicioColor?: number
  mensualidadHardware?: number
  mensualidadNegocio?: number
}

// Datos de entrada para calcular cotización
export interface MPSQuoteInput {
  oportunidadId: string
  modalidad: BusinessMode
  plazoMeses: number
  tasaInteresAnual: number
  items: Omit<MPSItem, 'id' | 'servicioBN' | 'servicioColor' | 'mensualidadHardware' | 'mensualidadNegocio'>[]
}

// Totales del grid (0% interés)
export interface MPSGridTotals {
  totalEquipos: number
  totalPrecioEquipos: number
  totalServicioBN: number
  totalServicioColor: number
  totalMensualidadHardware: number
  totalMensualidadNegocio: number
}

// Resumen financiero final (con interés PMT)
export interface MPSFinancialSummary {
  periodoMeses: number
  modalidad: BusinessMode
  totalServicios: number
  inversionHardware: number
  tasaInteresAnual: number
  tasaInteresMensual: number
  cuotaHardwareFinanciado: number
  cuotaMensualNegocioFinal: number
}

// Cotización completa calculada
export interface MPSQuoteResult {
  id: string
  oportunidadId: string
  fechaCreacion: string
  items: MPSItem[]
  gridTotals: MPSGridTotals
  financialSummary: MPSFinancialSummary
}

// Respuesta de la API
export interface MPSQuoteResponse {
  success: boolean
  data?: MPSQuoteResult
  error?: string
}

// Configuración del módulo MPS
export interface MPSConfig {
  enabled: boolean
  requireApprovalFor: PriceLevel[]
  defaultTasaInteres: number
  defaultPlazo: number
}

// Solicitud de aprobación de precio
export interface MPSPriceApprovalRequest {
  id: string
  oportunidadId: string
  oportunidadName?: string
  quoteData: MPSQuoteResult
  requestedBy: string
  requestedByName?: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  notes?: string
}
