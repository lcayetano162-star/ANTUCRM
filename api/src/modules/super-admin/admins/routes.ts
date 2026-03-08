import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, first_name, last_name, role, is_active, last_login, created_at FROM landlord_users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('[Admins] Error listando admins:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, first_name, last_name, role, is_active, last_login, created_at FROM landlord_users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admins] Error obteniendo admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;
    if (!email || !password || !first_name || !last_name) return res.status(400).json({ error: 'email, password, first_name y last_name son requeridos' });
    const existing = await query('SELECT id FROM landlord_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'El email ya esta registrado' });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO landlord_users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, first_name, last_name, role, is_active, created_at",
      [email, passwordHash, first_name, last_name, role || 'admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Admins] Error creando admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, role, is_active } = req.body;
    const result = await query(
      'UPDATE landlord_users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), role = COALESCE($3, role), is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $5 RETURNING id, email, first_name, last_name, role, is_active',
      [first_name, last_name, role, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admins] Error actualizando admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM landlord_users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json({ message: 'Admin eliminado exitosamente' });
  } catch (error) {
    console.error('[Admins] Error eliminando admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) return res.status(400).json({ error: 'new_password debe tener al menos 8 caracteres' });
    const passwordHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE landlord_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, req.params.id]);
    res.json({ message: 'Contrasena reseteada exitosamente' });
  } catch (error) {
    console.error('[Admins] Error reseteando contrasena:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/toggle-status', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'UPDATE landlord_users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, email, is_active',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admins] Error cambiando estado admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
