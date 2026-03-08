import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';
import { logAudit } from '../../../shared/utils/logger';
import { sendWelcomeTenantEmail } from '../../email/systemEmailService';

const router = Router();

// ── GET /api/super-admin/tenants ──────────────────────────────────────────────
router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { search, status, plan_id } = req.query;
    let conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(t.name ILIKE $${idx} OR t.slug ILIKE $${idx} OR t.domain ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status && status !== 'all') {
      conditions.push(`t.status = $${idx++}`);
      params.push(status);
    }
    if (plan_id && plan_id !== 'all') {
      conditions.push(`t.plan_id = $${idx++}`);
      params.push(plan_id);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await query(
      `SELECT t.*,
              p.name as plan_name,
              COUNT(DISTINCT u.id)::int as user_count,
              (SELECT u2.email FROM users u2 WHERE u2.tenant_id = t.id AND u2.role = 'admin' ORDER BY u2.created_at ASC LIMIT 1) as owner_email,
              (SELECT u3.first_name || ' ' || u3.last_name FROM users u3 WHERE u3.tenant_id = t.id AND u3.role = 'admin' ORDER BY u3.created_at ASC LIMIT 1) as owner_name,
              (SELECT MAX(u4.last_login) FROM users u4 WHERE u4.tenant_id = t.id) as last_active
       FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       LEFT JOIN users u ON u.tenant_id = t.id
       ${where}
       GROUP BY t.id, p.name
       ORDER BY t.created_at DESC`,
      params
    );

    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('[Tenants] Error listando tenants:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/super-admin/tenants/:id ─────────────────────────────────────────
router.get('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT t.*, p.name as plan_name,
              (SELECT u.email FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' LIMIT 1) as owner_email
       FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tenants] Error obteniendo tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/super-admin/tenants ─────────────────────────────────────────────
// Creates tenant + admin user in a single transaction
router.post('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, slug, domain, plan_id,
      owner_email, owner_first_name, owner_last_name, owner_password,
      modules, fiscal_year_start, currency, timezone, country
    } = req.body;

    if (!name || !plan_id || !owner_email || !owner_password) {
      return res.status(400).json({ error: 'name, plan_id, owner_email y owner_password son requeridos' });
    }

    // Validate country code (ISO 3166-1 alpha-2)
    const tenantCountry = (country && /^[A-Z]{2}$/.test(country)) ? country : 'DO';
    // Features exclusively available for República Dominicana
    const isRD = tenantCountry === 'DO';

    // Auto-generate slug if not provided
    const autoSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 100);

    // Check slug uniqueness
    const slugCheck = await client.query('SELECT id FROM tenants WHERE slug = $1', [autoSlug]);
    if (slugCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `El slug "${autoSlug}" ya está en uso` });
    }

    // Default modules if not provided
    const enabledModules = modules && typeof modules === 'object' ? modules : {
      crm: true, cpq: true, activities: true, marketing: true,
      performance: true, email: true, service_desk: false,
      inventory: false, invoicing: false
    };

    // Force-disable RD-exclusive modules for non-RD tenants
    if (!isRD) {
      enabledModules.automations = false;
    }

    // gov_module_enabled is RD-exclusive — always false for non-RD tenants
    const govModuleEnabled = isRD ? (req.body.gov_module_enabled === true) : false;

    const tenantResult = await client.query(
      `INSERT INTO tenants (name, slug, domain, plan_id, status, enabled_modules, fiscal_year_start, currency, timezone, country, gov_module_enabled)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, autoSlug, domain || null, plan_id, JSON.stringify(enabledModules),
       fiscal_year_start || 1, currency || 'DOP', timezone || 'America/Santo_Domingo',
       tenantCountry, govModuleEnabled]
    );
    const tenant = tenantResult.rows[0];

    // Check that owner_email is not taken in this tenant
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
      [tenant.id, owner_email]
    );
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(owner_password, 12);
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id, is_active)
       VALUES ($1, $2, $3, $4, 'admin', $5, true)`,
      [
        owner_email,
        passwordHash,
        owner_first_name || 'Admin',
        owner_last_name || name,
        tenant.id
      ]
    );

    await client.query('COMMIT');
    const saUser = (req as any).user;
    logAudit({
      action: 'CREATE', entityType: 'tenant', entityId: tenant.id,
      userId: saUser?.id, userEmail: saUser?.email,
      changes: { name, slug: tenant.slug, plan_id: tenant.plan_id, owner_email },
      ipAddress: req.ip
    });

    // Send welcome email to new tenant owner (non-blocking)
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const ownerName = `${owner_first_name || 'Admin'} ${owner_last_name || ''}`.trim();
    sendWelcomeTenantEmail(owner_email, ownerName, name, appUrl, owner_password)
      .catch(err => console.warn('[Tenants] No se pudo enviar welcome email:', err.message));

    res.status(201).json({ ...tenant, owner_email, owner_name: ownerName });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Tenants] Error creando tenant:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'El slug o dominio ya está en uso' });
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ── PUT /api/super-admin/tenants/:id ─────────────────────────────────────────
router.put('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, domain, plan_id, status } = req.body;
    const result = await query(
      `UPDATE tenants SET
         name    = COALESCE($1, name),
         domain  = COALESCE($2, domain),
         plan_id = COALESCE($3, plan_id),
         status  = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name || null, domain || null, plan_id || null, status || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tenants] Error actualizando tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /api/super-admin/tenants/:id ──────────────────────────────────────
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM tenants WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json({ message: 'Tenant eliminado exitosamente' });
  } catch (error) {
    console.error('[Tenants] Error eliminando tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/super-admin/tenants/:id/suspend ─────────────────────────────────
router.post('/:id/suspend', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "UPDATE tenants SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tenants] Error suspendiendo tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/super-admin/tenants/:id/activate ────────────────────────────────
router.post('/:id/activate', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tenants] Error activando tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/super-admin/tenants/:id/modules ─────────────────────────────────
router.get('/:id/modules', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const defaultModules = { crm: true, cpq: true, activities: true, marketing: true, performance: true, email: true, service_desk: false, inventory: false, invoicing: false };
    const result = await query('SELECT enabled_modules FROM tenants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json({ modules: result.rows[0].enabled_modules || defaultModules });
  } catch (error) {
    console.error('[Tenants] Error obteniendo módulos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PUT /api/super-admin/tenants/:id/modules ─────────────────────────────────
router.put('/:id/modules', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { modules } = req.body;
    if (!modules || typeof modules !== 'object') return res.status(400).json({ error: 'modules es requerido' });
    const result = await query(
      'UPDATE tenants SET enabled_modules = $1, updated_at = NOW() WHERE id = $2 RETURNING id, enabled_modules',
      [JSON.stringify(modules), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json({ modules: result.rows[0].enabled_modules });
  } catch (error) {
    console.error('[Tenants] Error actualizando módulos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
