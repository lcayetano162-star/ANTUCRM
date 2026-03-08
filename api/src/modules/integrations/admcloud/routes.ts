import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import { pool } from '../../../shared/config/database';
import {
  encryptPassword, testConnection,
  syncClients, syncOpportunities, syncInvoices, syncInventory,
  syncAccountsReceivable, syncServiceTickets, syncMarketing,
  AdmcloudConnection
} from './connector';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getConnection(tenantId: string): Promise<AdmcloudConnection | null> {
  const res = await pool.query(
    'SELECT * FROM admcloud_connections WHERE tenant_id = $1 AND is_active = true LIMIT 1',
    [tenantId]
  );
  return res.rows[0] || null;
}

async function startLog(connId: string, tenantId: string, module: string, direction = 'pull'): Promise<string> {
  const res = await pool.query(
    `INSERT INTO admcloud_sync_logs (connection_id, tenant_id, module, direction, status, started_at)
     VALUES ($1,$2,$3,$4,'running',NOW()) RETURNING id`,
    [connId, tenantId, module, direction]
  );
  return res.rows[0].id;
}

async function finishLog(logId: string, status: 'success'|'partial'|'failed', error?: string) {
  await pool.query(
    'UPDATE admcloud_sync_logs SET status=$1, error_message=$2, finished_at=NOW() WHERE id=$3',
    [status, error || null, logId]
  );
}

