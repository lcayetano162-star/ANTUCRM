import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/super-admin/billing/subscriptions
// Returns tenant subscriptions (tenants + plans) formatted as billing records
router.get('/subscriptions', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
         t.id,
         t.id as transaction_id,
         t.id as tenant_id,
         t.name as tenant_name,
         COALESCE(p.name, 'Sin plan') as plan_name,
         COALESCE(p.price_monthly, 0) as amount,
         COALESCE(p.currency, 'USD') as currency,
         CASE WHEN t.status = 'active' THEN 'paid' ELSE 'pending' END as status,
         'manual' as payment_method,
         t.created_at as due_date,
         CASE WHEN t.status = 'active' THEN t.subscribed_at ELSE NULL END as paid_date,
         CONCAT('Suscripción - ', COALESCE(p.name, 'Sin plan')) as description,
         t.created_at
       FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       ORDER BY t.created_at DESC`
    );
    res.json({ subscriptions: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('[SA Billing] Error obteniendo suscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/super-admin/billing/stats
router.get('/stats', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
         COALESCE(SUM(p.price_monthly), 0) as mrr,
         COALESCE(SUM(p.price_yearly), 0) as arr,
         COUNT(t.id) as active_subscriptions
       FROM tenants t
       JOIN plans p ON t.plan_id = p.id
       WHERE t.status = 'active'`
    );
    res.json(result.rows[0] || { mrr: 0, arr: 0, active_subscriptions: 0 });
  } catch (error) {
    console.error('[SA Billing Stats] Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
