import { pool, query } from '../../shared/config/database';
import { callAI } from './aiService';

export interface RepStats {
  userId: string;
  name: string;
  won: number;
  lost: number;
  winRate: number;
  avgDealValue: number;
  avgDaysToClose: number;
  coaching?: string;
}

export interface CoachAnalysis {
  periodDays: number;
  totalWon: number;
  totalLost: number;
  overallWinRate: number;
  avgWonValue: number;
  avgLostValue: number;
  topWinStage: string;
  topLossStage: string;
  winPatterns: string[];
  lossPatterns: string[];
  keyRecommendations: string[];
  reps: RepStats[];
  generatedAt: string;
}

export async function getCoachAnalysis(tenantId: string, periodDays = 90, forceRefresh = false): Promise<CoachAnalysis> {
  // Check cache (max 6h)
  if (!forceRefresh) {
    const cached = await query(
      `SELECT analysis, created_at FROM ai_coach_cache
       WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '6 hours'`,
      [tenantId]
    );
    if (cached.rows.length > 0) return cached.rows[0].analysis as CoachAnalysis;
  }

  const since = `NOW() - INTERVAL '${periodDays} days'`;

  // ── 1. Closed deals in period ──────────────────────────────────────────────
  const dealsRes = await query(
    `SELECT o.id, o.name, o.stage, o.estimated_revenue, o.probability,
            o.created_at, o.actual_close_date,
            EXTRACT(EPOCH FROM (o.actual_close_date::timestamp - o.created_at))/86400 AS days_to_close,
            u.id as user_id,
            u.first_name || ' ' || u.last_name AS rep_name,
            c.name AS client_name
     FROM opportunities o
     LEFT JOIN users u ON o.owner_id = u.id
     LEFT JOIN clients c ON o.client_id = c.id
     WHERE o.tenant_id = $1
       AND o.stage IN ('closed_won','closed_lost')
       AND o.updated_at > ${since}
     ORDER BY o.updated_at DESC`,
    [tenantId]
  );
  const deals = dealsRes.rows;

  const won  = deals.filter(d => d.stage === 'closed_won');
  const lost = deals.filter(d => d.stage === 'closed_lost');

  // ── 2. Per-rep stats ───────────────────────────────────────────────────────
  const repMap: Record<string, RepStats & { wonValue: number; days: number[] }> = {};
  for (const d of deals) {
    if (!d.user_id) continue;
    if (!repMap[d.user_id]) {
      repMap[d.user_id] = { userId: d.user_id, name: d.rep_name, won: 0, lost: 0, winRate: 0, avgDealValue: 0, avgDaysToClose: 0, wonValue: 0, days: [] };
    }
    const r = repMap[d.user_id];
    if (d.stage === 'closed_won') { r.won++; r.wonValue += parseFloat(d.estimated_revenue || 0); }
    else r.lost++;
    if (d.days_to_close > 0) r.days.push(parseFloat(d.days_to_close));
  }

  const reps: RepStats[] = Object.values(repMap).map(r => ({
    userId: r.userId,
    name: r.name,
    won: r.won,
    lost: r.lost,
    winRate: r.won + r.lost > 0 ? Math.round((r.won / (r.won + r.lost)) * 100) : 0,
    avgDealValue: r.won > 0 ? Math.round(r.wonValue / r.won) : 0,
    avgDaysToClose: r.days.length > 0 ? Math.round(r.days.reduce((a, b) => a + b, 0) / r.days.length) : 0,
  })).sort((a, b) => b.winRate - a.winRate);

  const overallWinRate = deals.length > 0 ? Math.round((won.length / deals.length) * 100) : 0;
  const avgWonValue = won.length > 0 ? Math.round(won.reduce((s, d) => s + parseFloat(d.estimated_revenue || 0), 0) / won.length) : 0;
  const avgLostValue = lost.length > 0 ? Math.round(lost.reduce((s, d) => s + parseFloat(d.estimated_revenue || 0), 0) / lost.length) : 0;

  // ── 3. Stage where most losses happen ─────────────────────────────────────
  const stageCount = (list: typeof deals) => {
    const m: Record<string, number> = {};
    list.forEach(d => { m[d.stage] = (m[d.stage] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  // ── 4. AI analysis if deals exist ─────────────────────────────────────────
  let winPatterns: string[] = [];
  let lossPatterns: string[] = [];
  let keyRecommendations: string[] = [];
  let repCoaching: Record<string, string> = {};

  if (deals.length > 0) {
    const wonSummary = won.slice(0, 5).map(d =>
      `- ${d.name} ($${Number(d.estimated_revenue||0).toLocaleString()}, ${Math.round(d.days_to_close||0)} días, rep: ${d.rep_name})`
    ).join('\n') || '- Sin datos';

    const lostSummary = lost.slice(0, 5).map(d =>
      `- ${d.name} ($${Number(d.estimated_revenue||0).toLocaleString()}, rep: ${d.rep_name})`
    ).join('\n') || '- Sin datos';

    const repSummary = reps.slice(0, 5).map(r =>
      `- ${r.name}: ${r.won}G/${r.lost}P (${r.winRate}% win rate, prom. ${r.avgDaysToClose} días)`
    ).join('\n');

    const system = 'Eres un coach de ventas experto. Analiza los datos y responde SOLO con JSON válido.';
    const prompt = `Analiza estos resultados de ventas de los últimos ${periodDays} días:

GANADAS (${won.length}):
${wonSummary}

PERDIDAS (${lost.length}):
${lostSummary}

WIN RATE GENERAL: ${overallWinRate}%
VALOR PROMEDIO GANADAS: $${avgWonValue.toLocaleString()}
VALOR PROMEDIO PERDIDAS: $${avgLostValue.toLocaleString()}

RENDIMIENTO POR VENDEDOR:
${repSummary}

Responde con este JSON:
{
  "winPatterns": ["patrón de éxito 1", "patrón de éxito 2", "patrón de éxito 3"],
  "lossPatterns": ["patrón de pérdida 1", "patrón de pérdida 2", "patrón de pérdida 3"],
  "keyRecommendations": ["recomendación accionable 1", "recomendación 2", "recomendación 3"],
  "repCoaching": {
    "nombre_vendedor": "coaching personalizado en 1-2 frases"
  }
}`;

    try {
      const raw = await callAI(system, prompt);
      const clean = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean);
      winPatterns = parsed.winPatterns || [];
      lossPatterns = parsed.lossPatterns || [];
      keyRecommendations = parsed.keyRecommendations || [];
      repCoaching = parsed.repCoaching || {};
    } catch {
      // fallback sin AI
      winPatterns = overallWinRate >= 50
        ? ['Buen ratio de cierre general', 'Deals de mayor valor se cierran mejor']
        : ['Los deals pequeños cierran más fácil', 'El seguimiento rápido mejora resultados'];
      lossPatterns = ['Ciclo de venta largo aumenta riesgo', 'Deals de alto valor necesitan más contactos'];
      keyRecommendations = ['Hacer seguimiento en los primeros 7 días', 'Involucrar más contactos en deals grandes'];
    }

    // Assign coaching to reps
    reps.forEach(r => {
      r.coaching = repCoaching[r.name] || null as any;
    });
  }

  const analysis: CoachAnalysis = {
    periodDays,
    totalWon: won.length,
    totalLost: lost.length,
    overallWinRate,
    avgWonValue,
    avgLostValue,
    topWinStage: 'closed_won',
    topLossStage: stageCount(lost),
    winPatterns,
    lossPatterns,
    keyRecommendations,
    reps,
    generatedAt: new Date().toISOString()
  };

  // Cache result
  await pool.query(
    `INSERT INTO ai_coach_cache (tenant_id, analysis, period_days)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id) DO UPDATE SET analysis=$2, period_days=$3, created_at=NOW()`,
    [tenantId, JSON.stringify(analysis), periodDays]
  );

  return analysis;
}
