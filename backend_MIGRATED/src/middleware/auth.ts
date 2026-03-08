import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extiende la interfaz Request de Express para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string;
      };
    }
  }
}

/**
 * Middleware para verificar el token JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticación no proporcionado',
    });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para verificar roles
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permiso para realizar esta acción',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No bloquea la petición si no hay token, pero agrega el usuario si existe
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId,
      };
    } catch (error) {
      // Token inválido, pero no bloqueamos la petición
    }
  }
  
  next();
};
