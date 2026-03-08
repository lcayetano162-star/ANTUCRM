import { db } from '../../../shared/config/database';
import nodemailer from 'nodemailer';

export interface SendEmailDTO {
  to: string;
  subject: string;
  body: string;
  contactId?: string;
  tenantId: string;
  fromName?: string;
  fromEmail?: string;
}

function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function cleanTextForStorage(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

export class EmailService {
  async sendEmail(data: SendEmailDTO): Promise<any> {
    const settingsResult = await db.query(
      'SELECT * FROM tenant_email_settings WHERE tenant_id = $1',
      [data.tenantId]
    );
    if (settingsResult.rows.length === 0) {
      throw new Error('No hay configuracion SMTP para este tenant');
    }

    const settings = settingsResult.rows[0];
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure,
      auth: { user: settings.smtp_user, pass: settings.smtp_password }
    });

    const htmlBody = data.body.includes('<') ? data.body : textToHtml(data.body);
    const fromAddress = data.fromEmail || settings.from_email;
    const fromName = data.fromName || settings.from_name || fromAddress;

    await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: data.to,
      subject: data.subject,
      html: htmlBody,
      text: cleanTextForStorage(data.body)
    });

    if (data.contactId) {
      const saved = await db.query(
        'INSERT INTO contact_emails (contact_id, tenant_id, to_email, from_email, subject, body_text, body_html, sent_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
        [data.contactId, data.tenantId, data.to, fromAddress, data.subject, cleanTextForStorage(data.body), htmlBody]
      );
      return saved.rows[0];
    }

    return { sent: true, to: data.to };
  }

  async getEmailsByContact(contactId: string, tenantId: string): Promise<any[]> {
    const result = await db.query(
      'SELECT * FROM contact_emails WHERE contact_id = $1 AND tenant_id = $2 ORDER BY sent_at DESC',
      [contactId, tenantId]
    );
    return result.rows;
  }

  async getEmailById(id: string, tenantId: string): Promise<any> {
    const result = await db.query('SELECT * FROM contact_emails WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return result.rows[0] || null;
  }

  async getEmailStats(tenantId: string): Promise<any> {
    const result = await db.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN sent_at >= NOW() - INTERVAL \'30 days\' THEN 1 END) as last_30_days FROM contact_emails WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0];
  }

  async verifySmtpConfig(tenantId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const settingsResult = await db.query('SELECT * FROM tenant_email_settings WHERE tenant_id = $1', [tenantId]);
      if (settingsResult.rows.length === 0) return { ok: false, error: 'Sin configuracion SMTP' };
      const settings = settingsResult.rows[0];
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: { user: settings.smtp_user, pass: settings.smtp_password }
      });
      await transporter.verify();
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const emailService = new EmailService();
