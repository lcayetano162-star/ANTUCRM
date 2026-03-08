const express = require('express');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../../config/database');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');
const router = express.Router();

// Aplicar middleware a todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============================================
// GET ALL TENANTS
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, p.name as plan_name, p.slug as plan_slug
       FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       ORDER BY t.created_at DESC`
    );
    
    res.json({
      success: true,
      tenants: result.rows
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener empresas'
    });
  }
});

// ============================================
// GET SINGLE TENANT
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenantResult = await query(
      `SELECT t.*, p.name as plan_name, p.slug as plan_slug
       FROM tenants t
       LEFT JOIN plans p ON t.plan_id = p.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // Obtener usuarios del tenant
    const usersResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at,
              tu.is_owner
       FROM users u
       JOIN tenant_users tu ON u.id = tu.user_id
       WHERE tu.tenant_id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      tenant: {
        ...tenantResult.rows[0],
        users: usersResult.rows
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener empresa'
    });
  }
});

// ============================================
// CREATE TENANT
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      domain,
      plan_id,
      database_name,
      settings,
      billing_info,
      trial_days,
      // Owner info
      owner_email,
      owner_first_name,
      owner_last_name,
      owner_password
    } = req.body;

    // Validaciones
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y slug son requeridos'
      });
    }

    if (!owner_email || !owner_first_name || !owner_password) {
      return res.status(400).json({
        success: false,
        error: 'Información del propietario es requerida (email, nombre, contraseña)'
      });
    }

    // Crear tenant y usuario en transacción
    const result = await transaction(async (client) => {
      // 1. Crear el tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, domain, plan_id, database_name, status, settings, billing_info, trial_ends_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          name,
          slug,
          domain || null,
          plan_id || null,
          database_name || `tenant_${slug}`,
          'active',
          JSON.stringify(settings || {}),
          JSON.stringify(billing_info || {}),
          trial_days ? new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000) : null
        ]
      );

      const tenant = tenantResult.rows[0];

      // 2. Crear el usuario propietario
      const passwordHash = await bcrypt.hash(owner_password, 10);
      
      const ownerResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          tenant.id,
          owner_email.toLowerCase(),
          passwordHash,
          owner_first_name,
          owner_last_name || '',
          'admin',
          true
        ]
      );

      const owner = ownerResult.rows[0];

      // 3. Crear el enlace en tenant_users
      await client.query(
        `INSERT INTO tenant_users (tenant_id, user_id, role, is_owner)
         VALUES ($1, $2, $3, $4)`,
        [tenant.id, owner.id, 'owner', true]
      );

      return { tenant, owner };
    });

    res.status(201).json({
      success: true,
      tenant: result.tenant,
      owner: {
        id: result.owner.id,
        email: result.owner.email,
        firstName: result.owner.first_name,
        lastName: result.owner.last_name,
        role: result.owner.role
      },
      message: 'Empresa creada exitosamente'
    });

  } catch (error) {
    console.error('Create tenant error:', error);
    if (error.message.includes('unique constraint')) {
      if (error.message.includes('slug')) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una empresa con ese slug'
        });
      }
      if (error.message.includes('email')) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un usuario con ese email en este tenant'
        });
      }
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear empresa'
    });
  }
});

// ============================================
// UPDATE TENANT
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      domain,
      plan_id,
      database_name,
      status,
      settings,
      billing_info
    } = req.body;

    const result = await query(
      `UPDATE tenants SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        domain = COALESCE($3, domain),
        plan_id = COALESCE($4, plan_id),
        database_name = COALESCE($5, database_name),
        status = COALESCE($6, status),
        settings = COALESCE($7, settings),
        billing_info = COALESCE($8, billing_info),
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name,
        slug,
        domain,
        plan_id,
        database_name,
        status,
        settings ? JSON.stringify(settings) : null,
        billing_info ? JSON.stringify(billing_info) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      tenant: result.rows[0],
      message: 'Empresa actualizada exitosamente'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar empresa'
    });
  }
});

// ============================================
// DELETE TENANT
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el tenant existe
    const tenantResult = await query(
      'SELECT * FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // Eliminar en cascada (la base de datos manejará los ON DELETE CASCADE)
    await query('DELETE FROM tenants WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Empresa eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar empresa'
    });
  }
});

// ============================================
// SUSPEND/ACTIVATE TENANT
// ============================================
router.post('/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE tenants SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      tenant: result.rows[0],
      message: 'Empresa suspendida exitosamente'
    });
  } catch (error) {
    console.error('Suspend tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al suspender empresa'
    });
  }
});

router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      tenant: result.rows[0],
      message: 'Empresa activada exitosamente'
    });
  } catch (error) {
    console.error('Activate tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al activar empresa'
    });
  }
});

module.exports = router;
