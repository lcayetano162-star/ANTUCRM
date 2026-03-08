import { query } from '../../shared/config/database';
import { callAI, sanitizeForPrompt } from './aiService';

export interface AIDailyBriefing {
  id: string;
  briefingDate: string;
  greeting: string;
  summary: string;
  atRiskDeals: AtRiskDeal[];
  staleContacts: StaleContact[];
  overdueTasks: OverdueTask[];
  pipelineHealth: 'excelente' | 'bueno' | 'en_riesgo' | 'critico';
  pipelineGap: number;
  topAction: string;
  insights: string[];
  monthlyGoal: number;
  wonThisMonth: number;
  createdAt: string;
}

interface AtRiskDeal {
  id: string;
  name: string;
  stage: string;
  daysStuck: number;
  value: number;
  clientName?: string;
}

interface StaleContact {
  id: string;
  name: string;
  company?: string;
  daysSinceContact: number;
}

interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  relatedTo?: string;
}

// ── Genera o devuelve el briefing del día actual ──────────────────────────────
export async function getDailyBriefing(tenantId: string, userId: string): Promise<AIDailyBriefing> {
  const today = new Date().toISOString().split('T')[0];

  // Devolver el briefing ya generado hoy si existe
  const existing = await query(
    `SELECT * FROM ai_briefings WHERE tenant_id = $1 AND user_id = $2 AND briefing_date = $3`,
    [tenantId, userId, today]
  );

  if (existing.rows.length > 0) {
    return mapRow(existing.rows[0]);
  }

  // Generar nuevo briefing
  return generateBriefing(tenantId, userId, today);
}

// ── Fuerza regeneración (botón "Actualizar" en UI) ────────────────────────────
export async function regenerateBriefing(tenantId: string, userId: string): Promise<AIDailyBriefing> {
  const today = new Date().toISOString().split('T')[0];
  await query(
    `DELETE FROM ai_briefings WHERE tenant_id = $1 AND user_id = $2 AND briefing_date = $3`,
    [tenantId, userId, today]
  );
  return generateBriefing(tenantId, userId, today);
}

