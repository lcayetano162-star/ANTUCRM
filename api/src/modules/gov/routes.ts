// ============================================================
// ANTU CRM — Gov Module Routes (Ley 47-25 RD)
// Endpoints: checklist CRUD + AI-ready portal sync
// ============================================================
import { Router, Request, Response } from 'express';
import { query } from '../../shared/config/database';
import { authenticateToken } from '../../shared/middleware/auth';
import { checkGovAccess } from './middleware';

const router = Router();

// Apply auth + gov-module check to all routes
router.use(authenticateToken as any, checkGovAccess as any);

// ── Templates de requisitos por tipo de proceso ───────────────
const TEMPLATES: Record<string, Array<{ name: string; category: string; description?: string; is_mandatory: boolean }>> = {
  'Compra Menor': [
    { name: 'Registro de Proveedor del Estado (RPE) actualizado', category: 'Legal', is_mandatory: true, description: 'RPE vigente emitido por DGCP bajo Ley 47-25' },
    { name: 'Certificación de la DGII (sin deuda fiscal)', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la TSS (sin deuda SS)', category: 'Legal', is_mandatory: true },
    { name: 'Cotización de precios firmada', category: 'Económica', is_mandatory: true },
    { name: 'Declaración Jurada de no conflicto de interés', category: 'Declaración Jurada', is_mandatory: true },
  ],
  'Selección Abreviada': [
    { name: 'Registro de Proveedor del Estado (RPE) actualizado', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la DGII', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la TSS', category: 'Legal', is_mandatory: true },
    { name: 'Estados financieros auditados (último año)', category: 'Económica', is_mandatory: true },
    { name: 'Propuesta técnica', category: 'Técnica', is_mandatory: true },
    { name: 'Propuesta económica sellada', category: 'Económica', is_mandatory: true },
    { name: 'Garantía de Seriedad de la Oferta', category: 'Económica', is_mandatory: true },
    { name: 'Declaración Jurada de no conflicto de interés', category: 'Declaración Jurada', is_mandatory: true },
  ],
  'Licitación Pública': [
    { name: 'Registro de Proveedor del Estado (RPE) actualizado', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la DGII', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la TSS', category: 'Legal', is_mandatory: true },
    { name: 'Acta constitutiva y estatutos sociales', category: 'Legal', is_mandatory: true },
    { name: 'Estados financieros auditados (últimos 3 años)', category: 'Económica', is_mandatory: true },
    { name: 'Línea de crédito bancario o capacidad financiera', category: 'Económica', is_mandatory: true },
    { name: 'Propuesta técnica detallada', category: 'Técnica', is_mandatory: true },
    { name: 'Cronograma de ejecución', category: 'Técnica', is_mandatory: true },
    { name: 'Propuesta económica sellada', category: 'Económica', is_mandatory: true },
    { name: 'Garantía de Seriedad de la Oferta (2% del monto)', category: 'Económica', is_mandatory: true },
    { name: 'Declaración Jurada de no conflicto de interés', category: 'Declaración Jurada', is_mandatory: true },
    { name: 'Declaración Jurada Ley 311-14 (soborno)', category: 'Declaración Jurada', is_mandatory: true },
  ],
  'Comparación de Precios': [
    { name: 'Registro de Proveedor del Estado (RPE) actualizado', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la DGII', category: 'Legal', is_mandatory: true },
    { name: 'Cotización económica', category: 'Económica', is_mandatory: true },
  ],
  'Subasta Inversa Electrónica': [
    { name: 'Registro de Proveedor del Estado (RPE) actualizado', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la DGII', category: 'Legal', is_mandatory: true },
    { name: 'Certificación de la TSS', category: 'Legal', is_mandatory: true },
    { name: 'Ficha técnica del producto/servicio', category: 'Técnica', is_mandatory: true },
    { name: 'Oferta económica electrónica', category: 'Económica', is_mandatory: true },
  ],
};

// ── GET /api/gov/checklist/:opportunity_id ────────────────────
router.get('/checklist/:opportunity_id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { opportunity_id } = req.params;

    // Verify opportunity belongs to tenant and is a gov opportunity
    const oppCheck = await query(
      `SELECT id, name, is_gov, gov_type, gov_process_id, submission_deadline
         FROM opportunities
        WHERE id = $1 AND tenant_id = $2`,
      [opportunity_id, user.tenant_id]
    );
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    const checklist = await query(
      `SELECT gc.*,
              u1.first_name || ' ' || u1.last_name AS uploaded_by_name,
              u2.first_name || ' ' || u2.last_name AS verified_by_name
         FROM gov_checklist gc
         LEFT JOIN users u1 ON gc.uploaded_by = u1.id
         LEFT JOIN users u2 ON gc.verified_by = u2.id
        WHERE gc.opportunity_id = $1 AND gc.tenant_id = $2
        ORDER BY gc.sort_order, gc.category, gc.created_at`,
      [opportunity_id, user.tenant_id]
    );

    res.json({
      opportunity: oppCheck.rows[0],
      checklist: checklist.rows,
    });
  } catch (err) {
    console.error('[Gov] Error obteniendo checklist:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/gov/checklist ───────────────────────────────────
// Crea un ítem de checklist. Si body.use_template=true, carga plantilla.
router.post('/checklist', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { opportunity_id, use_template, name, category, description, is_mandatory, sort_order } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({ error: 'opportunity_id es requerido' });
    }

    // Verify opportunity ownership
    const oppCheck = await query(
      `SELECT id, gov_type FROM opportunities WHERE id = $1 AND tenant_id = $2`,
      [opportunity_id, user.tenant_id]
    );
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    // Template auto-load
    if (use_template) {
      const govType = oppCheck.rows[0].gov_type;
      const items = TEMPLATES[govType] || TEMPLATES['Compra Menor'];

      const inserted: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const row = await query(
          `INSERT INTO gov_checklist
             (tenant_id, opportunity_id, name, category, description, is_mandatory, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING
           RETURNING *`,
          [user.tenant_id, opportunity_id, item.name, item.category, item.description || null, item.is_mandatory, i]
        );
        if (row.rows[0]) inserted.push(row.rows[0]);
      }
      return res.status(201).json({ loaded: inserted.length, items: inserted });
    }

    // Single item creation
    if (!name || !category) {
      return res.status(400).json({ error: 'name y category son requeridos' });
    }
    const VALID_CATEGORIES = ['Legal', 'Técnica', 'Económica', 'Declaración Jurada'];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'category inválida', valid: VALID_CATEGORIES });
    }

    const result = await query(
      `INSERT INTO gov_checklist
         (tenant_id, opportunity_id, name, category, description, is_mandatory, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [user.tenant_id, opportunity_id, name, category, description || null, is_mandatory !== false, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Gov] Error creando checklist item:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /api/gov/checklist/:id ──────────────────────────────
router.patch('/checklist/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, version_47_25_compliant, name, category, description, is_mandatory } = req.body;

    const VALID_STATUSES = ['pending', 'uploaded', 'verified'];
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status inválido', valid: VALID_STATUSES });
    }

    const VALID_CATEGORIES = ['Legal', 'Técnica', 'Económica', 'Declaración Jurada'];
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'category inválida', valid: VALID_CATEGORIES });
    }

    // Build dynamic update
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(status);
      if (status === 'uploaded') {
        sets.push(`uploaded_by = $${idx++}`, `uploaded_at = NOW()`);
        params.push(user.userId);
      }
      if (status === 'verified') {
        sets.push(`verified_by = $${idx++}`, `verification_timestamp = NOW()`);
        params.push(user.userId);
      }
    }
    if (version_47_25_compliant !== undefined) { sets.push(`version_47_25_compliant = $${idx++}`); params.push(version_47_25_compliant); }
    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
    if (category !== undefined) { sets.push(`category = $${idx++}`); params.push(category); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description); }
    if (is_mandatory !== undefined) { sets.push(`is_mandatory = $${idx++}`); params.push(is_mandatory); }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(req.params.id, user.tenant_id);
    const result = await query(
      `UPDATE gov_checklist SET ${sets.join(', ')}, updated_at = NOW()
        WHERE id = $${idx} AND tenant_id = $${idx + 1}
        RETURNING *`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Gov] Error actualizando checklist item:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /api/gov/checklist/:id ─────────────────────────────
router.delete('/checklist/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'DELETE FROM gov_checklist WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });
    res.json({ message: 'Ítem eliminado' });
  } catch (err) {
    console.error('[Gov] Error eliminando checklist item:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/gov/sync-portal ─────────────────────────────────
// AI-Ready: stub para integración con Portal DGCP / Gemini / Antigravity
// El cuerpo acepta { opportunity_id, gov_process_id } y devuelve
// un JSON estructurado que el frontend puede mostrar o inyectar al checklist.
router.post('/sync-portal', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { opportunity_id, gov_process_id } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({ error: 'opportunity_id es requerido' });
    }

    // Sanitize gov_process_id: only alphanumeric, hyphens and dots allowed.
    // This prevents prompt injection when this value is later interpolated into
    // an AI system prompt (see AI-READY CONTRACT comment below).
    if (gov_process_id !== undefined && gov_process_id !== null) {
      const GOV_PROCESS_ID_RE = /^[A-Za-z0-9\-\.]{1,64}$/;
      if (!GOV_PROCESS_ID_RE.test(String(gov_process_id))) {
        return res.status(400).json({
          error: 'gov_process_id inválido. Solo se permiten letras, números, guiones y puntos (máx 64 caracteres).'
        });
      }
    }

    const oppCheck = await query(
      `SELECT id, name, gov_type, gov_process_id, submission_deadline
         FROM opportunities WHERE id = $1 AND tenant_id = $2`,
      [opportunity_id, user.tenant_id]
    );
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    const opp = oppCheck.rows[0];
    const processId = gov_process_id || opp.gov_process_id;

    // Update gov_process_id if provided
    if (gov_process_id && gov_process_id !== opp.gov_process_id) {
      await query(
        'UPDATE opportunities SET gov_process_id = $1, updated_at = NOW() WHERE id = $2',
        [gov_process_id, opportunity_id]
      );
    }

    // ── AI-READY CONTRACT ─────────────────────────────────────
    // When Gemini/Antigravity is connected, replace this stub with:
    //   const aiRes = await geminiClient.chat({ systemPrompt: DGCP_SYSTEM_PROMPT, ... })
    //
    // DGCP_SYSTEM_PROMPT = `Eres un consultor legal experto en la Ley 47-25 de República
    //   Dominicana (Nueva Ley de Compras y Contrataciones Públicas, vigente enero 2026).
    //   Analiza el pliego de condiciones del proceso ${processId} y devuelve un JSON con
    //   los requisitos obligatorios estructurados por categoría.`
    //
    // Expected AI response shape (pass directly to checklist auto-create):
    // {
    //   process_id: string,
    //   institution: string,
    //   object: string,
    //   requirements: Array<{ name, category, is_mandatory, description, version_47_25_compliant }>
    // }

    const stubResponse = {
      source: 'dgcp_portal_stub',
      ai_ready: true,
      process_id: processId || 'PENDING',
      institution: 'Portal DGCP — Integración pendiente',
      object: opp.name,
      gov_type: opp.gov_type,
      submission_deadline: opp.submission_deadline,
      message: 'Sincronización con Portal DGCP lista para integración con IA (Gemini/Antigravity). Los requisitos se cargarán automáticamente al conectar el proveedor de IA.',
      requirements_preview: TEMPLATES[opp.gov_type] || TEMPLATES['Compra Menor'],
    };

    res.json(stubResponse);
  } catch (err) {
    console.error('[Gov] Error en sync-portal:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/gov/templates ────────────────────────────────────
router.get('/templates', async (_req: Request, res: Response) => {
  res.json({ templates: TEMPLATES, gov_types: Object.keys(TEMPLATES) });
});

export default router;
