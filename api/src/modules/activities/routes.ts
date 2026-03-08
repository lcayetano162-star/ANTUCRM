import { Router, Request, Response } from 'express';
import { activityService } from './services/activityService';
import { requireModule } from '../../shared/middleware/moduleCheck';
import { authenticateToken } from '../../shared/middleware/auth';

const router = Router();
router.use(requireModule('activities'));

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { related_type, related_id, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const activities = await activityService.getAll({
      userId: user.userId,
      relatedType: related_type as string,
      relatedId: related_id as string,
      limit: parseInt(limit as string),
      offset
    });
    res.json(activities);
  } catch (error) {
    console.error('[Activities] Error listando actividades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const stats = await activityService.getStats(user.userId, startDate);
    res.json(stats);
  } catch (error) {
    console.error('[Activities] Error obteniendo estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/by-user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const activities = await activityService.getByUser(req.params.userId, parseInt(limit as string), offset);
    res.json(activities);
  } catch (error) {
    console.error('[Activities] Error listando actividades por usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/by-related/:type/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const activities = await activityService.getByRelated(req.params.type, req.params.id);
    res.json(activities);
  } catch (error) {
    console.error('[Activities] Error listando actividades relacionadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, description, duration, outcome, related_type, related_id } = req.body;
    if (!type || !description || !related_type || !related_id) {
      return res.status(400).json({ error: 'type, description, related_type y related_id son requeridos' });
    }
    const activity = await activityService.create({ type, description, duration, outcome, related_type, related_id, user_id: user.userId, tenant_id: user.tenant_id });
    res.status(201).json(activity);
  } catch (error) {
    console.error('[Activities] Error creando actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const deleted = await activityService.delete(req.params.id, user.userId);
    if (!deleted) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('[Activities] Error eliminando actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
