import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken } from '../../../shared/middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, assigned_to, related_to_type, related_to_id, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let whereConditions = ['t.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;
    if (status) { whereConditions.push(`t.status = $${paramIndex}`); params.push(status); paramIndex++; }
    if (assigned_to) { whereConditions.push(`t.assigned_to = $${paramIndex}`); params.push(assigned_to); paramIndex++; }
    if (related_to_type) { whereConditions.push(`t.related_to_type = $${paramIndex}`); params.push(related_to_type); paramIndex++; }
    if (related_to_id) { whereConditions.push(`t.related_to_id = $${paramIndex}`); params.push(related_to_id); paramIndex++; }
    const whereClause = whereConditions.join(' AND ');
    const result = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as assigned_user_name
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       WHERE ${whereClause}
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM tasks t WHERE ${whereClause}`, params);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('[Tasks] Error listando tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue
       FROM tasks WHERE tenant_id = $1 AND assigned_to = $2`,
      [user.tenant_id, user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tasks] Error obteniendo estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as assigned_user_name
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tasks] Error obteniendo tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, status, priority, due_date, assigned_to, related_to_type, related_to_id } = req.body;
    if (!title) return res.status(400).json({ error: 'El titulo es requerido' });
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, related_to_type, related_to_id, tenant_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, status || 'pending', priority || 'medium', due_date, assigned_to || user.userId, related_to_type, related_to_id, user.tenant_id, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Tasks] Error creando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, status, priority, due_date, assigned_to, related_to_type, related_to_id } = req.body;
    const result = await query(
      `UPDATE tasks SET
        title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status),
        priority = COALESCE($4, priority), due_date = COALESCE($5, due_date), assigned_to = COALESCE($6, assigned_to),
        related_to_type = COALESCE($7, related_to_type), related_to_id = COALESCE($8, related_to_id), updated_at = NOW()
       WHERE id = $9 AND tenant_id = $10 RETURNING *`,
      [title, description, status, priority, due_date, assigned_to, related_to_type, related_to_id, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tasks] Error actualizando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('[Tasks] Error eliminando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      "UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Tasks] Error completando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
