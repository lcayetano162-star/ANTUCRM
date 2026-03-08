/**
 * Interaction Service - Timeline Unificado
 * 
 * Arquitectura: PostgreSQL + Node.js (pg)
 * Consistente con: database.ts (shared/config)
 * 
 * Usa: pool.query() y transaction() como el resto de la app
 */

import { Pool } from 'pg';
import { pool, query, transaction } from '../../shared/config/database';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ChannelType = 'email' | 'whatsapp' | 'sms' | 'call' | 'note' | 'meeting';
export type DirectionType = 'inbound' | 'outbound' | 'internal';
export type StatusType = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'replied';

export interface AIInsight {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;
  summary: string;
  topics: string[];
  intent?: string;
  urgency?: 'low' | 'medium' | 'high';
  keywords?: string[];
  suggested_action?: string;
}

export interface InteractionMetadata {
  email_headers?: Record<string, string>;
  whatsapp_data?: any;
  attachments?: Array<{
    filename: string;
    size: number;
    mime_type: string;
    url?: string;
  }>;
  ip_address?: string;
  user_agent?: string;
  [key: string]: any;
}

export interface SaveInteractionInput {
  tenant_id: string;
  client_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  user_id: string;
  
  channel: ChannelType;
  direction: DirectionType;
  
  subject?: string;
  content: string;
  
  from_address: string;
  to_address: string;
  cc_addresses?: string[];
  bcc_addresses?: string[];
  
  provider?: string;
  external_id?: string;
  thread_id?: string;
  
  metadata?: InteractionMetadata;
  parent_id?: string;
  
  is_private?: boolean;
}

export interface Interaction extends SaveInteractionInput {
  id: string;
  status: StatusType;
  content_preview?: string;
  ai_insight?: AIInsight;
  ai_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_processed_at?: Date;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  replied_at?: Date;
  thread_depth: number;
  created_at: Date;
  updated_at: Date;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

export class InteractionService {
  /**
   * FUNCIÓN PRINCIPAL: Guarda una interacción en el timeline
   * 
   * Usa transaction() de database.ts para atomicidad
   * Compatible con el código existente
   */
  async saveInteraction(input: SaveInteractionInput): Promise<Interaction> {
    return transaction(async (client) => {
      // Calcular thread_depth si hay parent
      let threadDepth = 0;
      if (input.parent_id) {
        const depthRes = await client.query(
          'SELECT thread_depth FROM interactions WHERE id = $1',
          [input.parent_id]
        );
        if (depthRes.rows[0]) {
          threadDepth = depthRes.rows[0].thread_depth + 1;
        }
      }

      // Insertar interacción
      const result = await client.query(
        `INSERT INTO interactions (
          tenant_id, client_id, contact_id, opportunity_id, user_id,
          channel, direction, status,
          subject, content,
          from_address, to_address, cc_addresses, bcc_addresses,
          provider, external_id, thread_id,
          metadata, parent_id, thread_depth,
          is_private, ai_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *`,
        [
          input.tenant_id,
          input.client_id || null,
          input.contact_id || null,
          input.opportunity_id || null,
          input.user_id,
          input.channel,
          input.direction,
          'pending',
          input.subject || null,
          input.content,
          input.from_address,
          input.to_address,
          input.cc_addresses || null,
          input.bcc_addresses || null,
          input.provider || 'system',
          input.external_id || null,
          input.thread_id || null,
          JSON.stringify(input.metadata || {}),
          input.parent_id || null,
          threadDepth,
          input.is_private || false,
          'pending'
        ]
      );

      const interaction = this.mapRow(result.rows[0]);

      // Procesar IA en background (no bloqueante)
      this.processAI(interaction).catch(console.error);

      console.log(`[Timeline] ${input.channel} ${input.direction}: ${interaction.id}`);
      return interaction;
    });
  }

  /**
   * Actualiza el estado desde webhooks (Resend, Twilio, etc)
   */
  async updateStatus(
    externalId: string,
    status: StatusType,
    eventData?: any
  ): Promise<void> {
    const timestampCol = this.getTimestampColumn(status);
    
    await query(
      `UPDATE interactions 
       SET status = $1${timestampCol ? `, ${timestampCol} = NOW()` : ''}
       WHERE external_id = $2`,
      [status, externalId]
    );

    // Registrar evento
    const interaction = await query(
      'SELECT id, tenant_id FROM interactions WHERE external_id = $1',
      [externalId]
    );

    if (interaction.rows[0]) {
      await query(
        `INSERT INTO interaction_events (interaction_id, tenant_id, event_type, event_data, provider)
         VALUES ($1, $2, $3, $4, $5)`,
        [interaction.rows[0].id, interaction.rows[0].tenant_id, status, 
         JSON.stringify(eventData || {}), eventData?.provider || 'unknown']
      );
    }
  }

