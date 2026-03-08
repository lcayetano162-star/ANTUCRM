import { Router, Request, Response } from 'express';
import { query, pool } from '../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';
import { requireModule } from '../../shared/middleware/moduleCheck';

const router = Router();

// ── Enforce module enabled per tenant ────────────────────────────────────────
router.use(requireModule('service_desk'));

// ── Role helpers ─────────────────────────────────────────────────────────────
// Roles con acceso supervisor completo al módulo de servicio técnico
const SUPERVISOR_ROLES = ['superadmin', 'admin', 'sales_manager', 'service_supervisor'];
const isSupervisor = (role: string) => SUPERVISOR_ROLES.includes(role);
const isTech       = (role: string) => role === 'service_tech';
const hasSDAccess  = (role: string) => isSupervisor(role) || isTech(role);

// ── Constants ────────────────────────────────────────────────────────────────
const VALID_STATUSES    = ['Open','Pending','In_Progress','Waiting_Parts','Resolved','Closed'] as const;
const VALID_PRIORITIES  = ['Low','Medium','High','Critical'] as const;
const VALID_WO_STATUSES = ['Draft','Scheduled','In_Progress','Completed','Cancelled'] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Campos que un SERVICE_TECH puede modificar en un ticket (no puede reasignar ni cambiar prioridad)
const TECH_ALLOWED_FIELDS = new Set(['status', 'execution_details', 'client_signature']);

// SLA hours per priority
const SLA_HOURS: Record<string, number> = {
  Critical: 4, High: 24, Medium: 72, Low: 168
};

// ── Ticket number generator ─────────────────────────────────────────────────
async function generateTicketNumber(tenantId: string): Promise<string> {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const res = await query(
    `SELECT COUNT(*) FROM service_tickets WHERE tenant_id = $1 AND ticket_number LIKE $2`,
    [tenantId, `TKT-${ym}-%`]
  );
  const n = parseInt(res.rows[0].count) + 1;
  return `TKT-${ym}-${String(n).padStart(4, '0')}`;
}

