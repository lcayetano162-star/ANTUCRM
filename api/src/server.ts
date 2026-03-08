import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Shared
import { testConnection, pool } from './shared/config/database';
import { errorHandler, requestLogger, sanitizeInput, requestTimeout } from './shared/middleware/validation';
import { runMigrationsOnStartup } from './database/runMigrations';

// Module routes
import authRoutes from './modules/auth/routes';
import usersRoutes from './modules/crm/users/routes';
import clientsRoutes from './modules/crm/clients/routes';
import contactsRoutes from './modules/crm/contacts/routes';
import opportunitiesRoutes from './modules/crm/opportunities/routes';
import tasksRoutes from './modules/crm/tasks/routes';
import quotesRoutes from './modules/cpq/quotes/routes';
import mpsRoutes from './modules/cpq/mps/routes';
import marketingRoutes from './modules/marketing/routes';
import trackingRoutes from './modules/marketing/trackingRoutes';
import performanceRoutes from './modules/performance/routes';
import activitiesRoutes from './modules/activities/routes';
import emailRoutes from './modules/email/routes';
import superAdminPlansRoutes from './modules/super-admin/plans/routes';
import superAdminTenantsRoutes from './modules/super-admin/tenants/routes';
import superAdminAdminsRoutes from './modules/super-admin/admins/routes';
import superAdminDashboardRoutes from './modules/super-admin/dashboard/routes';
import superAdminUsersRoutes from './modules/super-admin/users/routes';
import superAdminLogsRoutes from './modules/super-admin/logs/routes';
import superAdminBillingRoutes from './modules/super-admin/billing/routes';
import superAdminSettingsRoutes from './modules/super-admin/settings/routes';
import creditsRoutes      from './modules/credits/routes';
import serviceDeskRoutes  from './modules/service-desk/routes';
import inventoryRoutes from './modules/inventory/routes';
import invoicingRoutes from './modules/invoicing/routes';
import integrationRoutes from './modules/integrations/routes';
import admcloudRoutes from './modules/integrations/admcloud/routes';
import erpIntegrationRoutes from './modules/integrations/erp/routes';
import aiRoutes from './modules/ai/routes';
import importRoutes from './modules/import/routes';
import govRoutes from './modules/gov/routes';
import automationRoutes from './modules/automations/routes';
import tenantSettingsRoutes from './modules/crm/tenantSettings/routes';
import whatsappRoutes from './modules/whatsapp/routes';
import mobileRoutes from './modules/mobile/routes';
import emailRoutes from './modules/email/routes';

// Workers & services
import { emailWorker } from './modules/marketing/workers/emailWorker';
import { automationWorker } from './modules/automations/automationWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Security & middleware
// ============================================
// Trust reverse proxy (nginx) so req.ip reflects real client IP, not proxy IP
app.set('trust proxy', 1);

app.use(helmet());

// CORS: soporte para múltiples orígenes separados por coma
// Ej: CORS_ORIGIN=https://midominio.com,http://localhost:5173
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin Origin (nginx mismo servidor, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Origen bloqueado: ${origin}. Permitidos: ${allowedOrigins.join(', ')}`);
    callback(new Error(`CORS: Origen no permitido: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);
app.use(sanitizeInput);          // XSS strip en todos los inputs
app.use(requestTimeout(30000));  // 30s timeout por request

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});
app.use('/api/auth/', authLimiter);

