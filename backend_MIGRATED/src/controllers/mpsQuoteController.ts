import type { Request, Response } from 'express';
import { mpsCalculatorService } from '../services/mpsCalculatorService';
import type { MPSQuoteInput, MPSItem } from '../types/mpsQuote';

/**
 * Controlador para el Cotizador MPS
 * Maneja las peticiones HTTP relacionadas con cotizaciones MPS
 */

export class MPSQuoteController {
  /**
   * POST /api/mps/calculate
   * Calcula una nueva cotización MPS completa
   */
  public calculateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MPSQuoteInput = req.body;

      // Log para debugging
      console.log('[MPS Quote] Calculando cotización:', {
        oportunidadId: input.oportunidadId,
        modalidad: input.modalidad,
        plazoMeses: input.plazoMeses,
        tasaInteres: input.tasaInteresAnual,
        cantidadItems: input.items?.length,
      });

      const result = mpsCalculatorService.calculateQuote(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[MPS Quote] Error calculando cotización:', error);

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al calcular cotización',
      });
    }
  };

  /**
   * POST /api/mps/recalculate
   * Recalcula una cotización con nuevos parámetros (plazo, tasa)
   * sin modificar los items
   */
  public recalculateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        items,
        plazoMeses,
        tasaInteresAnual,
        modalidad,
        oportunidadId,
      } = req.body;

      if (!items || !plazoMeses || tasaInteresAnual === undefined || !modalidad) {
        res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: items, plazoMeses, tasaInteresAnual, modalidad',
        });
        return;
      }

      console.log('[MPS Quote] Recalculando cotización:', {
        oportunidadId,
        modalidad,
        plazoMeses,
        tasaInteres: tasaInteresAnual,
        cantidadItems: items.length,
      });

      const result = mpsCalculatorService.recalculateQuote(
        items as MPSItem[],
        plazoMeses,
        tasaInteresAnual,
        modalidad,
        oportunidadId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[MPS Quote] Error recalculando cotización:', error);

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al recalcular cotización',
      });
    }
  };

  /**
   * POST /api/mps/validate
   * Valida los datos de entrada sin calcular
   */
  public validateInput = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MPSQuoteInput = req.body;

      // Validaciones básicas
      const errors: string[] = [];

      if (!input.oportunidadId?.trim()) {
        errors.push('El ID de oportunidad es requerido');
      }

      if (!input.modalidad) {
        errors.push('La modalidad de negocio es requerida');
      }

      if (!input.plazoMeses || input.plazoMeses <= 0) {
        errors.push('El plazo en meses debe ser mayor a 0');
      }

      if (input.tasaInteresAnual === undefined || input.tasaInteresAnual < 0) {
        errors.push('La tasa de interés debe ser >= 0');
      }

      if (!input.items || input.items.length === 0) {
        errors.push('Debe incluir al menos un ítem');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          errors,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Datos válidos',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error en validación',
      });
    }
  };

  /**
   * GET /api/mps/example
   * Retorna un ejemplo de estructura de entrada
   */
  public getExample = async (req: Request, res: Response): Promise<void> => {
    const example = {
      oportunidadId: 'OP-017',
      modalidad: 'renta',
      plazoMeses: 36,
      tasaInteresAnual: 16,
      items: [
        {
          codigo: 'EMC00AA',
          descripcion: 'ImageFORCE 6170 Speed License',
          nivelPrecio: 'precio_estrategico',
          precioEquipo: 7200,
          cxcBN: 0.008032,
          volumenBN: 2000,
          cxcColor: 0.09521,
          volumenColor: 50000,
        },
        {
          codigo: 'EMC00AA',
          descripcion: 'ImageFORCE 6170 Speed License',
          nivelPrecio: 'precio_lista',
          precioEquipo: 8200,
          cxcBN: 0.006532,
          volumenBN: 0,
          cxcColor: 0.09375,
          volumenColor: 0,
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: example,
    });
  };
}

// Exportar instancia
export const mpsQuoteController = new MPSQuoteController();
