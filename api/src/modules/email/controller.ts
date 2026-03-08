// ============================================
// EMAIL CONTROLLER - Sistema bidireccional de emails
// ============================================

import { Request, Response } from 'express';
import { pool } from '../../shared/config/database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { OpenAIService } from '../ai/openai.service';

export class EmailController {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  // ============================================
  // CUENTAS DE EMAIL
  // ============================================

  async getAccounts(req: any, res: Response) {
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          id, smtp_from_name, smtp_from_email, smtp_host, smtp_port,
          imap_enabled, imap_host, imap_port,
          is_active, is_default, last_check_at, last_error, created_at
        FROM email_accounts
        WHERE tenant_id = $1 AND deleted_at IS NULL
        ORDER BY is_default DESC, created_at DESC
      `, [tenantId]);

      // No retornar passwords
      res.json(result.rows);
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ error: 'Error fetching email accounts' });
    }
  }

  async createAccount(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const {
      smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure,
      smtp_from_name, smtp_from_email,
      imap_host, imap_port, imap_user, imap_password, imap_secure, imap_enabled,
      is_default
    } = req.body;

    try {
      // Encriptar passwords
      const encryptedSmtpPassword = this.encrypt(smtp_password);
      const encryptedImapPassword = imap_password ? this.encrypt(imap_password) : null;

      // Si es default, quitar default de otras
      if (is_default) {
        await pool.query(`
          UPDATE email_accounts SET is_default = false WHERE tenant_id = $1
        `, [tenantId]);
      }

      const result = await pool.query(`
        INSERT INTO email_accounts (
          tenant_id, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure,
          smtp_from_name, smtp_from_email,
          imap_host, imap_port, imap_user, imap_password, imap_secure, imap_enabled,
          is_default, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, smtp_from_name, smtp_from_email, is_active, is_default, created_at
      `, [
        tenantId, smtp_host, smtp_port, smtp_user, encryptedSmtpPassword, smtp_secure,
        smtp_from_name, smtp_from_email,
        imap_host, imap_port, imap_user, encryptedImapPassword, imap_secure, imap_enabled,
        is_default || false, userId
      ]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ error: 'Error creating email account' });
    }
  }

  async testAccount(req: any, res: Response) {
    const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure } = req.body;

    try {
      const transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        secure: smtp_secure,
        auth: {
          user: smtp_user,
          pass: smtp_password
        }
      });

      await transporter.verify();
      res.json({ success: true, message: 'Conexión SMTP exitosa' });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: 'Error de conexión: ' + error.message 
      });
    }
  }

  // ============================================
  // CONVERSACIONES
  // ============================================

  async getConversations(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const { status = 'active', assigned_to, client_id, search, limit = 50, offset = 0 } = req.query;

    try {
      let query = `
        SELECT 
          ec.*,
          c.name as client_name,
          c.email as client_email,
          c.company as client_company,
          CONCAT(u.first_name, ' ', u.last_name) as assigned_name,
          (SELECT body_text FROM email_messages 
           WHERE conversation_id = ec.id 
           ORDER BY created_at DESC LIMIT 1) as last_message_preview
        FROM email_conversations ec
        LEFT JOIN clients c ON ec.client_id = c.id
        LEFT JOIN users u ON ec.assigned_to = u.id
        WHERE ec.tenant_id = $1
      `;

      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (status) {
        query += ` AND ec.status = $${paramIndex++}`;
        params.push(status);
      }

      if (assigned_to) {
        query += ` AND ec.assigned_to = $${paramIndex++}`;
        params.push(assigned_to);
      }

      if (client_id) {
        query += ` AND ec.client_id = $${paramIndex++}`;
        params.push(client_id);
      }

      if (search) {
        query += ` AND (
          ec.subject ILIKE $${paramIndex} OR
          c.name ILIKE $${paramIndex} OR
          c.email ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY ec.last_message_at DESC NULLS LAST LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Error fetching conversations' });
    }
  }

  async getConversation(req: any, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    try {
      // Obtener conversación
      const conversationResult = await pool.query(`
        SELECT ec.*, 
          c.name as client_name, c.email as client_email, c.phone as client_phone,
          CONCAT(u.first_name, ' ', u.last_name) as assigned_name
        FROM email_conversations ec
        LEFT JOIN clients c ON ec.client_id = c.id
        LEFT JOIN users u ON ec.assigned_to = u.id
        WHERE ec.id = $1 AND ec.tenant_id = $2
      `, [id, tenantId]);

      if (conversationResult.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Obtener mensajes
      const messagesResult = await pool.query(`
        SELECT 
          em.*,
          CONCAT(u.first_name, ' ', u.last_name) as sender_name
        FROM email_messages em
        LEFT JOIN users u ON em.created_by = u.id
        WHERE em.conversation_id = $1
        ORDER BY em.created_at ASC
      `, [id]);

      res.json({
        conversation: conversationResult.rows[0],
        messages: messagesResult.rows
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Error fetching conversation' });
    }
  }

  async closeConversation(req: any, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    try {
      await pool.query(`
        UPDATE email_conversations
        SET status = 'closed', updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]);

      res.json({ success: true });
    } catch (error) {
      console.error('Close conversation error:', error);
      res.status(500).json({ error: 'Error closing conversation' });
    }
  }

  // ============================================
  // ENVIAR EMAILS (Outbound)
  // ============================================

  async sendEmail(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const {
      to,
      cc,
      bcc,
      subject,
      body_text,
      body_html,
      client_id,
      contact_id,
      opportunity_id,
      conversation_id,
      reply_to_message_id,
      attachments,
      track_opens = true
    } = req.body;

    // Cliente de BD para transacción
    const dbClient = await pool.connect();
    
    try {
      // Iniciar transacción
      await dbClient.query('BEGIN');
      
      // Obtener cuenta de email
      const accountResult = await dbClient.query(`
        SELECT * FROM email_accounts
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY is_default DESC LIMIT 1
      `, [tenantId]);

      if (accountResult.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({ error: 'No email account configured' });
      }

      const account = accountResult.rows[0];

      // Crear transporter
      const transporter = nodemailer.createTransport({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_secure,
        auth: {
          user: account.smtp_user,
          pass: this.decrypt(account.smtp_password)
        }
      });

      // Generar Message-ID único
      const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${account.smtp_host}>`;

      // Construir email
      const mailOptions: any = {
        from: `"${account.smtp_from_name}" <${account.smtp_from_email}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text: body_text,
        html: body_html || body_text,
        messageId,
        headers: {
          'X-AntuCRM-Tenant': tenantId,
          'X-AntuCRM-User': userId
        }
      };

      if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
      if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;

      // Si es reply, mantener thread
      let finalConversationId = conversation_id;
      let threadId: string | null = null;

      if (reply_to_message_id) {
        const parentResult = await dbClient.query(`
          SELECT conversation_id, thread_id, message_id
          FROM email_messages WHERE id = $1
        `, [reply_to_message_id]);

        if (parentResult.rows.length > 0) {
          finalConversationId = parentResult.rows[0].conversation_id;
          threadId = parentResult.rows[0].thread_id;
          mailOptions.inReplyTo = parentResult.rows[0].message_id;
          mailOptions.references = parentResult.rows[0].message_id;
        }
      }

      // Crear o usar conversación existente
      if (!finalConversationId) {
        const convResult = await dbClient.query(`
          INSERT INTO email_conversations (
            tenant_id, client_id, contact_id, opportunity_id, subject, thread_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, thread_id
        `, [tenantId, client_id, contact_id, opportunity_id, subject, threadId || messageId]);

        finalConversationId = convResult.rows[0].id;
        threadId = convResult.rows[0].thread_id;
      }

      // Agregar tracking pixel si está habilitado
      if (track_opens && body_html) {
        const trackingPixel = `<img src="${process.env.API_URL}/api/email/track/${messageId.replace(/[<>]/g, '')}" width="1" height="1" />`;
        mailOptions.html = body_html + trackingPixel;
      }

      // Guardar en BD primero (con estado 'sending')
      const messageResult = await dbClient.query(`
        INSERT INTO email_messages (
          tenant_id, conversation_id, from_email, from_name, to_emails, cc_emails, bcc_emails,
          subject, body_text, body_html, message_id, in_reply_to, references_ids,
          direction, status, tracking_enabled, has_attachments, attachments,
          created_by, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        RETURNING *
      `, [
        tenantId, finalConversationId, account.smtp_from_email, account.smtp_from_name,
        JSON.stringify(Array.isArray(to) ? to : [to]),
        JSON.stringify(cc ? (Array.isArray(cc) ? cc : [cc]) : []),
        JSON.stringify(bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : []),
        subject, body_text, mailOptions.html, messageId,
        reply_to_message_id || null,
        JSON.stringify(threadId ? [threadId] : []),
        'outbound', 'sending', track_opens,
        !!(attachments && attachments.length > 0),
        JSON.stringify(attachments || []),
        userId
      ]);

      // Actualizar cliente (último contacto)
      if (client_id) {
        await dbClient.query(`
          UPDATE clients SET last_contact_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [client_id]);
      }

      // Commit de la transacción de BD antes de enviar email
      await dbClient.query('COMMIT');

      // Enviar email (operación externa, no se puede revertir)
      try {
        const info = await transporter.sendMail(mailOptions);
        
        // Actualizar estado a 'sent'
        await pool.query(`
          UPDATE email_messages 
          SET status = 'sent', updated_at = NOW()
          WHERE id = $1
        `, [messageResult.rows[0].id]);

        res.status(201).json({
          success: true,
          message: messageResult.rows[0],
          conversation_id: finalConversationId
        });
        
      } catch (smtpError: any) {
        // Marcar como failed si el envío SMTP falla
        await pool.query(`
          UPDATE email_messages 
          SET status = 'failed', error_message = $1, updated_at = NOW()
          WHERE id = $2
        `, [smtpError.message, messageResult.rows[0].id]);

        res.status(502).json({
          success: false,
          error: 'SMTP Error: ' + smtpError.message,
          conversation_id: finalConversationId
        });
      }

    } catch (error: any) {
      // Rollback en caso de error de BD
      await dbClient.query('ROLLBACK');
      console.error('Send email error:', error);
      res.status(500).json({ error: 'Error sending email: ' + error.message });
    } finally {
      // Liberar cliente
      dbClient.release();
    }
  }

  // ============================================
  // RECIBIR EMAILS (Inbound) - Webhook
  // ============================================

  async receiveInboundEmail(req: any, res: Response) {
    const { to, from, subject, text, html, headers, attachments } = req.body;
    
    try {
      // Validar que 'to' sea un string válido
      if (!to || typeof to !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing "to" field' });
      }
      
      // Extraer tenant de la dirección (ej: reply+tenant123@antu-crm.com)
      // Usar regex seguro con validación
      const tenantMatch = to.match(/^[^+]*\+([a-zA-Z0-9_-]+)@/);
      if (!tenantMatch || !tenantMatch[1]) {
        return res.status(400).json({ 
          error: 'Invalid tenant identifier in email address',
          format: 'Expected: reply+TENANT_ID@antu-crm.com'
        });
      }

      const tenantId = tenantMatch[1];
      
      // Validar formato de tenantId (UUID o slug alfanumérico)
      const validTenantPattern = /^[a-zA-Z0-9_-]{1,64}$/;
      if (!validTenantPattern.test(tenantId)) {
        return res.status(400).json({ 
          error: 'Invalid tenant identifier format',
          code: 'INVALID_TENANT_FORMAT'
        });
      }

      // Buscar cliente por email del remitente
      const clientResult = await pool.query(`
        SELECT id, assigned_to FROM clients WHERE tenant_id = $1 AND email = $2
      `, [tenantId, from]);

      const clientId = clientResult.rows[0]?.id;
      const assignedTo = clientResult.rows[0]?.assigned_to;

      // Buscar conversación existente por thread o crear nueva
      const threadId = headers?.['message-id'] || headers?.['in-reply-to'];
      let conversationId: string;

      if (threadId) {
        const convResult = await pool.query(`
          SELECT id FROM email_conversations
          WHERE tenant_id = $1 AND (thread_id = $2 OR message_id = $2)
        `, [tenantId, threadId]);

        if (convResult.rows.length > 0) {
          conversationId = convResult.rows[0].id;
        } else {
          // Crear nueva conversación
          const newConv = await pool.query(`
            INSERT INTO email_conversations (
              tenant_id, client_id, subject, thread_id, assigned_to, status, unread_count
            ) VALUES ($1, $2, $3, $4, $5, 'active', 1)
            RETURNING id
          `, [tenantId, clientId, subject, threadId, assignedTo]);
          conversationId = newConv.rows[0].id;
        }
      } else {
        // Crear nueva conversación
        const newConv = await pool.query(`
          INSERT INTO email_conversations (
            tenant_id, client_id, subject, thread_id, assigned_to, status, unread_count
          ) VALUES ($1, $2, $3, $4, $5, 'active', 1)
          RETURNING id
        `, [tenantId, clientId, subject, headers?.['message-id'], assignedTo]);
        conversationId = newConv.rows[0].id;
      }

      // Guardar mensaje
      const messageResult = await pool.query(`
        INSERT INTO email_messages (
          tenant_id, conversation_id, from_email, from_name, to_emails,
          subject, body_text, body_html, message_id, in_reply_to,
          direction, status, is_read, headers, has_attachments, attachments, source_ip
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        tenantId, conversationId, from, from,
        JSON.stringify([to]), subject, text, html,
        headers?.['message-id'], headers?.['in-reply-to'],
        'inbound', 'delivered', false,
        JSON.stringify(headers), !!(attachments && attachments.length > 0),
        JSON.stringify(attachments || []), req.ip
      ]);

      const messageId = messageResult.rows[0].id;

      // Procesar con IA (async)
      this.processWithAI(messageId, tenantId, subject, text, clientId);

      res.status(201).json({ success: true, message_id: messageId });

    } catch (error) {
      console.error('Receive inbound email error:', error);
      res.status(500).json({ error: 'Error processing email' });
    }
  }

  // ============================================
  // PROCESAMIENTO CON IA
  // ============================================

  private async processWithAI(messageId: string, tenantId: string, subject: string, body: string, clientId?: string) {
    try {
      // Análisis de sentimiento, intención, entidades
      const analysis = await this.openAIService.analyzeEmailContent(subject, body);

      // Actualizar mensaje con análisis
      await pool.query(`
        UPDATE email_messages
        SET ai_analysis = $1, ai_entities = $2, ai_processed_at = NOW()
        WHERE id = $3
      `, [JSON.stringify(analysis.sentiment), JSON.stringify(analysis.entities), messageId]);

      // Actualizar conversación con resumen
      await pool.query(`
        UPDATE email_conversations
        SET 
          ai_summary = $1,
          ai_sentiment = $2,
          ai_intent = $3,
          ai_priority_score = $4,
          ai_action_items = $5,
          ai_analyzed_at = NOW()
        WHERE id = (SELECT conversation_id FROM email_messages WHERE id = $6)
      `, [
        analysis.summary,
        analysis.sentiment?.label,
        analysis.intent,
        analysis.priorityScore,
        JSON.stringify(analysis.actionItems),
        messageId
      ]);

      // Si detecta oportunidad, crear sugerencia
      if (analysis.detectedOpportunity && clientId) {
        await pool.query(`
          INSERT INTO ai_suggestions (
            tenant_id, type, title, description, source_type, source_id, metadata
          ) VALUES ($1, 'opportunity', $2, $3, 'email', $4, $5)
        `, [
          tenantId,
          'Oportunidad detectada en email',
          analysis.summary,
          messageId,
          JSON.stringify({ value: analysis.detectedValue, client_id: clientId })
        ]);
      }

    } catch (error) {
      console.error('AI processing error:', error);
    }
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const { category } = req.query;

    try {
      let query = `
        SELECT id, name, subject, category, tags, is_active, created_at
        FROM email_templates
        WHERE tenant_id = $1 AND is_active = true
      `;
      const params: any[] = [tenantId];

      if (category) {
        query += ` AND category = $2`;
        params.push(category);
      }

      query += ` ORDER BY name ASC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Error fetching templates' });
    }
  }

  async createTemplate(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const { name, subject, body_text, body_html, category, tags } = req.body;

    try {
      const result = await pool.query(`
        INSERT INTO email_templates (
          tenant_id, name, subject, body_text, body_html, category, tags, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, subject, category, created_at
      `, [tenantId, name, subject, body_text, body_html, category, JSON.stringify(tags || []), userId]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Error creating template' });
    }
  }

  // ============================================
  // TRACKING
  // ============================================

  async trackOpen(req: any, res: Response) {
    const { messageId } = req.params;
    
    try {
      await pool.query(`
        UPDATE email_messages
        SET 
          opened_at = COALESCE(opened_at, NOW()),
          open_count = open_count + 1
        WHERE message_id LIKE $1
      `, [`%${messageId}%`]);

      // Retornar pixel transparente
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (error) {
      res.status(200).end();
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  private getEncryptionKey(): Buffer {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    
    if (!ENCRYPTION_KEY) {
      throw new Error('SECURITY_ERROR: ENCRYPTION_KEY environment variable is required. Set a 32-character key.');
    }
    
    if (ENCRYPTION_KEY.length !== 32) {
      throw new Error(`SECURITY_ERROR: ENCRYPTION_KEY must be exactly 32 characters. Current length: ${ENCRYPTION_KEY.length}`);
    }
    
    return Buffer.from(ENCRYPTION_KEY, 'utf8');
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = this.getEncryptionKey();
    const [ivHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export default EmailController;
