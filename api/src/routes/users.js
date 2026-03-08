const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Get all users (for current tenant)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario'
    });
  }
});

// Create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      tenant_id
    } = req.body;

    if (!email || !password || !first_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const targetTenantId = tenant_id || req.user.tenant_id;

    const result = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [
        targetTenantId,
        email.toLowerCase(),
        passwordHash,
        first_name,
        last_name || '',
        role || 'seller'
      ]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('unique constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un usuario con ese email en este tenant'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario'
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      role,
      is_active
    } = req.body;

    // Solo admin puede cambiar role e is_active
    const allowedRoles = ['superadmin', 'admin', 'sales_manager'];
    const canModifyRole = allowedRoles.includes(req.user.role);

    const result = await query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        role = CASE WHEN $3 THEN COALESCE($4, role) ELSE role END,
        is_active = CASE WHEN $3 THEN COALESCE($5, is_active) ELSE is_active END,
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [
        first_name,
        last_name,
        canModifyRole,
        role,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
});

// Delete user
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminarse a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propia cuenta'
      });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
});

module.exports = router;
