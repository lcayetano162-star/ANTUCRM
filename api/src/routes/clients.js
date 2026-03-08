const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all clients with optional filters
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const { status, search, assigned_to } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    let sql = `
      SELECT c.*, 
             u.first_name as assigned_first_name, 
             u.last_name as assigned_last_name,
             COUNT(DISTINCT con.id) as contacts_count,
             COUNT(DISTINCT o.id) as opportunities_count
      FROM clients c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN contacts con ON con.client_id = c.id
      LEFT JOIN opportunities o ON o.client_id = c.id
      WHERE c.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assigned_to) {
      sql += ` AND c.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.rnc ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY c.id, u.first_name, u.last_name ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    
    res.json({
      success: true,
      clients: result.rows
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener clientes'
    });
  }
});

// Get single client with contacts
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const clientResult = await query(
      `SELECT c.*, 
              u.first_name as assigned_first_name, 
              u.last_name as assigned_last_name
       FROM clients c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Get contacts
    const contactsResult = await query(
      `SELECT * FROM contacts WHERE client_id = $1 ORDER BY is_primary DESC, created_at DESC`,
      [id]
    );

    // Get opportunities
    const opportunitiesResult = await query(
      `SELECT id, name, stage, estimated_revenue, expected_close_date, status
       FROM opportunities WHERE client_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    
    res.json({
      success: true,
      client: {
        ...clientResult.rows[0],
        contacts: contactsResult.rows,
        opportunities: opportunitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cliente'
    });
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    const {
      name,
      rnc,
      phone,
      email,
      address,
      city,
      country,
      status,
      source,
      notes,
      assigned_to,
      tenant_id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del cliente es requerido'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;

    const result = await query(
      `INSERT INTO clients (tenant_id, name, rnc, phone, email, address, city, country, status, source, notes, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        targetTenantId,
        name,
        rnc || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        country || 'República Dominicana',
        status || 'prospect',
        source || null,
        notes || null,
        assigned_to || req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      client: result.rows[0],
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cliente'
    });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      rnc,
      phone,
      email,
      address,
      city,
      country,
      status,
      source,
      notes,
      assigned_to
    } = req.body;

    const result = await query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        rnc = COALESCE($2, rnc),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        country = COALESCE($7, country),
        status = COALESCE($8, status),
        source = COALESCE($9, source),
        notes = COALESCE($10, notes),
        assigned_to = COALESCE($11, assigned_to),
        updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name,
        rnc,
        phone,
        email,
        address,
        city,
        country,
        status,
        source,
        notes,
        assigned_to,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      client: result.rows[0],
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cliente'
    });
  }
});

// Delete client
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM clients WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cliente'
    });
  }
});

// Convert client to opportunity
router.post('/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    const { opportunity_name, estimated_revenue, expected_close_date } = req.body;

    // Get client info
    const clientResult = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const client = clientResult.rows[0];

    // Create opportunity
    const oppResult = await query(
      `INSERT INTO opportunities (tenant_id, name, client_id, owner_id, stage, estimated_revenue, expected_close_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        client.tenant_id,
        opportunity_name || `Oportunidad - ${client.name}`,
        id,
        client.assigned_to || req.user.id,
        'qualify',
        estimated_revenue || 0,
        expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ]
    );

    // Update client status
    await query(
      `UPDATE clients SET status = 'client', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      opportunity: oppResult.rows[0],
      message: 'Cliente convertido a oportunidad exitosamente'
    });
  } catch (error) {
    console.error('Convert client error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al convertir cliente'
    });
  }
});

module.exports = router;
