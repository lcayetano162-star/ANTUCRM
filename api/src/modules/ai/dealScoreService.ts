import { query } from '../../shared/config/database';

export interface ScoreFactor {
  name: string;
  label: string;
  value: number;   // contribution to score (-30 to +30)
  detail: string;
}

export interface DealScore {
  score: number;           // 0-100
  label: 'Caliente' | 'Tibio' | 'Frío' | 'Perdido';
  color: 'green' | 'yellow' | 'orange' | 'red';
  factors: ScoreFactor[];
  rationale: string;
}

function scoreLabel(score: number): DealScore['label'] {
  if (score >= 70) return 'Caliente';
  if (score >= 45) return 'Tibio';
  if (score >= 20) return 'Frío';
  return 'Perdido';
}

function scoreColor(score: number): DealScore['color'] {
  if (score >= 70) return 'green';
  if (score >= 45) return 'yellow';
  if (score >= 20) return 'orange';
  return 'red';
}

export async function scoreDeal(tenantId: string, opportunityId: string): Promise<DealScore> {
  // Gather all data needed for scoring in one query
  const res = await query(
    `SELECT o.*,
            EXTRACT(EPOCH FROM (NOW() - MAX(a.performed_at)))/86400 AS days_since_activity,
            COUNT(DISTINCT a.id) AS activity_count,
            COUNT(DISTINCT co.id) AS contact_count,
            COUNT(DISTINCT q.id) AS quote_count,
            MAX(q.status) AS latest_quote_status
     FROM opportunities o
     LEFT JOIN activities a ON a.related_to_id = o.id AND a.tenant_id = o.tenant_id
     LEFT JOIN contacts co ON co.client_id = o.client_id AND co.tenant_id = o.tenant_id
     LEFT JOIN quotes q ON q.opportunity_id = o.id AND q.status NOT IN ('cancelled')
     WHERE o.id = $1 AND o.tenant_id = $2
     GROUP BY o.id`,
    [opportunityId, tenantId]
  );

  if (res.rows.length === 0) throw new Error('Oportunidad no encontrada');
  const d = res.rows[0];

  const factors: ScoreFactor[] = [];
  let score = 0;

  // ── Factor 1: Etapa del pipeline ──────────────────────────────────────────
  const STAGE_SCORES: Record<string, number> = {
    qualify: 10, proposal: 25, negotiation: 35, closed_won: 50, closed_lost: 0
  };
  const stageScore = STAGE_SCORES[d.stage] ?? 15;
  factors.push({
    name: 'stage', label: 'Etapa del pipeline',
    value: stageScore,
    detail: `Etapa actual: ${d.stage} (+${stageScore} pts)`
  });
  score += stageScore;

  // ── Factor 2: Días desde última actividad ─────────────────────────────────
  const daysSince = d.days_since_activity ? Math.floor(parseFloat(d.days_since_activity)) : 999;
  let actScore = 0;
  let actDetail = '';
  if (daysSince <= 3)       { actScore = 20; actDetail = 'Actividad en los últimos 3 días — muy activo'; }
  else if (daysSince <= 7)  { actScore = 15; actDetail = `Última actividad hace ${daysSince} días`; }
  else if (daysSince <= 14) { actScore = 8;  actDetail = `Última actividad hace ${daysSince} días`; }
  else if (daysSince <= 30) { actScore = 0;  actDetail = `Última actividad hace ${daysSince} días — necesita atención`; }
  else                      { actScore = -15; actDetail = `Sin actividad en ${daysSince} días — riesgo de enfriamiento`; }
  factors.push({ name: 'activity_recency', label: 'Recencia de contacto', value: actScore, detail: actDetail });
  score += actScore;

  // ── Factor 3: Probabilidad configurada ────────────────────────────────────
  const prob = parseInt(d.probability || 0);
  const probScore = Math.round(prob * 0.12); // max +12 pts
  factors.push({
    name: 'probability', label: 'Probabilidad asignada',
    value: probScore,
    detail: `Probabilidad: ${prob}% → ${probScore} pts`
  });
  score += probScore;

  // ── Factor 4: Fecha de cierre ─────────────────────────────────────────────
  let closeScore = 0;
  let closeDetail = 'Sin fecha de cierre definida';
  if (d.expected_close_date) {
    const daysToClose = Math.floor((new Date(d.expected_close_date).getTime() - Date.now()) / 86400000);
    if (daysToClose < 0)       { closeScore = -10; closeDetail = `Vencido hace ${Math.abs(daysToClose)} días — urgente`; }
    else if (daysToClose <= 7) { closeScore = 8;   closeDetail = `Cierre en ${daysToClose} días — próximo cierre`; }
    else if (daysToClose <= 30){ closeScore = 4;   closeDetail = `Cierre en ${daysToClose} días`; }
    else                       { closeScore = 0;   closeDetail = `Cierre en ${daysToClose} días`; }
  }
  factors.push({ name: 'close_date', label: 'Fecha de cierre', value: closeScore, detail: closeDetail });
  score += closeScore;

  // ── Factor 5: Contactos comprometidos ─────────────────────────────────────
  const contactCount = parseInt(d.contact_count || 0);
  const cScore = contactCount >= 3 ? 8 : contactCount >= 1 ? 4 : 0;
  factors.push({
    name: 'contacts', label: 'Contactos registrados',
    value: cScore,
    detail: `${contactCount} contacto(s) — ${contactCount === 0 ? 'sin contactos, riesgo alto' : 'buena cobertura'}`
  });
  score += cScore;

  // ── Factor 6: Cotización enviada ──────────────────────────────────────────
  const qCount = parseInt(d.quote_count || 0);
  let qScore = 0;
  let qDetail = 'Sin cotización enviada';
  if (qCount > 0) {
    if (d.latest_quote_status === 'approved') { qScore = 10; qDetail = 'Cotización aprobada — muy positivo'; }
    else if (d.latest_quote_status === 'sent') { qScore = 7; qDetail = 'Cotización enviada y en revisión'; }
    else { qScore = 3; qDetail = 'Cotización en borrador'; }
  }
  factors.push({ name: 'quote', label: 'Estado de cotización', value: qScore, detail: qDetail });
  score += qScore;

  // ── Normalizar a 0-100 ────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rationale automático ──────────────────────────────────────────────────
  const topPositive = factors.filter(f => f.value > 0).sort((a,b) => b.value - a.value)[0];
  const topNegative = factors.filter(f => f.value < 0).sort((a,b) => a.value - b.value)[0];
  let rationale = `Score ${score}/100 (${scoreLabel(score)}). `;
  if (topPositive) rationale += `Punto fuerte: ${topPositive.detail}. `;
  if (topNegative) rationale += `Riesgo principal: ${topNegative.detail}.`;

  const result: DealScore = {
    score,
    label: scoreLabel(score),
    color: scoreColor(score),
    factors,
    rationale
  };

  // ── Persist score in DB ───────────────────────────────────────────────────
  await query(
    `UPDATE opportunities SET
       ai_deal_score = $1,
       ai_score_label = $2,
       ai_score_factors = $3,
       ai_score_rationale = $4,
       ai_score_updated_at = NOW()
     WHERE id = $5 AND tenant_id = $6`,
    [score, result.label, JSON.stringify(factors), rationale, opportunityId, tenantId]
  );

  return result;
}

export async function batchScoreDeals(tenantId: string): Promise<{ scored: number; errors: number }> {
  const opps = await query(
    `SELECT id FROM opportunities
     WHERE tenant_id = $1 AND status = 'active' AND stage NOT IN ('closed_won','closed_lost')`,
    [tenantId]
  );

  let scored = 0, errors = 0;
  for (const opp of opps.rows) {
    try {
      await scoreDeal(tenantId, opp.id);
      scored++;
    } catch {
      errors++;
    }
  }
  return { scored, errors };
}
