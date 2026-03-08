import * as https from 'https';
import * as crypto from 'crypto';
import { query } from '../../shared/config/database';

// ── Encryption helpers (AES-256-GCM) ────────────────────────────────────────
const CIPHER_KEY = process.env.ENCRYPTION_KEY || 'antu-crm-default-32-byte-key-!!!';
if (!process.env.ENCRYPTION_KEY) {
  console.warn('[AI] ADVERTENCIA: ENCRYPTION_KEY no definida. Usando clave por defecto insegura. Define ENCRYPTION_KEY en producción.');
}
const KEY = Buffer.from(CIPHER_KEY.padEnd(32).slice(0, 32));

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

// ── Prompt Injection Sanitizer ────────────────────────────────────────────────
// Strips control characters, role-switching keywords, and truncates to maxLen.
// Apply to ANY user-controlled string before including it in an AI prompt.
export function sanitizeForPrompt(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return 'N/A';
  const str = String(value);
  return str
    // Remove null bytes and ASCII control characters (except \n \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove common prompt-injection role-switch sequences
    .replace(/\b(ignore|forget|disregard)\s+(previous|prior|above|all)\s+(instructions?|prompts?|context)/gi, '[filtered]')
    // Collapse runs of whitespace to single space (except intentional newlines)
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxLen);
}

// ── Circuit Breaker para llamadas a IA externa ────────────────────────────────
// Evita cascada de fallos si el proveedor de IA está caído
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  threshold: 3,       // abrir circuito tras 3 fallos
  resetAfterMs: 60000 // cerrar automáticamente tras 60s
};

function checkCircuit() {
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    const elapsed = Date.now() - circuitBreaker.lastFailure;
    if (elapsed < circuitBreaker.resetAfterMs) {
      const remaining = Math.ceil((circuitBreaker.resetAfterMs - elapsed) / 1000);
      throw new Error(`IA temporalmente no disponible (circuito abierto). Reintentando en ${remaining}s.`);
    }
    // Half-open: permitir un intento para ver si se recuperó
    circuitBreaker.failures = 0;
  }
}

function recordSuccess() { circuitBreaker.failures = 0; }
function recordFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
}

// ── HTTP helper ──────────────────────────────────────────────────────────────
function httpPost(hostname: string, path: string, headers: Record<string, string>, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON response from AI provider')); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Get global AI config ──────────────────────────────────────────────────────
export async function getAIConfig(): Promise<any | null> {
  const res = await query('SELECT * FROM ai_global_config LIMIT 1', []);
  return res.rows[0] || null;
}

// ── Call AI provider ──────────────────────────────────────────────────────────
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  checkCircuit(); // lanza error inmediato si el circuito está abierto

  const cfg = await getAIConfig();

  // Fallback: si no hay config en DB, usar GEMINI_API_KEY del entorno
  if (!cfg || !cfg.is_active) {
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey) throw new Error('IA no configurada. Configúrala en Super Admin → IA o define GEMINI_API_KEY en el entorno.');
    const envModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    try {
      const resp = await httpPost(
        'generativelanguage.googleapis.com',
        `/v1beta/models/${envModel}:generateContent?key=${envKey}`,
        {},
        { contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }] }
      );
      if (resp.error) throw new Error(resp.error.message);
      recordSuccess();
      return resp.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      recordFailure();
      throw err;
    }
  }

  const apiKey = decryptKey(cfg.api_key_enc);
  const provider = cfg.provider as 'claude' | 'openai' | 'gemini';
  const model = cfg.model;

  try {
    let result = '';

    if (provider === 'claude') {
      const resp = await httpPost('api.anthropic.com', '/v1/messages',
        { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        { model, max_tokens: model.includes('opus') ? 4096 : 2048, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }
      );
      if (resp.error) throw new Error(resp.error.message);
      result = resp.content?.[0]?.text || '';
    } else if (provider === 'openai') {
      const resp = await httpPost('api.openai.com', '/v1/chat/completions',
        { 'Authorization': `Bearer ${apiKey}` },
        { model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }
      );
      if (resp.error) throw new Error(resp.error.message);
      result = resp.choices?.[0]?.message?.content || '';
    } else if (provider === 'gemini') {
      const resp = await httpPost('generativelanguage.googleapis.com',
        `/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {},
        { contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }] }
      );
      if (resp.error) throw new Error(resp.error.message);
      result = resp.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      throw new Error('Proveedor no soportado');
    }

    recordSuccess();
    return result;
  } catch (err) {
    recordFailure();
    throw err;
  }
}

// ── Contact Analysis ──────────────────────────────────────────────────────────
export async function analyzeContact(tenantId: string, contactId: string, contactData: any): Promise<any> {
  // Gather context from DB
  const [activitiesRes, emailsRes, oppsRes] = await Promise.all([
    query(
      `SELECT type, subject, notes, created_at FROM activities
       WHERE tenant_id = $1 AND (contact_id = $2 OR client_id = (SELECT client_id FROM contacts WHERE id = $2 AND tenant_id = $1))
       ORDER BY created_at DESC LIMIT 10`,
      [tenantId, contactId]
    ),
    query(
      `SELECT subject, status, opened_at, clicked_at, created_at FROM contact_emails
       WHERE tenant_id = $1 AND contact_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [tenantId, contactId]
    ),
    query(
      `SELECT name, stage, estimated_revenue, probability, updated_at FROM opportunities
       WHERE tenant_id = $1 AND contact_id = $2
       ORDER BY updated_at DESC LIMIT 5`,
      [tenantId, contactId]
    ),
  ]);

  const systemPrompt = `Eres un asistente CRM experto en análisis de prospectos y clientes.
Analiza los datos del contacto y responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "temperature": "caliente|tibio|frio",
  "temperatureScore": <número 0-100>,
  "context": "<resumen breve del estado del contacto>",
  "nextAction": "<acción concreta recomendada>",
  "insights": ["<insight 1>","<insight 2>","<insight 3>"],
  "lastInteraction": "<descripción de la última interacción>",
  "estimatedValue": "<valor estimado en USD o la moneda de las oportunidades>"
}`;

  const userPrompt = `Contacto: ${sanitizeForPrompt(contactData.name, 100)} (${sanitizeForPrompt(contactData.email, 100) || 'sin email'})
Cliente: ${sanitizeForPrompt(contactData.clientName, 100) || 'sin empresa'}

Actividades recientes:
${activitiesRes.rows.map(a => `- [${a.type}] ${sanitizeForPrompt(a.subject, 80)} ${a.notes ? '('+sanitizeForPrompt(a.notes, 80)+')' : ''} — ${new Date(a.created_at).toLocaleDateString('es')}`).join('\n') || 'Sin actividades'}

Correos:
${emailsRes.rows.map(e => `- ${sanitizeForPrompt(e.subject, 80)} [${e.status}] enviado ${new Date(e.created_at).toLocaleDateString('es')}${e.opened_at ? ', abierto' : ''}${e.clicked_at ? ', click' : ''}`).join('\n') || 'Sin correos'}

Oportunidades:
${oppsRes.rows.map(o => `- ${sanitizeForPrompt(o.name, 80)}: ${o.stage} | $${o.estimated_revenue?.toLocaleString()} | ${o.probability}% prob.`).join('\n') || 'Sin oportunidades'}

Analiza y responde con el JSON.`;

  const rawResponse = await callAI(systemPrompt, userPrompt);

  // Parse JSON from response (AI sometimes wraps in markdown)
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La IA no retornó un JSON válido');
  return JSON.parse(jsonMatch[0]);
}

