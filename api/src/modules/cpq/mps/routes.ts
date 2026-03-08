import { Router } from 'express';
import { mpsQuoteController } from './controllers/quoteController';
import { mpsConfigController } from './controllers/configController';
import { mpsApprovalController } from './controllers/approvalController';

const router = Router();

// Calculation routes
router.post('/calculate', mpsQuoteController.calculateQuote);
router.post('/recalculate', mpsQuoteController.recalculateQuote);
router.post('/validate', mpsQuoteController.validateInput);
router.get('/example', mpsQuoteController.getExample);

// Config routes
router.get('/config', mpsConfigController.getConfig);
router.put('/config', mpsConfigController.updateConfig);
router.post('/config/reset', mpsConfigController.resetConfig);

// Price approval routes
router.post('/price-approval/request', mpsApprovalController.createRequest);
router.get('/price-approval/pending', mpsApprovalController.getPendingRequests);
router.get('/price-approval/all', mpsApprovalController.getAllRequests);
router.get('/price-approval/by-opportunity/:oportunidadId', mpsApprovalController.getRequestsByOpportunity);
router.get('/price-approval/:id', mpsApprovalController.getRequestById);
router.post('/price-approval/:id/respond', mpsApprovalController.respondToRequest);

export default router;
