import { pool, query } from '../../shared/config/database';

export interface StageScenario {
  stage: string;
  stageName: string;
  count: number;
  totalValue: number;
  weightedPessimistic: number;
  weightedRealistic: number;
  weightedOptimistic: number;
}

export interface ForecastScenario {
  label: string;
  multiplier: number;
  total: number;
  color: string;
}

export interface ForecastResult {
  stages: StageScenario[];
  scenarios: ForecastScenario[];
  pipelineTotal: number;
  activeCount: number;
  avgDealSize: number;
  closingThisMonth: number;
  closingThisMonthValue: number;
  historicalWinRate: number;
  generatedAt: string;
}

// Historical close rates by stage (calibrated from typical CRM data)
const STAGE_CLOSE_RATES: Record<string, number> = {
  qualify: 0.10,
  analysis: 0.22,
  proposal: 0.40,
  negotiation: 0.68,
};

const STAGE_NAMES: Record<string, string> = {
  qualify: 'Calificación',
  analysis: 'Análisis',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
};

export async function getForecast(tenantId: string, forceRefresh = false): Promise<ForecastResult> {
  // Cache: 30 min
  if (!forceRefresh) {
    const cached = await query(
      `SELECT forecast, created_at FROM ai_forecast_cache
       WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 minutes'`,
      [tenantId]
    );
    if (cached.rows.length > 0) return cached.rows[0].forecast as ForecastResult;
  }

  // Active pipeline
  const pipelineRes = await query(
    `SELECT o.stage,
            COUNT(*)::int AS count,
            SUM(o.estimated_revenue) AS total_value,
            AVG(o.probability) AS avg_prob
     FROM opportunities o
     WHERE o.tenant_id = $1
       AND o.status = 'active'
       AND o.stage NOT IN ('closed_won','closed_lost')
     GROUP BY o.stage`,
    [tenantId]
  );

  // Historical win rate (last 90 days)
  const winRes = await query(
    `SELECT
       COUNT(*) FILTER (WHERE stage = 'closed_won')::int AS won,
       COUNT(*)::int AS total
     FROM opportunities
     WHERE tenant_id = $1 AND stage IN ('closed_won','closed_lost')
       AND updated_at > NOW() - INTERVAL '90 days'`,
    [tenantId]
  );
  const histWon = winRes.rows[0]?.won || 0;
  const histTotal = winRes.rows[0]?.total || 0;
  const historicalWinRate = histTotal > 0 ? Math.round((histWon / histTotal) * 100) : 25;

  // Closing this month
  const closingRes = await query(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(estimated_revenue),0) AS value
     FROM opportunities
     WHERE tenant_id = $1
       AND status = 'active'
       AND stage NOT IN ('closed_won','closed_lost')
       AND expected_close_date >= date_trunc('month', NOW())
       AND expected_close_date < date_trunc('month', NOW()) + INTERVAL '1 month'`,
    [tenantId]
  );

  const stages: StageScenario[] = pipelineRes.rows.map(row => {
    const baseRate = STAGE_CLOSE_RATES[row.stage] ?? 0.15;
    const tv = parseFloat(row.total_value || 0);
    return {
      stage: row.stage,
      stageName: STAGE_NAMES[row.stage] || row.stage,
      count: row.count,
      totalValue: Math.round(tv),
      weightedPessimistic: Math.round(tv * baseRate * 0.6),
      weightedRealistic:   Math.round(tv * baseRate),
      weightedOptimistic:  Math.round(tv * baseRate * 1.4),
    };
  }).sort((a, b) => {
    const order = ['qualify','analysis','proposal','negotiation'];
    return order.indexOf(a.stage) - order.indexOf(b.stage);
  });

  const pess = stages.reduce((s, r) => s + r.weightedPessimistic, 0);
  const real = stages.reduce((s, r) => s + r.weightedRealistic, 0);
  const opti = stages.reduce((s, r) => s + r.weightedOptimistic, 0);
  const pipelineTotal = stages.reduce((s, r) => s + r.totalValue, 0);
  const activeCount = stages.reduce((s, r) => s + r.count, 0);
  const avgDealSize = activeCount > 0 ? Math.round(pipelineTotal / activeCount) : 0;

  const scenarios: ForecastScenario[] = [
    { label: 'Pesimista',  multiplier: 0.6,  total: pess, color: 'red' },
    { label: 'Realista',   multiplier: 1.0,  total: real, color: 'blue' },
    { label: 'Optimista',  multiplier: 1.4,  total: opti, color: 'green' },
  ];

  const result: ForecastResult = {
    stages,
    scenarios,
    pipelineTotal,
    activeCount,
    avgDealSize,
    closingThisMonth: closingRes.rows[0]?.count || 0,
    closingThisMonthValue: Math.round(parseFloat(closingRes.rows[0]?.value || 0)),
    historicalWinRate,
    generatedAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO ai_forecast_cache (tenant_id, forecast)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id) DO UPDATE SET forecast=$2, created_at=NOW()`,
    [tenantId, JSON.stringify(result)]
  );

  return result;
}
