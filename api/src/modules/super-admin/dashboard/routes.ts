import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/super-admin/dashboard  (root — used by frontend)
router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalRes, activeRes, suspendedRes, trialRes,
      plansRes, usersRes, mrrRes, prevMonthRes, recentRes,
      tenantsListRes
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM tenants'),
      query("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'"),
      query("SELECT COUNT(*) as count FROM tenants WHERE status NOT IN ('active','trial')"),
      query('SELECT COUNT(*) as count FROM tenants WHERE trial_ends_at IS NOT NULL AND trial_ends_at > NOW()'),
      query('SELECT COUNT(*) as count FROM plans WHERE is_active = true'),
      query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      query(`SELECT COALESCE(SUM(p.price_monthly), 0) as mrr
             FROM tenants t JOIN plans p ON t.plan_id = p.id
             WHERE t.status = 'active'`),
      query('SELECT COUNT(*) as count FROM tenants WHERE created_at >= $1 AND created_at < $2',
            [sixtyDaysAgo, thirtyDaysAgo]),
      query(`SELECT t.id, t.name, COALESCE(t.slug, t.id::text) as slug,
                    t.status, COALESCE(p.name, 'Sin plan') as plan_name,
                    t.created_at, COALESCE(u.email, '') as owner_email
             FROM tenants t
             LEFT JOIN plans p ON t.plan_id = p.id
             LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
             ORDER BY t.created_at DESC LIMIT 5`),
      // Tenant list for simulation mode picker
      query(`SELECT t.id, t.name, t.status, COALESCE(p.name,'Sin plan') as plan_name,
                    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.is_active = true) as user_count
             FROM tenants t LEFT JOIN plans p ON t.plan_id = p.id
             ORDER BY t.name LIMIT 50`)
    ]);

    const currentCount = parseInt(totalRes.rows[0].count);
    const prevCount    = parseInt(prevMonthRes.rows[0].count);
    const tenantsGrowth = prevCount > 0
      ? Math.round(((currentCount - prevCount) / prevCount) * 100)
      : 0;

    // ── Revenue by day (last 30 days) ──────────────────────────────────────────
    // Approximate daily MRR as: active tenants * their plan price / 30
    const revenueByDayRes = await query(`
      SELECT
        gs::date as date,
        COALESCE((
          SELECT SUM(p.price_monthly / 30)
          FROM tenants t
          JOIN plans p ON t.plan_id = p.id
          WHERE t.status = 'active'
            AND t.created_at::date <= gs::date
        ), 0) as revenue
      FROM generate_series($1::date, $2::date, '1 day') gs
      ORDER BY gs::date`,
      [thirtyDaysAgo.toISOString().slice(0, 10), now.toISOString().slice(0, 10)]
    );

    // ── SLA stats (service desk — defensive) ──────────────────────────────────
    let slaStats = { resolved: 0, total: 0, pct: 100, avgHours: 0 };
    try {
      const slaRes = await query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('resolved','closed')) as resolved,
          COUNT(*) as total,
          AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600)
            FILTER (WHERE status IN ('resolved','closed')) as avg_hours
        FROM service_tickets
        WHERE created_at >= $1`, [thirtyDaysAgo]);
      const r = slaRes.rows[0];
      const total = parseInt(r.total) || 0;
      const resolved = parseInt(r.resolved) || 0;
      slaStats = {
        resolved, total,
        pct: total > 0 ? Math.round((resolved / total) * 100) : 100,
        avgHours: Math.round(parseFloat(r.avg_hours) || 0)
      };
    } catch { /* table may not exist yet */ }

    // ── Integration statuses ───────────────────────────────────────────────────
    let integrationStatus: any[] = [];
    try {
      const intRes = await query(`
        SELECT service_name, last_status, last_sync_at,
               (SELECT status_code FROM erp_integration_logs
                WHERE service_name = ei.service_name
                ORDER BY created_at DESC LIMIT 1) as last_status_code
        FROM erp_integrations ei
        WHERE is_active = true
        GROUP BY service_name, last_status, last_sync_at
        ORDER BY service_name`);
      integrationStatus = intRes.rows;
    } catch { /* tables may not exist yet */ }

    // ── Action items (things needing attention) ────────────────────────────────
    const actionItems: { type: string; title: string; description: string; count: number; href: string; severity: 'high' | 'medium' | 'low' }[] = [];

    // Trial tenants expiring in next 3 days
    try {
      const expiringRes = await query(`
        SELECT COUNT(*) as count FROM tenants
        WHERE status = 'trial'
          AND trial_ends_at IS NOT NULL
          AND trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'`);
      const count = parseInt(expiringRes.rows[0].count);
      if (count > 0) actionItems.push({
        type: 'trial_expiring', title: 'Trials por vencer',
        description: `${count} empresa${count !== 1 ? 's' : ''} con trial que vence en 3 días`,
        count, href: '/super-admin/tenants', severity: 'high'
      });
    } catch {}

    // Suspended tenants
    try {
      const suspRes = await query(`SELECT COUNT(*) as count FROM tenants WHERE status = 'suspended'`);
      const count = parseInt(suspRes.rows[0].count);
      if (count > 0) actionItems.push({
        type: 'suspended', title: 'Tenants suspendidos',
        description: `${count} empresa${count !== 1 ? 's' : ''} suspendida${count !== 1 ? 's' : ''} requiere${count === 1 ? '' : 'n'} revisión`,
        count, href: '/super-admin/tenants', severity: 'medium'
      });
    } catch {}

    // Tenants with no plan
    try {
      const noPlanRes = await query(`SELECT COUNT(*) as count FROM tenants WHERE plan_id IS NULL AND status = 'active'`);
      const count = parseInt(noPlanRes.rows[0].count);
      if (count > 0) actionItems.push({
        type: 'no_plan', title: 'Sin plan asignado',
        description: `${count} empresa activa sin plan — asignar para facturar`,
        count, href: '/super-admin/tenants', severity: 'high'
      });
    } catch {}

    // ERP integrations with errors
    try {
      const erpErrRes = await query(`SELECT COUNT(*) as count FROM erp_integrations WHERE last_status = 'error' AND is_active = true`);
      const count = parseInt(erpErrRes.rows[0].count);
      if (count > 0) actionItems.push({
        type: 'erp_error', title: 'Integraciones con error',
        description: `${count} conector ERP falló en la última sincronización`,
        count, href: '/super-admin/settings', severity: 'high'
      });
    } catch {}

    // System errors in last 24h
    try {
      const errRes = await query(`SELECT COUNT(*) as count FROM system_logs WHERE level = 'error' AND created_at >= NOW() - INTERVAL '24 hours'`);
      const count = parseInt(errRes.rows[0].count);
      if (count > 0) actionItems.push({
        type: 'system_errors', title: 'Errores del sistema',
        description: `${count} error${count !== 1 ? 'es' : ''} registrado${count !== 1 ? 's' : ''} en las últimas 24 horas`,
        count, href: '/super-admin/logs', severity: count > 10 ? 'high' : 'medium'
      });
    } catch {}

    // Sort by severity then take top 5
    const severityOrder = { high: 0, medium: 1, low: 2 };
    actionItems.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      stats: {
        totalTenants: currentCount,
        activeTenants: parseInt(activeRes.rows[0].count),
        trialTenants: parseInt(trialRes.rows[0].count),
        suspendedTenants: parseInt(suspendedRes.rows[0].count),
        totalPlans: parseInt(plansRes.rows[0].count),
        totalUsers: parseInt(usersRes.rows[0].count),
        monthlyRecurringRevenue: parseFloat(mrrRes.rows[0].mrr),
        tenantsGrowth,
        revenueGrowth: 0
      },
      recentTenants: recentRes.rows,
      revenueByDay: revenueByDayRes.rows.map((r: any) => ({
        date: r.date,
        revenue: Math.round(parseFloat(r.revenue) * 100) / 100
      })),
      slaStats,
      integrationStatus,
      actionItems: actionItems.slice(0, 5),
      tenantList: tenantsListRes.rows
    });
  } catch (error) {
    console.error('[SA Dashboard] Error obteniendo estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/super-admin/dashboard/stats  (legacy — keep for compatibility)
router.get('/stats', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const [tenants, plans, users, activeTenants, recentTenants] = await Promise.all([
      query('SELECT COUNT(*) as count FROM tenants'),
      query('SELECT COUNT(*) as count FROM plans'),
      query('SELECT COUNT(*) as count FROM users'),
      query("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'"),
      query('SELECT t.*, p.name as plan_name FROM tenants t LEFT JOIN plans p ON t.plan_id = p.id ORDER BY t.created_at DESC LIMIT 5')
    ]);
    res.json({
      total_tenants: parseInt(tenants.rows[0].count),
      active_tenants: parseInt(activeTenants.rows[0].count),
      total_plans: parseInt(plans.rows[0].count),
      total_users: parseInt(users.rows[0].count),
      recent_tenants: recentTenants.rows
    });
  } catch (error) {
    console.error('[SA Dashboard] Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
