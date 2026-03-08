import { Request, Response } from 'express';
import { mpsCalculatorService } from '../services/calculatorService';
import { MPSQuoteInput } from '../types';

export class MPSQuoteController {
  calculateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MPSQuoteInput = req.body;
      if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        res.status(400).json({ success: false, error: 'Se requiere al menos un item' });
        return;
      }
      const result = mpsCalculatorService.calculateQuote(input);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[MPSQuote] Error calculando cotizacion:', error);
      res.status(500).json({ success: false, error: 'Error al calcular cotizacion' });
    }
  };

  recalculateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        res.status(400).json({ success: false, error: 'Se requiere al menos un item' });
        return;
      }
      const result = mpsCalculatorService.recalculateQuote(input);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[MPSQuote] Error recalculando cotizacion:', error);
      res.status(500).json({ success: false, error: 'Error al recalcular cotizacion' });
    }
  };

  validateInput = async (req: Request, res: Response): Promise<void> => {
    try {
      const { items } = req.body;
      const errors: string[] = [];
      if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Se requiere al menos un item en items[]');
      } else {
        items.forEach((item: any, index: number) => {
          if (!item.brand) errors.push(`Item ${index + 1}: brand es requerido`);
          if (!item.model) errors.push(`Item ${index + 1}: model es requerido`);
          if (item.copies <= 0) errors.push(`Item ${index + 1}: copies debe ser mayor a 0`);
          if (item.monthlyVolumeBW < 0) errors.push(`Item ${index + 1}: monthlyVolumeBW no puede ser negativo`);
        });
      }
      res.json({ valid: errors.length === 0, errors });
    } catch (error) {
      res.status(500).json({ valid: false, errors: ['Error interno de validacion'] });
    }
  };

  getExample = async (req: Request, res: Response): Promise<void> => {
    res.json({
      items: [{
        id: 'item-1',
        brand: 'HP',
        model: 'LaserJet Pro M404n',
        ppm: 40,
        isColor: false,
        monthlyVolumeBW: 2000,
        monthlyVolumeColor: 0,
        copies: 2,
        priceLevel: 'list',
        businessMode: 'venta',
        financingMonths: 36,
        interestRate: 1.2
      }],
      businessMode: 'venta',
      priceLevel: 'list',
      financingMonths: 36,
      interestRate: 1.2
    });
  };
}

export const mpsQuoteController = new MPSQuoteController();
