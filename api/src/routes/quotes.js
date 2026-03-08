const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all quotes
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    const { status, client_id } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    let sql = `
      SELECT q.*, 
             c.name as client_name,
             u.first_name as created_by_first_name,
             u.last_name as created_by_last_name
      FROM quotes q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND q.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (client_id) {
      sql += ` AND q.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    sql += ` ORDER BY q.created_at DESC`;

    const result = await query(sql, params);
    
    res.json({
      success: true,
      quotes: result.rows
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotizaciones'
    });
  }
});

// Get single quote with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const quoteResult = await query(
      `SELECT q.*, 
              c.name as client_name,
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = $1`,
      [id]
    );
    
    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    // Get items
    const itemsResult = await query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    
    res.json({
      success: true,
      quote: {
        ...quoteResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotización'
    });
  }
});

// Generate quote number
const generateQuoteNumber = async (tenantId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const result = await query(
    `SELECT COUNT(*) as count FROM quotes WHERE tenant_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [tenantId, year]
  );
  
  const count = parseInt(result.rows[0].count) + 1;
  return `COT-${year}${month}-${String(count).padStart(4, '0')}`;
};

// Create quote
router.post('/', async (req, res) => {
  try {
    const {
      client_id,
      opportunity_id,
      valid_until,
      notes,
      items,
      tenant_id
    } = req.body;

    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: 'Cliente es requerido'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir al menos un item'
      });
    }

    const targetTenantId = tenant_id || req.user.tenant_id;
    const quoteNumber = await generateQuoteNumber(targetTenantId);

    // Calculate totals
    let subtotal = 0;
    let totalMonthly = 0;
    let totalOnetime = 0;

    items.forEach(item => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const discount = item.discount_percent || 0;
      const total = quantity * unitPrice * (1 - discount / 100);
      
      subtotal += total;
      
      if (item.is_recurring) {
        totalMonthly += total;
      } else {
        totalOnetime += total;
      }
    });

    const taxRate = 18; // 18% ITBIS
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Create quote
    const quoteResult = await query(
      `INSERT INTO quotes (tenant_id, quote_number, client_id, opportunity_id, status, subtotal, tax_rate, tax_amount, total_monthly, total_onetime, valid_until, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        targetTenantId,
        quoteNumber,
        client_id,
        opportunity_id || null,
        'draft',
        subtotal,
        taxRate,
        taxAmount,
        totalMonthly,
        totalOnetime,
        valid_until || null,
        notes || null,
        req.user.id
      ]
    );

    const quote = quoteResult.rows[0];

    // Create items
    for (const item of items) {
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const discount = item.discount_percent || 0;
      const totalPrice = quantity * unitPrice * (1 - discount / 100);

      await query(
        `INSERT INTO quote_items (quote_id, product_name, description, quantity, unit_price, discount_percent, total_price, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          quote.id,
          item.product_name,
          item.description || null,
          quantity,
          unitPrice,
          discount,
          totalPrice,
          item.is_recurring !== false
        ]
      );
    }

    // Get quote with items
    const itemsResult = await query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY created_at ASC`,
      [quote.id]
    );

    res.status(201).json({
      success: true,
      quote: {
        ...quote,
        items: itemsResult.rows
      },
      message: 'Cotización creada exitosamente'
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cotización'
    });
  }
});

// Update quote status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    const result = await query(
      `UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      quote: result.rows[0],
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado'
    });
  }
});

// Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM quotes WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cotización'
    });
  }
});

module.exports = router;
