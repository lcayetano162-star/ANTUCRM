/**
 * Webhook Handlers - Resend & WhatsApp
 * 
 * Integración con el Timeline Unificado
 * Cada mensaje recibido o enviado se loguea automáticamente
 */

import { Request, Response } from 'express';
import { interactionService } from './interactionService';
import { query } from '../../shared/config/database';
import crypto from 'crypto';

// ─── RESEND WEBHOOK ──────────────────────────────────────────────────────────

/**
 * POST /webhooks/resend
 * Recibe eventos de Resend: sent, delivered, opened, clicked, bounced, complaint
 */
export async function handleResendWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verificar firma (si configuras webhook secret en Resend)
    // const signature = req.headers['x-resend-signature'];
    
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const { type, data } = event;
      
      console.log(`[Resend Webhook] Event: ${type}, Email: ${data?.to?.[0]}`);

      // Buscar interacción por email_id
      if (data.email_id) {
        // Mapear evento Resend a nuestro status
        const statusMap: Record<string, any> = {
          'email.sent': 'sent',
          'email.delivered': 'delivered',
          'email.opened': 'read',
          'email.clicked': 'read',  // clicked implica opened
          'email.bounced': 'failed',
          'email.complained': 'failed',
          'email.delivery_delayed': 'pending'
        };

        const status = statusMap[type];
        if (status) {
          await interactionService.updateStatus(data.email_id, status, {
            provider: 'resend',
            ...data
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Log email enviado por Resend (llamar inmediatamente después de enviar)
 */
export async function logResendEmail(
  tenantId: string,
  userId: string,
  resendData: {
    id: string;           // Resend email ID
    to: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
  },
  crmData: {
    client_id?: string;
    contact_id?: string;
    opportunity_id?: string;
  }
): Promise<void> {
  await interactionService.saveInteraction({
    tenant_id: tenantId,
    user_id: userId,
    channel: 'email',
    direction: 'outbound',
    subject: resendData.subject,
    content: resendData.html || resendData.text || '',
    from_address: resendData.from,
    to_address: resendData.to,
    provider: 'resend',
    external_id: resendData.id,
    ...crmData
  });
}

// ─── WHATSAPP WEBHOOK (Meta/Twilio) ─────────────────────────────────────────

/**
 * POST /webhooks/whatsapp
 * Recibe mensajes entrantes de WhatsApp
 */
export async function handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verificar firma de Meta/Twilio
    // const signature = req.headers['x-twilio-signature'] || req.headers['x-hub-signature-256'];
    
    const body = req.body;
    
    // Detectar proveedor por formato
    if (body.Body && body.From && body.To) {
      // Formato Twilio
      await handleTwilioMessage(body);
    } else if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      // Formato Meta (WhatsApp Business API)
      await handleMetaMessage(body);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTwilioMessage(body: any): Promise<void> {
  const { Body, From, To, MessageSid, ProfileName } = body;
  
  console.log(`[WhatsApp Twilio] From: ${From}, Message: ${Body?.substring(0, 50)}...`);

  // Buscar contacto por número de teléfono
  const contactResult = await query(
    `SELECT c.id as contact_id, c.client_id, c.tenant_id 
     FROM contacts c
     WHERE c.phone = $1 OR c.whatsapp = $1
     LIMIT 1`,
    [From.replace('whatsapp:', '')]
  );

  const contact = contactResult.rows[0];
  if (!contact) {
    console.warn(`[WhatsApp] No contact found for ${From}`);
    return;
  }

  // Crear thread_id único por conversación
  const threadId = `wa_${[From, To].sort().join('_')}`;

  await interactionService.saveInteraction({
    tenant_id: contact.tenant_id,
    client_id: contact.client_id,
    contact_id: contact.contact_id,
    user_id: await getDefaultUserForTenant(contact.tenant_id), // Asignar a un usuario default o round-robin
    channel: 'whatsapp',
    direction: 'inbound',
    content: Body,
    from_address: From.replace('whatsapp:', ''),
    to_address: To.replace('whatsapp:', ''),
    provider: 'twilio',
    external_id: MessageSid,
    thread_id: threadId,
    metadata: {
      whatsapp_data: {
        profile_name: ProfileName,
        num_media: body.NumMedia,
        media_urls: extractMediaUrls(body)
      }
    }
  });
}

async function handleMetaMessage(body: any): Promise<void> {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0]?.value;
  const messages = changes?.messages || [];

  for (const message of messages) {
    const { from, id: messageId, type, timestamp } = message;
    
    let content = '';
    if (type === 'text') {
      content = message.text?.body || '';
    } else if (type === 'image' || type === 'document' || type === 'audio') {
      content = `[${type.toUpperCase()}]: ${message[type]?.caption || 'Archivo adjunto'}`;
    }

    // Buscar contacto
    const contactResult = await query(
      `SELECT c.id as contact_id, c.client_id, c.tenant_id 
       FROM contacts c
       WHERE c.whatsapp = $1 OR c.phone = $1
       LIMIT 1`,
      [from]
    );

    const contact = contactResult.rows[0];
    if (!contact) {
      console.warn(`[WhatsApp Meta] No contact found for ${from}`);
      continue;
    }

    const threadId = `wa_${changes.metadata?.phone_number_id}_${from}`;

    await interactionService.saveInteraction({
      tenant_id: contact.tenant_id,
      client_id: contact.client_id,
      contact_id: contact.contact_id,
      user_id: await getDefaultUserForTenant(contact.tenant_id),
      channel: 'whatsapp',
      direction: 'inbound',
      content,
      from_address: from,
      to_address: changes.metadata?.display_phone_number || '',
      provider: 'meta',
      external_id: messageId,
      thread_id: threadId,
      metadata: {
        whatsapp_data: {
          message_type: type,
          timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
        }
      }
    });
  }
}

/**
 * Log mensaje WhatsApp enviado (llamar después de enviar por API)
 */
export async function logWhatsAppSent(
  tenantId: string,
  userId: string,
  waData: {
    messageId: string;
    to: string;
    body: string;
    threadId?: string;
  },
  crmData: {
    client_id?: string;
    contact_id?: string;
  }
): Promise<void> {
  await interactionService.saveInteraction({
    tenant_id: tenantId,
    user_id: userId,
    channel: 'whatsapp',
    direction: 'outbound',
    content: waData.body,
    from_address: 'system',  // Tu número de WhatsApp Business
    to_address: waData.to,
    provider: 'meta',  // o 'twilio'
    external_id: waData.messageId,
    thread_id: waData.threadId,
    ...crmData
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function getDefaultUserForTenant(tenantId: string): Promise<string> {
  // Buscar un admin o el primer usuario activo del tenant
  const result = await query(
    `SELECT id FROM users 
     WHERE tenant_id = $1 AND is_active = true AND role IN ('admin', 'manager')
     ORDER BY created_at ASC 
     LIMIT 1`,
    [tenantId]
  );
  
  if (result.rows[0]) {
    return result.rows[0].id;
  }
  
  // Fallback: cualquier usuario
  const fallback = await query(
    'SELECT id FROM users WHERE tenant_id = $1 LIMIT 1',
    [tenantId]
  );
  
  return fallback.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
}

function extractMediaUrls(body: any): string[] {
  const urls: string[] = [];
  const numMedia = parseInt(body.NumMedia || '0');
  for (let i = 0; i < numMedia; i++) {
    if (body[`MediaUrl${i}`]) {
      urls.push(body[`MediaUrl${i}`]);
    }
  }
  return urls;
}

// ─── VERIFICACIÓN DE FIRMAS ──────────────────────────────────────────────────

/**
 * Verifica firma de Twilio
 */
export function verifyTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, any>,
  signature: string
): boolean {
  const data = Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('');
  
  const expected = crypto
    .createHmac('sha1', authToken)
    .update(url + data)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Verifica firma de Meta
 */
export function verifyMetaSignature(
  appSecret: string,
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');
  
  return signature === `sha256=${expected}`;
}
