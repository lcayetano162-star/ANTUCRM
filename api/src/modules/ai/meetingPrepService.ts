import { query } from '../../shared/config/database';
import { callAI, sanitizeForPrompt } from './aiService';

export interface MeetingBrief {
  clientName: string;
  opportunityName?: string;
  executiveSummary: string;
  keyContext: string[];
  talkingPoints: { title: string; detail: string }[];
  openItems: string[];
  risks: string[];
  suggestedActions: string[];
  generatedAt: string;
}

export async function generateMeetingPrep(
  tenantId: string,
  clientId: string,
  opportunityId?: string
): Promise<MeetingBrief> {

  // ── 1. Datos del cliente ────────────────────────────────────────────────────
  const clientRes = await query(
    `SELECT c.*, u.first_name || ' ' || u.last_name AS assigned_name
     FROM clients c LEFT JOIN users u ON c.assigned_to = u.id
     WHERE c.id = $1 AND c.tenant_id = $2`,
    [clientId, tenantId]
  );
  if (clientRes.rows.length === 0) throw new Error('Cliente no encontrado');
  const client = clientRes.rows[0];

  // ── 2. Oportunidad específica o la más relevante ───────────────────────────
  let opportunity: any = null;
  if (opportunityId) {
    const oppRes = await query(
      `SELECT o.*, q.total_monthly, q.total_onetime, q.status as quote_status
       FROM opportunities o
       LEFT JOIN quotes q ON q.opportunity_id = o.id AND q.status NOT IN ('cancelled')
       WHERE o.id = $1 AND o.tenant_id = $2
       ORDER BY q.created_at DESC LIMIT 1`,
      [opportunityId, tenantId]
    );
    opportunity = oppRes.rows[0] || null;
  } else {
    const oppRes = await query(
      `SELECT * FROM opportunities
       WHERE client_id = $1 AND tenant_id = $2 AND status = 'active'
       ORDER BY estimated_revenue DESC LIMIT 1`,
      [clientId, tenantId]
    );
    opportunity = oppRes.rows[0] || null;
  }

  // ── 3. Actividades recientes (últimas 10) ──────────────────────────────────
  const actRes = await query(
    `SELECT a.type, a.subject, a.description, a.performed_at,
            u.first_name || ' ' || u.last_name AS by_user
     FROM activities a LEFT JOIN users u ON a.performed_by = u.id
     WHERE a.tenant_id = $1 AND a.related_to_id = $2
     ORDER BY a.performed_at DESC LIMIT 10`,
    [tenantId, clientId]
  );
  const activities = actRes.rows;

  // ── 4. Contactos del cliente ───────────────────────────────────────────────
  const contactRes = await query(
    `SELECT first_name, last_name, position, email, phone FROM contacts
     WHERE client_id = $1 AND tenant_id = $2 ORDER BY is_primary DESC LIMIT 5`,
    [clientId, tenantId]
  );
  const contacts = contactRes.rows;

  // ── 5. Tareas abiertas relacionadas ───────────────────────────────────────
  const taskRes = await query(
    `SELECT title, due_date, priority, status
     FROM tasks
     WHERE tenant_id = $1 AND related_to_id = $2 AND status != 'completed'
     ORDER BY due_date ASC LIMIT 5`,
    [tenantId, clientId]
  );
  const tasks = taskRes.rows;

  // ── 6. Construir contexto para la IA ──────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = activities[0];
  const daysSinceContact = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity.performed_at).getTime()) / 86400000)
    : null;

  const systemPrompt = `Eres un asistente de ventas experto que prepara briefings concisos para reuniones con clientes.
Responde SOLO con JSON válido sin markdown ni texto extra.`;

  const userPrompt = `Prepara un briefing de reunión ejecutivo para hoy (${today}).

CLIENTE: ${sanitizeForPrompt(client.name, 100)}
Tipo: ${client.contact_type || 'client'} | Ciudad: ${sanitizeForPrompt(client.city, 60) || 'N/A'} | RNC: ${sanitizeForPrompt(client.rnc, 20) || 'N/A'}
Último contacto: ${daysSinceContact !== null ? daysSinceContact + ' días atrás' : 'Sin registro'}
Notas: ${sanitizeForPrompt(client.notes, 200) || 'Ninguna'}

CONTACTOS CLAVE:
${contacts.map(c => `- ${sanitizeForPrompt(c.first_name, 50)} ${sanitizeForPrompt(c.last_name, 50)} (${sanitizeForPrompt(c.position, 60) || 'Sin cargo'})`).join('\n') || '- Sin contactos registrados'}

OPORTUNIDAD ACTIVA:
${opportunity ? `Nombre: ${sanitizeForPrompt(opportunity.name, 100)}
Etapa: ${opportunity.stage} | Probabilidad: ${opportunity.probability}%
Valor estimado: $${Number(opportunity.estimated_revenue || 0).toLocaleString()}
Cierre esperado: ${opportunity.expected_close_date || 'Sin fecha'}` : 'Sin oportunidad activa'}

ÚLTIMAS 5 ACTIVIDADES:
${activities.slice(0, 5).map(a =>
  `- [${a.type}] ${sanitizeForPrompt(a.subject, 80) || 'Sin asunto'} — ${new Date(a.performed_at).toLocaleDateString('es-DO')}`
).join('\n') || '- Sin actividades recientes'}

TAREAS PENDIENTES:
${tasks.map(t => `- [${t.priority}] ${sanitizeForPrompt(t.title, 80)} (vence: ${t.due_date ? new Date(t.due_date).toLocaleDateString('es-DO') : 'Sin fecha'})`).join('\n') || '- Sin tareas pendientes'}

Responde con este JSON exacto:
{
  "executiveSummary": "2-3 frases describiendo el estado actual de la relación con el cliente y la oportunidad",
  "keyContext": ["dato clave 1", "dato clave 2", "dato clave 3"],
  "talkingPoints": [
    { "title": "Título del punto", "detail": "Detalle y enfoque sugerido" },
    { "title": "...", "detail": "..." },
    { "title": "...", "detail": "..." }
  ],
  "openItems": ["ítem pendiente 1", "ítem pendiente 2"],
  "risks": ["riesgo 1", "riesgo 2"],
  "suggestedActions": ["acción concreta 1 post-reunión", "acción concreta 2"]
}`;

  const raw = await callAI(systemPrompt, userPrompt);

  // Parse JSON — tolera markdown code fences si la IA las devuelve
  let parsed: any;
  try {
    const clean = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/,'').trim();
    parsed = JSON.parse(clean);
  } catch {
    // Fallback si la IA no devuelve JSON válido
    parsed = {
      executiveSummary: raw.slice(0, 300),
      keyContext: [],
      talkingPoints: [],
      openItems: [],
      risks: [],
      suggestedActions: []
    };
  }

  return {
    clientName: client.name,
    opportunityName: opportunity?.name,
    executiveSummary: parsed.executiveSummary || '',
    keyContext: parsed.keyContext || [],
    talkingPoints: parsed.talkingPoints || [],
    openItems: parsed.openItems || [],
    risks: parsed.risks || [],
    suggestedActions: parsed.suggestedActions || [],
    generatedAt: new Date().toISOString()
  };
}