// ── Sales Recommendations ─────────────────────────────────────────────────────
export async function getSalesRecommendations(tenantId: string, userId: string): Promise<any> {
  const [pipeline, activities, wonOpps] = await Promise.all([
    query(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(estimated_revenue),0) as value
       FROM opportunities WHERE tenant_id = $1 AND assigned_to = $2 AND stage NOT IN ('closed_won','closed_lost')
       GROUP BY stage`,
      [tenantId, userId]
    ),
    query(
      `SELECT type, COUNT(*) as count FROM activities
       WHERE tenant_id = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY type`,
      [tenantId, userId]
    ),
    query(
      `SELECT COUNT(*) as count, COALESCE(SUM(estimated_revenue),0) as value
       FROM opportunities WHERE tenant_id = $1 AND assigned_to = $2
       AND stage = 'closed_won' AND updated_at >= NOW() - INTERVAL '30 days'`,
      [tenantId, userId]
    ),
  ]);

  const systemPrompt = `Eres un coach de ventas experto. Analiza el pipeline y actividades del vendedor.
Responde ÚNICAMENTE con un JSON válido:
{
  "summary": "<resumen breve del desempeño>",
  "recommendations": ["<rec 1>","<rec 2>","<rec 3>"],
  "focusStage": "<etapa donde debe enfocarse>",
  "riskAlert": "<riesgo o alerta principal o null>",
  "weeklyGoal": "<meta concreta para esta semana>"
}`;

  const userPrompt = `Pipeline activo:
${pipeline.rows.map(r => `- ${r.stage}: ${r.count} opps, $${parseInt(r.value).toLocaleString()}`).join('\n') || 'Vacío'}

Actividades últimos 30 días:
${activities.rows.map(a => `- ${a.type}: ${a.count}`).join('\n') || 'Sin actividades'}

Cierres este mes: ${wonOpps.rows[0]?.count || 0} oportunidades por $${parseInt(wonOpps.rows[0]?.value || 0).toLocaleString()}

Recomienda.`;

  const rawResponse = await callAI(systemPrompt, userPrompt);
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La IA no retornó un JSON válido');
  return JSON.parse(jsonMatch[0]);
}
