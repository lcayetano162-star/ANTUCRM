// ============================================
// WHATSAPP BUSINESS API SERVICE
// Enterprise-grade messaging service
// ============================================

import axios, { AxiosError, AxiosInstance } from 'axios';
import crypto from 'crypto';
import { query } from '../../shared/config/database';
import { logSystem } from '../../shared/utils/logger';

// ============================================
// CONFIGURACIÓN Y TYPES
// ============================================

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsAppConfig {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  businessAccountId?: string;
  accessToken: string;
  appSecret?: string;
  isActive: boolean;
}

interface SendMessageOptions {
  tenantId: string;
  phoneNumber: string;
  message: string;
  contactId?: string;
  clientId?: string;
  opportunityId?: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  mediaUrl?: string;
  priority?: number; // 1-10
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          wa_id: string;
          profile: { name: string };
        }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; caption?: string };
          document?: { id: string; filename: string };
          context?: { id: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            category: string;
            expiration_timestamp: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ============================================
// ERROR CLASSES
// ============================================

class WhatsAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

class RateLimitError extends WhatsAppError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, 'RATE_LIMIT', true);
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export class WhatsAppService {
  private clients: Map<string, AxiosInstance> = new Map();
  
  // ============================================
  // CONFIGURACIÓN
  // ============================================
  
  async getConfig(tenantId: string): Promise<WhatsAppConfig | null> {
    const result = await query(
      `SELECT id, tenant_id, phone_number_id, business_account_id, 
              access_token, app_secret, is_active
       FROM whatsapp_config 
       WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );
    
    if (result.rows.length === 0) return null;
    
    return {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      phoneNumberId: result.rows[0].phone_number_id,
      businessAccountId: result.rows[0].business_account_id,
      accessToken: result.rows[0].access_token,
      appSecret: result.rows[0].app_secret,
      isActive: result.rows[0].is_active,
    };
  }
  
  private getClient(config: WhatsAppConfig): AxiosInstance {
    if (!this.clients.has(config.tenantId)) {
      const client = axios.create({
        baseURL: WHATSAPP_API_BASE,
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      this.clients.set(config.tenantId, client);
    }
    
    return this.clients.get(config.tenantId)!;
  }
  
  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================
  
  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string; waMessageId: string }> {
    const { tenantId, phoneNumber, message, templateName, templateParams } = options;
    
    // 1. Obtener configuración
    const config = await this.getConfig(tenantId);
    if (!config) {
      throw new WhatsAppError('WhatsApp not configured for this tenant', 'NOT_CONFIGURED', false);
    }
    
    // 2. Verificar rate limits
    await this.checkRateLimit(tenantId);
    
    // 3. Validar número
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new WhatsAppError('Invalid phone number', 'INVALID_PHONE', false);
    }
    
    // 4. Crear registro en BD (antes de enviar)
    const messageRecord = await query(
      `INSERT INTO whatsapp_messages (
        tenant_id, contact_id, client_id, opportunity_id,
        phone_number, direction, message_type, content,
        status, retry_count, max_retries
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        tenantId,
        options.contactId || null,
        options.clientId || null,
        options.opportunityId || null,
        formattedPhone,
        'outbound',
        templateName ? 'template' : 'text',
        message,
        'pending',
        0,
        3,
      ]
    );
    
    const dbMessageId = messageRecord.rows[0].id;
    
    try {
      // 5. Enviar a WhatsApp API
      const client = this.getClient(config);
      
      let payload: any;
      
      if (templateName) {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es' },
            components: this.buildTemplateComponents(templateParams),
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message, preview_url: true },
        };
      }
      
      const response = await client.post(
        `/${config.phoneNumberId}/messages`,
        payload
      );
      
      const waMessageId = response.data.messages?.[0]?.id;
      
      // 6. Actualizar con éxito
      await query(
        `UPDATE whatsapp_messages 
         SET wa_message_id = $1, status = 'sent', sent_at = NOW(), status_updated_at = NOW()
         WHERE id = $2`,
        [waMessageId, dbMessageId]
      );
      
      // 7. Incrementar rate limit
      await this.incrementRateLimit(tenantId);
      
      // 8. Crear actividad
      await this.createActivityFromMessage(tenantId, dbMessageId, 'outbound');
      
      return { messageId: dbMessageId, waMessageId };
      
    } catch (error: any) {
      const whatsappError = this.parseWhatsAppError(error);
      
      await query(
        `UPDATE whatsapp_messages 
         SET status = 'failed', failed_at = NOW(), error_code = $1, error_message = $2, retry_count = retry_count + 1
         WHERE id = $3`,
        [whatsappError.code, whatsappError.message, dbMessageId]
      );
      
      if (whatsappError.isRetryable) {
        await this.queueForRetry(dbMessageId, whatsappError instanceof RateLimitError ? whatsappError.retryAfter : 60);
      }
      
      throw whatsappError;
    }
  }
  
  // ============================================
  // WEBHOOK HANDLING
  // ============================================
  
  async processWebhook(payload: WhatsAppWebhookPayload, signature: string, appSecret: string): Promise<void> {
    const isValid = this.verifyWebhookSignature(payload, signature, appSecret);
    
    await query(
      `INSERT INTO whatsapp_webhook_logs (payload, signature, is_signature_valid)
       VALUES ($1, $2, $3)`,
      [JSON.stringify(payload), signature, isValid]
    );
    
    if (!isValid) {
      throw new WhatsAppError('Invalid signature', 'INVALID_SIGNATURE', false);
    }
    
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await this.processInboundMessage(change.value, message);
          }
        }
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await this.processStatusUpdate(status);
          }
        }
      }
    }
  }
  
  private async processInboundMessage(value: any, message: any): Promise<void> {
    const phoneNumberId = value.metadata.phone_number_id;
    const from = message.from;
    const name = value.contacts?.[0]?.profile?.name || 'Unknown';
    
    const configResult = await query(
      'SELECT tenant_id FROM whatsapp_config WHERE phone_number_id = $1',
      [phoneNumberId]
    );
    
    if (configResult.rows.length === 0) return;
    const tenantId = configResult.rows[0].tenant_id;
    
    // Buscar o crear contacto
    const contactResult = await query(
      `SELECT id FROM contacts WHERE tenant_id = $1 AND phone = $2 LIMIT 1`,
      [tenantId, from]
    );
    
    let contactId = contactResult.rows[0]?.id;
    if (!contactId) {
      const newContact = await query(
        `INSERT INTO contacts (tenant_id, first_name, phone, source, created_at)
         VALUES ($1, $2, $3, 'whatsapp', NOW()) RETURNING id`,
        [tenantId, name, from]
      );
      contactId = newContact.rows[0].id;
    }
    
    let content = '';
    let messageType = message.type;
    
    if (message.text) content = message.text.body;
    else if (message.image) content = message.image.caption || 'Image received';
    else if (message.document) content = `Document: ${message.document.filename}`;
    
    const result = await query(
      `INSERT INTO whatsapp_messages (
        tenant_id, contact_id, wa_message_id, phone_number,
        direction, message_type, content, status, sender_name, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10))
      RETURNING id`,
      [
        tenantId, contactId, message.id, from, 'inbound',
        messageType, content, 'delivered', name, parseInt(message.timestamp)
      ]
    );
    
    await this.createActivityFromMessage(tenantId, result.rows[0].id, 'inbound');
  }
  
  private async processStatusUpdate(status: any): Promise<void> {
    await query(
      `UPDATE whatsapp_messages 
       SET status = $1, status_updated_at = NOW(),
           ${status.status === 'delivered' ? 'delivered_at = NOW(),' : ''}
           ${status.status === 'read' ? 'read_at = NOW(),' : ''}
           ${status.status === 'failed' ? 'failed_at = NOW(), error_code = $5, error_message = $6,' : ''}
           conversation_id = $2, conversation_category = $3, conversation_expiration = $4
       WHERE wa_message_id = $7`,
      [
        status.status,
        status.conversation?.id,
        status.conversation?.category,
        status.conversation?.expiration_timestamp ? new Date(parseInt(status.conversation.expiration_timestamp) * 1000) : null,
        status.errors?.[0]?.code,
        status.errors?.[0]?.message,
        status.id,
      ]
    );
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private formatPhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return null;
    return cleaned;
  }
  
  private async checkRateLimit(tenantId: string): Promise<void> {
    const result = await query(
      `SELECT messages_sent_today, messages_sent_date FROM whatsapp_config WHERE tenant_id = $1`,
      [tenantId]
    );
    
    if (result.rows.length === 0) return;
    const { messages_sent_today, messages_sent_date } = result.rows[0];
    
    const today = new Date().toISOString().split('T')[0];
    if (messages_sent_date !== today) {
      await query(
        `UPDATE whatsapp_config SET messages_sent_today = 0, messages_sent_date = $1 WHERE tenant_id = $2`,
        [today, tenantId]
      );
      return;
    }
    
    if (messages_sent_today >= 1000) {
      throw new RateLimitError(3600);
    }
  }
  
  private async incrementRateLimit(tenantId: string): Promise<void> {
    await query(
      `UPDATE whatsapp_config SET messages_sent_today = messages_sent_today + 1 WHERE tenant_id = $1`,
      [tenantId]
    );
  }
  
  private async queueForRetry(messageId: string, delaySeconds: number): Promise<void> {
    const scheduledFor = new Date(Date.now() + delaySeconds * 1000);
    await query(
      `INSERT INTO whatsapp_message_queue (message_id, scheduled_for, status) VALUES ($1, $2, 'queued')`,
      [messageId, scheduledFor]
    );
  }
  
  private parseWhatsAppError(error: AxiosError): WhatsAppError {
    const response = error.response?.data as any;
    const errorCode = response?.error?.code || error.code || 'UNKNOWN';
    const errorMessage = response?.error?.message || error.message || 'Unknown error';
    
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'RATE_LIMIT', 80007];
    const isRetryable = retryableCodes.some(code => errorCode.toString().includes(code.toString()));
    
    if (errorCode === 'RATE_LIMIT' || error.response?.status === 429) {
      const retryAfter = parseInt(error.response?.headers['retry-after'] || '60');
      return new RateLimitError(retryAfter);
    }
    
    return new WhatsAppError(errorMessage, errorCode, isRetryable, error);
  }
  
  private verifyWebhookSignature(payload: any, signature: string, appSecret: string): boolean {
    if (!signature || !appSecret) return false;
    const body = JSON.stringify(payload);
    const expectedSignature = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
    
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
  
  private buildTemplateComponents(params?: Record<string, any>): any[] {
    if (!params) return [];
    return [{
      type: 'body',
      parameters: Object.entries(params).map(([key, value]) => ({
        type: 'text', text: String(value),
      })),
    }];
  }
  
  private async createActivityFromMessage(tenantId: string, messageId: string, direction: string): Promise<void> {
    const msgResult = await query(
      `SELECT contact_id, client_id, opportunity_id, content FROM whatsapp_messages WHERE id = $1`,
      [messageId]
    );
    
    if (msgResult.rows.length === 0) return;
    const msg = msgResult.rows[0];
    
    await query(
      `INSERT INTO activities (tenant_id, contact_id, client_id, opportunity_id, type, subject, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        tenantId, msg.contact_id, msg.client_id, msg.opportunity_id, 'whatsapp',
        direction === 'inbound' ? 'Mensaje de WhatsApp recibido' : 'Mensaje de WhatsApp enviado',
        msg.content, 'completed'
      ]
    );
  }
}

export const whatsAppService = new WhatsAppService();
