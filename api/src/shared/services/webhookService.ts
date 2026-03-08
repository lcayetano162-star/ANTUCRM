import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { query, pool } from '../config/database';

const RETRY_DELAYS_MS = [0, 5 * 60 * 1000, 30 * 60 * 1000]; // immediate, 5min, 30min
const TIMEOUT_MS = 10_000;

// ── Dispatch de un evento a todos los webhooks suscritos del tenant ────────────
export async function dispatchWebhookEvent(
  tenantId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    // Obtener webhooks activos suscritos a este evento
    const res = await query(
      `SELECT id, url, secret FROM webhooks
        WHERE tenant_id = $1
          AND is_active = true
          AND failure_count < 5
          AND $2 = ANY(events)`,
      [tenantId, eventType]
    );

    if (res.rows.length === 0) return;

    for (const webhook of res.rows) {
      // Crear registro del evento
      const eventRes = await query(
        `INSERT INTO webhook_events (tenant_id, webhook_id, event_type, payload, status, next_attempt_at)
           VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING id`,
        [tenantId, webhook.id, eventType, JSON.stringify(payload)]
      );
      const eventId = eventRes.rows[0].id;

      // Disparar async sin bloquear la respuesta HTTP
      setImmediate(() => deliverEvent(eventId, webhook.id, webhook.url, webhook.secret, eventType, payload, tenantId));
    }
  } catch (err) {
    console.error('[WebhookService] Error dispatching event:', err);
  }
}

// ── Entrega de un evento a un endpoint ────────────────────────────────────────
async function deliverEvent(
  eventId: string,
  webhookId: string,
  url: string,
  secret: string,
  eventType: string,
  payload: Record<string, any>,
  tenantId: string,
  attemptNumber = 0
): Promise<void> {
  const body = JSON.stringify({
    id: eventId,
    event: eventType,
    created_at: new Date().toISOString(),
    data: payload
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const headers: Record<string, string> = {
    'Content-Type':     'application/json',
    'Content-Length':   Buffer.byteLength(body).toString(),
    'X-Antu-Event':     eventType,
    'X-Antu-Delivery':  eventId,
    'X-Antu-Timestamp': timestamp,
    'X-Antu-Signature': `sha256=${signature}`,
    'User-Agent':       'AntuCRM-Webhook/2.0'
  };

  try {
    const { statusCode, responseBody } = await httpPost(url, headers, body);
    const success = statusCode >= 200 && statusCode < 300;

    if (success) {
      await query(
        `UPDATE webhook_events SET status='delivered', attempts=$1, response_code=$2, response_body=$3, delivered_at=NOW() WHERE id=$4`,
        [attemptNumber + 1, statusCode, responseBody?.slice(0, 500) ?? null, eventId]
      );
      await query(
        'UPDATE webhooks SET last_triggered_at=NOW(), last_success_at=NOW(), failure_count=0 WHERE id=$1',
        [webhookId]
      );
    } else {
      await handleFailure(eventId, webhookId, tenantId, statusCode, responseBody, null, attemptNumber, url, secret, eventType, payload);
    }
  } catch (err: any) {
    await handleFailure(eventId, webhookId, tenantId, null, null, err.message, attemptNumber, url, secret, eventType, payload);
  }
}

async function handleFailure(
  eventId: string, webhookId: string, tenantId: string,
  statusCode: number | null, responseBody: string | null, errorMsg: string | null,
  attemptNumber: number, url: string, secret: string, eventType: string, payload: Record<string, any>
) {
  const nextAttempt = attemptNumber + 1;
  if (nextAttempt < RETRY_DELAYS_MS.length) {
    const delay = RETRY_DELAYS_MS[nextAttempt];
    const nextAt = new Date(Date.now() + delay);
    await query(
      `UPDATE webhook_events
          SET status='retrying', attempts=$1, response_code=$2, response_body=$3, error_message=$4, next_attempt_at=$5
        WHERE id=$6`,
      [nextAttempt, statusCode, responseBody?.slice(0, 500) ?? null, errorMsg, nextAt, eventId]
    );
    setTimeout(() => deliverEvent(eventId, webhookId, url, secret, eventType, payload, tenantId, nextAttempt), delay);
  } else {
    await query(
      `UPDATE webhook_events
          SET status='failed', attempts=$1, response_code=$2, response_body=$3, error_message=$4
        WHERE id=$5`,
      [nextAttempt, statusCode, responseBody?.slice(0, 500) ?? null, errorMsg, eventId]
    );
    await query(
      'UPDATE webhooks SET failure_count = failure_count + 1, last_triggered_at=NOW() WHERE id=$1',
      [webhookId]
    );
  }
}

// ── Wrapper HTTP/HTTPS ────────────────────────────────────────────────────────
function httpPost(url: string, headers: Record<string, string>, body: string): Promise<{ statusCode: number; responseBody: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers,
      timeout: TIMEOUT_MS
    };
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk });
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, responseBody: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

export default { dispatchWebhookEvent };
