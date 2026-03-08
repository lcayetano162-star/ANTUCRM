const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticateToken, updateLastLogin, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// ============================================
// LOGIN - Soporta tanto usuarios de tenant como Super Admin
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password, isLandlord } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email y contraseña son requeridos' 
      });
    }

    let user = null;
    let isLandlordUser = false;

    // Primero intentar como Super Admin (landlord_user)
    const landlordResult = await query(
      'SELECT * FROM landlord_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (landlordResult.rows.length > 0) {
      user = landlordResult.rows[0];
      isLandlordUser = true;
    } else {
      // Si no es Super Admin, buscar en usuarios de tenant
      const userResult = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
      );
      
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // Actualizar último login (no bloqueante)
    await updateLastLogin(user.id, isLandlordUser);

    // Generar token JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isLandlord: isLandlordUser
    };

    if (!isLandlordUser) {
      tokenPayload.tenantId = user.tenant_id;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Respuesta exitosa
    const response = {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isLandlord: isLandlordUser
      }
    };

    if (!isLandlordUser) {
      response.user.tenantId = user.tenant_id;
    }

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servidor' 
    });
  }
});

// ============================================
// GET CURRENT USER
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isLandlord: user.isLandlord || false
      }
    };

    if (!user.isLandlord) {
      response.user.tenantId = user.tenant_id;
    }

    res.json(response);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener usuario' 
    });
  }
});

// ============================================
// CHANGE PASSWORD
// ============================================
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const isLandlord = req.user.isLandlord;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const table = isLandlord ? 'landlord_users' : 'users';

    // Si es Super Admin, permitir cambio sin validar contraseña actual
    if (req.user.role === 'superadmin' && !currentPassword) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await query(
        `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newHash, userId]
      );
      
      return res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    }

    // Para otros usuarios, validar contraseña actual
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual requerida'
      });
    }

    const userResult = await query(
      `SELECT password_hash FROM ${table} WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña'
    });
  }
});

// ============================================
// RESET PASSWORD (Super Admin only)
// ============================================
router.post('/reset-password', authenticateToken, async (req, res) => {
  try {
    const { userId, newPassword, isLandlordUser } = req.body;

    // Solo Super Admin puede resetear contraseñas
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Solo Super Admin puede resetear contraseñas'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const table = isLandlordUser ? 'landlord_users' : 'users';
    const newHash = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );

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

module.exports = router;
