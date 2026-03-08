const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const { status, type } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    let sql = `
      SELECT c.*, 
             s.name as segment_name,
             u.first_name as created_by_first_name,
             u.last_name as created_by_last_name
      FROM marketing_campaigns c
      LEFT JOIN marketing_segments s ON c.segment_id = s.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      sql += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    
    res.json({
      success: true,
      campaigns: result.rows
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener campañas'
    });
  }
});

// Get single campaign
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaignResult = await query(
      `SELECT c.*, 
              s.name as segment_name,
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
       FROM marketing_campaigns c
       LEFT JOIN marketing_segments s ON c.segment_id = s.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaña no encontrada'
      });
    }

    res.json({
      success: true,
      campaign: campaignResult.rows[0]
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener campaña'
    });
  }
});

// Create campaign
router.post('/campaigns', async (req, res) => {
  try {
    const {
      name,
      type,
      subject,
      content,
      segment_id,
      scheduled_at,
      tenant_id
    } = req.body;

    if (!name || !type || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, tipo y asunto son requeridos'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    // Get audience count if segment is specified
    let audienceCount = 0;
    if (segment_id) {
      const segmentResult = await query(
        'SELECT contact_count FROM marketing_segments WHERE id = $1',
        [segment_id]
      );
      if (segmentResult.rows.length > 0) {
        audienceCount = segmentResult.rows[0].contact_count;
      }
    } else {
      // Count all contacts in tenant
      const contactsResult = await query(
        'SELECT COUNT(*) as count FROM contacts WHERE tenant_id = $1',
        [targetTenantId]
      );
      audienceCount = parseInt(contactsResult.rows[0].count);
    }

    const result = await query(
      `INSERT INTO marketing_campaigns (tenant_id, name, type, subject, content, segment_id, audience_count, status, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        targetTenantId,
        name,
        type,
        subject,
        content || null,
        segment_id || null,
        audienceCount,
        scheduled_at ? 'scheduled' : 'draft',
        scheduled_at || null,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      campaign: result.rows[0],
      message: 'Campaña creada exitosamente'
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear campaña'
    });
  }
});

// Update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, segment_id, scheduled_at } = req.body;

    const result = await query(
      `UPDATE marketing_campaigns 
       SET name = $1, subject = $2, content = $3, segment_id = $4, scheduled_at = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, subject, content, segment_id, scheduled_at, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaña no encontrada'
      });
    }

    res.json({
      success: true,
      campaign: result.rows[0],
      message: 'Campaña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar campaña'
    });
  }
});

// Launch campaign
router.post('/campaigns/:id/launch', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE marketing_campaigns 
       SET status = 'running', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status IN ('draft', 'scheduled', 'paused')
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo lanzar la campaña'
      });
    }

    // Simulate sending (in production, this would queue emails)
    setTimeout(async () => {
      await query(
        `UPDATE marketing_campaigns 
         SET status = 'completed', sent_count = audience_count, completed_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
    }, 5000);

    res.json({
      success: true,
      campaign: result.rows[0],
      message: 'Campaña lanzada exitosamente'
    });
  } catch (error) {
    console.error('Launch campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al lanzar campaña'
    });
  }
});

// Pause campaign
router.post('/campaigns/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE marketing_campaigns 
       SET status = 'paused', updated_at = NOW()
       WHERE id = $1 AND status = 'running'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo pausar la campaña'
      });
    }

    res.json({
      success: true,
      campaign: result.rows[0],
      message: 'Campaña pausada'
    });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al pausar campaña'
    });
  }
});

// Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM marketing_campaigns WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaña no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Campaña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar campaña'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all automations
router.get('/automations', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    const result = await query(
      `SELECT a.*, 
              COUNT(ae.id) as actions_count,
              (SELECT COUNT(*) FROM automation_logs WHERE automation_id = a.id) as executed_count
       FROM marketing_automations a
       LEFT JOIN marketing_automation_actions ae ON a.id = ae.automation_id
       WHERE a.tenant_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      automations: result.rows
    });
  } catch (error) {
    console.error('Get automations error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener automatizaciones'
    });
  }
});

// Get single automation
router.get('/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const automationResult = await query(
      'SELECT * FROM marketing_automations WHERE id = $1',
      [id]
    );
    
    if (automationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Automatización no encontrada'
      });
    }

    // Get actions
    const actionsResult = await query(
      'SELECT * FROM marketing_automation_actions WHERE automation_id = $1 ORDER BY sequence ASC',
      [id]
    );

    res.json({
      success: true,
      automation: {
        ...automationResult.rows[0],
        actions: actionsResult.rows
      }
    });
  } catch (error) {
    console.error('Get automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener automatización'
    });
  }
});