// ── Núcleo: recopila datos y llama a la IA ────────────────────────────────────
async function generateBriefing(tenantId: string, userId: string, today: string): Promise<AIDailyBriefing> {

  // 1. Oportunidades estancadas (mismo stage hace más de 14 días)
  const stuckDeals = await query(
    `SELECT o.id, o.name, o.stage, o.estimated_revenue,
            EXTRACT(DAY FROM NOW() - o.updated_at)::int AS days_stuck,
            c.name AS client_name
     FROM opportunities o
     LEFT JOIN clients c ON o.client_id = c.id
     WHERE o.tenant_id = $1
       AND o.assigned_to = $2
       AND o.stage NOT IN ('closed_won','closed_lost')
       AND o.updated_at < NOW() - INTERVAL '14 days'
     ORDER BY days_stuck DESC LIMIT 5`,
    [tenantId, userId]
  );

  // 2. Contactos sin actividad hace más de 30 días
  const staleContacts = await query(
    `SELECT c.id, c.first_name || ' ' || c.last_name AS name,
            cl.name AS company,
            EXTRACT(DAY FROM NOW() - COALESCE(
              (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = c.id AND a.tenant_id = $1),
              c.created_at
            ))::int AS days_since_contact
     FROM contacts c
     LEFT JOIN clients cl ON c.client_id = cl.id
     WHERE c.tenant_id = $1
       AND c.assigned_to = $2
     HAVING EXTRACT(DAY FROM NOW() - COALESCE(
              (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = c.id AND a.tenant_id = $1),
              c.created_at
            )) > 30
     ORDER BY days_since_contact DESC LIMIT 5`,
    [tenantId, userId]
  );

  // 3. Tareas vencidas
  const overdueTasks = await query(
    `SELECT t.id, t.title, t.due_date,
            CASE WHEN t.related_type = 'opportunity' THEN
              (SELECT name FROM opportunities WHERE id = t.related_id)
            ELSE NULL END AS related_to
     FROM tasks t
     WHERE t.tenant_id = $1
       AND t.assigned_to = $2
       AND t.status IN ('pending','in_progress')
       AND t.due_date < CURRENT_DATE
     ORDER BY t.due_date ASC LIMIT 5`,
    [tenantId, userId]
  );

  // 4. Pipeline activo y cierre del mes
  const pipeline = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN stage NOT IN ('closed_won','closed_lost') THEN estimated_revenue ELSE 0 END), 0) AS pipeline_value,
       COALESCE(SUM(CASE WHEN stage = 'closed_won' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW()) THEN estimated_revenue ELSE 0 END), 0) AS won_this_month,
       COUNT(CASE WHEN stage NOT IN ('closed_won','closed_lost') THEN 1 END) AS active_count
     FROM opportunities
     WHERE tenant_id = $1 AND assigned_to = $2`,
    [tenantId, userId]
  );

  // 5. Meta mensual del usuario (de performance si existe)
  const goalResult = await query(
    `SELECT COALESCE(monthly_quota, 0) AS monthly_goal
     FROM performance_metrics
     WHERE tenant_id = $1 AND user_id = $2
       AND period_year = EXTRACT(YEAR FROM NOW())
       AND period_month = EXTRACT(MONTH FROM NOW())
     LIMIT 1`,
    [tenantId, userId]
  );

  // 6. Info del usuario
  const userResult = await query(
    `SELECT first_name FROM users WHERE id = $1`, [userId]
  );

  const firstName = userResult.rows[0]?.first_name || 'vendedor';
  const pipelineValue = parseFloat(pipeline.rows[0]?.pipeline_value || 0);
  const wonThisMonth = parseFloat(pipeline.rows[0]?.won_this_month || 0);
  const monthlyGoal = parseFloat(goalResult.rows[0]?.monthly_goal || 0);
  const pipelineGap = monthlyGoal > 0 ? monthlyGoal - wonThisMonth : 0;

  const atRiskDeals = stuckDeals.rows.map(r => ({
    id: r.id, name: r.name, stage: r.stage,
    daysStuck: r.days_stuck, value: parseFloat(r.estimated_revenue || 0),
    clientName: r.client_name
  }));

  const staleContactsList = staleContacts.rows.map(r => ({
    id: r.id, name: r.name, company: r.company,
    daysSinceContact: r.days_since_contact
  }));

  const overdueTasksList = overdueTasks.rows.map(r => ({
    id: r.id, title: r.title, dueDate: r.due_date, relatedTo: r.related_to
  }));

  // ── Prompt para la IA ────────────────────────────────────────────────────
  const systemPrompt = `Eres Antü, el asistente de ventas inteligente de un CRM empresarial.
Tu tarea es generar un briefing diario personalizado y accionable para el vendedor.
Responde ÚNICAMENTE con JSON válido. Sin markdown, sin texto antes o después del JSON.`;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const userPrompt = `Genera un briefing diario para ${firstName}.

DATOS DEL DÍA (${today}):
- Pipeline activo: $${pipelineValue.toLocaleString()} (${pipeline.rows[0]?.active_count || 0} oportunidades)
- Cerrado este mes: $${wonThisMonth.toLocaleString()}
- Meta mensual: $${monthlyGoal.toLocaleString()}
- Gap para meta: $${pipelineGap.toLocaleString()}
- Oportunidades estancadas >14 días: ${atRiskDeals.length}
- Contactos sin actividad >30 días: ${staleContactsList.length}
- Tareas vencidas: ${overdueTasksList.length}

Oportunidades en riesgo:
${atRiskDeals.map(d => `- "${sanitizeForPrompt(d.name, 80)}" (${d.stage}): ${d.daysStuck} días sin avance, $${d.value.toLocaleString()}`).join('\n') || 'Ninguna'}

Contactos descuidados:
${staleContactsList.map(c => `- ${sanitizeForPrompt(c.name, 60)} (${sanitizeForPrompt(c.company, 60) || 'sin empresa'}): ${c.daysSinceContact} días sin contacto`).join('\n') || 'Ninguno'}

Tareas vencidas:
${overdueTasksList.map(t => `- "${sanitizeForPrompt(t.title, 80)}" (venció ${t.dueDate})`).join('\n') || 'Ninguna'}

