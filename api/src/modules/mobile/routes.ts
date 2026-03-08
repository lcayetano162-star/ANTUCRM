// ============================================
// MOBILE ROUTES - API endpoints for mobile app
// ============================================

import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth';
import { tenantMiddleware } from '../../shared/middleware/tenant';
import { MobileController } from './controller';

const router = Router();
const mobileController = new MobileController();

// All mobile routes require authentication and tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/stats', mobileController.getDashboardStats);
router.get('/dashboard/tasks', mobileController.getTodayTasks);
router.get('/dashboard/opportunities', mobileController.getHotOpportunities);

// ============================================
// CLIENTS
// ============================================
router.get('/clients', mobileController.getClients);
router.get('/clients/nearby', mobileController.getNearbyClients);
router.patch('/clients/:id/hot', mobileController.toggleHotClient);

// ============================================
// OPPORTUNITIES
// ============================================
router.get('/opportunities', mobileController.getOpportunities);
router.patch('/opportunities/:id/stage', mobileController.updateOpportunityStage);

// ============================================
// TASKS
// ============================================
router.get('/tasks', mobileController.getTasks);
router.post('/tasks/:id/complete', mobileController.completeTask);

// ============================================
// CHECK-IN / GEOLOCATION
// ============================================
router.post('/checkin', mobileController.createCheckIn);
router.get('/checkins/history', mobileController.getCheckInHistory);

// ============================================
// VOICE NOTES
// ============================================
router.post('/voice-note', mobileController.createVoiceNote);
router.post('/transcribe', mobileController.transcribeAudio);

// ============================================
// BUSINESS CARD SCANNER
// ============================================
router.post('/scan-card', mobileController.scanBusinessCard);

// ============================================
// PUSH NOTIFICATIONS
// ============================================
router.post('/push-subscription', mobileController.savePushSubscription);
router.delete('/push-subscription', mobileController.removePushSubscription);

export default router;
