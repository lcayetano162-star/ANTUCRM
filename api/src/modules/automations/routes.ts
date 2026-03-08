import { Router, Request, Response } from 'express';
import { query } from '../../shared/config/database';
import { authenticateToken } from '../../shared/middleware/auth';
import { automationWorker } from './automationWorker';

const router = Router();

// ── GET /api/automations — list rules for tenant ──────────────────────────────
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      `SELECT ar.*,
              u.first_name || ' ' || u.last_name AS created_by_name,
              (SELECT COUNT(*) FROM automation_logs al WHERE al.rule_id = ar.id AND al.status = 'success') AS total_executions,
              (SELECT COUNT(*) FROM automation_logs al WHERE al.rule_id = ar.id AND al.status = 'error') AS total_errors
       FROM automation_rules ar
       LEFT JOIN users u ON ar.created_by = u.id
       WHERE ar.tenant_id = $1
       ORDER BY ar.created_at DESC`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/automations — create rule ───────────────────────────────────────
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, description, trigger_type, trigger_config, action_type, action_config } = req.body;

  const VALID_TRIGGERS = ['deal_stuck','contact_inactive','task_overdue','deal_won','deal_lost','stage_changed','new_deal_created'];
  const VALID_ACTIONS  = ['create_task','send_notification','change_stage','webhook'];

  if (!name) return res.status(400).json({ error: 'name es requerido' });
  if (!VALID_TRIGGERS.includes(trigger_type)) return res.status(400).json({ error: 'trigger_type inválido', valid: VALID_TRIGGERS });
  if (!VALID_ACTIONS.includes(action_type))   return res.status(400).json({ error: 'action_type inválido', valid: VALID_ACTIONS });

  try {
    const result = await query(
      `INSERT INTO automation_rules
         (tenant_id, name, description, trigger_type, trigger_config, action_type, action_config, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [user.tenant_id, name, description, trigger_type,
       JSON.stringify(trigger_config || {}),
       action_type, JSON.stringify(action_config || {}),
       user.id || user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/automations/:id — update rule ────────────────────────────────────
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, description, trigger_type, trigger_config, action_type, action_config, is_active } = req.body;

  try {
    const result = await query(
      `UPDATE automation_rules SET
          name           = COALESCE($1, name),
          description    = COALESCE($2, description),
          trigger_type   = COALESCE($3, trigger_type),
          trigger_config = COALESCE($4, trigger_config),
          action_type    = COALESCE($5, action_type),
          action_config  = COALESCE($6, action_config),
          is_active      = COALESCE($7, is_active),
          updated_at     = NOW()
       WHERE id = $8 AND tenant_id = $9 RETURNING *`,
      [name, description, trigger_type,
       trigger_config ? JSON.stringify(trigger_config) : null,
       action_type,
       action_config  ? JSON.stringify(action_config)  : null,
       is_active !== undefined ? is_active : null,
       req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/automations/:id/toggle — toggle active ────────────────────────
router.patch('/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      `UPDATE automation_rules SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 RETURNING id, name, is_active`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/automations/:id ───────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      'DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/automations/:id/logs — execution history ────────────────────────
router.get('/:id/logs', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      `SELECT al.* FROM automation_logs al
       JOIN automation_rules ar ON al.rule_id = ar.id
       WHERE al.rule_id = $1 AND ar.tenant_id = $2
       ORDER BY al.created_at DESC LIMIT 50`,
      [req.params.id, user.tenant_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/automations/notifications/unread ─────────────────────────────────
router.get('/notifications/unread', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      `SELECT * FROM automation_notifications
       WHERE tenant_id = $1
         AND (user_id = $2 OR user_id IS NULL)
         AND is_read = false
       ORDER BY created_at DESC LIMIT 20`,
      [user.tenant_id, user.id || user.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/automations/notifications/read-all ─────────────────────────────
router.post('/notifications/read-all', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    await query(
      `UPDATE automation_notifications SET is_read = true
       WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [user.tenant_id, user.id || user.userId]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/automations/run-now — manual trigger for admin/testing ──────────
router.post('/run-now', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!['admin','landlord'].includes(user.role)) {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  try {
    automationWorker.runNow();
    res.json({ ok: true, message: 'Verificación iniciada en background' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
