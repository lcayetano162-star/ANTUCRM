import { v4 as uuidv4 } from 'uuid';
import type {
  MPSItem,
  MPSQuoteInput,
  MPSQuoteResult,
  MPSGridTotals,
  MPSFinancialSummary,
  MPSQuoteResponse,
} from '../types/mpsQuote';

/**
 * Servicio de cálculo para el Cotizador MPS
 * Implementa la lógica financiera con fórmula PMT
 */

export class MPSCalculatorService {
  /**
   * Genera un ID único para items
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Calcula los valores de un ítem individual (0% interés)
   */
  private calculateItem(
    item: Omit<MPSItem, 'id' | 'servicioBN' | 'servicioColor' | 'mensualidadHardware' | 'mensualidadNegocio'>,
    plazoMeses: number
  ): MPSItem {
    const servicioBN = item.volumenBN * item.cxcBN;
    const servicioColor = item.volumenColor * item.cxcColor;
    const mensualidadHardware = item.precioEquipo / plazoMeses;
    const mensualidadNegocio = mensualidadHardware + servicioBN + servicioColor;

    return {
      ...item,
      id: this.generateId(),
      servicioBN: this.round(servicioBN),
      servicioColor: this.round(servicioColor),
      mensualidadHardware: this.round(mensualidadHardware),
      mensualidadNegocio: this.round(mensualidadNegocio),
    };
  }

  /**
   * Calcula los totales del grid (0% interés)
   */
  private calculateGridTotals(items: MPSItem[]): MPSGridTotals {
    const totals = items.reduce(
      (acc, item) => ({
        totalEquipos: acc.totalEquipos + 1,
        totalPrecioEquipos: acc.totalPrecioEquipos + item.precioEquipo,
        totalServicioBN: acc.totalServicioBN + (item.servicioBN || 0),
        totalServicioColor: acc.totalServicioColor + (item.servicioColor || 0),
        totalMensualidadHardware: acc.totalMensualidadHardware + (item.mensualidadHardware || 0),
        totalMensualidadNegocio: acc.totalMensualidadNegocio + (item.mensualidadNegocio || 0),
      }),
      {
        totalEquipos: 0,
        totalPrecioEquipos: 0,
        totalServicioBN: 0,
        totalServicioColor: 0,
        totalMensualidadHardware: 0,
        totalMensualidadNegocio: 0,
      }
    );

    return {
      totalEquipos: totals.totalEquipos,
      totalPrecioEquipos: this.round(totals.totalPrecioEquipos),
      totalServicioBN: this.round(totals.totalServicioBN),
      totalServicioColor: this.round(totals.totalServicioColor),
      totalMensualidadHardware: this.round(totals.totalMensualidadHardware),
      totalMensualidadNegocio: this.round(totals.totalMensualidadNegocio),
    };
  }

  /**
   * Fórmula PMT (Payment)
   * Calcula la cuota mensual de un préstamo/amortización
   * 
   * Fórmula: PMT = PV * [ r / (1 - (1 + r)^-N) ]
   * 
   * Donde:
   * - PV = Valor presente (inversión total en hardware)
   * - r = Tasa de interés mensual
   * - N = Número de períodos (meses)
   * 
   * @param pv - Valor presente (inversión en hardware)
   * @param rate - Tasa de interés mensual (ej: 0.013333 para 16% anual)
   * @param periods - Número de períodos (meses)
   * @returns Cuota mensual
   */
  private calculatePMT(pv: number, rate: number, periods: number): number {
    // Caso especial: tasa 0%
    if (rate === 0) {
      return pv / periods;
    }

    // Fórmula PMT: PV * [ r / (1 - (1 + r)^-N) ]
    const numerator = rate;
    const denominator = 1 - Math.pow(1 + rate, -periods);
    const pmt = pv * (numerator / denominator);

    return this.round(pmt);
  }

  /**
   * Calcula el resumen financiero final (con interés PMT)
   */
  private calculateFinancialSummary(
    gridTotals: MPSGridTotals,
    plazoMeses: number,
    tasaInteresAnual: number,
    modalidad: string
  ): MPSFinancialSummary {
    // A. Total Servicios = Sumatoria de todos los servicios
    const totalServicios = gridTotals.totalServicioBN + gridTotals.totalServicioColor;

    // B. Inversión Total Hardware (PV) = Sumatoria exacta de Precio Equipo
    const inversionHardware = gridTotals.totalPrecioEquipos;

    // C. Tasa de interés mensual
    const tasaInteresMensual = tasaInteresAnual / 100 / 12;

    // D. Cuota de Hardware Financiado = PMT aplicado al PV total
    const cuotaHardwareFinanciado = this.calculatePMT(
      inversionHardware,
      tasaInteresMensual,
      plazoMeses
    );

    // E. CUOTA MENSUAL NEGOCIO FINAL = Total Servicios + Cuota Hardware Financiado
    const cuotaMensualNegocioFinal = totalServicios + cuotaHardwareFinanciado;

    return {
      periodoMeses: plazoMeses,
      modalidad: modalidad as any,
      totalServicios: this.round(totalServicios),
      inversionHardware: this.round(inversionHardware),
      tasaInteresAnual: tasaInteresAnual,
      tasaInteresMensual: this.round(tasaInteresMensual, 6),
      cuotaHardwareFinanciado: cuotaHardwareFinanciado,
      cuotaMensualNegocioFinal: this.round(cuotaMensualNegocioFinal),
    };
  }

