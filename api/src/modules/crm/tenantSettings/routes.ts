import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/tenant/settings — returns fiscal_year_start, currency, timezone, name
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await query(
      `SELECT name, slug, domain, fiscal_year_start, currency, timezone, status, plan_id
       FROM tenants WHERE id = $1`,
      [user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tenant/settings — admin only: update fiscal_year_start, currency, timezone
router.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { fiscal_year_start, currency, timezone } = req.body;

    if (fiscal_year_start !== undefined) {
      const month = parseInt(fiscal_year_start);
      if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'fiscal_year_start debe ser un mes entre 1 y 12' });
      }
    }
    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      return res.status(400).json({ error: 'currency debe ser un código ISO 4217 de 3 letras' });
    }

    await query(
      `UPDATE tenants SET
         fiscal_year_start = COALESCE($1, fiscal_year_start),
         currency          = COALESCE($2, currency),
         timezone          = COALESCE($3, timezone),
         updated_at        = NOW()
       WHERE id = $4`,
      [fiscal_year_start || null, currency || null, timezone || null, user.tenant_id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
