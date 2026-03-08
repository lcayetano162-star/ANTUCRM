import { Router } from 'express';
import emailController from '../controllers/emailController';

/**
 * Rutas para el envío y gestión de correos electrónicos
 * Base: /api/emails
 */

const router = Router();

// POST /api/emails/send - Enviar un nuevo correo
router.post('/send', emailController.sendEmail);

// GET /api/emails/contact/:contactId - Obtener correos de un contacto
router.get('/contact/:contactId', emailController.getEmailsByContact);

// GET /api/emails/stats - Estadísticas de correos del usuario
router.get('/stats', emailController.getEmailStats);

// GET /api/emails/verify-config - Verificar configuración SMTP
router.get('/verify-config', emailController.verifySmtpConfig);

// GET /api/emails/:emailId - Obtener un correo específico
router.get('/:emailId', emailController.getEmailById);

export default router;
