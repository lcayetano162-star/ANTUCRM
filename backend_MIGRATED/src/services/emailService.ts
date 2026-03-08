import nodemailer from 'nodemailer';
import { db } from '../config/database';

// ============================================================
// Servicio de Envío de Correos - AntuCRM
// Outbound Email Only (SMTP)
// ============================================================

export interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  bodyText: string;    // Texto plano (para guardar en BD y leer con IA)
  bodyHtml?: string;   // HTML opcional (para envío visual)
}

export interface SendEmailParams {
  emailData: EmailData;
  contactId: string;
  clientId?: string;
  userId: string;
  tenantId: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailRecord {
  id: string;
  contactId: string;
  clientId?: string;
  userId: string;
  tenantId: string;
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt: Date;
  createdAt: Date;
}

// Configuración SMTP desde variables de entorno
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Configuración del remitente por defecto
const DEFAULT_FROM = {
  email: process.env.FROM_EMAIL || 'noreply@antucrm.com',
  name: process.env.FROM_NAME || 'AntuCRM',
};

/**
 * Crea el transporte SMTP
 */
const createTransporter = () => {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error('Configuración SMTP incompleta. Verifique SMTP_USER y SMTP_PASS');
  }

  return nodemailer.createTransporter({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass,
    },
    tls: {
      rejectUnauthorized: false, // Útil para desarrollo, en producción revisar
    },
  });
};

/**
 * Convierte texto plano a HTML básico (para envío visual)
 * Mantiene saltos de línea y enlaces
 */
const textToHtml = (text: string): string => {
  // Escapar HTML para seguridad
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convertir saltos de línea a <br>
  const withBreaks = escaped.replace(/\n/g, '<br>');

  // Convertir URLs a enlaces
  const withLinks = withBreaks.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );

  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${withLinks}</div>`;
};

/**
 * Limpia el texto para almacenamiento (optimizado para IA)
 * - Elimina espacios extras
 * - Normaliza saltos de línea
 * - Mantiene solo texto relevante
 */
const cleanTextForStorage = (text: string): string => {
  return text
    .trim()
    .replace(/\r\n/g, '\n')  // Normalizar saltos de línea Windows
    .replace(/\r/g, '\n')    // Normalizar saltos de línea Mac
    .replace(/\n{3,}/g, '\n\n')  // Máximo 2 saltos de línea consecutivos
    .replace(/[ \t]+/g, ' ')  // Normalizar espacios
    .trim();
};

/**
 * Envía un correo electrónico y guarda el registro en la base de datos
 */
export const sendEmail = async (params: SendEmailParams): Promise<EmailRecord> => {
  const { emailData, contactId, clientId, userId, tenantId, fromEmail, fromName } = params;

  // Limpiar texto para almacenamiento
  const cleanBodyText = cleanTextForStorage(emailData.bodyText);

  // Generar HTML si no se proporcionó
  const bodyHtml = emailData.bodyHtml || textToHtml(cleanBodyText);

  let transporter;
  let emailResult;
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | undefined;

  try {
    // Crear transporte y enviar correo
    transporter = createTransporter();

    const mailOptions = {
      from: `"${fromName || DEFAULT_FROM.name}" <${fromEmail || DEFAULT_FROM.email}>`,
      to: `"${emailData.toName || ''}" <${emailData.to}>`,
      subject: emailData.subject,
      text: cleanBodyText,  // Versión texto plano
      html: bodyHtml,       // Versión HTML
    };

    emailResult = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Correo enviado:', emailResult.messageId);

  } catch (error: any) {
    console.error('[EmailService] Error al enviar correo:', error);
    status = 'failed';
    errorMessage = error.message || 'Error desconocido al enviar correo';
    // Continuamos para guardar el registro del intento fallido
  }

  // Guardar registro en la base de datos
  try {
    const query = `
      INSERT INTO contact_emails (
        contact_id, client_id, user_id, tenant_id,
        to_email, to_name, from_email, from_name,
        subject, body_text, body_html, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      contactId,
      clientId || null,
      userId,
      tenantId,
      emailData.to,
      emailData.toName || null,
      fromEmail || DEFAULT_FROM.email,
      fromName || DEFAULT_FROM.name,
      emailData.subject,
      cleanBodyText,  // Guardamos el texto limpio
      bodyHtml,
      status,
      errorMessage || null,
    ];

    const result = await db.query(query, values);
    const savedRecord = result.rows[0];

    return {
      id: savedRecord.id,
      contactId: savedRecord.contact_id,
      clientId: savedRecord.client_id,
      userId: savedRecord.user_id,
      tenantId: savedRecord.tenant_id,
      toEmail: savedRecord.to_email,
      toName: savedRecord.to_name,
      fromEmail: savedRecord.from_email,
      fromName: savedRecord.from_name,
      subject: savedRecord.subject,
      bodyText: savedRecord.body_text,
      bodyHtml: savedRecord.body_html,
      status: savedRecord.status,
      errorMessage: savedRecord.error_message,
      sentAt: savedRecord.sent_at,
      createdAt: savedRecord.created_at,
    };

  } catch (dbError: any) {
    console.error('[EmailService] Error al guardar en BD:', dbError);
    throw new Error(`Correo ${status === 'sent' ? 'enviado' : 'fallido'}, pero no se pudo guardar el registro: ${dbError.message}`);
  }
};

