const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'AntuCRM-SecretKey-2024-ChangeInProduction';

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de autenticación requerido' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar si es Super Admin (landlord_user)
    if (decoded.isLandlord) {
      const landlordResult = await query(
        'SELECT * FROM landlord_users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (landlordResult.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Super Admin no encontrado o inactivo' 
        });
      }
      
      req.user = {
        ...landlordResult.rows[0],
        isLandlord: true,
        role: 'superadmin'
      };
    } else {
      // Es un usuario de tenant
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no encontrado o inactivo' 
        });
      }
      
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error en autenticación' 
    });
  }
};

// Middleware para requerir Super Admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado. Se requiere privilegios de Super Admin.' 
    });
  }
  next();
};

// Middleware para requerir Admin o superior
const requireAdmin = (req, res, next) => {
  const allowedRoles = ['superadmin', 'admin', 'sales_manager'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado. Se requiere privilegios de administrador.' 
    });
  }
  next();
};

// Middleware para verificar acceso a tenant
const requireTenantAccess = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de tenant requerido' 
      });
    }

    // Super Admin tiene acceso a todos los tenants
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Verificar que el usuario pertenece al tenant
    if (req.user.tenant_id !== tenantId) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes acceso a este tenant' 
      });
    }

    next();
  } catch (error) {
    console.error('Tenant access error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al verificar acceso al tenant' 
    });
  }
};

// Actualizar último login (sin causar errores si la columna no existe)
const updateLastLogin = async (userId, isLandlord = false) => {
  try {
    const table = isLandlord ? 'landlord_users' : 'users';
    await query(
      `UPDATE ${table} SET last_login = NOW() WHERE id = $1`,
      [userId]
    );
  } catch (error) {
    // Silenciar error si la columna no existe
    console.log('Nota: last_login no actualizado (columna puede no existir)');
  }
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
  requireTenantAccess,
  updateLastLogin,
  JWT_SECRET
};
