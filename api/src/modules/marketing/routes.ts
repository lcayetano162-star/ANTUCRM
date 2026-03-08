import { Router, Request, Response } from 'express';
import { query } from '../../shared/config/database';
import { requireModule } from '../../shared/middleware/moduleCheck';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';

const router = Router();
router.use(requireModule('marketing'));

// ============ CAMPAIGNS ============

router.get('/campaigns', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT * FROM marketing_campaigns WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [user.tenant_id]
    );
    res.json({ campaigns: result.rows });
  } catch (error) {
    console.error('[Marketing] Error listando campanas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/campaigns/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'SELECT * FROM marketing_campaigns WHERE id = $1 AND tenant_id = $2',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error obteniendo campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/campaigns', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, type, subject, content, segment_id, scheduled_at } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name y type son requeridos' });
    const result = await query(
      `INSERT INTO marketing_campaigns (name, type, subject, content, segment_id, scheduled_at, status, tenant_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8) RETURNING *`,
      [name, type, subject || '', content, segment_id || null, scheduled_at || null, user.tenant_id, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error creando campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/campaigns/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, type, subject, content, segment_id, scheduled_at } = req.body;
    const result = await query(
      `UPDATE marketing_campaigns SET
        name = COALESCE($1, name), type = COALESCE($2, type),
        subject = COALESCE($3, subject), content = COALESCE($4, content),
        segment_id = COALESCE($5, segment_id), scheduled_at = COALESCE($6, scheduled_at), updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8 RETURNING *`,
      [name, type, subject, content, segment_id, scheduled_at, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error actualizando campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/campaigns/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('DELETE FROM marketing_campaigns WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json({ message: 'Campana eliminada exitosamente' });
  } catch (error) {
    console.error('[Marketing] Error eliminando campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/campaigns/:id/launch', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      "UPDATE marketing_campaigns SET status = 'running', started_at = NOW(), updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error lanzando campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/campaigns/:id/pause', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      "UPDATE marketing_campaigns SET status = 'paused', updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error pausando campana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ AUTOMATIONS ============

router.get('/automations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM marketing_automation_actions WHERE automation_id = a.id)::int AS actions_count,
        (SELECT COUNT(*) FROM automation_logs WHERE automation_id = a.id)::int AS executed_count
       FROM marketing_automations a
       WHERE a.tenant_id = $1 ORDER BY a.created_at DESC`,
      [user.tenant_id]
    );
    res.json({ automations: result.rows });
  } catch (error) {
    console.error('[Marketing] Error listando automatizaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/automations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('SELECT * FROM marketing_automations WHERE id = $1 AND tenant_id = $2', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Automatizacion no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error obteniendo automatizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/automations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, trigger_type, trigger_config } = req.body;
    if (!name || !trigger_type) return res.status(400).json({ error: 'name y trigger_type son requeridos' });
    const result = await query(
      `INSERT INTO marketing_automations (name, trigger_type, trigger_config, status, tenant_id, created_by)
       VALUES ($1,$2,$3,'draft',$4,$5) RETURNING *`,
      [name, trigger_type, JSON.stringify(trigger_config || {}), user.tenant_id, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error creando automatizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/automations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, trigger_type, trigger_config } = req.body;
    const result = await query(
      `UPDATE marketing_automations SET
        name = COALESCE($1, name), trigger_type = COALESCE($2, trigger_type),
        trigger_config = COALESCE($3, trigger_config), updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [name, trigger_type, trigger_config ? JSON.stringify(trigger_config) : null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Automatizacion no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error actualizando automatizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/automations/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('DELETE FROM marketing_automations WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Automatizacion no encontrada' });
    res.json({ message: 'Automatizacion eliminada exitosamente' });
  } catch (error) {
    console.error('[Marketing] Error eliminando automatizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/automations/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body;
    if (!['active', 'paused', 'draft'].includes(status)) return res.status(400).json({ error: 'Status invalido' });
    const result = await query(
      'UPDATE marketing_automations SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Automatizacion no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error actualizando estado automatizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ SEGMENTS ============

router.get('/segments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('SELECT * FROM marketing_segments WHERE tenant_id = $1 ORDER BY name', [user.tenant_id]);
    res.json({ segments: result.rows });
  } catch (error) {
    console.error('[Marketing] Error listando segmentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/segments/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('SELECT * FROM marketing_segments WHERE id = $1 AND tenant_id = $2', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Segmento no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error obteniendo segmento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/segments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, criteria } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const result = await query(
      'INSERT INTO marketing_segments (name, description, criteria, tenant_id, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, JSON.stringify(criteria || {}), user.tenant_id, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error creando segmento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/segments/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, criteria } = req.body;
    const result = await query(
      'UPDATE marketing_segments SET name = COALESCE($1, name), description = COALESCE($2, description), criteria = COALESCE($3, criteria), updated_at = NOW() WHERE id = $4 AND tenant_id = $5 RETURNING *',
      [name, description, criteria ? JSON.stringify(criteria) : null, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Segmento no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Marketing] Error actualizando segmento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/segments/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('DELETE FROM marketing_segments WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Segmento no encontrado' });
    res.json({ message: 'Segmento eliminado exitosamente' });
  } catch (error) {
    console.error('[Marketing] Error eliminando segmento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
