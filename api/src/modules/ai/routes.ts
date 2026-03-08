import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../shared/middleware/auth';
import { getAIConfig, encryptKey, decryptKey, analyzeContact, getSalesRecommendations } from './aiService';
import { getDailyBriefing, regenerateBriefing } from './briefingService';
import { generateMeetingPrep } from './meetingPrepService';
import { scoreDeal, batchScoreDeals } from './dealScoreService';
import { getCoachAnalysis } from './coachService';
import { getForecast } from './forecastService';
import { getRelationshipMap } from './relationshipMapService';
import { query } from '../../shared/config/database';

const router = Router();

// ── Super Admin only: GET config ─────────────────────────────────────────────
router.get('/config', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.isLandlord) return res.status(403).json({ error: 'Solo Super Admin' });
  try {
    const cfg = await getAIConfig();
    if (!cfg) return res.json({ configured: false });
    // Never return the raw key
    const { api_key_enc, ...safe } = cfg;
    res.json({ configured: true, ...safe, api_key_set: !!api_key_enc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Super Admin only: PUT config ─────────────────────────────────────────────
router.put('/config', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.isLandlord) return res.status(403).json({ error: 'Solo Super Admin' });
  try {
    const { provider, api_key, model, is_active,
            enable_contact_analysis, enable_sales_recommendations, enable_route_planner } = req.body;
    if (!provider || !['claude','openai','gemini'].includes(provider)) {
      return res.status(400).json({ error: 'provider inválido' });
    }

    const existing = await getAIConfig();
    // Only update api_key_enc if a new key is provided
    let api_key_enc = existing?.api_key_enc || null;
    if (api_key && api_key.trim() && !api_key.startsWith('sk-***')) {
      api_key_enc = encryptKey(api_key.trim());
    }
    if (!api_key_enc) return res.status(400).json({ error: 'Se requiere una API key' });

    if (existing) {
      await query(
        `UPDATE ai_global_config SET provider=$1, api_key_enc=$2, model=$3, is_active=$4,
         enable_contact_analysis=$5, enable_sales_recommendations=$6, enable_route_planner=$7, updated_at=NOW()
         WHERE id=$8`,
        [provider, api_key_enc, model || 'claude-sonnet-4-6', is_active !== false,
         enable_contact_analysis !== false, enable_sales_recommendations !== false,
         enable_route_planner !== false, existing.id]
      );
    } else {
      await query(
        `INSERT INTO ai_global_config (provider, api_key_enc, model, is_active,
          enable_contact_analysis, enable_sales_recommendations, enable_route_planner)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [provider, api_key_enc, model || 'claude-sonnet-4-6', is_active !== false,
         enable_contact_analysis !== false, enable_sales_recommendations !== false,
         enable_route_planner !== false]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Super Admin only: POST test ───────────────────────────────────────────────
router.post('/test', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.isLandlord) return res.status(403).json({ error: 'Solo Super Admin' });
  try {
    const { callAI } = await import('./aiService');
    const result = await callAI(
      'You are a helpful assistant. Respond only with valid JSON.',
      'Respond with exactly: {"status":"ok","message":"Conexión exitosa con Antü CRM"}'
    );
    res.json({ success: true, response: result });
  } catch (err: any) {
    const msg = err.message || 'Error desconocido';
    // Provide actionable error messages for common Anthropic errors
    let hint = '';
    if (msg.includes('401') || msg.includes('authentication') || msg.includes('api_key')) {
      hint = 'API key inválida. Verifica que comience con sk-ant-api03- y esté correctamente copiada.';
    } else if (msg.includes('403')) {
      hint = 'API key sin permisos. Verifica que la key tenga acceso al modelo seleccionado.';
    } else if (msg.includes('429')) {
      hint = 'Límite de requests alcanzado. Espera unos segundos y vuelve a intentarlo.';
    } else if (msg.includes('circuito')) {
      hint = 'Circuito abierto por fallos previos. Espera 60 segundos y vuelve a intentarlo.';
    }
    res.status(400).json({ success: false, error: hint || msg });
  }
});

// ── Tenant: POST analyze contact ─────────────────────────────────────────────
router.post('/analyze/contact', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { contactId, contactName, contactEmail, clientName } = req.body;
    if (!contactId) return res.status(400).json({ error: 'contactId requerido' });
    const result = await analyzeContact(user.tenant_id, contactId, { name: contactName, email: contactEmail, clientName });
    res.json(result);
  } catch (err: any) {
    const msg = err.message || 'Error en análisis IA';
    const status = msg.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: msg });
  }
});

// ── Tenant: POST sales recommendations ───────────────────────────────────────
router.post('/recommendations/sales', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await getSalesRecommendations(user.tenant_id, user.id);
    res.json(result);
  } catch (err: any) {
    const msg = err.message || 'Error en recomendaciones IA';
    const status = msg.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: msg });
  }
});

// ── Tenant: GET briefing diario (IA que Anticipa) ────────────────────────────
router.get('/briefing', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const briefing = await getDailyBriefing(user.tenant_id, user.id);
    res.json(briefing);
  } catch (err: any) {
    const status = err.message?.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Error generando briefing' });
  }
});

// ── Tenant: POST regenerar briefing (botón "Actualizar") ─────────────────────
router.post('/briefing/regenerate', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const briefing = await regenerateBriefing(user.tenant_id, user.id);
    res.json(briefing);
  } catch (err: any) {
    const status = err.message?.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Error regenerando briefing' });
  }
});

// ── Tenant: POST meeting prep ─────────────────────────────────────────────────
// Genera briefing pre-reunión con IA basado en datos del CRM del cliente
router.post('/meeting-prep', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { client_id, opportunity_id } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id es requerido' });
    const brief = await generateMeetingPrep(user.tenant_id, client_id, opportunity_id);
    res.json(brief);
  } catch (err: any) {
    const status = err.message?.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Error generando briefing de reunión' });
  }
});

// ── Tenant: POST deal score (un deal) ─────────────────────────────────────────
router.post('/deal-score/:opportunityId', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await scoreDeal(user.tenant_id, req.params.opportunityId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error calculando score' });
  }
});

// ── Tenant: POST deal score batch (todos los deals activos) ───────────────────
router.post('/deal-score/batch', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await batchScoreDeals(user.tenant_id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error en batch scoring' });
  }
});

// ── Tenant: GET deal scores pipeline (todos los deals con score) ──────────────
router.get('/deal-scores', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await query(
      `SELECT id, name, stage, estimated_revenue, probability,
              ai_deal_score, ai_score_label, ai_score_factors, ai_score_rationale, ai_score_updated_at
       FROM opportunities
       WHERE tenant_id = $1 AND status = 'active' AND stage NOT IN ('closed_won','closed_lost')
       ORDER BY ai_deal_score DESC NULLS LAST`,
      [user.tenant_id]
    );
    res.json({ deals: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tenant: GET coach win/loss analysis ───────────────────────────────────────
router.get('/coach', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const days = parseInt(req.query.days as string) || 90;
    const refresh = req.query.refresh === 'true';
    const analysis = await getCoachAnalysis(user.tenant_id, days, refresh);
    res.json(analysis);
  } catch (err: any) {
    const status = err.message?.includes('no configurada') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Error generando análisis coach' });
  }
});

// ── Tenant: GET forecast ──────────────────────────────────────────────────────
router.get('/forecast', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const refresh = req.query.refresh === 'true';
    const forecast = await getForecast(user.tenant_id, refresh);
    res.json(forecast);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generando forecast' });
  }
});

// ── Tenant: GET relationship map for a client ──────────────────────────────────
router.get('/relationship-map', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user.tenant_id) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id es requerido' });
    const map = await getRelationshipMap(user.tenant_id, client_id as string);
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generando mapa de relaciones' });
  }
});

export default router;
