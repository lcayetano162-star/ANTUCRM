import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';
import { VALID_SCOPES_LIST } from '../../shared/middleware/apiKeyAuth';
import { dispatchWebhookEvent } from '../../shared/services/webhookService';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Eventos disponibles para suscripción
const VALID_EVENTS = [
  'client.created','client.updated','client.deleted',
  'contact.created','contact.updated',
  'opportunity.created','opportunity.updated','opportunity.won','opportunity.lost',
  'quote.created','quote.accepted','quote.rejected',
  'invoice.created','invoice.sent','invoice.paid','invoice.overdue','invoice.void',
  'ticket.created','ticket.assigned','ticket.resolved','ticket.closed',
  'inventory.low_stock','inventory.out_of_stock',
  'activity.completed','task.completed',
];

// ═══════════════════════════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/integrations/api-keys
router.get('/api-keys', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT id, name, description, key_prefix, scopes, is_active, last_used_at, expires_at, created_at
         FROM api_keys
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Integrations] list api-keys error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/integrations/api-keys — Crear nueva API key
// La clave completa se retorna UNA SOLA VEZ en la respuesta
router.post('/api-keys', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, scopes = [], expires_at } = req.body;

    if (!name || name.trim().length === 0)
      return res.status(400).json({ error: 'El nombre de la API key es requerido' });
    if (name.length > 100)
      return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });

    const invalidScopes = scopes.filter((s: string) => !VALID_SCOPES_LIST.includes(s));
    if (invalidScopes.length > 0)
      return res.status(400).json({ error: `Scopes inválidos: ${invalidScopes.join(', ')}`, valid: VALID_SCOPES_LIST });

    // Generar clave segura: ak_<32 bytes hex> = "ak_" + 64 chars
    const rawKey    = 'ak_' + crypto.randomBytes(32).toString('hex');
    const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 10); // "ak_a1b2c3d4"

    const result = await query(
      `INSERT INTO api_keys (tenant_id, name, description, key_prefix, key_hash, scopes, expires_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, description, key_prefix, scopes, is_active, expires_at, created_at`,
      [user.tenant_id, name.trim(), description || null, keyPrefix, keyHash,
       scopes, expires_at || null, user.id || user.userId]
    );

    // Retornar la clave completa SOLO en esta respuesta
    res.status(201).json({ ...result.rows[0], full_key: rawKey, _warning: 'Guarda esta clave ahora. No se mostrará de nuevo.' });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe una API key con ese nombre' });
    console.error('[Integrations] create api-key error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/integrations/api-keys/:id — Activar/desactivar o actualizar descripción
router.put('/api-keys/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const { is_active, description, scopes } = req.body;

    if (scopes) {
      const invalid = scopes.filter((s: string) => !VALID_SCOPES_LIST.includes(s));
      if (invalid.length > 0) return res.status(400).json({ error: `Scopes inválidos: ${invalid.join(', ')}` });
    }

    const result = await query(
      `UPDATE api_keys
           SET is_active   = COALESCE($1, is_active),
               description = COALESCE($2, description),
               scopes      = COALESCE($3, scopes),
               updated_at  = NOW()
         WHERE id = $4 AND tenant_id = $5 RETURNING id, name, key_prefix, scopes, is_active, last_used_at, expires_at`,
      [is_active ?? null, description ?? null, scopes ?? null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Integrations] update api-key error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/integrations/api-keys/:id — Revocar permanentemente
router.delete('/api-keys/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await query(
      'DELETE FROM api_keys WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key no encontrada' });
    res.json({ message: 'API key revocada exitosamente' });
  } catch (err) {
    console.error('[Integrations] delete api-key error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/integrations/webhooks
router.get('/webhooks', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT id, name, url, events, is_active, failure_count, last_triggered_at, last_success_at, created_at
         FROM webhooks
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Integrations] list webhooks error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/integrations/webhooks
router.post('/webhooks', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, url, events = [] } = req.body;

    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!url  || url.trim().length === 0)  return res.status(400).json({ error: 'La URL es requerida' });
    try { new URL(url) } catch { return res.status(400).json({ error: 'URL inválida' }); }
    if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ error: 'Selecciona al menos un evento' });
    const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) return res.status(400).json({ error: `Eventos inválidos: ${invalidEvents.join(', ')}` });

    const secret = crypto.randomBytes(32).toString('hex');

    const result = await query(
      `INSERT INTO webhooks (tenant_id, name, url, secret, events, created_by)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, name, url, events, is_active, failure_count, last_triggered_at, created_at`,
      [user.tenant_id, name.trim(), url.trim(), secret, events, user.id || user.userId]
    );
    // Retornar el secret SOLO al crear
    res.status(201).json({ ...result.rows[0], secret, _warning: 'Guarda este secret ahora. No se mostrará de nuevo.' });
  } catch (err) {
    console.error('[Integrations] create webhook error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/integrations/webhooks/:id
router.put('/webhooks/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const { name, url, events, is_active } = req.body;

    if (url) { try { new URL(url) } catch { return res.status(400).json({ error: 'URL inválida' }); } }
    if (events) {
      const invalid = events.filter((e: string) => !VALID_EVENTS.includes(e));
      if (invalid.length > 0) return res.status(400).json({ error: `Eventos inválidos: ${invalid.join(', ')}` });
    }

    const result = await query(
      `UPDATE webhooks
           SET name       = COALESCE($1, name),
               url        = COALESCE($2, url),
               events     = COALESCE($3, events),
               is_active  = COALESCE($4, is_active),
               failure_count = CASE WHEN $4 = true THEN 0 ELSE failure_count END,
               updated_at = NOW()
         WHERE id = $5 AND tenant_id = $6
         RETURNING id, name, url, events, is_active, failure_count, last_triggered_at`,
      [name ?? null, url ?? null, events ?? null, is_active ?? null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Integrations] update webhook error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/integrations/webhooks/:id
router.delete('/webhooks/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await query(
      'DELETE FROM webhooks WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook no encontrado' });
    res.json({ message: 'Webhook eliminado exitosamente' });
  } catch (err) {
    console.error('[Integrations] delete webhook error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/integrations/webhooks/:id/test — Enviar evento de prueba
router.post('/webhooks/:id/test', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

    const wh = await query(
      'SELECT id, url, is_active FROM webhooks WHERE id = $1 AND tenant_id = $2',
      [req.params.id, user.tenant_id]
    );
    if (wh.rows.length === 0) return res.status(404).json({ error: 'Webhook no encontrado' });
    if (!wh.rows[0].is_active) return res.status(400).json({ error: 'El webhook está desactivado' });

    await dispatchWebhookEvent(user.tenant_id, 'test.ping', {
      message: 'Evento de prueba desde Antü CRM',
      webhook_id: req.params.id,
      triggered_by: user.email,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Evento de prueba enviado. Revisa el log de entregas en unos segundos.' });
  } catch (err) {
    console.error('[Integrations] test webhook error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/integrations/webhooks/:id/events — Log de entregas
router.get('/webhooks/:id/events', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const { page = '1', limit = '20' } = req.query;
    const pageNum  = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 20);
    const offset   = (pageNum - 1) * limitNum;

    const result = await query(
      `SELECT id, event_type, status, attempts, response_code, error_message, delivered_at, created_at
         FROM webhook_events
        WHERE webhook_id = $1 AND tenant_id = $2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4`,
      [req.params.id, user.tenant_id, limitNum, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Integrations] events log error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/integrations/events — Catálogo de eventos disponibles
router.get('/events', authenticateToken, async (_req: Request, res: Response) => {
  res.json(VALID_EVENTS);
});

// GET /api/integrations/scopes — Catálogo de scopes disponibles
router.get('/scopes', authenticateToken, async (_req: Request, res: Response) => {
  res.json(VALID_SCOPES_LIST);
});

export default router;
