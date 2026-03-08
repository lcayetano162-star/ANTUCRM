import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

// ── Sanitización XSS básica ────────────────────────────────────────────────
function stripXSS(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  if (Array.isArray(value)) return value.map(stripXSS);
  if (value && typeof value === 'object') {
    const clean: any = {};
    for (const key of Object.keys(value)) clean[key] = stripXSS(value[key]);
    return clean;
  }
  return value;
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) req.body = stripXSS(req.body);
  if (req.query) req.query = stripXSS(req.query) as any;
  next();
};

// ── Request timeout (30s) ──────────────────────────────────────────────────
export const requestTimeout = (timeoutMs = 30000) => (req: Request, res: Response, next: NextFunction): void => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ success: false, error: 'Tiempo de espera agotado. Intente nuevamente.' });
    }
  }, timeoutMs);
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  next();
};

export const validateBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({ success: false, error: 'El cuerpo de la petición no puede estar vacío' });
    return;
  }
  next();
};

export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    res.status(400).json({ success: false, error: 'Content-Type debe ser application/json' });
    return;
  }
  next();
};

// ── Error handler con logging estructurado ─────────────────────────────────
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || randomBytes(4).toString('hex');
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    method: req.method,
    path: req.path,
    tenantId: (req as any).user?.tenant_id || 'unknown',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ts: new Date().toISOString(),
  }));
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    requestId,
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// ── Request logger estructurado ────────────────────────────────────────────
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = randomBytes(4).toString('hex');
  req.headers['x-request-id'] = requestId;
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    // Solo loguear rutas de API, ignorar /health para no saturar logs
    if (!req.path.startsWith('/health')) {
      console.log(JSON.stringify({
        level, requestId,
        method: req.method, path: req.path,
        status: res.statusCode, ms,
        ts: new Date().toISOString(),
      }));
    }
  });
  next();
};
