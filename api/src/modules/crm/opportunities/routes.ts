import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { query, pool } from '../../../shared/config/database';
import { authenticateToken } from '../../../shared/middleware/auth';
import { fireEvent } from '../../automations/automationEngine';

// Rate limiting para operaciones de escritura
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 operaciones por ventana
  message: { error: 'Demasiadas operaciones. Por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validación de fecha
const isValidFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  return !isNaN(date.getTime()) && date > now;
};

// Sanitización de búsqueda
const sanitizeSearch = (search: string): string => {
  // Escapar caracteres especiales de LIKE
  return search.replace(/[%_]/g, '\\$&');
};

const router = Router();

export const PIPELINE_STAGES = [
  'prospecting', 'qualification', 'proposal',
  'negotiation', 'closed_won', 'closed_lost'
];

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { stage, assigned_to, client_id, search, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let whereConditions = ['o.tenant_id = $1', 'o.deleted_at IS NULL'];
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;
    if (stage) { whereConditions.push(`o.stage = $${paramIndex}`); params.push(stage); paramIndex++; }
    if (assigned_to) { whereConditions.push(`o.owner_id = $${paramIndex}`); params.push(assigned_to); paramIndex++; }
    if (client_id) { whereConditions.push(`o.client_id = $${paramIndex}`); params.push(client_id); paramIndex++; }
    if (search) { whereConditions.push(`o.name ILIKE $${paramIndex}`); params.push(`%${search}%`); paramIndex++; }
    const whereClause = whereConditions.join(' AND ');
    const result = await query(
      `SELECT o.*, c.name as client_name, u.first_name || ' ' || u.last_name as assigned_user_name
       FROM opportunities o
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN users u ON o.owner_id = u.id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM opportunities o WHERE ${whereClause} AND o.deleted_at IS NULL`, [...params]);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('[Opportunities] Error listando oportunidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/pipeline/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(estimated_revenue), 0) as total_value
       FROM opportunities WHERE tenant_id = $1 GROUP BY stage`,
      [user.tenant_id]
    );
    const summary: Record<string, any> = {};
    for (const stage of PIPELINE_STAGES) { summary[stage] = { count: 0, total_value: 0 }; }
    for (const row of result.rows) { summary[row.stage] = { count: parseInt(row.count), total_value: parseFloat(row.total_value) }; }
    res.json(summary);
  } catch (error) {
    console.error('[Opportunities] Error obteniendo resumen pipeline:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT o.*, c.name as client_name, u.first_name || ' ' || u.last_name as assigned_user_name
       FROM opportunities o LEFT JOIN clients c ON o.client_id = c.id LEFT JOIN users u ON o.owner_id = u.id
       WHERE o.id = $1 AND o.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Oportunidad no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Opportunities] Error obteniendo oportunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, writeLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, title, description, client_id, contact_id, stage, estimated_revenue, probability, expected_close_date, owner_id, assigned_to, source } = req.body;
    
    const oppName = name || title;
    if (!oppName || !client_id) {
      return res.status(400).json({ error: 'name y client_id son requeridos' });
    }
    
    // Validar nombre (mínimo 3 caracteres)
    if (oppName.trim().length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }
    
    // Validar stage
    const validStage = stage || 'prospecting';
    if (!PIPELINE_STAGES.includes(validStage)) {
      return res.status(400).json({ error: 'Stage inválido', valid_stages: PIPELINE_STAGES });
    }
    
    // Validar fecha de cierre (debe ser futura)
    if (expected_close_date && !isValidFutureDate(expected_close_date)) {
      return res.status(400).json({ error: 'La fecha de cierre debe ser futura' });
    }
    
    // Validar revenue (debe ser positivo)
    const validRevenue = Math.max(0, parseFloat(estimated_revenue) || 0);
    const validProbability = Math.min(100, Math.max(0, parseInt(probability) || 10));
    
    const result = await query(
      `INSERT INTO opportunities (name, description, client_id, contact_id, stage, estimated_revenue, probability, expected_close_date, owner_id, source, tenant_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        oppName.trim(), 
        description?.trim() || null, 
        client_id, 
        contact_id || null, 
        validStage, 
        validRevenue, 
        validProbability, 
        expected_close_date || null, 
        owner_id || assigned_to || user.userId || user.id, 
        source?.trim() || null, 
        user.tenant_id,
        user.userId || user.id
      ]
    );
    
    // Audit log
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, new_data, ip_address)
       VALUES ($1, $2, 'opportunity', $3, 'create', $4, $5)`,
      [
        user.tenant_id,
        user.userId || user.id,
        result.rows[0].id,
        JSON.stringify(result.rows[0]),
        req.ip
      ]
    );
    
    fireEvent('new_deal_created', user.tenant_id, result.rows[0].id, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Opportunities] Error creando oportunidad:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, title, description, client_id, contact_id, estimated_revenue, probability, expected_close_date, owner_id, assigned_to, source, status } = req.body;
    // NOTE: stage changes MUST use POST /:id/move to enforce business rules (credit check for closed_won)
    const result = await query(
      `UPDATE opportunities SET
        name = COALESCE($1, name), description = COALESCE($2, description), client_id = COALESCE($3, client_id),
        contact_id = COALESCE($4, contact_id), estimated_revenue = COALESCE($5, estimated_revenue),
        probability = COALESCE($6, probability), expected_close_date = COALESCE($7, expected_close_date),
        owner_id = COALESCE($8, owner_id), source = COALESCE($9, source),
        status = COALESCE($10, status), updated_at = NOW()
       WHERE id = $11 AND tenant_id = $12 RETURNING *`,
      [name || title || null, description, client_id, contact_id, estimated_revenue, probability, expected_close_date, owner_id || assigned_to || null, source, status, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Oportunidad no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Opportunities] Error actualizando oportunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// SOFT DELETE - Production ready
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Verificar que existe y no está ya eliminada
    const checkResult = await query(
      'SELECT id, name FROM opportunities WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [req.params.id, user.tenant_id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada o ya eliminada' });
    }
    
    const oppName = checkResult.rows[0].name;
    
    // Soft delete
    await query(
      'UPDATE opportunities SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND tenant_id = $3',
      [user.userId || user.id, req.params.id, user.tenant_id]
    );
    
    // Audit log
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, old_data, ip_address)
       VALUES ($1, $2, 'opportunity', $3, 'delete', $4, $5)`,
      [
        user.tenant_id, 
        user.userId || user.id, 
        req.params.id,
        JSON.stringify({ name: oppName, deleted_at: new Date() }),
        req.ip
      ]
    );
    
    res.json({ 
      success: true,
      message: 'Oportunidad movida a papelera',
      can_restore: true
    });
  } catch (error) {
    console.error('[Opportunities] Error eliminando oportunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RESTORE - Recuperar oportunidad eliminada
router.post('/:id/restore', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const result = await query(
      `UPDATE opportunities 
       SET deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL
       RETURNING *`,
      [req.params.id, user.tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada en papelera' });
    }
    
    // Audit log
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, new_data)
       VALUES ($1, $2, 'opportunity', $3, 'restore', $4)`,
      [
        user.tenant_id,
        user.userId || user.id,
        req.params.id,
        JSON.stringify({ restored_at: new Date() })
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[Opportunities] Error restaurando oportunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// LIST DELETED - Ver papelera
router.get('/deleted/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const result = await query(
      `SELECT o.*, c.name as client_name,
              u.first_name || ' ' || u.last_name as deleted_by_name
       FROM opportunities o
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN users u ON o.deleted_by = u.id
       WHERE o.tenant_id = $1 AND o.deleted_at IS NOT NULL
       ORDER BY o.deleted_at DESC`,
      [user.tenant_id]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('[Opportunities] Error listando papelera:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/move', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (req as any).user;
    const { stage } = req.body;

    if (!stage || !PIPELINE_STAGES.includes(stage)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stage invalido', valid_stages: PIPELINE_STAGES });
    }

    // ── Validación de Crédito (dentro de la transacción para evitar race condition) ──
    // Si el destino es 'closed_won', debe existir un crédito APROBADO vinculado.
    // Usamos SELECT ... FOR UPDATE para bloquear la fila y evitar doble uso concurrente.
    if (stage === 'closed_won') {
      const creditCheck = await client.query(
        `SELECT id, amount, currency, approved_at
           FROM credits
          WHERE opportunity_id = $1
            AND tenant_id      = $2
            AND status         = 'approved'
            AND (expires_at IS NULL OR expires_at > NOW())
          LIMIT 1
          FOR UPDATE`,
        [req.params.id, user.tenant_id]
      );

      if (creditCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        // Distinguish between "already used" and "never approved"
        const usedCheck = await query(
          `SELECT id FROM credits WHERE opportunity_id = $1 AND tenant_id = $2 AND status = 'used' LIMIT 1`,
          [req.params.id, user.tenant_id]
        );
        if (usedCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Crédito ya utilizado',
            detail: 'El crédito asociado a esta oportunidad ya fue utilizado en un cierre anterior. No puede reutilizarse.'
          });
        }
        return res.status(403).json({
          success: false,
          error: 'Crédito requerido',
          detail: 'La oportunidad no puede cerrarse como Ganada sin un crédito aprobado y vigente vinculado. Solicite o apruebe el crédito antes de continuar.'
        });
      }

      // Marcar el crédito como 'used' atómicamente dentro de la misma transacción
      await client.query(
        `UPDATE credits SET status = 'used', updated_at = NOW() WHERE id = $1`,
        [creditCheck.rows[0].id]
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    const result = await client.query(
      `UPDATE opportunities
          SET stage = $1,
              actual_close_date = CASE WHEN $1 IN ('closed_won','closed_lost') THEN CURRENT_DATE ELSE actual_close_date END,
              updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *`,
      [stage, req.params.id, user.tenant_id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    // ── Validación Gov 47-25 ──────────────────────────────────────────────────
    // Si la oportunidad es gubernamental, bloquea el avance a cualquier etapa
    // posterior a 'qualification' cuando haya documentos obligatorios pendientes.
    // Cubre: proposal, negotiation, closed_won — impide también saltar etapas.
    if (stage === 'proposal' || stage === 'negotiation' || stage === 'closed_won') {
      const govCheck = await client.query(
        `SELECT is_gov FROM opportunities WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, user.tenant_id]
      );
      if (govCheck.rows[0]?.is_gov) {
        const pendingMandatory = await client.query(
          `SELECT COUNT(*) FROM gov_checklist
            WHERE opportunity_id = $1
              AND tenant_id      = $2
              AND is_mandatory   = true
              AND status         = 'pending'`,
          [req.params.id, user.tenant_id]
        );
        if (parseInt(pendingMandatory.rows[0].count) > 0) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            success: false,
            error: 'Expediente incompleto',
            detail: `El expediente no cumple con los requisitos mínimos de la Ley 47-25. Hay ${pendingMandatory.rows[0].count} documento(s) obligatorio(s) pendiente(s) de carga o verificación.`
          });
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    await client.query('COMMIT');

    // ── Fire automation events (non-blocking) ─────────────────────────────
    const opp = result.rows[0];
    const eventData = { ...opp, client_name: opp.client_name };
    if (stage === 'closed_won') {
      fireEvent('deal_won', user.tenant_id, opp.id, eventData);
    } else if (stage === 'closed_lost') {
      fireEvent('deal_lost', user.tenant_id, opp.id, eventData);
    }
    fireEvent('stage_changed', user.tenant_id, opp.id, { ...eventData, to_stage: stage });

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Opportunities] Error moviendo oportunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

export default router;
