import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export function requireModule(moduleName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      // Super admins and landlords bypass module checks
      if (user?.isLandlord || user?.role === 'superadmin') {
        return next();
      }
      const tenantId = user?.tenant_id || user?.tenantId;
      if (!tenantId) {
        res.status(403).json({ success: false, error: 'Módulo no disponible' });
        return;
      }
      const result = await query('SELECT enabled_modules FROM tenants WHERE id = $1', [tenantId]);
      if (result.rows.length === 0) {
        res.status(403).json({ success: false, error: 'Tenant no encontrado' });
        return;
      }
      const modules = result.rows[0].enabled_modules || {};
      if (modules[moduleName] === false) {
        res.status(403).json({
          success: false,
          error: `El módulo "${moduleName}" no está habilitado para tu organización`,
          module: moduleName
        });
        return;
      }
      next();
    } catch (error) {
      console.error('[ModuleCheck] Error:', error);
      res.status(500).json({ success: false, error: 'Error verificando módulos' });
    }
  };
}