  /**
   * Obtiene timeline de un cliente (ordenado cronológicamente)
   */
  async getClientTimeline(
    tenantId: string,
    clientId: string,
    options: {
      channels?: ChannelType[];
      limit?: number;
      offset?: number;
      includePrivate?: boolean;
    } = {}
  ): Promise<Interaction[]> {
    const { channels, limit = 50, offset = 0, includePrivate = false } = options;

    let sql = `
      SELECT i.*, 
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM interactions i
      LEFT JOIN users u ON u.id = i.user_id
      WHERE i.tenant_id = $1 
        AND (i.client_id = $2 OR i.contact_id IN (
          SELECT id FROM contacts WHERE client_id = $2
        ))
    `;
    const params: any[] = [tenantId, clientId];

    if (!includePrivate) {
      sql += ` AND i.is_private = false`;
    }

    if (channels?.length) {
      sql += ` AND i.channel = ANY($${params.length + 1}::channel_type[])`;
      params.push(channels);
    }

    sql += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Obtiene una conversación completa (thread)
   */
  async getThread(tenantId: string, threadId: string): Promise<Interaction[]> {
    const result = await query(
      `SELECT * FROM interactions
       WHERE tenant_id = $1 AND thread_id = $2
       ORDER BY created_at ASC`,
      [tenantId, threadId]
    );
    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Busca en el contenido (búsqueda de texto)
   */
  async search(
    tenantId: string,
    searchTerm: string,
    clientId?: string
  ): Promise<Interaction[]> {
    let sql = `
      SELECT * FROM interactions
      WHERE tenant_id = $1
        AND to_tsvector('spanish', content) @@ plainto_tsquery('spanish', $2)
    `;
    const params: any[] = [tenantId, searchTerm];

    if (clientId) {
      sql += ` AND client_id = $3`;
      params.push(clientId);
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await query(sql, params);
    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Actualiza el análisis de IA (llamado por el AI service)
   */
  async updateAIInsight(
    interactionId: string,
    insight: AIInsight
  ): Promise<void> {
    await query(
      `UPDATE interactions 
       SET ai_insight = $1,
           ai_status = 'completed',
           ai_processed_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(insight), interactionId]
    );
  }

  /**
   * Obtiene resumen de interacciones para dashboard
   */
  async getSummary(
    tenantId: string,
    clientId: string
  ): Promise<{
    total: number;
    lastInteraction: Date | null;
    sentiment: string | null;
    aiSummary: string | null;
  }> {
    const result = await query(
      `SELECT 
        total_interactions,
        last_interaction_at,
        last_sentiment,
        last_ai_summary
       FROM v_client_interaction_summary
       WHERE tenant_id = $1 AND client_id = $2`,
      [tenantId, clientId]
    );

    if (result.rows[0]) {
      return {
        total: parseInt(result.rows[0].total_interactions),
        lastInteraction: result.rows[0].last_interaction_at,
        sentiment: result.rows[0].last_sentiment,
        aiSummary: result.rows[0].last_ai_summary
      };
    }

    return { total: 0, lastInteraction: null, sentiment: null, aiSummary: null };
  }

  // ─── PRIVATE ───────────────────────────────────────────────────────────────

  private getTimestampColumn(status: StatusType): string | null {
    const map: Record<string, string> = {
      'sent': 'sent_at',
      'delivered': 'delivered_at',
      'read': 'read_at',
      'replied': 'replied_at'
    };
    return map[status] || null;
  }

  private async processAI(interaction: Interaction): Promise<void> {
    // Placeholder - integrar con tu aiService existente
    // const analysis = await aiService.analyzeInteraction(interaction);
    // await this.updateAIInsight(interaction.id, analysis);
  }

  private mapRow(row: any): Interaction {
    return {
      ...row,
      metadata: row.metadata || {},
      ai_insight: row.ai_insight || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      ai_processed_at: row.ai_processed_at ? new Date(row.ai_processed_at) : undefined,
      sent_at: row.sent_at ? new Date(row.sent_at) : undefined,
      delivered_at: row.delivered_at ? new Date(row.delivered_at) : undefined,
      read_at: row.read_at ? new Date(row.read_at) : undefined,
      replied_at: row.replied_at ? new Date(row.replied_at) : undefined
    };
  }
}

// Export singleton
export const interactionService = new InteractionService();
export default interactionService;
