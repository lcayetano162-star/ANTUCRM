import { Router } from 'express';
import { performanceController } from '../controllers/performanceController';

/**
 * Rutas para el módulo de Desempeño
 * Base: /api/performance
 */

const router = Router();

// GET /api/performance/metrics - Obtener métricas de desempeño
router.get('/metrics', performanceController.getMetrics);

// GET /api/performance/team - Obtener métricas del equipo (solo managers)
router.get('/team', performanceController.getTeamMetrics);

// GET /api/performance/history - Obtener histórico de desempeño
router.get('/history', performanceController.getHistory);

// PUT /api/performance/quota - Actualizar cuota (solo managers)
router.put('/quota', performanceController.updateQuota);

export default router;
