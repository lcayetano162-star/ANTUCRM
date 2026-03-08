/**
 * Webhook Authentication Middleware
 * 
 * Valida firmas HMAC de webhooks entrantes para prevenir
 * envío de emails falsificados por terceros.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Valida la firma HMAC de un webhook entrante
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Next function
 */
export function validateWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  // Obtener firma del header (formato común: X-Webhook-Signature o X-SendGrid-Signature)
  const signature = req.headers['x-webhook-signature'] as string || 
                   req.headers['x-sendgrid-signature'] as string ||
                   req.headers['x-resend-signature'] as string;
  
  const secret = process.env.WEBHOOK_SECRET;
  
  // Si no hay secret configurado, rechazar (fail secure)
  if (!secret) {
    console.error('[SECURITY] WEBHOOK_SECRET not configured. Webhook rejected.');
    res.status(500).json({ 
      error: 'Server configuration error',
      code: 'WEBHOOK_SECRET_MISSING'
    });
    return;
  }
  
  // Si no hay firma en el request, rechazar
  if (!signature) {
    console.warn(`[SECURITY] Webhook missing signature from IP: ${req.ip}`);
    res.status(401).json({ 
      error: 'Missing webhook signature',
      code: 'SIGNATURE_MISSING'
    });
    return;
  }
  
  try {
    // Calcular firma esperada usando HMAC-SHA256
    const payload = JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Comparación timing-safe para prevenir timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    
    // Verificar longitudes iguales antes de comparar
    if (signatureBuffer.length !== expectedBuffer.length) {
      console.warn(`[SECURITY] Invalid webhook signature length from IP: ${req.ip}`);
      res.status(401).json({ 
        error: 'Invalid webhook signature',
        code: 'SIGNATURE_INVALID'
      });
      return;
    }
    
    // Comparación segura
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.warn(`[SECURITY] Invalid webhook signature from IP: ${req.ip}`);
      res.status(401).json({ 
        error: 'Invalid webhook signature',
        code: 'SIGNATURE_MISMATCH'
      });
      return;
    }
    
    // Firma válida, continuar
    next();
    
  } catch (error) {
    console.error('[SECURITY] Error validating webhook signature:', error);
    res.status(401).json({ 
      error: 'Signature validation failed',
      code: 'SIGNATURE_ERROR'
    });
  }
}

/**
 * Middleware opcional que permite pasar sin secret configurado
 * Útil para desarrollo, NO usar en producción
 */
export function validateWebhookSignatureOptional(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!secret) {
    console.warn('[SECURITY] WEBHOOK_SECRET not configured. Allowing webhook in DEV mode.');
    next();
    return;
  }
  
  validateWebhookSignature(req, res, next);
}
