import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

const router = Router();

// Helper: normalize a plan row to the shape the frontend expects
function mapPlan(row: any) {
  return {
    ...row,
    price_monthly: parseFloat(row.price_monthly ?? row.price ?? 0),
    price_yearly:  parseFloat(row.price_yearly  ?? row.price * 10 ?? 0),
    slug:          row.slug || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
    currency:      row.currency || 'USD',
    sort_order:    row.sort_order ?? 0,
    limits:        row.limits || {},
    is_active:     row.is_active ?? true,
    features:      Array.isArray(row.features) ? row.features : (row.features ? JSON.parse(row.features) : []),
  };
}

// GET /api/super-admin/plans
router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM plans ORDER BY sort_order ASC, price_monthly ASC NULLS LAST');
    res.json({ plans: result.rows.map(mapPlan) });
  } catch (error) {
    console.error('[Plans] Error listando planes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/super-admin/plans/:id
router.get('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json(mapPlan(result.rows[0]));
  } catch (error) {
    console.error('[Plans] Error obteniendo plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/super-admin/plans
router.post('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, price_monthly, price_yearly, currency, features, is_active, sort_order, limits } = req.body;
    if (!name || price_monthly === undefined) {
      return res.status(400).json({ error: 'name y price_monthly son requeridos' });
    }
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const planLimits = limits && typeof limits === 'object' ? limits : { max_users: 5 };
    const result = await query(
      `INSERT INTO plans
         (name, slug, description, price_monthly, price_yearly, currency, features, is_active, sort_order, limits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        name, autoSlug, description || null,
        parseFloat(price_monthly) || 0,
        parseFloat(price_yearly)  || 0,
        currency || 'USD',
        JSON.stringify(Array.isArray(features) ? features : []),
        is_active !== false,
        parseInt(sort_order) || 0,
        JSON.stringify(planLimits)
      ]
    );
    res.status(201).json(mapPlan(result.rows[0]));
  } catch (error: any) {
    console.error('[Plans] Error creando plan:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Ya existe un plan con ese nombre o slug' });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/super-admin/plans/:id
router.put('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, price_monthly, price_yearly, currency, features, is_active, sort_order, limits } = req.body;
    const result = await query(
      `UPDATE plans SET
         name          = COALESCE($1, name),
         slug          = COALESCE($2, slug),
         description   = COALESCE($3, description),
         price_monthly = COALESCE($4, price_monthly),
         price_yearly  = COALESCE($5, price_yearly),
         currency      = COALESCE($6, currency),
         features      = COALESCE($7, features),
         is_active     = COALESCE($8, is_active),
         sort_order    = COALESCE($9, sort_order),
         limits        = COALESCE($10, limits),
         updated_at    = NOW()
       WHERE id = $11 RETURNING *`,
      [
        name,
        slug || null,
        description ?? null,
        price_monthly !== undefined ? parseFloat(price_monthly) : null,
        price_yearly  !== undefined ? parseFloat(price_yearly)  : null,
        currency || null,
        features !== undefined ? JSON.stringify(Array.isArray(features) ? features : []) : null,
        is_active !== undefined ? is_active : null,
        sort_order !== undefined ? parseInt(sort_order) : null,
        limits !== undefined ? JSON.stringify(limits) : null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json(mapPlan(result.rows[0]));
  } catch (error) {
    console.error('[Plans] Error actualizando plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/super-admin/plans/:id
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    // Prevent deletion if tenants are using this plan
    const inUse = await query('SELECT COUNT(*) as count FROM tenants WHERE plan_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: hay tenants usando este plan' });
    }
    const result = await query('DELETE FROM plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json({ message: 'Plan eliminado exitosamente' });
  } catch (error) {
    console.error('[Plans] Error eliminando plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