  /**
   * Redondea un número a N decimales
   */
  private round(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Valida los datos de entrada
   */
  private validateInput(input: MPSQuoteInput): string | null {
    if (!input.oportunidadId || input.oportunidadId.trim() === '') {
      return 'El ID de oportunidad es requerido';
    }

    if (!input.modalidad) {
      return 'La modalidad de negocio es requerida';
    }

    if (!input.plazoMeses || input.plazoMeses <= 0) {
      return 'El plazo en meses debe ser mayor a 0';
    }

    if (input.tasaInteresAnual === undefined || input.tasaInteresAnual < 0) {
      return 'La tasa de interés es requerida y debe ser >= 0';
    }

    if (!input.items || input.items.length === 0) {
      return 'Debe incluir al menos un ítem';
    }

    for (const item of input.items) {
      if (!item.codigo || item.codigo.trim() === '') {
        return 'Todos los ítems deben tener un código';
      }
      if (!item.descripcion || item.descripcion.trim() === '') {
        return 'Todos los ítems deben tener una descripción';
      }
      if (item.precioEquipo === undefined || item.precioEquipo < 0) {
        return `El ítem ${item.codigo} debe tener un precio de equipo válido`;
      }
      if (item.volumenBN < 0 || item.volumenColor < 0) {
        return `El ítem ${item.codigo} no puede tener volúmenes negativos`;
      }
      if (item.cxcBN < 0 || item.cxcColor < 0) {
        return `El ítem ${item.codigo} no puede tener costos por copia negativos`;
      }
    }

    return null;
  }

  /**
   * Calcula una cotización MPS completa
   * 
   * PASO 1: Cálculos del Grid (0% Interés)
   * - Mensualidad Hardware = Precio Equipo / Plazo
   * - Mensualidad Negocio = Mensualidad Hardware + Servicio B/N + Servicio Color
   * 
   * PASO 2: Cálculos del Resumen Final (PMT)
   * - Total Servicios = Sumatoria de servicios
   * - Inversión Hardware = Sumatoria de Precio Equipo
   * - Cuota Hardware Financiado = PMT(PV, r, N)
   * - Cuota Mensual Negocio Final = Total Servicios + Cuota Hardware Financiado
   */
  public calculateQuote(input: MPSQuoteInput): MPSQuoteResult {
    // Validar entrada
    const validationError = this.validateInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    // PASO 1: Calcular cada ítem del grid (0% interés)
    const calculatedItems = input.items.map((item) =>
      this.calculateItem(item, input.plazoMeses)
    );

    // PASO 2: Calcular totales del grid
    const gridTotals = this.calculateGridTotals(calculatedItems);

    // PASO 3: Calcular resumen financiero (con PMT)
    const financialSummary = this.calculateFinancialSummary(
      gridTotals,
      input.plazoMeses,
      input.tasaInteresAnual,
      input.modalidad
    );

    // Construir resultado completo
    const result: MPSQuoteResult = {
      id: this.generateId(),
      oportunidadId: input.oportunidadId,
      fechaCreacion: new Date().toISOString(),
      items: calculatedItems,
      gridTotals,
      financialSummary,
    };

    return result;
  }

  /**
   * Recalcula una cotización con nuevos parámetros
   * Útil cuando el vendedor cambia el plazo o tasa sin modificar items
   */
  public recalculateQuote(
    items: MPSItem[],
    plazoMeses: number,
    tasaInteresAnual: number,
    modalidad: string,
    oportunidadId: string
  ): MPSQuoteResult {
    // Recalcular items con nuevo plazo
    const recalculatedItems = items.map((item) => {
      const mensualidadHardware = item.precioEquipo / plazoMeses;
      const mensualidadNegocio = mensualidadHardware + (item.servicioBN || 0) + (item.servicioColor || 0);

      return {
        ...item,
        mensualidadHardware: this.round(mensualidadHardware),
        mensualidadNegocio: this.round(mensualidadNegocio),
      };
    });

    // Recalcular totales
    const gridTotals = this.calculateGridTotals(recalculatedItems);

    // Recalcular resumen financiero
    const financialSummary = this.calculateFinancialSummary(
      gridTotals,
      plazoMeses,
      tasaInteresAnual,
      modalidad
    );

    return {
      id: this.generateId(),
      oportunidadId,
      fechaCreacion: new Date().toISOString(),
      items: recalculatedItems,
      gridTotals,
      financialSummary,
    };
  }
}

// Exportar instancia singleton
export const mpsCalculatorService = new MPSCalculatorService();
