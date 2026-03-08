const express = require('express');
const { query } = require('../../config/database');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');
const router = express.Router();

// Aplicar middleware a todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============================================
// GET ALL PLANS
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM plans ORDER BY sort_order ASC, created_at ASC'
    );
    
    res.json({
      success: true,
      plans: result.rows
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener planes'
    });
  }
});

// ============================================
// GET SINGLE PLAN
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM plans WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }
    
    res.json({
      success: true,
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener plan'
    });
  }
});

// ============================================
// CREATE PLAN
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      currency,
      features,
      limits,
      is_active,
      sort_order
    } = req.body;

    // Validaciones
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y slug son requeridos'
      });
    }

    const result = await query(
      `INSERT INTO plans (name, slug, description, price_monthly, price_yearly, currency, features, limits, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        slug,
        description || '',
        price_monthly || 0,
        price_yearly || 0,
        currency || 'USD',
        JSON.stringify(features || []),
        JSON.stringify(limits || {}),
        is_active !== undefined ? is_active : true,
        sort_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      plan: result.rows[0],
      message: 'Plan creado exitosamente'
    });
  } catch (error) {
    console.error('Create plan error:', error);
    if (error.message.includes('unique constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un plan con ese slug'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear plan'
    });
  }
});

// ============================================
// UPDATE PLAN
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      currency,
      features,
      limits,
      is_active,
      sort_order
    } = req.body;

    const result = await query(
      `UPDATE plans SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        price_monthly = COALESCE($4, price_monthly),
        price_yearly = COALESCE($5, price_yearly),
        currency = COALESCE($6, currency),
        features = COALESCE($7, features),
        limits = COALESCE($8, limits),
        is_active = COALESCE($9, is_active),
        sort_order = COALESCE($10, sort_order),
        updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        slug,
        description,
        price_monthly,
        price_yearly,
        currency,
        features ? JSON.stringify(features) : null,
        limits ? JSON.stringify(limits) : null,
        is_active,
        sort_order,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }

    res.json({
      success: true,
      plan: result.rows[0],
      message: 'Plan actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar plan'
    });
  }
});

// ============================================
// DELETE PLAN
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay tenants usando este plan
    const tenantsResult = await query(
      'SELECT COUNT(*) as count FROM tenants WHERE plan_id = $1',
      [id]
    );

    if (parseInt(tenantsResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el plan porque hay empresas usando it'
      });
    }

    const result = await query(
      'DELETE FROM plans WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar plan'
    });
  }
});

module.exports = router;
