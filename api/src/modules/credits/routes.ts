import { Router, Request, Response } from 'express';
import { query } from '../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';

const router = Router();

// 'used' is set automatically by the opportunity close flow — never manually
const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'expired'];

// GET /api/credits
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, opportunity_id, client_id, page = '1', limit = '50' } = req.query;
    const pageNum  = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));
    const offset = (pageNum - 1) * limitNum;

    let conditions = ['cr.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let idx = 2;

    if (status)         { conditions.push(`cr.status = $${idx++}`);           params.push(status); }
    if (opportunity_id) { conditions.push(`cr.opportunity_id = $${idx++}`);   params.push(opportunity_id); }
    if (client_id)      { conditions.push(`cr.client_id = $${idx++}`);        params.push(client_id); }

    const where = conditions.join(' AND ');

    const result = await query(
      `SELECT cr.*,
              c.name  AS client_name,
              o.name AS opportunity_title,
              u1.first_name || ' ' || u1.last_name AS requested_by_name,
              u2.first_name || ' ' || u2.last_name AS reviewed_by_name
         FROM credits cr
         LEFT JOIN clients       c  ON cr.client_id      = c.id
         LEFT JOIN opportunities o  ON cr.opportunity_id = o.id
         LEFT JOIN users         u1 ON cr.requested_by   = u1.id
         LEFT JOIN users         u2 ON cr.reviewed_by    = u2.id
        WHERE ${where}
        ORDER BY cr.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM credits cr WHERE ${where}`, params);
    res.json({
      data: result.rows,
      total: parseInt(countRes.rows[0].count),
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('[Credits] Error listando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/credits/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT cr.*, c.name AS client_name, o.name AS opportunity_title
         FROM credits cr
         LEFT JOIN clients c ON cr.client_id = c.id
         LEFT JOIN opportunities o ON cr.opportunity_id = o.id
        WHERE cr.id = $1 AND cr.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Crédito no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Credits] Error obteniendo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/credits — Solicitar crédito
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { client_id, opportunity_id, amount, currency = 'DOP', notes, expires_at } = req.body;

    // ── Validación de entrada ────────────────────────────────────────────────
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const VALID_CURRENCIES = ['DOP', 'USD', 'EUR'];

    if (!client_id || !amount) {
      return res.status(400).json({ error: 'client_id y amount son requeridos' });
    }
    if (!UUID_RE.test(client_id)) {
      return res.status(400).json({ error: 'client_id debe ser un UUID válido' });
    }
    if (opportunity_id && !UUID_RE.test(opportunity_id)) {
      return res.status(400).json({ error: 'opportunity_id debe ser un UUID válido' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }
    if (numAmount > 999_999_999) {
      return res.status(400).json({ error: 'El monto excede el límite permitido' });
    }
    if (!VALID_CURRENCIES.includes(currency)) {
      return res.status(400).json({ error: 'Moneda inválida', valid: VALID_CURRENCIES });
    }
    if (notes && notes.length > 2000) {
      return res.status(400).json({ error: 'Las notas no pueden superar los 2000 caracteres' });
    }
    if (expires_at && isNaN(Date.parse(expires_at))) {
      return res.status(400).json({ error: 'expires_at debe ser una fecha válida (ISO 8601)' });
    }
    // ────────────────────────────────────────────────────────────────────────

    const result = await query(
      `INSERT INTO credits (tenant_id, client_id, opportunity_id, amount, currency, notes, expires_at, requested_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [user.tenant_id, client_id, opportunity_id || null, amount, currency, notes, expires_at || null, user.id || user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Credits] Error creando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/credits/:id/approve — Aprobar (solo admin)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { expires_at } = req.body;

    const result = await query(
      `UPDATE credits
           SET status      = 'approved',
               reviewed_by = $1,
               approved_at = NOW(),
               expires_at  = COALESCE($2, expires_at),
               updated_at  = NOW()
         WHERE id = $3 AND tenant_id = $4 AND status NOT IN ('used','approved')
         RETURNING *`,
      [user.id || user.userId, expires_at || null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crédito no encontrado o ya procesado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Credits] Error aprobando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/credits/:id/reject — Rechazar (solo admin)
router.put('/:id/reject', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rejection_reason } = req.body;

    const result = await query(
      `UPDATE credits
           SET status           = 'rejected',
               reviewed_by      = $1,
               rejected_at      = NOW(),
               rejection_reason = $2,
               updated_at       = NOW()
         WHERE id = $3 AND tenant_id = $4 AND status NOT IN ('used','approved','rejected')
         RETURNING *`,
      [user.id || user.userId, rejection_reason || null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crédito no encontrado o ya procesado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Credits] Error rechazando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/credits/:id — Actualizar (solo en status pending/under_review)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, currency, notes, expires_at, status } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status inválido', valid: VALID_STATUSES });
    }

    const result = await query(
      `UPDATE credits
           SET amount     = COALESCE($1, amount),
               currency   = COALESCE($2, currency),
               notes      = COALESCE($3, notes),
               expires_at = COALESCE($4, expires_at),
               status     = COALESCE($5, status),
               updated_at = NOW()
         WHERE id = $6 AND tenant_id = $7
         RETURNING *`,
      [amount, currency, notes, expires_at, status, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Crédito no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Credits] Error actualizando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/credits/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      "DELETE FROM credits WHERE id = $1 AND tenant_id = $2 AND status NOT IN ('approved','used') RETURNING id",
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crédito no encontrado o no se puede eliminar en su estado actual' });
    }
    res.json({ message: 'Crédito eliminado exitosamente' });
  } catch (error) {
    console.error('[Credits] Error eliminando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
