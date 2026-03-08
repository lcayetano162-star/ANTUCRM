/**
 * Utilidades de formateo para el Cotizador MPS
 */

/**
 * Formatea un número como moneda mexicana (MXN)
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formatea un porcentaje
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Traduce la modalidad de negocio
 */
export const translateModalidad = (modalidad: string): string => {
  const translations: Record<string, string> = {
    renta: 'Renta',
    venta: 'Venta',
    leasing: 'Leasing',
  };
  return translations[modalidad] || modalidad;
};

/**
 * Traduce el nivel de precio
 */
export const translateNivelPrecio = (nivel: string): string => {
  const translations: Record<string, string> = {
    precio_lista: 'Precio de Lista',
    precio_estrategico: 'Precio Estratégico',
    precio_mayorista: 'Precio Mayorista',
  };
  return translations[nivel] || nivel;
};

/**
 * Redondea un número a N decimales sin problemas de punto flotante
 */
export const round = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Calcula el valor presente neto (VPN) - utilidad adicional
 */
export const calculateNPV = (
  initialInvestment: number,
  cashFlows: number[],
  discountRate: number
): number => {
  let npv = -initialInvestment;
  
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
  }
  
  return round(npv);
};

/**
 * Genera un ID de cotización legible
 */
export const generateQuoteId = (): string => {
  const prefix = 'MPS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};
