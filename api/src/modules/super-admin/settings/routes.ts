import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { query } from '../../../shared/config/database';
import { authenticateToken, requireSuperAdmin } from '../../../shared/middleware/auth';

// ================================================
// ENCRYPTION UTILITIES
// ================================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('[FATAL] ENCRYPTION_KEY debe ser exactamente 32 caracteres');
  process.exit(1);
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY!), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const router = Router();

const DEFAULT_SMTP = {
  host: 'smtp.gmail.com',
  port: 587,
  username: '',
  password: '',
  from_email: 'noreply@antucrm.com',
  from_name: 'Antü CRM',
  encryption: 'tls',
  enabled: false
};

async function ensureSettingsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key        VARCHAR(100) PRIMARY KEY,
      value      JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// GET /api/super-admin/settings/smtp
router.get('/smtp', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await ensureSettingsTable();
    const result = await query('SELECT value FROM system_settings WHERE key = $1', ['smtp']);
    const settings = result.rows.length > 0 ? result.rows[0].value : DEFAULT_SMTP;
    // Never expose the password back to the frontend
    res.json({ ...settings, password: settings.password ? '••••••••' : '', password_set: !!settings.password });
  } catch (error) {
    console.error('[Settings] Error obteniendo SMTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/super-admin/settings/smtp
router.put('/smtp', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await ensureSettingsTable();
    const { host, port, username, password, from_email, from_name, encryption, enabled } = req.body;

    if (!host || !from_email) {
      return res.status(400).json({ error: 'host y from_email son requeridos' });
    }

    // Fetch existing to preserve password if not provided
    const existing = await query('SELECT value FROM system_settings WHERE key = $1', ['smtp']);
    const current = existing.rows.length > 0 ? existing.rows[0].value : DEFAULT_SMTP;

    // Encrypt password before saving
    let encryptedPassword = current.password;
    if (password && password !== '••••••••') {
      encryptedPassword = encrypt(password);
    }
    
    const newValue = {
      host: host || current.host,
      port: parseInt(port) || current.port || 587,
      username: username ?? current.username,
      // Store encrypted password
      password: encryptedPassword,
      from_email: from_email || current.from_email,
      from_name: from_name || current.from_name,
      encryption: encryption || current.encryption || 'tls',
      enabled: enabled !== undefined ? enabled : current.enabled
    };

    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      ['smtp', JSON.stringify(newValue)]
    );

    res.json({ message: 'Configuración SMTP guardada correctamente', password_set: !!newValue.password });
  } catch (error) {
    console.error('[Settings] Error guardando SMTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/super-admin/settings/smtp/test
router.post('/smtp/test', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await ensureSettingsTable();

    // Use provided values or fall back to saved config
    const result = await query('SELECT value FROM system_settings WHERE key = $1', ['smtp']);
    const saved = result.rows.length > 0 ? result.rows[0].value : DEFAULT_SMTP;

    const { host, port, username, password, from_email, from_name, encryption } = req.body;

    const smtpHost = host || saved.host;
    const smtpPort = parseInt(port) || saved.port || 587;
    const smtpUser = username ?? saved.username;
    // Decrypt password for use
    let smtpPass = '';
    if (password && password !== '••••••••') {
      smtpPass = password; // New password being tested
    } else if (saved.password) {
      try {
        smtpPass = decrypt(saved.password);
      } catch (e) {
        console.error('[SMTP] Error decrypting password:', e);
        return res.status(500).json({ error: 'Error al recuperar contraseña SMTP' });
      }
    }
    const smtpFrom = from_email || saved.from_email;
    const smtpFromName = from_name || saved.from_name || smtpFrom;
    const smtpEncryption = encryption || saved.encryption || 'tls';

    if (!smtpHost) {
      return res.status(400).json({ error: 'Configura el servidor SMTP antes de probar la conexión' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpEncryption === 'ssl',
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();

    // Send a test email to the configured from address
    await transporter.sendMail({
      from: `${smtpFromName} <${smtpFrom}>`,
      to: smtpFrom,
      subject: 'Prueba de conexión SMTP - Antü CRM',
      html: `<p>La configuración SMTP de <strong>Antü CRM</strong> está funcionando correctamente.</p>
             <p>Este es un correo de prueba enviado desde el Super Admin.</p>`
    });

    res.json({ message: 'Conexión SMTP exitosa. Se envió un correo de prueba a ' + smtpFrom });
  } catch (error: any) {
    console.error('[Settings] Error probando SMTP:', error);
    res.status(400).json({ error: 'Error de conexión SMTP: ' + (error.message || 'Verifica los datos ingresados') });
  }
});

export default router;
