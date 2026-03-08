import { Request, Response } from 'express';
import { mpsCalculatorService } from '../services/calculatorService';

export class MPSConfigController {
  getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ success: true, data: mpsCalculatorService.getConfig() });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error obteniendo configuracion' });
    }
  };

  updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedConfig = mpsCalculatorService.updateConfig(req.body);
      res.json({ success: true, data: updatedConfig });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error actualizando configuracion' });
    }
  };

  resetConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const defaultConfig = mpsCalculatorService.resetConfig();
      res.json({ success: true, data: defaultConfig, message: 'Configuracion restaurada a valores por defecto' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error reseteando configuracion' });
    }
  };
}

export const mpsConfigController = new MPSConfigController();