// ============================================
// Health check (real — verifica DB y worker)
// ============================================
app.get('/health', async (req, res) => {
  const start = Date.now();
  let dbOk = false;
  let dbLatencyMs = -1;

  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    emailWorker: { running: process.env.EMAIL_WORKER_ENABLED !== 'false' },
    memory: {
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

// ============================================
// API Routes
// ============================================

// Auth
app.use('/api/auth', authRoutes);

// CRM Core
app.use('/api/users', usersRoutes);
app.use('/api/tenant/settings', tenantSettingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/tasks', tasksRoutes);

// CPQ
app.use('/api/quotes', quotesRoutes);
app.use('/api/mps', mpsRoutes);

// Marketing
app.use('/api/marketing', marketingRoutes);
app.use('/api/tracking', trackingRoutes);

// Performance & Activities
app.use('/api/performance', performanceRoutes);
app.use('/api/activities', activitiesRoutes);

// Email (El Chismoso)
app.use('/api/email', emailRoutes);

// Super Admin (Landlord)
app.use('/api/super-admin/plans', superAdminPlansRoutes);
app.use('/api/super-admin/tenants', superAdminTenantsRoutes);
app.use('/api/super-admin/admins', superAdminAdminsRoutes);
app.use('/api/super-admin/dashboard', superAdminDashboardRoutes);
app.use('/api/super-admin/users', superAdminUsersRoutes);
app.use('/api/super-admin/logs', superAdminLogsRoutes);
app.use('/api/super-admin/billing', superAdminBillingRoutes);
app.use('/api/super-admin/settings', superAdminSettingsRoutes);

// ── Business Modules ─────────────────────────────────────
app.use('/api/credits',   creditsRoutes);
app.use('/api/service-desk', serviceDeskRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices',  invoicingRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integrations/erp', erpIntegrationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/import', importRoutes);
app.use('/api/integrations/admcloud', admcloudRoutes);
app.use('/api/gov', govRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/email', emailRoutes);

// ============================================
// Error handling (must be last)
// ============================================
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

// ============================================
// Start server + Graceful Shutdown
// ============================================
let server: any;

async function startServer() {
  try {
    await testConnection();
    console.log('[Server] Conexion a base de datos establecida');
  } catch (error) {
    console.warn('[Server] ADVERTENCIA: No se pudo conectar a la base de datos.');
  }

  try {
    await runMigrationsOnStartup();
  } catch (error) {
    console.warn('[Server] ADVERTENCIA: Error en migraciones incrementales:', error);
  }

  // Bootstrap: ensure super admin exists (idempotent)
  try {
    const bcrypt = await import('bcryptjs');
    const saEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@antucrm.com';
    const saPassword = process.env.SUPER_ADMIN_PASSWORD || 'AntuCRM2024!';
    const existing = await pool.query('SELECT id FROM landlord_users WHERE email = $1', [saEmail]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(saPassword, 10);
      await pool.query(
        `INSERT INTO landlord_users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, 'Super', 'Admin', 'superadmin', true)`,
        [saEmail, hash]
      );
      console.log(`[Server] Super Admin creado: ${saEmail}`);
    }
    // Ensure default plans exist
    const plans = await pool.query('SELECT COUNT(*) FROM plans');
    if (parseInt(plans.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
        ('Básico','basico','Ideal para pequeños negocios',29,290,'["Hasta 3 usuarios","Hasta 500 clientes"]'::jsonb,'{"max_users":3,"max_clients":500}'::jsonb,1),
        ('Profesional','profesional','Para empresas en crecimiento',79,790,'["Hasta 10 usuarios","Clientes ilimitados","Automatizaciones"]'::jsonb,'{"max_users":10,"max_clients":-1}'::jsonb,2),
        ('Empresarial','empresarial','Solución completa',199,1990,'["Usuarios ilimitados","Todas las funcionalidades","Soporte 24/7"]'::jsonb,'{"max_users":-1,"max_clients":-1}'::jsonb,3)
        ON CONFLICT (slug) DO NOTHING`);
      console.log('[Server] Planes iniciales creados');
    }
  } catch (err) {
    console.warn('[Server] Bootstrap super admin omitido:', err);
  }

  server = app.listen(PORT, () => {
    console.log(`[Server] ANTÜ CRM API corriendo en puerto ${PORT}`);
  });

  if (process.env.EMAIL_WORKER_ENABLED !== 'false') {
    emailWorker.start().catch((err: Error) => {
      console.error('[Server] Email worker falló al iniciar:', err.message);
    });
  }

  automationWorker.start();
}

async function shutdown(signal: string) {
  console.log(`[Server] ${signal} recibido. Cerrando limpiamente...`);

  emailWorker.stop();
  automationWorker.stop();

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server cerrado.');
      try {
        await pool.end();
        console.log('[Server] Pool de DB cerrado.');
      } catch (e) {
        console.error('[Server] Error cerrando pool DB:', e);
      }
      process.exit(0);
    });

    // Forzar salida si tarda más de 10s
    setTimeout(() => {
      console.error('[Server] Timeout de cierre. Forzando salida.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

startServer();

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[Server] uncaughtException — apagando:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] unhandledRejection:', reason);
  // No cerramos el server por promises rechazadas — solo logueamos
});

export default app;
