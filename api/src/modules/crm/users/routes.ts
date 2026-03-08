import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/utils/logger';
import { sendWelcomeUserEmail } from '../../email/systemEmailService';

const router = Router();

// GET /api/users - List all users for tenant
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users 
       WHERE tenant_id = $1 
       ORDER BY first_name, last_name`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Users] Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users 
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Users] Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users/reassign - Bulk reassign records between users (admin only)
router.post('/reassign', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { from_user_id, to_user_id, type } = req.body;
    if (!from_user_id || !to_user_id || !type) {
      return res.status(400).json({ error: 'from_user_id, to_user_id y type son requeridos' });
    }
    if (from_user_id === to_user_id) {
      return res.status(400).json({ error: 'Los usuarios deben ser diferentes' });
    }

    // Verify both users belong to the same tenant
    const both = await query(
      'SELECT id FROM users WHERE id = ANY($1) AND tenant_id = $2',
      [[from_user_id, to_user_id], user.tenant_id]
    );
    if (both.rows.length < 2) {
      return res.status(400).json({ error: 'Usuarios no válidos' });
    }

    let updated = 0;
    if (type === 'leads' || type === 'accounts') {
      const r = await query(
        'UPDATE clients SET owner_id = $1 WHERE owner_id = $2 AND tenant_id = $3',
        [to_user_id, from_user_id, user.tenant_id]
      );
      updated = r.rowCount || 0;
    } else if (type === 'opportunities') {
      const r = await query(
        'UPDATE opportunities SET owner_id = $1 WHERE owner_id = $2 AND tenant_id = $3',
        [to_user_id, from_user_id, user.tenant_id]
      );
      updated = r.rowCount || 0;
    } else {
      return res.status(400).json({ error: 'Tipo inválido. Use: leads, opportunities, accounts' });
    }

    res.json({ message: `${updated} registros reasignados exitosamente`, updated });
  } catch (error) {
    console.error('[Users] Error en reasignación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { email, password, first_name, last_name, role, send_invite } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'email, password, first_name y last_name son requeridos' });
    }

    // Enforce user limit from plan
    const tenantPlan = await query(
      `SELECT p.limits FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       WHERE t.id = $1`,
      [user.tenant_id]
    );
    const limits = tenantPlan.rows[0]?.limits || {};
    const maxUsers = limits.max_users != null ? parseInt(limits.max_users) : null;
    if (maxUsers !== null) {
      const countRes = await query(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND is_active = true',
        [user.tenant_id]
      );
      const currentCount = parseInt(countRes.rows[0].count);
      if (currentCount >= maxUsers) {
        return res.status(403).json({
          error: `Límite de usuarios alcanzado. Tu plan permite un máximo de ${maxUsers} usuario${maxUsers !== 1 ? 's' : ''}.`
        });
      }
    }

    const existing = await query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, user.tenant_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado en este tenant' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, passwordHash, first_name, last_name, role || 'sales', user.tenant_id]
    );

    const newUser = result.rows[0];
    logAudit({
      action: 'CREATE', entityType: 'user', entityId: newUser.id,
      userId: user.id, userEmail: user.email,
      tenantId: user.tenant_id,
      changes: { email: newUser.email, role: newUser.role },
      ipAddress: req.ip
    });

    // Send welcome email if requested
    if (send_invite !== false) {
      const tenantRes = await query('SELECT name FROM tenants WHERE id = $1', [user.tenant_id]);
      const tenantName = tenantRes.rows[0]?.name || 'tu empresa';
      const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      sendWelcomeUserEmail(
        email,
        `${first_name} ${last_name}`.trim(),
        tenantName,
        appUrl,
        password,
        role || 'sales'
      ).catch(err => console.warn('[Users] No se pudo enviar invite email:', err.message));
    }

    res.status(201).json(newUser);
  } catch (error) {
    console.error('[Users] Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { first_name, last_name, role, is_active } = req.body;

    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           role = COALESCE($3, role),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING id, email, first_name, last_name, role, is_active, updated_at`,
      [first_name, last_name, role, is_active, req.params.id, user.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Users] Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    logAudit({
      action: 'DELETE', entityType: 'user', entityId: req.params.id,
      userId: user.id, userEmail: user.email,
      tenantId: user.tenant_id,
      ipAddress: req.ip
    });
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('[Users] Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
