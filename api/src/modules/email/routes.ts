// ============================================
// EMAIL ROUTES - API para sistema bidireccional
// ============================================

import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth';
import { tenantMiddleware } from '../../shared/middleware/tenant';
import { validateWebhookSignature, validateWebhookSignatureOptional } from '../../middleware/webhook-auth';
import { EmailController } from './controller';

const router = Router();
const emailController = new EmailController();

// ============================================
// AUTENTICACIÓN
// ============================================
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// CUENTAS DE EMAIL
// ============================================
router.get('/accounts', emailController.getAccounts);
router.post('/accounts', emailController.createAccount);
router.post('/accounts/test', emailController.testAccount);

// ============================================
// CONVERSACIONES
// ============================================
router.get('/conversations', emailController.getConversations);
router.get('/conversations/:id', emailController.getConversation);
router.patch('/conversations/:id/close', emailController.closeConversation);

// ============================================
// ENVIAR EMAILS
// ============================================
router.post('/send', emailController.sendEmail);

// ============================================
// TEMPLATES
// ============================================
router.get('/templates', emailController.getTemplates);
router.post('/templates', emailController.createTemplate);

// ============================================
// TRACKING (Público)
// ============================================
router.get('/track/:messageId', emailController.trackOpen);

// ============================================
// WEBHOOK INBOUND (Público - para SendGrid/AWS SES)
// ============================================
import rateLimit from 'express-rate-limit';

// Rate limiter específico para webhooks: 100 requests por IP cada 15 minutos
const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'Too many webhook requests from this IP',
    retryAfter: '900'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // No saltar requests exitosos para prevenir abuso
  skipSuccessfulRequests: false,
  // Handler personalizado para logging
  handler: (req, res, next, options) => {
    console.warn(`[SECURITY] Webhook rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

router.post('/inbound', webhookRateLimiter, validateWebhookSignature, emailController.receiveInboundEmail);

export default router;