// ── Work order number generator ──────────────────────────────────────────────
async function generateWONumber(tenantId: string): Promise<string> {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const res = await query(
    `SELECT COUNT(*) FROM service_work_orders WHERE tenant_id = $1 AND work_order_number LIKE $2`,
    [tenantId, `WO-${ym}-%`]
  );
  const n = parseInt(res.rows[0].count) + 1;
  return `WO-${ym}-${String(n).padStart(4, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/service-desk/stats
// SUPERVISOR → métricas del equipo completo
// SERVICE_TECH → solo sus propias métricas (tickets asignados)
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (isTech(user.role)) {
      // Técnico: solo sus propios KPIs
      const myRes = await query(
        `SELECT
            COUNT(*) FILTER (WHERE status NOT IN ('Resolved','Closed'))           AS total_open,
            COUNT(*) FILTER (WHERE status = 'Open')                               AS open_count,
            COUNT(*) FILTER (WHERE status = 'In_Progress')                        AS in_progress_count,
            COUNT(*) FILTER (WHERE status = 'Waiting_Parts')                      AS waiting_parts_count,
            COUNT(*) FILTER (WHERE priority = 'Critical'
                              AND status NOT IN ('Resolved','Closed'))             AS critical_open,
            COUNT(*) FILTER (WHERE status = 'Resolved'
                              AND resolved_at >= date_trunc('month', NOW()))       AS resolved_this_month,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
              FILTER (WHERE status IN ('Resolved','Closed')
                       AND resolved_at IS NOT NULL)                                AS avg_resolution_hours
           FROM service_tickets
          WHERE tenant_id = $1 AND assigned_to = $2`,
        [user.tenant_id, user.id]
      );
      return res.json({ ...myRes.rows[0], scope: 'own', technicians: [] });
    }

    // Supervisor: equipo completo
    const [kpiRes, techRes] = await Promise.all([
      query(
        `SELECT
            COUNT(*) FILTER (WHERE status NOT IN ('Resolved','Closed'))                          AS total_open,
            COUNT(*) FILTER (WHERE status = 'Open')                                             AS open_count,
            COUNT(*) FILTER (WHERE status = 'In_Progress')                                      AS in_progress_count,
            COUNT(*) FILTER (WHERE status = 'Waiting_Parts')                                    AS waiting_parts_count,
            COUNT(*) FILTER (WHERE priority = 'Critical' AND status NOT IN ('Resolved','Closed')) AS critical_open,
            COUNT(*) FILTER (WHERE status = 'Resolved' AND resolved_at >= date_trunc('month', NOW())) AS resolved_this_month,
            COUNT(*) FILTER (WHERE status NOT IN ('Resolved','Closed') AND assigned_to IS NULL) AS unassigned_count,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
              FILTER (WHERE status IN ('Resolved','Closed') AND resolved_at IS NOT NULL)        AS avg_resolution_hours
           FROM service_tickets WHERE tenant_id = $1`,
        [user.tenant_id]
      ),
      query(
        `SELECT u.id, u.first_name || ' ' || u.last_name AS name,
                COUNT(*) FILTER (WHERE st.status NOT IN ('Resolved','Closed'))   AS open_count,
                COUNT(*) FILTER (WHERE st.status IN ('Resolved','Closed')
                                   AND st.resolved_at >= CURRENT_DATE)            AS closed_today
           FROM users u
           LEFT JOIN service_tickets st ON st.assigned_to = u.id AND st.tenant_id = $1
          WHERE u.tenant_id = $1 AND u.role IN ('service_tech','service_supervisor')
          GROUP BY u.id, u.first_name, u.last_name
          ORDER BY open_count DESC
          LIMIT 10`,
        [user.tenant_id]
      )
    ]);
    res.json({ ...kpiRes.rows[0], scope: 'team', technicians: techRes.rows });
  } catch (error) {
    console.error('[ServiceDesk] stats error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/service-desk — list with filters + pagination
// SUPERVISOR → todos los tickets del tenant
// SERVICE_TECH → solo tickets asignados a él
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    const { status, priority, assigned_to, client_id, search,
            page = '1', limit = '50' } = req.query;

    const pageNum  = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));
    const offset   = (pageNum - 1) * limitNum;

    let conds = ['st.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let idx = 2;

    // Técnico solo ve sus tickets asignados (la restricción de assigned_to del query sobrescribe cualquier filtro externo)
    if (isTech(user.role)) {
      conds.push(`st.assigned_to = $${idx++}`);
      params.push(user.id);
    } else {
      if (assigned_to) { conds.push(`st.assigned_to = $${idx++}`); params.push(assigned_to); }
    }

    if (status)    { conds.push(`st.status = $${idx++}`);    params.push(status); }
    if (priority)  { conds.push(`st.priority = $${idx++}`);  params.push(priority); }
    if (client_id) { conds.push(`st.client_id = $${idx++}`); params.push(client_id); }
    if (search) {
      conds.push(`(st.subject ILIKE $${idx} OR st.ticket_number ILIKE $${idx} OR c.name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conds.join(' AND ');
    const result = await query(
      `SELECT st.*,
              c.name AS client_name,
              u.first_name || ' ' || u.last_name AS assigned_to_name,
              (SELECT COUNT(*) FROM service_work_orders wo WHERE wo.ticket_id = st.id) AS work_orders_count
         FROM service_tickets st
         JOIN clients c ON st.client_id = c.id
         LEFT JOIN users u ON st.assigned_to = u.id
        WHERE ${where}
        ORDER BY
          CASE st.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
          st.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    const countRes = await query(
      `SELECT COUNT(*) FROM service_tickets st JOIN clients c ON st.client_id = c.id WHERE ${where}`,
      params
    );

    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count), page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('[ServiceDesk] list error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/service-desk/:id — ticket detail + work orders + parts
// SERVICE_TECH solo puede ver tickets asignados a él
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.id))
      return res.status(400).json({ error: 'ID de ticket inválido' });

    // Construir condición de acceso según rol
    const accessCond = isTech(user.role)
      ? 'st.id = $1 AND st.tenant_id = $2 AND st.assigned_to = $3'
      : 'st.id = $1 AND st.tenant_id = $2';
    const accessParams = isTech(user.role)
      ? [req.params.id, user.tenant_id, user.id]
      : [req.params.id, user.tenant_id];

    const [ticketRes, woRes] = await Promise.all([
      query(
        `SELECT st.*,
                c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
                u.first_name || ' ' || u.last_name AS assigned_to_name,
                cb.first_name || ' ' || cb.last_name AS created_by_name
           FROM service_tickets st
           JOIN clients c ON st.client_id = c.id
           LEFT JOIN users u  ON st.assigned_to = u.id
           LEFT JOIN users cb ON st.created_by  = cb.id
          WHERE ${accessCond}`,
        accessParams
      ),
      query(
        `SELECT wo.*,
                u.first_name || ' ' || u.last_name AS technician_name,
                (SELECT COALESCE(SUM(wop.quantity * wop.unit_cost),0)
                   FROM service_wo_parts wop WHERE wop.work_order_id = wo.id) AS parts_total_cost,
                (SELECT COUNT(*) FROM service_wo_parts wop WHERE wop.work_order_id = wo.id) AS parts_count
           FROM service_work_orders wo
           LEFT JOIN users u ON wo.technician_id = u.id
          WHERE wo.ticket_id = $1
          ORDER BY wo.created_at ASC`,
        [req.params.id]
      )
    ]);

    if (ticketRes.rows.length === 0)
      return res.status(404).json({ error: 'Ticket no encontrado o acceso denegado' });

    res.json({ ...ticketRes.rows[0], work_orders: woRes.rows });
  } catch (error) {
    console.error('[ServiceDesk] getById error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/service-desk — create ticket
// Ambos roles pueden crear tickets
// SERVICE_TECH no puede asignar assigned_to (se ignora si lo envía)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    const { subject, description, priority = 'Medium', client_id,
            asset_model, asset_serial, asset_under_warranty = false,
            assigned_to } = req.body;

    if (!subject || subject.trim().length === 0)
      return res.status(400).json({ error: 'El asunto es requerido' });
    if (subject.length > 255)
      return res.status(400).json({ error: 'El asunto no puede superar 255 caracteres' });
    if (!client_id)
      return res.status(400).json({ error: 'client_id es requerido' });
    if (!UUID_RE.test(client_id))
      return res.status(400).json({ error: 'client_id debe ser un UUID válido' });
    if (!VALID_PRIORITIES.includes(priority))
      return res.status(400).json({ error: 'Prioridad inválida', valid: VALID_PRIORITIES });

    // SERVICE_TECH no puede asignar manualmente — el ticket queda abierto sin asignación
    const effectiveAssignedTo = isTech(user.role) ? null : (assigned_to || null);
    if (effectiveAssignedTo && !UUID_RE.test(effectiveAssignedTo))
      return res.status(400).json({ error: 'assigned_to debe ser un UUID válido' });

    const ticketNumber = await generateTicketNumber(user.tenant_id);
    const status = effectiveAssignedTo ? 'Pending' : 'Open';

    const result = await query(
      `INSERT INTO service_tickets
           (tenant_id, ticket_number, subject, description, priority, status,
            client_id, asset_model, asset_serial, asset_under_warranty, assigned_to, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [user.tenant_id, ticketNumber, subject.trim(), description || null,
       priority, status, client_id,
       asset_model || null, asset_serial || null, Boolean(asset_under_warranty),
       effectiveAssignedTo, user.id || user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[ServiceDesk] create error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/service-desk/:id — update ticket fields
// SUPERVISOR → puede cambiar cualquier campo incluido assigned_to y priority
// SERVICE_TECH → solo puede cambiar status (propios) y execution_details/client_signature
//                NO puede reasignar ni cambiar prioridad
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.id))
      return res.status(400).json({ error: 'ID de ticket inválido' });

    let { subject, description, priority, status,
          asset_model, asset_serial, asset_under_warranty,
          assigned_to, client_signature } = req.body;

    // SERVICE_TECH: verificar que el ticket le pertenece y restringir campos
    if (isTech(user.role)) {
      const owned = await query(
        'SELECT id FROM service_tickets WHERE id = $1 AND tenant_id = $2 AND assigned_to = $3',
        [req.params.id, user.tenant_id, user.id]
      );
      if (owned.rows.length === 0)
        return res.status(403).json({ error: 'Solo puedes modificar tickets asignados a ti' });

      // Ignorar campos no permitidos para técnicos
      subject       = undefined;
      description   = undefined;
      priority      = undefined;
      assigned_to   = undefined;
      asset_model   = undefined;
      asset_serial  = undefined;
      asset_under_warranty = undefined;
    }

    if (priority && !VALID_PRIORITIES.includes(priority))
      return res.status(400).json({ error: 'Prioridad inválida', valid: VALID_PRIORITIES });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: 'Status inválido', valid: VALID_STATUSES });
    if (assigned_to && !UUID_RE.test(assigned_to))
      return res.status(400).json({ error: 'assigned_to debe ser un UUID válido' });

    const result = await query(
      `UPDATE service_tickets
           SET subject              = COALESCE($1, subject),
               description          = COALESCE($2, description),
               priority             = COALESCE($3, priority),
               status               = COALESCE($4, status),
               asset_model          = COALESCE($5, asset_model),
               asset_serial         = COALESCE($6, asset_serial),
               asset_under_warranty = COALESCE($7, asset_under_warranty),
               assigned_to          = COALESCE($8, assigned_to),
               client_signature     = COALESCE($9, client_signature),
               resolved_at = CASE WHEN $4 = 'Resolved' AND resolved_at IS NULL THEN NOW() ELSE resolved_at END,
               signed_at   = CASE WHEN $9 IS NOT NULL AND signed_at IS NULL    THEN NOW() ELSE signed_at   END,
               updated_at           = NOW()
         WHERE id = $10 AND tenant_id = $11 RETURNING *`,
      [subject || null, description || null, priority || null, status || null,
       asset_model || null, asset_serial || null,
       asset_under_warranty !== undefined ? Boolean(asset_under_warranty) : null,
       assigned_to || null, client_signature || null,
       req.params.id, user.tenant_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[ServiceDesk] update error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/service-desk/:id/close — close with digital signature
// Ambos roles pueden registrar la firma (supervisor o técnico presente con el cliente)
// SERVICE_TECH solo puede cerrar tickets asignados a él
router.post('/:id/close', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.id))
      return res.status(400).json({ error: 'ID de ticket inválido' });

    const { client_signature } = req.body;

    if (!client_signature || client_signature.trim().length < 2)
      return res.status(400).json({ error: 'La firma digital del cliente es requerida (nombre completo)' });

    // SERVICE_TECH solo puede cerrar sus propios tickets
    const accessCond = isTech(user.role)
      ? "id = $2 AND tenant_id = $3 AND assigned_to = $4 AND status IN ('Resolved','In_Progress')"
      : "id = $2 AND tenant_id = $3 AND status IN ('Resolved','In_Progress')";
    const accessParams = isTech(user.role)
      ? [client_signature.trim(), req.params.id, user.tenant_id, user.id]
      : [client_signature.trim(), req.params.id, user.tenant_id];

    const result = await query(
      `UPDATE service_tickets
           SET status           = 'Closed',
               client_signature = $1,
               signed_at        = NOW(),
               updated_at       = NOW()
         WHERE ${accessCond}
         RETURNING *`,
      accessParams
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Ticket no encontrado o no puede cerrarse en su estado actual' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[ServiceDesk] close error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/service-desk/:id — admin only, only Open tickets (sin cambio)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!UUID_RE.test(req.params.id))
      return res.status(400).json({ error: 'ID de ticket inválido' });

    const result = await query(
      "DELETE FROM service_tickets WHERE id = $1 AND tenant_id = $2 AND status = 'Open' RETURNING id",
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Ticket no encontrado o no se puede eliminar en este estado' });
    res.json({ message: 'Ticket eliminado exitosamente' });
  } catch (error) {
    console.error('[ServiceDesk] delete error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORK ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/service-desk/:id/work-orders
// SUPERVISOR → puede crear WO en cualquier ticket
// SERVICE_TECH → solo en tickets asignados a él
router.post('/:id/work-orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.id))
      return res.status(400).json({ error: 'ID de ticket inválido' });

    const { technician_id, scheduled_date, diagnosis } = req.body;

    // Verificar acceso al ticket según rol
    const ticketCond = isTech(user.role)
      ? 'id = $1 AND tenant_id = $2 AND assigned_to = $3'
      : 'id = $1 AND tenant_id = $2';
    const ticketParams = isTech(user.role)
      ? [req.params.id, user.tenant_id, user.id]
      : [req.params.id, user.tenant_id];

    const ticketCheck = await query(
      `SELECT id FROM service_tickets WHERE ${ticketCond}`,
      ticketParams
    );
    if (ticketCheck.rows.length === 0)
      return res.status(404).json({ error: 'Ticket no encontrado o acceso denegado' });

    // SERVICE_TECH solo puede asignarse a sí mismo como técnico
    const effectiveTechId = isTech(user.role) ? user.id : (technician_id || null);
    if (effectiveTechId && !UUID_RE.test(effectiveTechId))
      return res.status(400).json({ error: 'technician_id debe ser un UUID válido' });

    const woNumber = await generateWONumber(user.tenant_id);

    const result = await query(
      `INSERT INTO service_work_orders
           (tenant_id, ticket_id, work_order_number, technician_id, scheduled_date, diagnosis, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user.tenant_id, req.params.id, woNumber,
       effectiveTechId, scheduled_date || null, diagnosis || null,
       user.id || user.userId]
    );

    // Auto-move ticket to In_Progress if it was Open/Pending
    await query(
      `UPDATE service_tickets SET status = 'In_Progress', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND status IN ('Open','Pending')`,
      [req.params.id, user.tenant_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[ServiceDesk] create WO error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/service-desk/work-orders/:woId — update WO status/details
// SUPERVISOR → cualquier WO del tenant
// SERVICE_TECH → solo WOs donde technician_id = user.id
router.put('/work-orders/:woId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.woId))
      return res.status(400).json({ error: 'ID de orden de trabajo inválido' });

    const { status, execution_details, diagnosis } = req.body;

    if (status && !VALID_WO_STATUSES.includes(status))
      return res.status(400).json({ error: 'Status WO inválido', valid: VALID_WO_STATUSES });

    // Construir condición según rol
    const whereCond = isTech(user.role)
      ? 'id = $4 AND tenant_id = $5 AND technician_id = $6'
      : 'id = $4 AND tenant_id = $5';
    const extraParams = isTech(user.role) ? [user.id] : [];

    const result = await query(
      `UPDATE service_work_orders
           SET status            = COALESCE($1, status),
               execution_details = COALESCE($2, execution_details),
               diagnosis         = COALESCE($3, diagnosis),
               updated_at        = NOW()
         WHERE ${whereCond} RETURNING *`,
      [status || null, execution_details || null, diagnosis || null,
       req.params.woId, user.tenant_id, ...extraParams]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Orden de trabajo no encontrada o acceso denegado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[ServiceDesk] update WO error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTS (consume from inventory)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/service-desk/work-orders/:woId/parts
// Ambos roles pueden consumir piezas (técnico en sus propias WOs)
router.post('/work-orders/:woId/parts', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (req as any).user;

    if (!hasSDAccess(user.role))
      return res.status(403).json({ error: 'Acceso denegado al módulo de servicio técnico' });

    if (!UUID_RE.test(req.params.woId))
      return res.status(400).json({ error: 'ID de orden de trabajo inválido' });

    const { product_id, quantity = 1, is_warranty = false } = req.body;

    if (!product_id || !UUID_RE.test(product_id))
      return res.status(400).json({ error: 'product_id válido es requerido' });
    if (quantity <= 0)
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });

    // Verificar WO con acceso según rol
    const woCond = isTech(user.role)
      ? 'wo.id = $1 AND wo.tenant_id = $2 AND wo.technician_id = $3'
      : 'wo.id = $1 AND wo.tenant_id = $2';
    const woParams = isTech(user.role)
      ? [req.params.woId, user.tenant_id, user.id]
      : [req.params.woId, user.tenant_id];

    const woCheck = await client.query(
      `SELECT wo.id, wo.ticket_id FROM service_work_orders wo WHERE ${woCond}`,
      woParams
    );
    if (woCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Orden de trabajo no encontrada o acceso denegado' });
    }

    // Get product + inventory
    const prodRes = await client.query(
      `SELECT p.id, p.name, p.sku, p.cost, inv.quantity_on_hand
           FROM products p
           LEFT JOIN inventory inv ON inv.product_id = p.id AND inv.tenant_id = $1
          WHERE p.id = $2 AND p.tenant_id = $1`,
      [user.tenant_id, product_id]
    );
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const prod = prodRes.rows[0];
    const stock = prod.quantity_on_hand || 0;

    if (!is_warranty) {
      if (stock < quantity) {
        await client.query('ROLLBACK');
        return res.status(422).json({
          error: `Stock insuficiente para '${prod.name}': disponible ${stock}, solicitado ${quantity}`
        });
      }
      await client.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW() WHERE product_id = $2 AND tenant_id = $3',
        [quantity, product_id, user.tenant_id]
      );
      await client.query(
        `INSERT INTO inventory_movements (tenant_id, product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
           VALUES ($1,$2,'out',$3,'service_order',$4,'Consumo en orden de servicio',$5)`,
        [user.tenant_id, product_id, quantity, req.params.woId, user.id || user.userId]
      );
      if (stock - quantity === 0) {
        await client.query(
          `UPDATE service_tickets SET status = 'Waiting_Parts', updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2 AND status = 'In_Progress'`,
          [woCheck.rows[0].ticket_id, user.tenant_id]
        );
      }
    }

    const partRes = await client.query(
      `INSERT INTO service_wo_parts (tenant_id, work_order_id, product_id, quantity, unit_cost, is_warranty)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user.tenant_id, req.params.woId, product_id, quantity, prod.cost || 0, Boolean(is_warranty)]
    );

    await client.query('COMMIT');
    res.status(201).json({
      ...partRes.rows[0],
      product_name: prod.name,
      product_sku: prod.sku,
      current_stock: is_warranty ? stock : stock - quantity
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ServiceDesk] consume part error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

export default router;
