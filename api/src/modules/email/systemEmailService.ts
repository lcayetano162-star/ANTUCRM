import nodemailer from 'nodemailer';
import { query } from '../../shared/config/database';

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  encryption: string;
  enabled: boolean;
}

async function getSystemSmtp(): Promise<SmtpConfig | null> {
  const result = await query(
    "SELECT value FROM system_settings WHERE key = 'smtp'",
    []
  );
  if (result.rows.length === 0) return null;
  const cfg: SmtpConfig = result.rows[0].value;
  if (!cfg.enabled || !cfg.host || !cfg.password) return null;
  return cfg;
}

async function sendSystemEmail(to: string, subject: string, html: string): Promise<void> {
  const cfg = await getSystemSmtp();
  if (!cfg) {
    console.warn('[SystemEmail] SMTP del sistema no configurado o deshabilitado. Email no enviado.');
    return;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port || 587,
    secure: cfg.encryption === 'ssl',
    auth: { user: cfg.username, pass: cfg.password },
  });
  await transporter.sendMail({
    from: `${cfg.from_name || 'Antü CRM'} <${cfg.from_email}>`,
    to,
    subject,
    html,
  });
  console.log('[SystemEmail] Email transaccional enviado correctamente.');
}

// ── Templates ─────────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Antü CRM</title>
<style>
  body { margin:0; padding:0; background:#f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width:600px; margin:32px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#6d28d9,#4f46e5); padding:32px 40px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:22px; letter-spacing:-0.5px; }
  .header p { color:rgba(255,255,255,0.75); margin:6px 0 0; font-size:13px; }
  .body { padding:36px 40px; color:#374151; font-size:15px; line-height:1.6; }
  .body h2 { font-size:18px; color:#111827; margin-top:0; }
  .btn { display:inline-block; background:#6d28d9; color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:600; font-size:15px; margin:20px 0; }
  .info-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px 20px; margin:16px 0; font-size:14px; }
  .info-box strong { color:#111827; }
  .footer { background:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; text-align:center; color:#9ca3af; font-size:12px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🦅 Antü CRM</h1>
    <p>Customer Relationship Management</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Antü CRM. Todos los derechos reservados.</p>
    <p>Este es un mensaje automático, por favor no responda a este correo.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Forgot password ───────────────────────────────────────────────────────────
export async function sendForgotPasswordEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const html = baseTemplate(`
    <h2>Restablecer contraseña</h2>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Antü CRM.</p>
    <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en <strong>1 hora</strong>.</p>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">Restablecer Contraseña</a>
    </div>
    <p style="font-size:13px;color:#6b7280">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanecerá sin cambios.</p>
    <p style="font-size:12px;color:#9ca3af;word-break:break-all;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${resetUrl}</p>
  `);
  await sendSystemEmail(to, 'Restablecer contraseña — Antü CRM', html);
}

// ── Welcome tenant owner ──────────────────────────────────────────────────────
export async function sendWelcomeTenantEmail(
  to: string,
  ownerName: string,
  tenantName: string,
  loginUrl: string,
  tempPassword: string
): Promise<void> {
  const html = baseTemplate(`
    <h2>¡Bienvenido a Antü CRM! 🎉</h2>
    <p>Hola <strong>${ownerName}</strong>,</p>
    <p>Tu empresa <strong>${tenantName}</strong> ha sido registrada exitosamente en Antü CRM.</p>
    <p>Aquí están tus credenciales de acceso:</p>
    <div class="info-box">
      <p><strong>Email:</strong> ${to}</p>
      <p style="margin:0"><strong>Contraseña temporal:</strong> ${tempPassword}</p>
    </div>
    <p style="color:#dc2626;font-size:13px;"><strong>⚠️ Por seguridad, cambia tu contraseña al iniciar sesión por primera vez.</strong></p>
    <div style="text-align:center">
      <a href="${loginUrl}" class="btn">Iniciar Sesión</a>
    </div>
    <p style="font-size:13px;color:#6b7280">Si tienes preguntas, contacta a nuestro equipo de soporte.</p>
  `);
  await sendSystemEmail(to, `Bienvenido a Antü CRM — ${tenantName}`, html);
}

// ── Welcome new user (invite) ─────────────────────────────────────────────────
export async function sendWelcomeUserEmail(
  to: string,
  userName: string,
  tenantName: string,
  loginUrl: string,
  tempPassword: string,
  role: string
): Promise<void> {
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    sales_rep: 'Representante de Ventas',
    manager: 'Gerente',
    viewer: 'Solo lectura',
  };
  const roleLabel = roleLabels[role] || role;
  const html = baseTemplate(`
    <h2>Acceso a Antü CRM</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Se ha creado una cuenta para ti en <strong>${tenantName}</strong> en Antü CRM con el rol de <strong>${roleLabel}</strong>.</p>
    <p>Tus credenciales de acceso:</p>
    <div class="info-box">
      <p><strong>Email:</strong> ${to}</p>
      <p style="margin:0"><strong>Contraseña temporal:</strong> ${tempPassword}</p>
    </div>
    <p style="color:#dc2626;font-size:13px;"><strong>⚠️ Cambia tu contraseña al iniciar sesión por primera vez en Configuración → Seguridad.</strong></p>
    <div style="text-align:center">
      <a href="${loginUrl}" class="btn">Acceder a Antü CRM</a>
    </div>
  `);
  await sendSystemEmail(to, `Acceso a Antü CRM — ${tenantName}`, html);
}
