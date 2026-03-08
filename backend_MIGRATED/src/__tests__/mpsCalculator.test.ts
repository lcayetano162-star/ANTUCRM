import { MPSCalculatorService } from '../services/mpsCalculatorService';
import type { MPSQuoteInput } from '../types/mpsQuote';

describe('MPS Calculator Service', () => {
  let calculator: MPSCalculatorService;

  beforeEach(() => {
    calculator = new MPSCalculatorService();
  });

  describe('Cálculo básico', () => {
    it('debe calcular correctamente una cotización simple', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST-001',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'TEST001',
            descripcion: 'Equipo de prueba',
            nivelPrecio: 'precio_lista',
            precioEquipo: 7200,
            cxcBN: 0.008,
            volumenBN: 2000,
            cxcColor: 0.095,
            volumenColor: 50000,
          },
        ],
      };

      const result = calculator.calculateQuote(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.gridTotals.totalPrecioEquipos).toBe(7200);
    });

    it('debe calcular correctamente el caso del ejemplo (1 equipo $7,200 + 9 equipos $8,200)', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-017',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'EMC00AA',
            descripcion: 'ImageFORCE 6170',
            nivelPrecio: 'precio_estrategico',
            precioEquipo: 7200,
            cxcBN: 0.008032,
            volumenBN: 2000,
            cxcColor: 0.09521,
            volumenColor: 50000,
          },
          ...Array(9).fill(null).map((_, i) => ({
            codigo: 'EMC00AA',
            descripcion: 'ImageFORCE 6170',
            nivelPrecio: 'precio_lista',
            precioEquipo: 8200,
            cxcBN: 0.006532,
            volumenBN: 0,
            cxcColor: 0.09375,
            volumenColor: 0,
          })),
        ],
      };

      const result = calculator.calculateQuote(input);

      expect(result.success).toBe(true);
      expect(result.data?.gridTotals.totalPrecioEquipos).toBe(81000); // 7200 + (9 * 8200)
      expect(result.data?.gridTotals.totalEquipos).toBe(10);
      expect(result.data?.financialSummary.inversionHardware).toBe(81000);
    });

    it('debe calcular correctamente la fórmula PMT', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST-002',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'TEST002',
            descripcion: 'Equipo test',
            nivelPrecio: 'precio_lista',
            precioEquipo: 100000,
            cxcBN: 0,
            volumenBN: 0,
            cxcColor: 0,
            volumenColor: 0,
          },
        ],
      };

      const result = calculator.calculateQuote(input);

      // PMT(100000, 0.013333, 36) ≈ 3515.06
      expect(result.data?.financialSummary.cuotaHardwareFinanciado).toBeGreaterThan(3500);
      expect(result.data?.financialSummary.cuotaHardwareFinanciado).toBeLessThan(3530);
    });
  });

  describe('Validaciones', () => {
    it('debe rechazar cotización sin items', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [],
      };

      expect(() => calculator.calculateQuote(input)).toThrow('Debe incluir al menos un ítem');
    });

    it('debe rechazar cotización con plazo inválido', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST',
        modalidad: 'renta',
        plazoMeses: 0,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'TEST',
            descripcion: 'Test',
            nivelPrecio: 'precio_lista',
            precioEquipo: 1000,
            cxcBN: 0,
            volumenBN: 0,
            cxcColor: 0,
            volumenColor: 0,
          },
        ],
      };

      expect(() => calculator.calculateQuote(input)).toThrow('El plazo en meses debe ser mayor a 0');
    });

    it('debe rechazar item con precio negativo', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'TEST',
            descripcion: 'Test',
            nivelPrecio: 'precio_lista',
            precioEquipo: -1000,
            cxcBN: 0,
            volumenBN: 0,
            cxcColor: 0,
            volumenColor: 0,
          },
        ],
      };

      expect(() => calculator.calculateQuote(input)).toThrow('debe tener un precio de equipo válido');
    });
  });

  describe('Recálculo', () => {
    it('debe recalcular correctamente con nuevo plazo', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 16,
        items: [
          {
            codigo: 'TEST',
            descripcion: 'Test',
            nivelPrecio: 'precio_lista',
            precioEquipo: 36000,
            cxcBN: 0,
            volumenBN: 0,
            cxcColor: 0,
            volumenColor: 0,
          },
        ],
      };

      const original = calculator.calculateQuote(input);
      const items = original.data!.items;

      // Recalcular a 24 meses
      const recalculated = calculator.recalculateQuote(
        items,
        24,
        16,
        'renta',
        'OP-TEST'
      );

      // Mensualidad hardware debe cambiar: 36000/24 = 1500 (antes era 1000)
      expect(recalculated.data?.items[0].mensualidadHardware).toBe(1500);
    });
  });

  describe('Tasa 0%', () => {
    it('debe calcular correctamente con tasa 0%', () => {
      const input: MPSQuoteInput = {
        oportunidadId: 'OP-TEST',
        modalidad: 'renta',
        plazoMeses: 36,
        tasaInteresAnual: 0,
        items: [
          {
            codigo: 'TEST',
            descripcion: 'Test',
            nivelPrecio: 'precio_lista',
            precioEquipo: 36000,
            cxcBN: 0,
            volumenBN: 0,
            cxcColor: 0,
            volumenColor: 0,
          },
        ],
      };

      const result = calculator.calculateQuote(input);

      // Con tasa 0%, la cuota PMT es simplemente PV/N
      expect(result.data?.financialSummary.cuotaHardwareFinanciado).toBe(1000);
    });
  });
});
