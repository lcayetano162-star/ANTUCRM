import type { Request, Response } from 'express';
import type { MPSConfig } from '../types/mpsQuote';

/**
 * Controlador para la configuración del módulo MPS
 * Maneja las configuraciones de habilitación y niveles de precio
 */

// Configuración por defecto
const defaultConfig: MPSConfig = {
  enabled: true,
  requireApprovalFor: ['precio_estrategico', 'precio_mayorista'],
  defaultTasaInteres: 16,
  defaultPlazo: 36
};

// En producción, esto debería venir de la base de datos
let currentConfig: MPSConfig = { ...defaultConfig };

export class MPSConfigController {
  /**
   * GET /api/mps/config
   * Obtiene la configuración actual del módulo MPS
   */
  public getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: currentConfig
      });
    } catch (error) {
      console.error('[MPS Config] Error obteniendo configuración:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener configuración'
      });
    }
  };

  /**
   * PUT /api/mps/config
   * Actualiza la configuración del módulo MPS (solo admin)
   */
  public updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { enabled, requireApprovalFor, defaultTasaInteres, defaultPlazo } = req.body;

      // Validar datos
      if (defaultTasaInteres !== undefined && (defaultTasaInteres < 0 || defaultTasaInteres > 100)) {
        res.status(400).json({
          success: false,
          error: 'La tasa de interés debe estar entre 0 y 100'
        });
        return;
      }

      if (defaultPlazo !== undefined && (defaultPlazo < 1 || defaultPlazo > 120)) {
        res.status(400).json({
          success: false,
          error: 'El plazo debe estar entre 1 y 120 meses'
        });
        return;
      }

      // Actualizar configuración
      currentConfig = {
        enabled: enabled !== undefined ? enabled : currentConfig.enabled,
        requireApprovalFor: requireApprovalFor || currentConfig.requireApprovalFor,
        defaultTasaInteres: defaultTasaInteres !== undefined ? defaultTasaInteres : currentConfig.defaultTasaInteres,
        defaultPlazo: defaultPlazo !== undefined ? defaultPlazo : currentConfig.defaultPlazo
      };

      res.status(200).json({
        success: true,
        data: currentConfig,
        message: 'Configuración actualizada correctamente'
      });
    } catch (error) {
      console.error('[MPS Config] Error actualizando configuración:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar configuración'
      });
    }
  };

  /**
   * POST /api/mps/config/reset
   * Restaura la configuración por defecto (solo admin)
   */
  public resetConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      currentConfig = { ...defaultConfig };

      res.status(200).json({
        success: true,
        data: currentConfig,
        message: 'Configuración restaurada a valores por defecto'
      });
    } catch (error) {
      console.error('[MPS Config] Error restaurando configuración:', error);
      res.status(500).json({
        success: false,
        error: 'Error al restaurar configuración'
      });
    }
  };
}

// Exportar instancia
export const mpsConfigController = new MPSConfigController();
