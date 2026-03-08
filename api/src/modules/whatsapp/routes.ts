// ============================================
// WHATSAPP ROUTES - API Endpoints
// ============================================

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { whatsAppService } from './whatsappService';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';
import { query } from '../../shared/config/database';

const router = Router();

// Rate limiting más estricto para WhatsApp
const whatsappLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 mensajes por minuto
  message: { error: 'Rate limit exceeded. Please wait before sending more messages.' },
});

// ============================================
// CONFIGURACIÓN
// ============================================

// GET /api/whatsapp/config - Obtener configuración
router.get('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const result = await query(
      `SELECT id, phone_number_id, business_account_id, is_active, is_verified, 
              connected_at, messages_sent_today, messages_sent_date, created_at
       FROM whatsapp_config 
       WHERE tenant_id = $1`,
      [user.tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ configured: false });
    }
    
    res.json({
      configured: true,
      config: result.rows[0],
    });
  } catch (error) {
    console.error('[WhatsApp] Error getting config:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/whatsapp/config - Configurar WhatsApp (Admin only)
router.post('/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { phoneNumberId, businessAccountId, accessToken, appSecret, webhookVerifyToken } = req.body;
    
    // Validar campos requeridos
    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ error: 'phoneNumberId and accessToken are required' });
    }
    
    // Verificar que el token funciona (test call a WhatsApp API)
    try {
      const testResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`
      );
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        return res.status(400).json({
          error: 'Invalid credentials',
          detail: errorData.error?.message || 'Could not validate WhatsApp credentials'
        });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Could not connect to WhatsApp API' });
    }
    
    // Guardar configuración
    await query(
      `INSERT INTO whatsapp_config (
        tenant_id, phone_number_id, business_account_id, access_token, 
        app_secret, webhook_verify_token, is_active, is_verified, connected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        phone_number_id = EXCLUDED.phone_number_id,
        business_account_id = EXCLUDED.business_account_id,
        access_token = EXCLUDED.access_token,
        app_secret = EXCLUDED.app_secret,
        webhook_verify_token = EXCLUDED.webhook_verify_token,
        is_active = true,
        is_verified = true,
        connected_at = NOW(),
        updated_at = NOW()`,
      [user.tenant_id, phoneNumberId, businessAccountId, accessToken, appSecret, webhookVerifyToken]
    );
    
    res.json({ success: true, message: 'WhatsApp configured successfully' });
  } catch (error) {
    console.error('[WhatsApp] Error configuring:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/whatsapp/config - Desconectar WhatsApp
router.delete('/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    await query(
      'UPDATE whatsapp_config SET is_active = false, updated_at = NOW() WHERE tenant_id = $1',
      [user.tenant_id]
    );
    
    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (error) {
    console.error('[WhatsApp] Error disconnecting:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================
// MENSAJES
// ============================================

// POST /api/whatsapp/send - Enviar mensaje
router.post('/send', authenticateToken, whatsappLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { phoneNumber, message, contactId, clientId, opportunityId, templateName, templateParams } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber and message are required' });
    }
    
    const result = await whatsAppService.sendMessage({
      tenantId: user.tenant_id,
      phoneNumber,
      message,
      contactId,
      clientId,
      opportunityId,
      templateName,
      templateParams,
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error);
    res.status(400).json({
      error: error.message || 'Error sending message',
      code: error.code,
      retryable: error.isRetryable,
    });
  }
});

// GET /api/whatsapp/messages - Listar mensajes
router.get('/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contactId, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'tenant_id = $1 AND deleted_at IS NULL';
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;
    
    if (contactId) {
      whereClause += ` AND contact_id = $${paramIndex}`;
      params.push(contactId);
      paramIndex++;
    }
    
    const messages = await query(
      `SELECT wm.*, c.first_name || ' ' || c.last_name as contact_name
       FROM whatsapp_messages wm
       LEFT JOIN contacts c ON wm.contact_id = c.id
       WHERE ${whereClause}
       ORDER BY wm.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) FROM whatsapp_messages WHERE ${whereClause}`,
      params
    );
    
    res.json({
      data: messages.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('[WhatsApp] Error listing messages:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/whatsapp/conversations - Listar conversaciones únicas
router.get('/conversations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const result = await query(
      `SELECT DISTINCT ON (wm.phone_number)
        wm.phone_number,
        wm.contact_id,
        c.first_name || ' ' || c.last_name as contact_name,
        c.company as contact_company,
        wm.content as last_message,
        wm.direction as last_direction,
        wm.created_at as last_message_at,
        wm.status as last_status,
        (SELECT COUNT(*) FROM whatsapp_messages 
         WHERE phone_number = wm.phone_number AND tenant_id = $1 AND direction = 'inbound' 
         AND created_at > COALESCE(
           (SELECT MAX(created_at) FROM whatsapp_messages WHERE phone_number = wm.phone_number AND direction = 'outbound'),
           '1970-01-01'
         )
        ) as unread_count
       FROM whatsapp_messages wm
       LEFT JOIN contacts c ON wm.contact_id = c.id
       WHERE wm.tenant_id = $1 AND wm.deleted_at IS NULL
       ORDER BY wm.phone_number, wm.created_at DESC`,
      [user.tenant_id]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('[WhatsApp] Error listing conversations:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================
// WEBHOOK (Público - para Meta)
// ============================================

// GET /api/whatsapp/webhook - Verificación de webhook
router.get('/webhook', async (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Buscar tenant por verify_token
    const result = await query(
      'SELECT tenant_id FROM whatsapp_config WHERE webhook_verify_token = $1 AND is_active = true',
      [token]
    );
    
    if (mode === 'subscribe' && result.rows.length > 0) {
      console.log(`[WhatsApp] Webhook verified for tenant: ${result.rows[0].tenant_id}`);
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } catch (error) {
    console.error('[WhatsApp] Webhook verification error:', error);
    res.sendStatus(500);
  }
});

// POST /api/whatsapp/webhook - Recibir eventos
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = req.body;
    
    // Obtener appSecret (necesitamos buscar por phone_number_id en el payload)
    const phoneNumberId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    
    if (!phoneNumberId) {
      return res.sendStatus(400);
    }
    
    const configResult = await query(
      'SELECT tenant_id, app_secret FROM whatsapp_config WHERE phone_number_id = $1',
      [phoneNumberId]
    );
    
    if (configResult.rows.length === 0) {
      return res.sendStatus(404);
    }
    
    const { app_secret } = configResult.rows[0];
    
    // Responder inmediatamente a Meta (no bloquear)
    res.sendStatus(200);
    
    // Procesar en background
    whatsAppService.processWebhook(payload, signature?.replace('sha256=', '') || '', app_secret || '')
      .catch(error => {
        console.error('[WhatsApp] Webhook processing error:', error);
      });
      
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    res.sendStatus(500);
  }
});

// ============================================
// TEMPLATES
// ============================================

// GET /api/whatsapp/templates - Listar templates aprobados
router.get('/templates', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const result = await query(
      `SELECT id, template_id, name, language, category, status, components, usage_count, last_used_at
       FROM whatsapp_templates 
       WHERE tenant_id = $1 AND status = 'APPROVED'
       ORDER BY usage_count DESC, name ASC`,
      [user.tenant_id]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('[WhatsApp] Error listing templates:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
