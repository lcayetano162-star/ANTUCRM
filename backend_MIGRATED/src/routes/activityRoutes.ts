import { Router } from 'express';
import { activityController } from '../controllers/activityController';

/**
 * Rutas para el registro de actividades
 * Base: /api/activities
 */

const router = Router();

// POST /api/activities - Crear una nueva actividad
router.post('/', activityController.create);

// GET /api/activities - Obtener actividades con filtros
router.get('/', activityController.getAll);

// GET /api/activities/stats - Obtener estadísticas de actividades
router.get('/stats', activityController.getStats);

// GET /api/activities/by-user/:userId - Obtener actividades de un usuario
router.get('/by-user/:userId', activityController.getByUser);

// GET /api/activities/by-related/:relatedType/:relatedId - Obtener actividades relacionadas
router.get('/by-related/:relatedType/:relatedId', activityController.getByRelated);

// DELETE /api/activities/:id - Eliminar una actividad
router.delete('/:id', activityController.delete);

export default router;
