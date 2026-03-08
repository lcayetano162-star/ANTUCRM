import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET no está definido. El servidor no puede iniciar.');
  process.exit(1);
}

// Detectar si se está usando el placeholder del .env de ejemplo (producción insegura)
const PLACEHOLDER_SECRET = 'REEMPLAZA_CON_64_CARACTERES_ALEATORIOS_SEGUROS';
if (process.env.JWT_SECRET === PLACEHOLDER_SECRET) {
  console.error('[FATAL] JWT_SECRET tiene el valor placeholder. Debes configurar un secreto real en tu .env o docker-compose.yml');
  process.exit(1);
}

// Warn si el secreto es demasiado corto (< 32 chars)
if (process.env.JWT_SECRET.length < 32) {
  console.warn('[SECURITY] JWT_SECRET es muy corto. Usa al menos 32 caracteres para seguridad adecuada.');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenant_id?: string;
        tenantId?: string;   // alias camelCase para compatibilidad con módulos TS
        first_name?: string;
        last_name?: string;
        firstName?: string;  // alias camelCase
        lastName?: string;   // alias camelCase
        isLandlord?: boolean;
        is_active?: boolean;
        [key: string]: any;
      };
    }
  }
}

// Middleware principal de autenticación (con lookup en BD)
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Token de autenticación requerido' });
      return;
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Super Admin (landlord_user)
    if (decoded.isLandlord) {
      const landlordResult = await query(
        'SELECT * FROM landlord_users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      if (landlordResult.rows.length === 0) {
        res.status(401).json({ success: false, error: 'Super Admin no encontrado o inactivo' });
        return;
      }
      const u = landlordResult.rows[0];
      req.user = {
        ...u,
        userId: u.id,
        isLandlord: true,
        role: 'superadmin',
        firstName: u.first_name,
        lastName: u.last_name,
      };
    } else {
      // Usuario de tenant
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      if (userResult.rows.length === 0) {
        res.status(401).json({ success: false, error: 'Usuario no encontrado o inactivo' });
        return;
      }
      const u = userResult.rows[0];
      req.user = {
        ...u,
        userId: u.id,
        tenantId: u.tenant_id,
        firstName: u.first_name,
        lastName: u.last_name,
      };
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expirado' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, error: 'Token inválido' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Error en autenticación' });
  }
};

// Middleware ligero (sin lookup en BD) — para rutas que no necesitan datos frescos del usuario
export const authenticateTokenLight = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'Token de autenticación no proporcionado' });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenantId,
      tenantId: decoded.tenantId,
    };
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Token inválido o expirado' });
  }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere privilegios de Super Admin.' });
    return;
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const allowedRoles = ['superadmin', 'admin', 'sales_manager'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere privilegios de administrador.' });
    return;
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
      return;
    }
    next();
  };
};

export const requireTenantAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'ID de tenant requerido' });
      return;
    }
    if (req.user?.role === 'superadmin') return next();
    if (req.user?.tenant_id !== tenantId) {
      res.status(403).json({ success: false, error: 'No tienes acceso a este tenant' });
      return;
    }
    next();
  } catch (error) {
    console.error('Tenant access error:', error);
    res.status(500).json({ success: false, error: 'Error al verificar acceso al tenant' });
  }
};

export const updateLastLogin = async (userId: string, isLandlord = false): Promise<void> => {
  try {
    const table = isLandlord ? 'landlord_users' : 'users';
    await query(`UPDATE ${table} SET last_login = NOW() WHERE id = $1`, [userId]);
  } catch (error) {
    console.log('Nota: last_login no actualizado');
  }
};

export { JWT_SECRET };