// Create automation
router.post('/automations', async (req, res) => {
  try {
    const {
      name,
      trigger_type,
      trigger_config,
      actions,
      tenant_id
    } = req.body;

    if (!name || !trigger_type) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y tipo de disparador son requeridos'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    // Create automation
    const automationResult = await query(
      `INSERT INTO marketing_automations (tenant_id, name, trigger_type, trigger_config, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        targetTenantId,
        name,
        trigger_type,
        trigger_config ? JSON.stringify(trigger_config) : null,
        'draft',
        req.user.id
      ]
    );

    const automation = automationResult.rows[0];

    // Create actions if provided
    if (actions && actions.length > 0) {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        await query(
          `INSERT INTO marketing_automation_actions (automation_id, action_type, action_config, sequence)
           VALUES ($1, $2, $3, $4)`,
          [
            automation.id,
            action.action_type,
            JSON.stringify(action.action_config),
            i + 1
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      automation,
      message: 'Automatización creada exitosamente'
    });
  } catch (error) {
    console.error('Create automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear automatización'
    });
  }
});

// Update automation status
router.put('/automations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'paused', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    const result = await query(
      `UPDATE marketing_automations 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Automatización no encontrada'
      });
    }

    res.json({
      success: true,
      automation: result.rows[0],
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update automation status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado'
    });
  }
});

// Delete automation
router.delete('/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete actions first (cascade)
    await query('DELETE FROM marketing_automation_actions WHERE automation_id = $1', [id]);
    
    const result = await query(
      'DELETE FROM marketing_automations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Automatización no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Automatización eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar automatización'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all segments
router.get('/segments', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    const result = await query(
      `SELECT s.*, 
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
       FROM marketing_segments s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      segments: result.rows
    });
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener segmentos'
    });
  }
});

// Get single segment
router.get('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT s.*, 
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
       FROM marketing_segments s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Segmento no encontrado'
      });
    }

    res.json({
      success: true,
      segment: result.rows[0]
    });
  } catch (error) {
    console.error('Get segment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener segmento'
    });
  }
});

// Create segment
router.post('/segments', async (req, res) => {
  try {
    const {
      name,
      description,
      criteria,
      tenant_id
    } = req.body;

    if (!name || !criteria) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y criterios son requeridos'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    // Calculate contact count based on criteria
    let contactCount = 0;
    try {
      const criteriaObj = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
      
      // Build query based on criteria
      let countSql = 'SELECT COUNT(*) as count FROM contacts WHERE tenant_id = $1';
      const countParams = [targetTenantId];
      
      if (criteriaObj.status) {
        countSql += ` AND status = $${countParams.length + 1}`;
        countParams.push(criteriaObj.status);
      }
      
      if (criteriaObj.city) {
        countSql += ` AND city ILIKE $${countParams.length + 1}`;
        countParams.push(`%${criteriaObj.city}%`);
      }

      const countResult = await query(countSql, countParams);
      contactCount = parseInt(countResult.rows[0].count);
    } catch (e) {
      console.error('Error calculating segment count:', e);
    }

    const result = await query(
      `INSERT INTO marketing_segments (tenant_id, name, description, criteria, contact_count, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        targetTenantId,
        name,
        description || null,
        typeof criteria === 'object' ? JSON.stringify(criteria) : criteria,
        contactCount,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      segment: result.rows[0],
      message: 'Segmento creado exitosamente'
    });
  } catch (error) {
    console.error('Create segment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear segmento'
    });
  }
});

// Update segment
router.put('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, criteria } = req.body;

    // Recalculate contact count
    let contactCount = 0;
    if (criteria) {
      try {
        const criteriaObj = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
        const segmentResult = await query('SELECT tenant_id FROM marketing_segments WHERE id = $1', [id]);
        
        if (segmentResult.rows.length > 0) {
          const tenantId = segmentResult.rows[0].tenant_id;
          
          let countSql = 'SELECT COUNT(*) as count FROM contacts WHERE tenant_id = $1';
          const countParams = [tenantId];
          
          if (criteriaObj.status) {
            countSql += ` AND status = $${countParams.length + 1}`;
            countParams.push(criteriaObj.status);
          }
          
          if (criteriaObj.city) {
            countSql += ` AND city ILIKE $${countParams.length + 1}`;
            countParams.push(`%${criteriaObj.city}%`);
          }

          const countResult = await query(countSql, countParams);
          contactCount = parseInt(countResult.rows[0].count);
        }
      } catch (e) {
        console.error('Error recalculating segment count:', e);
      }
    }

    const result = await query(
      `UPDATE marketing_segments 
       SET name = $1, description = $2, criteria = $3, contact_count = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        name,
        description,
        typeof criteria === 'object' ? JSON.stringify(criteria) : criteria,
        contactCount,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Segmento no encontrado'
      });
    }

    res.json({
      success: true,
      segment: result.rows[0],
      message: 'Segmento actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update segment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar segmento'
    });
  }
});

// Delete segment
router.delete('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM marketing_segments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Segmento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Segmento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar segmento'
    });
  }
});

module.exports = router;
