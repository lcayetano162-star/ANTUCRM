import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/super-admin/users — all users across all tenants
router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              u.is_active, u.tenant_id, t.name as tenant_name,
              u.last_login, u.created_at
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('[SA Users] Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/super-admin/users/:id/toggle-status
router.put('/:id/toggle-status', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[SA Users] Error cambiando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
