import { Router } from 'express';
import { mpsQuoteController } from '../controllers/mpsQuoteController';
import { mpsConfigController } from '../controllers/mpsConfigController';
import { mpsApprovalController } from '../controllers/mpsApprovalController';

/**
 * Rutas para el Cotizador MPS
 * Base: /api/mps
 */

const router = Router();

// ============================================
// Rutas de Cálculo
// ============================================

// POST /api/mps/calculate - Calcular nueva cotización
router.post('/calculate', mpsQuoteController.calculateQuote);

// POST /api/mps/recalculate - Recalcular con nuevos parámetros
router.post('/recalculate', mpsQuoteController.recalculateQuote);

// POST /api/mps/validate - Validar datos de entrada
router.post('/validate', mpsQuoteController.validateInput);

// GET /api/mps/example - Obtener ejemplo de estructura
router.get('/example', mpsQuoteController.getExample);

// ============================================
// Rutas de Configuración
// ============================================

// GET /api/mps/config - Obtener configuración actual
router.get('/config', mpsConfigController.getConfig);

// PUT /api/mps/config - Actualizar configuración (admin)
router.put('/config', mpsConfigController.updateConfig);

// POST /api/mps/config/reset - Restaurar configuración por defecto (admin)
router.post('/config/reset', mpsConfigController.resetConfig);

// ============================================
// Rutas de Aprobaciones de Precio
// ============================================

// POST /api/mps/price-approval/request - Crear solicitud de aprobación
router.post('/price-approval/request', mpsApprovalController.createRequest);

// GET /api/mps/price-approval/pending - Obtener solicitudes pendientes (gerente)
router.get('/price-approval/pending', mpsApprovalController.getPendingRequests);

// GET /api/mps/price-approval/all - Obtener todas las solicitudes (admin)
router.get('/price-approval/all', mpsApprovalController.getAllRequests);

// GET /api/mps/price-approval/by-opportunity/:oportunidadId - Obtener por oportunidad
router.get('/price-approval/by-opportunity/:oportunidadId', mpsApprovalController.getRequestsByOpportunity);

// GET /api/mps/price-approval/:id - Obtener solicitud específica
router.get('/price-approval/:id', mpsApprovalController.getRequestById);

// POST /api/mps/price-approval/:id/respond - Responder solicitud (aprobar/rechazar)
router.post('/price-approval/:id/respond', mpsApprovalController.respondToRequest);

// ============================================
// Rutas de Cotizaciones Guardadas
// ============================================

// POST /api/mps/quotes - Guardar cotización MPS
// router.post('/quotes', mpsQuoteController.saveQuote);

// GET /api/mps/quotes - Obtener cotizaciones guardadas
// router.get('/quotes', mpsQuoteController.getSavedQuotes);

// GET /api/mps/quotes/:id - Obtener cotización específica
// router.get('/quotes/:id', mpsQuoteController.getQuoteById);

export default router;
