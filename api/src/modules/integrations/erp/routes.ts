import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../../shared/middleware/auth';
import { encryptApiKey, decryptApiKey, logIntegrationCall, lookupRNC, dispatchInvoiceToERP } from './integrationService';

const router = Router();

const VALID_SERVICES = ['alegra', 'odoo', 'quickbooks', 'dgii'] as const;
type ServiceName = typeof VALID_SERVICES[number];

// Ensure tables exist (auto-migration guard)
async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS erp_integrations (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id        UUID        NOT NULL,
      service_name     VARCHAR(50) NOT NULL,
      api_url          TEXT,
      api_key_encrypted TEXT,
      is_active        BOOLEAN     NOT NULL DEFAULT false,
      auto_sync        BOOLEAN     NOT NULL DEFAULT false,
      extra_config     JSONB       NOT NULL DEFAULT '{}',
      last_sync_at     TIMESTAMPTZ,
      last_status      VARCHAR(20) DEFAULT 'unconfigured',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, service_name)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS erp_integration_logs (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id        UUID        NOT NULL,
      service_name     VARCHAR(50) NOT NULL,
      endpoint         TEXT        NOT NULL,
      method           VARCHAR(10) NOT NULL DEFAULT 'GET',
      status_code      INTEGER,
      duration_ms      INTEGER,
      request_payload  JSONB,
      response_body    JSONB,
      error_message    TEXT,
      triggered_by     VARCHAR(100),
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── GET /api/integrations/erp ─────────────────────────────────────────────
// List all ERP integrations for the tenant (never return raw key)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    await ensureTables();
    const user = (req as any).user;
    const result = await query(
      `SELECT id, service_name, api_url, is_active, auto_sync, extra_config,
              last_sync_at, last_status, created_at, updated_at,
              (api_key_encrypted IS NOT NULL AND api_key_encrypted != '') AS api_key_set
         FROM erp_integrations
        WHERE tenant_id = $1
        ORDER BY service_name`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ERP] list error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── PUT /api/integrations/erp/:service ────────────────────────────────────
// Save/update config for a specific service
router.put('/:service', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await ensureTables();
    const user = (req as any).user;
    const service = req.params.service as ServiceName;
    if (!VALID_SERVICES.includes(service)) {
      return res.status(400).json({ error: `Servicio inválido. Use: ${VALID_SERVICES.join(', ')}` });
    }

    const { api_url, api_key, is_active, auto_sync, extra_config } = req.body;

    // Fetch existing row to preserve encrypted key if no new one provided
    const existing = await query(
      'SELECT api_key_encrypted FROM erp_integrations WHERE tenant_id=$1 AND service_name=$2',
      [user.tenant_id, service]
    );

    let encryptedKey = existing.rows[0]?.api_key_encrypted || null;
    // Only re-encrypt if a new (non-masked) key was submitted
    if (api_key && api_key !== '••••••••') {
      encryptedKey = encryptApiKey(api_key);
    }

    const result = await query(
      `INSERT INTO erp_integrations
         (tenant_id, service_name, api_url, api_key_encrypted, is_active, auto_sync, extra_config, last_status, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'unconfigured',NOW())
       ON CONFLICT (tenant_id, service_name) DO UPDATE SET
         api_url          = COALESCE($3, erp_integrations.api_url),
         api_key_encrypted= COALESCE($4, erp_integrations.api_key_encrypted),
         is_active        = COALESCE($5, erp_integrations.is_active),
         auto_sync        = COALESCE($6, erp_integrations.auto_sync),
         extra_config     = COALESCE($7, erp_integrations.extra_config),
         updated_at       = NOW()
       RETURNING id, service_name, api_url, is_active, auto_sync, extra_config, last_status,
                 (api_key_encrypted IS NOT NULL AND api_key_encrypted != '') AS api_key_set`,
      [
        user.tenant_id, service,
        api_url || null,
        encryptedKey,
        is_active !== undefined ? is_active : null,
        auto_sync !== undefined ? auto_sync : null,
        extra_config ? JSON.stringify(extra_config) : null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ERP] save error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /api/integrations/erp/:service/test ──────────────────────────────
// Test connectivity to the configured ERP
router.post('/:service/test', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await ensureTables();
    const user = (req as any).user;
    const service = req.params.service as ServiceName;
    if (!VALID_SERVICES.includes(service) || service === 'dgii') {
      return res.status(400).json({ error: 'Use el endpoint DGII para consultar RNCs' });
    }

    const row = await query(
      'SELECT api_url, api_key_encrypted, extra_config FROM erp_integrations WHERE tenant_id=$1 AND service_name=$2',
      [user.tenant_id, service]
    );
    if (row.rows.length === 0 || !row.rows[0].api_key_encrypted) {
      return res.status(400).json({ error: 'Configura las credenciales antes de probar la conexión' });
    }

    const cfg = row.rows[0];
    const apiKey = decryptApiKey(cfg.api_key_encrypted);
    const apiUrl = cfg.api_url;
    const start = Date.now();

    let testEndpoint = '';
    let testHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

    if (service === 'alegra') {
      const [user_, token] = apiKey.split(':');
      testEndpoint = `${apiUrl || 'https://app.alegra.com/api/r1'}/company`;
      testHeaders['Authorization'] = 'Basic ' + Buffer.from(`${user_}:${token}`).toString('base64');
    } else if (service === 'odoo') {
      testEndpoint = `${apiUrl}/web/dataset/call_kw`;
      testHeaders['Authorization'] = `Bearer ${apiKey}`;
    } else if (service === 'quickbooks') {
      const realmId = cfg.extra_config?.realm_id || '';
      testEndpoint = `${apiUrl || 'https://quickbooks.api.intuit.com'}/v3/company/${realmId}/companyinfo/${realmId}`;
      testHeaders['Authorization'] = `Bearer ${apiKey}`;
      testHeaders['Accept'] = 'application/json';
    }

    try {
      const resp = await fetch(testEndpoint, { method: 'GET', headers: testHeaders });
      const body = await resp.json().catch(() => ({}));
      const duration = Date.now() - start;

      await logIntegrationCall({
        tenantId: user.tenant_id, serviceName: service,
        endpoint: testEndpoint, method: 'GET',
        statusCode: resp.status, durationMs: duration,
        responseBody: body, triggeredBy: 'test'
      });

      await query(
        `UPDATE erp_integrations SET last_sync_at=NOW(), last_status=$1 WHERE tenant_id=$2 AND service_name=$3`,
        [resp.ok ? 'ok' : 'error', user.tenant_id, service]
      );

      if (resp.ok) {
        return res.json({ success: true, message: 'Conexión exitosa', status_code: resp.status, duration_ms: duration });
      } else {
        return res.status(400).json({ error: `Error ${resp.status} al conectar con ${service}`, details: body });
      }
    } catch (fetchErr: any) {
      const duration = Date.now() - start;
      await logIntegrationCall({
        tenantId: user.tenant_id, serviceName: service,
        endpoint: testEndpoint, method: 'GET',
        durationMs: duration, errorMessage: fetchErr.message, triggeredBy: 'test'
      });
      await query(
        `UPDATE erp_integrations SET last_status='error' WHERE tenant_id=$1 AND service_name=$2`,
        [user.tenant_id, service]
      );
      return res.status(400).json({ error: 'No se pudo conectar: ' + fetchErr.message });
    }
  } catch (err) {
    console.error('[ERP] test error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GET /api/integrations/erp/:service/logs ──────────────────────────────
router.get('/:service/logs', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await ensureTables();
    const user = (req as any).user;
    const service = req.params.service;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 30);

    const result = await query(
      `SELECT id, endpoint, method, status_code, duration_ms, error_message, triggered_by, created_at
         FROM erp_integration_logs
        WHERE tenant_id=$1 AND service_name=$2
        ORDER BY created_at DESC
        LIMIT $3`,
      [user.tenant_id, service, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ERP] logs error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── DELETE /api/integrations/erp/:service ────────────────────────────────
// Revoke / remove integration config
router.delete('/:service', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await query(
      'DELETE FROM erp_integrations WHERE tenant_id=$1 AND service_name=$2',
      [user.tenant_id, req.params.service]
    );
    res.json({ message: 'Integración eliminada' });
  } catch (err) {
    console.error('[ERP] delete error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GET /api/integrations/dgii/:rnc ──────────────────────────────────────
// RNC lookup — called without requiring admin (any authenticated user can look up)
router.get('/dgii/:rnc', authenticateToken, async (req: Request, res: Response) => {
  const rnc = req.params.rnc.replace(/[^0-9]/g, '');
  if (rnc.length < 9 || rnc.length > 11) {
    return res.status(400).json({ error: 'RNC inválido. Debe tener 9 u 11 dígitos.' });
  }

  const start = Date.now();
  const user = (req as any).user;
  try {
    const data = await lookupRNC(rnc);
    await logIntegrationCall({
      tenantId: user.tenant_id, serviceName: 'dgii',
      endpoint: `/dgii/${rnc}`, method: 'GET',
      statusCode: 200, durationMs: Date.now() - start,
      responseBody: data, triggeredBy: 'rnc_lookup'
    });
    res.json(data);
  } catch (err: any) {
    await logIntegrationCall({
      tenantId: user.tenant_id, serviceName: 'dgii',
      endpoint: `/dgii/${rnc}`, method: 'GET',
      statusCode: 404, durationMs: Date.now() - start,
      errorMessage: err.message, triggeredBy: 'rnc_lookup'
    });
    res.status(404).json({ error: err.message, rnc });
  }
});

// ─── Webhook: invoice.created → dispatch to ERPs ─────────────────────────
// Called internally by invoicing module after creating an invoice
router.post('/dispatch/invoice-created', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { invoice } = req.body;
    if (!invoice) return res.status(400).json({ error: 'invoice es requerido' });

    // Fire-and-forget: don't block the response
    dispatchInvoiceToERP(user.tenant_id, invoice).catch(e =>
      console.error('[ERP] dispatch error:', e)
    );

    res.json({ message: 'Dispatched to configured ERP integrations' });
  } catch (err) {
    console.error('[ERP] dispatch error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
