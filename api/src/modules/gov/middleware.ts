import { Request, Response, NextFunction } from 'express';
import { query } from '../../shared/config/database';

/**
 * checkGovAccess — verifica que el tenant tenga gov_module_enabled = true.
 * Debe usarse DESPUÉS de authenticateToken.
 */
export async function checkGovAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const result = await query(
      'SELECT gov_module_enabled FROM tenants WHERE id = $1',
      [user.tenant_id]
    );
    if (!result.rows[0]?.gov_module_enabled) {
      res.status(403).json({
        error: 'Módulo no habilitado',
        detail: 'El módulo de Licitaciones Gubernamentales no está activo para este tenant. Contacte a su administrador.'
      });
      return;
    }
    next();
  } catch (err) {
    console.error('[Gov] Error en checkGovAccess:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
