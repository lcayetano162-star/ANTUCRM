import type { Request, Response } from 'express';
import { activityService } from '../services/activityService';

/**
 * Controlador para el registro de actividades
 * Gestiona llamadas, visitas, correos, whatsapp y notas
 */

export class ActivityController {
  /**
   * POST /api/activities
   * Crea una nueva actividad
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, description, duration, outcome, related_type, related_id } = req.body;
      const userId = (req as any).user?.id;
      
      if (!type || !description || !related_type || !related_id) {
        res.status(400).json({
          success: false,
          error: 'Se requieren type, description, related_type y related_id'
        });
        return;
      }

      const activity = await activityService.create({
        type,
        description,
        duration,
        outcome,
        related_type,
        related_id,
        user_id: userId
      });

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Actividad registrada correctamente'
      });
    } catch (error) {
      console.error('[Activity] Error creando actividad:', error);
      res.status(500).json({
        success: false,
        error: 'Error al registrar actividad'
      });
    }
  };

  /**
   * GET /api/activities
   * Obtiene actividades con filtros
   */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, relatedType, relatedId, startDate, endDate } = req.query;
      
      const activities = await activityService.getAll({
        userId: userId as string,
        relatedType: relatedType as string,
        relatedId: relatedId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('[Activity] Error obteniendo actividades:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener actividades'
      });
    }
  };

  /**
   * GET /api/activities/by-user/:userId
   * Obtiene actividades de un usuario específico
   */
  public getByUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verificar permisos
      const isManager = (req as any).user?.role === 'manager' || (req as any).user?.role === 'admin';
      const requestingUserId = (req as any).user?.id;
      
      if (!isManager && userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver estas actividades'
        });
        return;
      }

      const activities = await activityService.getByUser(userId, {
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('[Activity] Error obteniendo actividades:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener actividades'
      });
    }
  };

  /**
   * GET /api/activities/by-related/:relatedType/:relatedId
   * Obtiene actividades relacionadas con un cliente, oportunidad o contacto
   */
  public getByRelated = async (req: Request, res: Response): Promise<void> => {
    try {
      const { relatedType, relatedId } = req.params;
      
      const activities = await activityService.getByRelated(relatedType, relatedId);

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('[Activity] Error obteniendo actividades:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener actividades'
      });
    }
  };

  /**
   * GET /api/activities/stats
   * Obtiene estadísticas de actividades
   */
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, startDate, endDate } = req.query;
      
      const stats = await activityService.getStats({
        userId: userId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Activity] Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  };

  /**
   * DELETE /api/activities/:id
   * Elimina una actividad
   */
  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const isManager = (req as any).user?.role === 'manager' || (req as any).user?.role === 'admin';
      
      // Verificar que el usuario sea el creador o un manager
      const activity = await activityService.getById(id);
      
      if (!activity) {
        res.status(404).json({
          success: false,
          error: 'Actividad no encontrada'
        });
        return;
      }
      
      if (!isManager && activity.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'No tienes permiso para eliminar esta actividad'
        });
        return;
      }

      await activityService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Actividad eliminada correctamente'
      });
    } catch (error) {
      console.error('[Activity] Error eliminando actividad:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar actividad'
      });
    }
  };
}

// Exportar instancia
export const activityController = new ActivityController();
