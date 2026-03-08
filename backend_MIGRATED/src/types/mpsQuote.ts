// Tipos para el Cotizador MPS (Managed Print Services)

// Nivel de precio del equipo
export type PriceLevel = 'precio_lista' | 'precio_estrategico' | 'precio_mayorista';

// Modalidad de negocio
export type BusinessMode = 'renta' | 'venta' | 'leasing';

// Item individual del grid de cotización
export interface MPSItem {
  id: string;
  codigo: string;
  descripcion: string;
  nivelPrecio: PriceLevel;
  precioEquipo: number;           // Precio del equipo (PV individual)
  cxcBN: number;                  // Costo por copia B/N
  volumenBN: number;              // Volumen mensual B/N
  cxcColor: number;               // Costo por copia Color
  volumenColor: number;           // Volumen mensual Color
  // Calculados (0% interés)
  servicioBN?: number;            // volumenBN * cxcBN
  servicioColor?: number;         // volumenColor * cxcColor
  mensualidadHardware?: number;   // precioEquipo / plazoMeses (0% interés)
  mensualidadNegocio?: number;    // mensualidadHardware + servicioBN + servicioColor
}

// Datos de entrada para calcular cotización
export interface MPSQuoteInput {
  oportunidadId: string;
  modalidad: BusinessMode;
  plazoMeses: number;
  tasaInteresAnual: number;       // Ej: 16 para 16%
  items: Omit<MPSItem, 'id' | 'servicioBN' | 'servicioColor' | 'mensualidadHardware' | 'mensualidadNegocio'>[];
}

// Totales del grid (0% interés)
export interface MPSGridTotals {
  totalEquipos: number;           // Cantidad de equipos
  totalPrecioEquipos: number;     // Sumatoria de Precio Equipo (PV total)
  totalServicioBN: number;        // Sumatoria Servicio B/N
  totalServicioColor: number;     // Sumatoria Servicio Color
  totalMensualidadHardware: number;  // Sumatoria Mensualidad Hardware (0%)
  totalMensualidadNegocio: number;   // Sumatoria Mensualidad Negocio (0%)
}

// Resumen financiero final (con interés PMT)
export interface MPSFinancialSummary {
  periodoMeses: number;
  modalidad: BusinessMode;
  totalServicios: number;         // totalServicioBN + totalServicioColor
  inversionHardware: number;      // totalPrecioEquipos (Capital/PV)
  tasaInteresAnual: number;
  tasaInteresMensual: number;     // tasaAnual / 100 / 12
  cuotaHardwareFinanciado: number;   // PMT aplicado a inversionHardware
  cuotaMensualNegocioFinal: number;  // totalServicios + cuotaHardwareFinanciado
}

// Cotización completa calculada
export interface MPSQuoteResult {
  id: string;
  oportunidadId: string;
  fechaCreacion: string;
  items: MPSItem[];
  gridTotals: MPSGridTotals;
  financialSummary: MPSFinancialSummary;
}

// Respuesta de la API
export interface MPSQuoteResponse {
  success: boolean;
  data?: MPSQuoteResult;
  error?: string;
}

// Configuración del módulo MPS
export interface MPSConfig {
  enabled: boolean;
  requireApprovalFor: PriceLevel[];
  defaultTasaInteres: number;
  defaultPlazo: number;
}

// Solicitud de aprobación de precio
export interface MPSPriceApprovalRequest {
  id: string;
  oportunidadId: string;
  oportunidadName?: string;
  quoteData: MPSQuoteResult;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}
