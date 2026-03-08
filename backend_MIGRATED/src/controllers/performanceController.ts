import type { Request, Response } from 'express';
import { performanceService } from '../services/performanceService';

/**
 * Controlador para el módulo de Desempeño (Mi Desempeño)
 * Gestiona métricas de ventas y actividades de vendedores
 */

export class PerformanceController {
  /**
   * GET /api/performance/metrics
   * Obtiene las métricas de desempeño del usuario actual o de un vendedor específico
   */
  public getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.query.userId as string || (req as any).user?.id;
      const period = req.query.period as 'month' | 'quarter' | 'year' || 'month';
      
      // Verificar permisos
      const isManager = (req as any).user?.role === 'manager' || (req as any).user?.role === 'admin';
      const requestingUserId = (req as any).user?.id;
      
      // Si no es manager, solo puede ver sus propias métricas
      if (!isManager && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver estas métricas'
        });
        return;
      }

      const metrics = await performanceService.getMetrics(userId, period);

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('[Performance] Error obteniendo métricas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener métricas de desempeño'
      });
    }
  };

  /**
   * GET /api/performance/team
   * Obtiene las métricas de todo el equipo (solo para managers)
   */
  public getTeamMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const isManager = (req as any).user?.role === 'manager' || (req as any).user?.role === 'admin';
      
      if (!isManager) {
        res.status(403).json({
          success: false,
          error: 'Solo managers pueden ver métricas del equipo'
        });
        return;
      }

      const teamMetrics = await performanceService.getTeamMetrics();

      res.status(200).json({
        success: true,
        data: teamMetrics
      });
    } catch (error) {
      console.error('[Performance] Error obteniendo métricas del equipo:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener métricas del equipo'
      });
    }
  };

  /**
   * GET /api/performance/history
   * Obtiene el histórico de desempeño del usuario
   */
  public getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.query.userId as string || (req as any).user?.id;
      const months = parseInt(req.query.months as string) || 6;
      
      const history = await performanceService.getHistory(userId, months);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('[Performance] Error obteniendo histórico:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener histórico de desempeño'
      });
    }
  };

  /**
   * PUT /api/performance/quota
   * Actualiza la cuota de un vendedor (solo managers)
   */
  public updateQuota = async (req: Request, res: Response): Promise<void> => {
    try {
      const isManager = (req as any).user?.role === 'manager' || (req as any).user?.role === 'admin';
      
      if (!isManager) {
        res.status(403).json({
          success: false,
          error: 'Solo managers pueden actualizar cuotas'
        });
        return;
      }

      const { userId, monthlyQuota, yearlyQuota } = req.body;
      
      if (!userId || !monthlyQuota || !yearlyQuota) {
        res.status(400).json({
          success: false,
          error: 'Se requieren userId, monthlyQuota y yearlyQuota'
        });
        return;
      }

      const updatedQuota = await performanceService.updateQuota(userId, monthlyQuota, yearlyQuota);

      res.status(200).json({
        success: true,
        data: updatedQuota,
        message: 'Cuota actualizada correctamente'
      });
    } catch (error) {
      console.error('[Performance] Error actualizando cuota:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar cuota'
      });
    }
  };
}

// Exportar instancia
export const performanceController = new PerformanceController();
