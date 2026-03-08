import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validar que el body de la petición no esté vacío
 */
export const validateBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: 'El cuerpo de la petición no puede estar vacío',
    });
    return;
  }
  next();
};

/**
 * Middleware para validar Content-Type
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'];
  
  if (!contentType || !contentType.includes('application/json')) {
    res.status(400).json({
      success: false,
      error: 'Content-Type debe ser application/json',
    });
    return;
  }
  next();
};

/**
 * Middleware para manejo de errores globales
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

/**
 * Middleware para logging de peticiones
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};