// ── GET /admcloud/connection ──────────────────────────────────────────────────
router.get('/connection', async (req: Request, res: Response) => {
  try {
    const conn = await pool.query(
      `SELECT id, company, role, app_id, is_active, last_sync_at,
              svc_clients, svc_opportunities, svc_invoices, svc_inventory,
              svc_ar, svc_service, svc_marketing,
              sync_clients, sync_opportunities, sync_invoices, sync_inventory,
              sync_ar, sync_service, sync_marketing, created_at
         FROM admcloud_connections WHERE tenant_id=$1 LIMIT 1`,
      [req.user!.tenantId]
    );
    res.json({ connection: conn.rows[0] || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admcloud/connection ─────────────────────────────────────────────────
router.post('/connection', async (req: Request, res: Response) => {
  try {
    const {
      company, role, app_id, username, password,
      svc_clients, svc_opportunities, svc_invoices, svc_inventory,
      svc_ar, svc_service, svc_marketing,
      sync_clients = true, sync_opportunities = true, sync_invoices = true,
      sync_inventory = true, sync_ar = true, sync_service = false, sync_marketing = false
    } = req.body;

    if (!company || !role || !app_id || !username || !password) {
      return res.status(400).json({ error: 'company, role, app_id, username y password son obligatorios' });
    }

    const password_enc = encryptPassword(password);

    const existing = await pool.query(
      'SELECT id FROM admcloud_connections WHERE tenant_id=$1', [req.user!.tenantId]
    );

    let conn;
    if (existing.rows.length > 0) {
      conn = await pool.query(
        `UPDATE admcloud_connections SET
           company=$1, role=$2, app_id=$3, username=$4, password_enc=$5,
           svc_clients=$6, svc_opportunities=$7, svc_invoices=$8, svc_inventory=$9,
           svc_ar=$10, svc_service=$11, svc_marketing=$12,
           sync_clients=$13, sync_opportunities=$14, sync_invoices=$15, sync_inventory=$16,
           sync_ar=$17, sync_service=$18, sync_marketing=$19, is_active=true, updated_at=NOW()
         WHERE tenant_id=$20
         RETURNING id, company, role, app_id, is_active, sync_clients, sync_opportunities,
                   sync_invoices, sync_inventory, sync_ar, sync_service, sync_marketing`,
        [company, role, app_id, username, password_enc,
         svc_clients||null, svc_opportunities||null, svc_invoices||null, svc_inventory||null,
         svc_ar||null, svc_service||null, svc_marketing||null,
         sync_clients, sync_opportunities, sync_invoices, sync_inventory,
         sync_ar, sync_service, sync_marketing, req.user!.tenantId]
      );
    } else {
      conn = await pool.query(
        `INSERT INTO admcloud_connections
           (tenant_id, company, role, app_id, username, password_enc,
            svc_clients, svc_opportunities, svc_invoices, svc_inventory,
            svc_ar, svc_service, svc_marketing,
            sync_clients, sync_opportunities, sync_invoices, sync_inventory,
            sync_ar, sync_service, sync_marketing, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING id, company, role, app_id, is_active, sync_clients, sync_opportunities,
                   sync_invoices, sync_inventory, sync_ar, sync_service, sync_marketing`,
        [req.user!.tenantId, company, role, app_id, username, password_enc,
         svc_clients||null, svc_opportunities||null, svc_invoices||null, svc_inventory||null,
         svc_ar||null, svc_service||null, svc_marketing||null,
         sync_clients, sync_opportunities, sync_invoices, sync_inventory,
         sync_ar, sync_service, sync_marketing, req.user!.id]
      );
    }

    res.status(201).json({ connection: conn.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admcloud/test ───────────────────────────────────────────────────────
router.post('/test', async (req: Request, res: Response) => {
  try {
    const conn = await getConnection(req.user!.tenantId);
    if (!conn) return res.status(404).json({ error: 'No hay conexión Admcloud configurada' });
    const result = await testConnection(conn);
    res.json(result);
  } catch (err: any) {
    res.json({ ok: false, message: err.message });
  }
});

// ── POST /admcloud/sync/:module ───────────────────────────────────────────────
const MODULES = ['clients','opportunities','invoices','inventory','ar','service','marketing','all'] as const;

router.post('/sync/:module', async (req: Request, res: Response) => {
  const { module } = req.params;
  if (!MODULES.includes(module as any)) {
    return res.status(400).json({ error: `Módulo inválido. Válidos: ${MODULES.join(', ')}` });
  }

  try {
    const conn = await getConnection(req.user!.tenantId);
    if (!conn) return res.status(404).json({ error: 'No hay conexión Admcloud configurada' });

    const summary: Record<string, any> = {};
    const modulesToRun = module === 'all'
      ? (['clients','opportunities','invoices','inventory','ar','service','marketing'] as const)
      : [module as typeof MODULES[number]];

    let clientMap = new Map<string, string>();

    for (const mod of modulesToRun) {
      const enabled = conn[`sync_${mod}` as keyof AdmcloudConnection];
      if (!enabled) { summary[mod] = { skipped: true }; continue; }

      const logId = await startLog(conn.id, conn.tenant_id, mod);
      try {
        if (mod === 'clients') {
          clientMap = await syncClients(conn, logId);
        } else if (mod === 'opportunities') {
          await syncOpportunities(conn, logId, clientMap);
        } else if (mod === 'invoices') {
          await syncInvoices(conn, logId);
        } else if (mod === 'inventory') {
          await syncInventory(conn, logId);
        } else if (mod === 'ar') {
          await syncAccountsReceivable(conn, logId);
        } else if (mod === 'service') {
          await syncServiceTickets(conn, logId);
        } else if (mod === 'marketing') {
          await syncMarketing(conn, logId);
        }
        await finishLog(logId, 'success');
        summary[mod] = { status: 'success' };
      } catch (err: any) {
        await finishLog(logId, 'failed', err.message);
        summary[mod] = { status: 'failed', error: err.message };
      }
    }

    // Actualizar last_sync_at
    await pool.query(
      'UPDATE admcloud_connections SET last_sync_at=NOW() WHERE id=$1',
      [conn.id]
    );

    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /admcloud/logs ────────────────────────────────────────────────────────
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { limit = 50, module } = req.query;
    const params: any[] = [req.user!.tenantId];
    let where = 'WHERE l.tenant_id = $1';
    if (module) { params.push(module); where += ` AND l.module = $${params.length}`; }

    const logs = await pool.query(
      `SELECT l.id, l.module, l.direction, l.status,
              l.records_pulled, l.records_created, l.records_updated, l.records_failed,
              l.error_message, l.started_at, l.finished_at,
              EXTRACT(EPOCH FROM (l.finished_at - l.started_at)) AS duration_seconds
         FROM admcloud_sync_logs l
         ${where}
         ORDER BY l.started_at DESC
         LIMIT $${params.length + 1}`,
      [...params, Number(limit)]
    );

    res.json({ logs: logs.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
