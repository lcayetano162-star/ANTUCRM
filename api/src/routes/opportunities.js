const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Pipeline stages
const PIPELINE_STAGES = [
  { id: 'qualify', name: 'Calificación', probability: 10 },
  { id: 'analysis', name: 'Análisis', probability: 25 },
  { id: 'proposal', name: 'Propuesta', probability: 50 },
  { id: 'negotiation', name: 'Negociación', probability: 75 },
  { id: 'closed_won', name: 'Cerrada Ganada', probability: 100 },
  { id: 'closed_lost', name: 'Cerrada Perdida', probability: 0 }
];

// Get all opportunities
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const { stage, owner_id, client_id } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    let sql = `
      SELECT o.*, 
             c.name as client_name,
             u.first_name as owner_first_name,
             u.last_name as owner_last_name
      FROM opportunities o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN users u ON o.owner_id = u.id
      WHERE o.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (stage) {
      sql += ` AND o.stage = $${paramIndex}`;
      params.push(stage);
      paramIndex++;
    }

    if (owner_id) {
      sql += ` AND o.owner_id = $${paramIndex}`;
      params.push(owner_id);
      paramIndex++;
    }

    if (client_id) {
      sql += ` AND o.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const result = await query(sql, params);
    
    res.json({
      success: true,
      opportunities: result.rows,
      pipelineStages: PIPELINE_STAGES
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener oportunidades'
    });
  }
});

// Get pipeline summary
router.get('/pipeline/summary', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    const result = await query(
      `SELECT 
        stage,
        COUNT(*) as count,
        COALESCE(SUM(estimated_revenue), 0) as total_value
       FROM opportunities
       WHERE tenant_id = $1 AND status = 'active'
       GROUP BY stage
       ORDER BY 
         CASE stage
           WHEN 'qualify' THEN 1
           WHEN 'analysis' THEN 2
           WHEN 'proposal' THEN 3
           WHEN 'negotiation' THEN 4
           WHEN 'closed_won' THEN 5
           WHEN 'closed_lost' THEN 6
         END`,
      [tenantId]
    );

    // Calculate totals
    const totalsResult = await query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN stage = 'closed_won' THEN estimated_revenue ELSE 0 END), 0) as won_value,
        COALESCE(SUM(CASE WHEN stage NOT IN ('closed_won', 'closed_lost') THEN estimated_revenue ELSE 0 END), 0) as pipeline_value
       FROM opportunities
       WHERE tenant_id = $1`,
      [tenantId]
    );
    
    res.json({
      success: true,
      stages: result.rows,
      totals: totalsResult.rows[0],
      pipelineStages: PIPELINE_STAGES
    });
  } catch (error) {
    console.error('Get pipeline summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen del pipeline'
    });
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const oppResult = await query(
      `SELECT o.*, 
              c.name as client_name,
              u.first_name as owner_first_name,
              u.last_name as owner_last_name
       FROM opportunities o
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN users u ON o.owner_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    
    if (oppResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Oportunidad no encontrada'
      });
    }

    // Get activities
    const activitiesResult = await query(
      `SELECT * FROM activities 
       WHERE related_to_type = 'opportunity' AND related_to_id = $1
       ORDER BY performed_at DESC`,
      [id]
    );
    
    res.json({
      success: true,
      opportunity: {
        ...oppResult.rows[0],
        activities: activitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener oportunidad'
    });
  }
});

// Create opportunity
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      client_id,
      contact_id,
      stage,
      probability,
      estimated_revenue,
      expected_close_date,
      source,
      tenant_id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de la oportunidad es requerido'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    const result = await query(
      `INSERT INTO opportunities (tenant_id, name, description, client_id, contact_id, owner_id, stage, probability, estimated_revenue, expected_close_date, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        targetTenantId,
        name,
        description || null,
        client_id || null,
        contact_id || null,
        req.user.id,
        stage || 'qualify',
        probability || 10,
        estimated_revenue || 0,
        expected_close_date || null,
        source || null
      ]
    );

    res.status(201).json({
      success: true,
      opportunity: result.rows[0],
      message: 'Oportunidad creada exitosamente'
    });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear oportunidad'
    });
  }
});

// Update opportunity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      client_id,
      stage,
      probability,
      estimated_revenue,
      expected_close_date,
      status
    } = req.body;

    // Calcular probabilidad basada en etapa si no se proporciona
    let finalProbability = probability;
    if (stage && !probability) {
      const stageInfo = PIPELINE_STAGES.find(s => s.id === stage);
      if (stageInfo) {
        finalProbability = stageInfo.probability;
      }
    }

    const result = await query(
      `UPDATE opportunities SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        client_id = COALESCE($3, client_id),
        stage = COALESCE($4, stage),
        probability = COALESCE($5, probability),
        estimated_revenue = COALESCE($6, estimated_revenue),
        expected_close_date = COALESCE($7, expected_close_date),
        status = COALESCE($8, status),
        actual_close_date = CASE WHEN $4 IN ('closed_won', 'closed_lost') THEN NOW() ELSE actual_close_date END,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name,
        description,
        client_id,
        stage,
        finalProbability,
        estimated_revenue,
        expected_close_date,
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Oportunidad no encontrada'
      });
    }

    res.json({
      success: true,
      opportunity: result.rows[0],
      message: 'Oportunidad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar oportunidad'
    });
  }
});

// Delete opportunity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM opportunities WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Oportunidad no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Oportunidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar oportunidad'
    });
  }
});

// Move opportunity to next stage
router.post('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({
        success: false,
        error: 'Etapa destino requerida'
      });
    }

    const stageInfo = PIPELINE_STAGES.find(s => s.id === stage);
    if (!stageInfo) {
      return res.status(400).json({
        success: false,
        error: 'Etapa inválida'
      });
    }

    const result = await query(
      `UPDATE opportunities SET
        stage = $1,
        probability = $2,
        actual_close_date = CASE WHEN $1 IN ('closed_won', 'closed_lost') THEN NOW() ELSE actual_close_date END,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [stage, stageInfo.probability, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Oportunidad no encontrada'
      });
    }

    res.json({
      success: true,
      opportunity: result.rows[0],
      message: `Oportunidad movida a ${stageInfo.name}`
    });
  } catch (error) {
    console.error('Move opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al mover oportunidad'
    });
  }
});

module.exports = router;
