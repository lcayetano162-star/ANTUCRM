const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const { status, assigned_to, priority, related_to_type, related_to_id } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    let sql = `
      SELECT t.*, 
             u.first_name as assigned_first_name,
             u.last_name as assigned_last_name,
             c.name as client_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN clients c ON t.related_to_type = 'client' AND t.related_to_id = c.id
      WHERE t.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assigned_to) {
      sql += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (priority) {
      sql += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (related_to_type && related_to_id) {
      sql += ` AND t.related_to_type = $${paramIndex} AND t.related_to_id = $${paramIndex + 1}`;
      params.push(related_to_type, related_to_id);
      paramIndex += 2;
    }

    sql += ` ORDER BY 
      CASE t.priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`;

    const result = await query(sql, params);
    
    res.json({
      success: true,
      tasks: result.rows
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tareas'
    });
  }
});

// Get task stats
router.get('/stats/summary', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const userId = req.user.id;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending' AND assigned_to = $2) as my_pending,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue
       FROM tasks
       WHERE tenant_id = $1`,
      [tenantId, userId]
    );
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT t.*, 
              u.first_name as assigned_first_name,
              u.last_name as assigned_last_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }
    
    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tarea'
    });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      assigned_to,
      related_to_type,
      related_to_id,
      priority,
      due_date,
      tenant_id
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Título de la tarea es requerido'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    const result = await query(
      `INSERT INTO tasks (tenant_id, title, description, assigned_to, related_to_type, related_to_id, priority, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        targetTenantId,
        title,
        description || null,
        assigned_to || req.user.id,
        related_to_type || null,
        related_to_id || null,
        priority || 'medium',
        due_date || null,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      task: result.rows[0],
      message: 'Tarea creada exitosamente'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear tarea'
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assigned_to,
      status,
      priority,
      due_date
    } = req.body;

    const result = await query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assigned_to = COALESCE($3, assigned_to),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        due_date = COALESCE($6, due_date),
        completed_at = CASE WHEN $4 = 'completed' AND status != 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title,
        description,
        assigned_to,
        status,
        priority,
        due_date,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      task: result.rows[0],
      message: 'Tarea actualizada exitosamente'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar tarea'
    });
  }
});

// Complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE tasks SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      task: result.rows[0],
      message: 'Tarea completada exitosamente'
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al completar tarea'
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar tarea'
    });
  }
});

module.exports = router;
