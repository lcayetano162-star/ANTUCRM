const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');
const router = express.Router();

// Aplicar middleware a todas las rutas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============================================
// GET ALL SUPER ADMINS
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at
       FROM landlord_users
       ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      admins: result.rows
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener administradores'
    });
  }
});

// ============================================
// GET SINGLE SUPER ADMIN
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at
       FROM landlord_users
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }
    
    res.json({
      success: true,
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener administrador'
    });
  }
});

// ============================================
// CREATE SUPER ADMIN
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      is_active
    } = req.body;

    // Validaciones
    if (!email || !password || !first_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO landlord_users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, last_login, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        first_name,
        last_name || '',
        role || 'superadmin',
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({
      success: true,
      admin: result.rows[0],
      message: 'Super Admin creado exitosamente'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.message.includes('unique constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un administrador con ese email'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear administrador'
    });
  }
});

// ============================================
// UPDATE SUPER ADMIN
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      first_name,
      last_name,
      role,
      is_active
    } = req.body;

    // No permitir desactivarse a sí mismo
    if (id === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    const result = await query(
      `UPDATE landlord_users SET
        email = COALESCE($1, email),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at`,
      [
        email ? email.toLowerCase() : null,
        first_name,
        last_name,
        role,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }

    res.json({
      success: true,
      admin: result.rows[0],
      message: 'Super Admin actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update admin error:', error);
    if (error.message.includes('unique constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un administrador con ese email'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al actualizar administrador'
    });
  }
});

// ============================================
// DELETE SUPER ADMIN
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminarse a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar que quede al menos un Super Admin activo
    const countResult = await query(
      `SELECT COUNT(*) as count FROM landlord_users WHERE is_active = true AND id != $1`,
      [id]
    );

    if (parseInt(countResult.rows[0].count) === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe quedar al menos un Super Admin activo'
      });
    }

    const result = await query(
      'DELETE FROM landlord_users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Super Admin eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar administrador'
    });
  }
});

// ============================================
// RESET PASSWORD
// ============================================
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await query(
      `UPDATE landlord_users SET password_hash = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, first_name, last_name`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Contraseña reseteada exitosamente'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al resetear contraseña'
    });
  }
});

// ============================================
// TOGGLE ACTIVE STATUS
// ============================================
router.post('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir desactivarse a sí mismo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes cambiar el estado de tu propia cuenta'
      });
    }

    // Verificar el estado actual
    const currentResult = await query(
      'SELECT is_active FROM landlord_users WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Administrador no encontrado'
      });
    }

    const newStatus = !currentResult.rows[0].is_active;

    // Si se va a desactivar, verificar que quede al menos uno activo
    if (!newStatus) {
      const countResult = await query(
        `SELECT COUNT(*) as count FROM landlord_users WHERE is_active = true AND id != $1`,
        [id]
      );

      if (parseInt(countResult.rows[0].count) === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debe quedar al menos un Super Admin activo'
        });
      }
    }

    const result = await query(
      `UPDATE landlord_users SET is_active = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, first_name, last_name, is_active`,
      [newStatus, id]
    );

    res.json({
      success: true,
      admin: result.rows[0],
      message: `Administrador ${newStatus ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del administrador'
    });
  }
});

module.exports = router;