/**
 * Obtiene los correos enviados a un contacto específico
 */
export const getEmailsByContact = async (
  contactId: string,
  tenantId: string,
  limit: number = 50,
  offset: number = 0
): Promise<EmailRecord[]> => {
  const query = `
    SELECT ce.*, 
           u.first_name as sender_first_name, 
           u.last_name as sender_last_name
    FROM contact_emails ce
    LEFT JOIN users u ON ce.user_id = u.id
    WHERE ce.contact_id = $1 
      AND ce.tenant_id = $2
    ORDER BY ce.sent_at DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await db.query(query, [contactId, tenantId, limit, offset]);

  return result.rows.map((row: any) => ({
    id: row.id,
    contactId: row.contact_id,
    clientId: row.client_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    toEmail: row.to_email,
    toName: row.to_name,
    fromEmail: row.from_email,
    fromName: row.from_name,
    subject: row.subject,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    status: row.status,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }));
};

/**
 * Obtiene un correo específico por ID
 */
export const getEmailById = async (
  emailId: string,
  tenantId: string
): Promise<EmailRecord | null> => {
  const query = `
    SELECT ce.*, 
           u.first_name as sender_first_name, 
           u.last_name as sender_last_name
    FROM contact_emails ce
    LEFT JOIN users u ON ce.user_id = u.id
    WHERE ce.id = $1 AND ce.tenant_id = $2
  `;

  const result = await db.query(query, [emailId, tenantId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    contactId: row.contact_id,
    clientId: row.client_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    toEmail: row.to_email,
    toName: row.to_name,
    fromEmail: row.from_email,
    fromName: row.from_name,
    subject: row.subject,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    status: row.status,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
};

/**
 * Obtiene estadísticas de correos enviados por usuario
 */
export const getEmailStats = async (
  userId: string,
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  sent: number;
  failed: number;
}> => {
  let query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
    FROM contact_emails
    WHERE user_id = $1 AND tenant_id = $2
  `;

  const params: any[] = [userId, tenantId];

  if (startDate) {
    query += ` AND sent_at >= $${params.length + 1}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND sent_at <= $${params.length + 1}`;
    params.push(endDate);
  }

  const result = await db.query(query, params);

  return {
    total: parseInt(result.rows[0].total),
    sent: parseInt(result.rows[0].sent),
    failed: parseInt(result.rows[0].failed),
  };
};

/**
 * Verifica la configuración SMTP
 */
export const verifySmtpConfig = async (): Promise<{
  valid: boolean;
  message: string;
}> => {
  try {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      return {
        valid: false,
        message: 'Configuración SMTP incompleta. Faltan credenciales.',
      };
    }

    const transporter = createTransporter();
    await transporter.verify();

    return {
      valid: true,
      message: 'Configuración SMTP válida',
    };
  } catch (error: any) {
    return {
      valid: false,
      message: `Error de configuración SMTP: ${error.message}`,
    };
  }
};

export default {
  sendEmail,
  getEmailsByContact,
  getEmailById,
  getEmailStats,
  verifySmtpConfig,
};
