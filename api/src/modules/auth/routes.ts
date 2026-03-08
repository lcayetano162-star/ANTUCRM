import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool, query } from '../../shared/config/database';
import { authenticateToken, updateLastLogin, JWT_SECRET } from '../../shared/middleware/auth';
import { logSystem } from '../../shared/utils/logger';
import { sendForgotPasswordEmail } from '../email/systemEmailService';

const router = Router();

// POST /api/auth/login - Dual login: landlord or tenant user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // 1. Try landlord_users first
    const landlordResult = await query(
      'SELECT * FROM landlord_users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (landlordResult.rows.length > 0) {
      const user = landlordResult.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, isLandlord: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await query(
        'UPDATE landlord_users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      logSystem({
        level: 'info', category: 'auth',
        message: `Super Admin autenticado: ${user.email}`,
        userId: user.id, userEmail: user.email,
        ipAddress: req.ip
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          isLandlord: true
        }
      });
    }

    // 2. Try tenant users
    // NOTE: email is unique per tenant but not globally — ORDER BY u.created_at DESC LIMIT 1
    // prevents returning demo-tenant user when a real tenant with the same email exists.
    const userResult = await query(
      `SELECT u.*, t.name as tenant_name, (t.status = 'active' OR t.status = 'trial') as tenant_active,
              t.enabled_modules, t.gov_module_enabled, t.country
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.is_active = true
       ORDER BY u.created_at DESC
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    if (!user.tenant_active) {
      return res.status(403).json({ error: 'Tu organización está suspendida' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        isLandlord: false
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    logSystem({
      level: 'info', category: 'auth',
      message: `Usuario autenticado: ${user.email} (tenant: ${user.tenant_name})`,
      userId: user.id, userEmail: user.email,
      tenantId: user.tenant_id, tenantName: user.tenant_name,
      ipAddress: req.ip
    });

    const defaultModules = { crm: true, cpq: true, activities: true, marketing: true, performance: true, email: true };
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        isLandlord: false,
        enabledModules: user.enabled_modules || defaultModules,
        gov_module_enabled: user.gov_module_enabled || false,
        country: user.country || 'DO'
      }
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Update last login in background (non-blocking)
    updateLastLogin(user.userId || user.id, user.isLandlord).catch(() => {});

    if (user.isLandlord) {
      const result = await query(
        'SELECT id, email, first_name, last_name, role, last_login FROM landlord_users WHERE id = $1',
        [user.userId || user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      return res.json({ ...result.rows[0], isLandlord: true });
    }

    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.tenant_id, u.last_login,
              t.name as tenant_name, t.enabled_modules, t.gov_module_enabled, t.country
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const u = result.rows[0];
    const defaultModules = { crm: true, cpq: true, activities: true, marketing: true, performance: true, email: true };
    return res.json({ ...u, isLandlord: false, enabledModules: u.enabled_modules || defaultModules, gov_module_enabled: u.gov_module_enabled || false, country: u.country || 'DO' });
  } catch (error) {
    console.error('[Auth] Error en /me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const table = user.isLandlord ? 'landlord_users' : 'users';
    const result = await query(`SELECT password_hash FROM ${table} WHERE id = $1`, [user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query(`UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, user.userId]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('[Auth] Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/reset-password (admin only)
router.post('/reset-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { user_id, new_password } = req.body;

    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && !currentUser.isLandlord) {
      return res.status(403).json({ error: 'No tienes permisos para resetear contraseñas' });
    }

    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'user_id y new_password son requeridos' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
      [newHash, user_id, currentUser.tenant_id]
    );

    res.json({ message: 'Contraseña reseteada exitosamente' });
  } catch (error) {
    console.error('[Auth] Error reseteando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/forgot-password — genera token y envía email
router.post('/forgot-password', async (req: Request, res: Response) => {
  // Always respond the same to avoid user enumeration
  const SAFE_MSG = 'Si el email existe, recibirás un correo con instrucciones.';
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email es requerido' });

    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    // Look in tenant users first, then landlord
    let userId: string | null = null;
    let userName = 'Usuario';
    let userType = 'tenant';

    const tenantRes = await query(
      `SELECT u.id, u.first_name, u.last_name FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.is_active = true
         AND t.status IN ('active','trial')
       ORDER BY u.created_at DESC LIMIT 1`,
      [email]
    );
    if (tenantRes.rows.length > 0) {
      const u = tenantRes.rows[0];
      userId = u.id;
      userName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || email;
      userType = 'tenant';
    } else {
      const landlordRes = await query(
        'SELECT id, first_name, last_name FROM landlord_users WHERE email = $1 AND is_active = true',
        [email]
      );
      if (landlordRes.rows.length > 0) {
        const u = landlordRes.rows[0];
        userId = u.id;
        userName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || email;
        userType = 'landlord';
      }
    }

    if (!userId) return res.json({ message: SAFE_MSG });

    // Generate secure token
    const token = crypto.randomBytes(48).toString('hex');
    await query(
      `INSERT INTO password_reset_tokens (user_id, user_type, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')
       ON CONFLICT DO NOTHING`,
      [userId, userType, token]
    );

    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendForgotPasswordEmail(email, userName, resetUrl).catch(err =>
      console.error('[Auth] Error enviando forgot password email:', err.message)
    );

    res.json({ message: SAFE_MSG });
  } catch (error) {
    console.error('[Auth] Error en forgot-password:', error);
    res.json({ message: SAFE_MSG }); // don't expose errors
  }
});

// POST /api/auth/reset-password-token — valida token y actualiza contraseña
router.post('/reset-password-token', async (req: Request, res: Response) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const tokenRes = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const { user_id, user_type } = tokenRes.rows[0];
    const table = user_type === 'landlord' ? 'landlord_users' : 'users';
    const newHash = await bcrypt.hash(new_password, 12);

    await query(`UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, user_id]);
    await query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);

    res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('[Auth] Error en reset-password-token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
