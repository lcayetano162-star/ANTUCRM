import { Router, Request, Response } from 'express';
import { performanceService } from './services/performanceService';
import { requireModule } from '../../shared/middleware/moduleCheck';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';

const router = Router();
router.use(requireModule('performance'));

router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Only admins can query other users' metrics; regular users always see their own
    const isAdmin = ['admin', 'superadmin', 'sales_manager'].includes(user.role);
    const requestedUserId = req.query.userId as string;
    const userId = (isAdmin && requestedUserId) ? requestedUserId : (user.id || user.userId);
    const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';
    const metrics = await performanceService.getMetrics(userId, period);
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('[Performance] Error obteniendo metricas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const months = parseInt(req.query.months as string) || 6;
    const history = await performanceService.getHistory(user.userId, months);
    res.json(history);
  } catch (error) {
    console.error('[Performance] Error obteniendo historico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/team', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = await performanceService.getTeamMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('[Performance] Error obteniendo metricas del equipo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.put('/quota/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { monthly_quota, yearly_quota } = req.body;
    if (!monthly_quota || !yearly_quota) {
      return res.status(400).json({ error: 'monthly_quota y yearly_quota son requeridos' });
    }
    const result = await performanceService.updateQuota(req.params.userId, monthly_quota, yearly_quota);
    res.json(result);
  } catch (error) {
    console.error('[Performance] Error actualizando cuota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
