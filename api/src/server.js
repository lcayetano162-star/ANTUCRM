const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ 
  origin: process.env.FRONTEND_URL || '*', 
  credentials: true 
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Demasiadas peticiones' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// PUBLIC ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));

// ============================================
// TRACKING ROUTES (Públicos - No requieren auth)
// ============================================
app.use('/track', require('./routes/tracking'));

// ============================================
// PROTECTED ROUTES - Tenant Level
// ============================================
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/marketing', require('./routes/marketing'));

// ============================================
// SUPER ADMIN ROUTES - Landlord Level
// ============================================
app.use('/api/super-admin/plans', require('./routes/super-admin/plans'));
app.use('/api/super-admin/tenants', require('./routes/super-admin/tenants'));
app.use('/api/super-admin/admins', require('./routes/super-admin/admins'));

// ============================================
// DASHBOARD STATS (Super Admin)
// ============================================
app.get('/api/super-admin/dashboard', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const { authenticateToken, requireSuperAdmin } = require('./middleware/auth');
    
    // Manual middleware application
    const authMiddleware = authenticateToken;
    const adminMiddleware = requireSuperAdmin;
    
    // Apply middleware manually
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      adminMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get stats
    const tenantsCount = await query('SELECT COUNT(*) as count FROM tenants');
    const activeTenantsCount = await query("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'");
    const plansCount = await query('SELECT COUNT(*) as count FROM plans');
    const adminsCount = await query('SELECT COUNT(*) as count FROM landlord_users');
    
    // Get recent tenants
    const recentTenants = await query(
      `SELECT t.*, p.name as plan_name 
       FROM tenants t 
       LEFT JOIN plans p ON t.plan_id = p.id 
       ORDER BY t.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalTenants: parseInt(tenantsCount.rows[0].count),
        activeTenants: parseInt(activeTenantsCount.rows[0].count),
        totalPlans: parseInt(plansCount.rows[0].count),
        totalAdmins: parseInt(adminsCount.rows[0].count)
      },
      recentTenants: recentTenants.rows
    });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Error interno del servidor' 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint no encontrado' 
  });
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  try {
    await testConnection();
    console.log('✅ PostgreSQL conectado');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  🚀 Antü CRM API - Multi-Tenant SaaS                   ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║  Puerto: ${PORT}                                        ║`);
      console.log(`║  Entorno: ${process.env.NODE_ENV || 'development'}                                   ║`);
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log('║  Endpoints disponibles:                                ║');
      console.log('║    • POST /api/auth/login                              ║');
      console.log('║    • GET  /api/auth/me                                 ║');
      console.log('║    • GET  /api/users                                   ║');
      console.log('║    • GET  /api/clients                                 ║');
      console.log('║    • GET  /api/opportunities                           ║');
      console.log('║    • GET  /api/quotes                                  ║');
      console.log('║    • GET  /api/tasks                                   ║');
      console.log('║    • GET  /api/marketing/campaigns                     ║');
      console.log('║    • GET  /api/marketing/automations                   ║');
      console.log('║    • GET  /api/marketing/segments                      ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log('║  Super Admin Endpoints:                                ║');
      console.log('║    • GET  /api/super-admin/plans                       ║');
      console.log('║    • GET  /api/super-admin/tenants                     ║');
      console.log('║    • GET  /api/super-admin/admins                      ║');
      console.log('║    • GET  /api/super-admin/dashboard                   ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    process.exit(1);
  }
};

startServer();