Responde con este JSON exacto:
{
  "greeting": "${saludo}, ${firstName}! [frase motivadora corta según el contexto del vendedor]",
  "summary": "[2 oraciones: estado general del día y qué debe priorizarse]",
  "pipeline_health": "[excelente|bueno|en_riesgo|critico según los datos]",
  "top_action": "[La UNA acción más importante que debe hacer hoy, específica y concreta]",
  "insights": [
    "[insight accionable 1]",
    "[insight accionable 2]",
    "[insight accionable 3]"
  ]
}`;

  let aiResponse: any = {
    greeting: `${saludo}, ${firstName}! Aquí está tu resumen del día.`,
    summary: `Tienes ${atRiskDeals.length} oportunidades en riesgo y ${overdueTasksList.length} tareas vencidas. Revisa tu pipeline hoy.`,
    pipeline_health: pipelineGap > pipelineValue * 0.5 ? 'critico' : pipelineGap > 0 ? 'en_riesgo' : 'bueno',
    top_action: atRiskDeals.length > 0 ? `Contacta a ${atRiskDeals[0].clientName || 'el cliente'} sobre "${atRiskDeals[0].name}" que lleva ${atRiskDeals[0].daysStuck} días sin avance.` : 'Revisa tu pipeline y agenda seguimientos para hoy.',
    insights: ['Mantén tu pipeline actualizado diariamente.', 'Un contacto a tiempo puede salvar una oportunidad.', 'Foco en calidad sobre cantidad de oportunidades.']
  };

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) aiResponse = { ...aiResponse, ...JSON.parse(match[0]) };
  } catch {
    // Usar fallback ya definido arriba
  }

  const pipelineHealth = ['excelente','bueno','en_riesgo','critico'].includes(aiResponse.pipeline_health)
    ? aiResponse.pipeline_health as AIDailyBriefing['pipelineHealth']
    : 'bueno';

  // Persistir en DB
  const saved = await query(
    `INSERT INTO ai_briefings
       (tenant_id, user_id, briefing_date, greeting, summary,
        at_risk_deals, stale_contacts, overdue_tasks,
        pipeline_health, pipeline_gap, top_action, insights,
        monthly_goal, won_this_month)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (tenant_id, user_id, briefing_date) DO UPDATE SET
       greeting = EXCLUDED.greeting, summary = EXCLUDED.summary,
       at_risk_deals = EXCLUDED.at_risk_deals, stale_contacts = EXCLUDED.stale_contacts,
       overdue_tasks = EXCLUDED.overdue_tasks, pipeline_health = EXCLUDED.pipeline_health,
       pipeline_gap = EXCLUDED.pipeline_gap, top_action = EXCLUDED.top_action,
       insights = EXCLUDED.insights, monthly_goal = EXCLUDED.monthly_goal,
       won_this_month = EXCLUDED.won_this_month, created_at = NOW()
     RETURNING *`,
    [
      tenantId, userId, today,
      aiResponse.greeting, aiResponse.summary,
      JSON.stringify(atRiskDeals), JSON.stringify(staleContactsList), JSON.stringify(overdueTasksList),
      pipelineHealth, pipelineGap, aiResponse.top_action,
      JSON.stringify(aiResponse.insights || []),
      monthlyGoal, wonThisMonth
    ]
  );

  return mapRow(saved.rows[0]);
}

function mapRow(row: any): AIDailyBriefing {
  return {
    id: row.id,
    briefingDate: row.briefing_date,
    greeting: row.greeting,
    summary: row.summary,
    atRiskDeals: row.at_risk_deals || [],
    staleContacts: row.stale_contacts || [],
    overdueTasks: row.overdue_tasks || [],
    pipelineHealth: row.pipeline_health,
    pipelineGap: parseFloat(row.pipeline_gap || 0),
    topAction: row.top_action,
    insights: row.insights || [],
    monthlyGoal: parseFloat(row.monthly_goal || 0),
    wonThisMonth: parseFloat(row.won_this_month || 0),
    createdAt: row.created_at,
  };
}
