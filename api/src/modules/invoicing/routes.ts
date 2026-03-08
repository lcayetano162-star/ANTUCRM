import { Router, Request, Response } from 'express';
import { query, pool } from '../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';

const router = Router();

// ── NCF HELPERS ────────────────────────────────────────────────────────────

/**
 * Genera el siguiente NCF para el tenant y tipo dado.
 * Formato: B0100000001  (tipo 2 dígitos + 8 dígitos secuencial)
 * Tipos soportados:  B01 B02 B14 B15 B16
 */
async function generateNCF(client: any, tenantId: string, ncfType: string): Promise<string> {
  // Upsert secuencia y obtener siguiente valor atómicamente
  const res = await client.query(
    `INSERT INTO ncf_sequences (tenant_id, ncf_type, current_sequence, max_sequence)
          VALUES ($1, $2, 1, 9999999)
      ON CONFLICT (tenant_id, ncf_type) DO UPDATE
          SET current_sequence = ncf_sequences.current_sequence + 1
        WHERE ncf_sequences.current_sequence < ncf_sequences.max_sequence
      RETURNING current_sequence`,
    [tenantId, ncfType]
  );

  if (res.rows.length === 0) {
    throw new Error(`Secuencia NCF de tipo ${ncfType} ha alcanzado el límite máximo. Contacte al administrador.`);
  }

  const seq = res.rows[0].current_sequence;
  // Formato: B01 + 8 dígitos (ej B0100000042)
  return `${ncfType}${String(seq).padStart(8, '0')}`;
}

/** Genera número de factura interno: FAC-YYYYMM-NNNN */
async function generateInvoiceNumber(client: any, tenantId: string): Promise<string> {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const countRes = await client.query(
    `SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND invoice_number LIKE $2`,
    [tenantId, `FAC-${ym}-%`]
  );

  const n = parseInt(countRes.rows[0].count) + 1;
  return `FAC-${ym}-${String(n).padStart(4, '0')}`;
}

/**
 * Dispara las salidas de inventario para cada ítem con product_id de tipo 'product'.
 * Llamado dentro de una transacción.
 */
async function releaseInventory(
  client: any, tenantId: string, invoiceId: string,
  invoiceNumber: string, items: any[], userId: string
): Promise<void> {
  for (const item of items) {
    if (!item.product_id) continue;

    // Verificar que el producto es físico (no servicio)
    const prodRes = await client.query(
      "SELECT type FROM products WHERE id = $1 AND tenant_id = $2",
      [item.product_id, tenantId]
    );
    if (prodRes.rows.length === 0 || prodRes.rows[0].type !== 'product') continue;

    // Verificar stock disponible
    const invRes = await client.query(
      'SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE product_id = $1 AND tenant_id = $2',
      [item.product_id, tenantId]
    );
    if (invRes.rows.length === 0) continue;

    const available = parseFloat(invRes.rows[0].quantity_on_hand) - parseFloat(invRes.rows[0].quantity_reserved);
    if (available < parseFloat(item.quantity)) {
      throw new Error(
        `Stock insuficiente para el producto "${item.description}". Disponible: ${available}, requerido: ${item.quantity}`
      );
    }

    // Decrementar stock
    await client.query(
      'UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW() WHERE product_id = $2 AND tenant_id = $3',
      [item.quantity, item.product_id, tenantId]
    );

    // Registrar movimiento de salida
    await client.query(
      `INSERT INTO inventory_movements (tenant_id, product_id, movement_type, quantity, reference_type, reference_id, reference_number, notes, created_by)
        VALUES ($1,$2,'out',$3,'invoice',$4,$5,'Salida por factura',$6)`,
      [tenantId, item.product_id, item.quantity, invoiceId, invoiceNumber, userId]
    );
  }

  // Marcar factura como con inventario liberado
  await client.query(
    'UPDATE invoices SET inventory_released = true WHERE id = $1 AND tenant_id = $2',
    [invoiceId, tenantId]
  );
}

// ── GET /api/invoices ────────────────────────────────────────────────────

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, client_id, ncf_type, page = '1', limit = '50' } = req.query;
    const pageNum  = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));
    const offset = (pageNum - 1) * limitNum;

    let conds = ['inv.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let idx = 2;

    if (status)   { conds.push(`inv.status = $${idx++}`);   params.push(status); }
    if (client_id){ conds.push(`inv.client_id = $${idx++}`);params.push(client_id); }
    if (ncf_type) { conds.push(`inv.ncf_type = $${idx++}`); params.push(ncf_type); }

    const where = conds.join(' AND ');
    const result = await query(
      `SELECT inv.*, c.name AS client_name,
              u.first_name || ' ' || u.last_name AS created_by_name
         FROM invoices inv
         JOIN clients c ON inv.client_id = c.id
         LEFT JOIN users u ON inv.created_by = u.id
        WHERE ${where}
        ORDER BY inv.issue_date DESC, inv.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM invoices inv WHERE ${where}`, params);
    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (error) {
    console.error('[Invoicing] Error listando facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/invoices/:id ────────────────────────────────────────────────

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [invRes, itemsRes] = await Promise.all([
      query(
        `SELECT inv.*, c.name AS client_name
           FROM invoices inv JOIN clients c ON inv.client_id = c.id
          WHERE inv.id = $1 AND inv.tenant_id = $2`,
        [req.params.id, user.tenant_id]
      ),
      query(
        `SELECT ii.*, p.sku, p.name AS product_name
           FROM invoice_items ii
           JOIN invoices inv ON inv.id = ii.invoice_id
           LEFT JOIN products p ON ii.product_id = p.id
          WHERE ii.invoice_id = $1 AND inv.tenant_id = $2 ORDER BY ii.sort_order`,
        [req.params.id, user.tenant_id]
      )
    ]);

    if (invRes.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ ...invRes.rows[0], items: itemsRes.rows });
  } catch (error) {
    console.error('[Invoicing] Error obteniendo factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /api/invoices ── CREAR FACTURA + NCF + INVENTARIO ──────────────

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (req as any).user;
    const {
      client_id, opportunity_id, quote_id,
      ncf_type = 'B01', ncf_expiry_date,
      items = [],
      issue_date, due_date, payment_terms = 30, payment_method,
      notes, internal_notes,
      status = 'draft'
    } = req.body;

    // ── Validación de entrada ──────────────────────────────────────────────────
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const VALID_NCF_TYPES = ['B01', 'B02', 'B14', 'B15', 'B16'];

    if (!client_id) {
      return res.status(400).json({ error: 'client_id es requerido' });
    }
    if (!UUID_RE.test(client_id)) {
      return res.status(400).json({ error: 'client_id debe ser un UUID válido' });
    }
    if (!VALID_NCF_TYPES.includes(ncf_type)) {
      return res.status(400).json({ error: 'ncf_type inválido', valid: VALID_NCF_TYPES });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La factura debe tener al menos un ítem' });
    }
    if (items.length > 500) {
      return res.status(400).json({ error: 'La factura no puede tener más de 500 ítems' });
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description || typeof it.description !== 'string' || it.description.trim().length === 0) {
        return res.status(400).json({ error: `Ítem ${i + 1}: description es requerido` });
      }
      if (it.description.length > 500) {
        return res.status(400).json({ error: `Ítem ${i + 1}: description supera los 500 caracteres` });
      }
      const qty = parseFloat(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: `Ítem ${i + 1}: quantity debe ser mayor a 0` });
      }
      const price = parseFloat(it.unit_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: `Ítem ${i + 1}: unit_price debe ser >= 0` });
      }
      if (price > 999_999_999) {
        return res.status(400).json({ error: `Ítem ${i + 1}: unit_price excede el límite permitido` });
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Calcular totales
    const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.18');
    let subtotal = 0;
    const processedItems = items.map((item: any, i: number) => {
      const qty       = parseFloat(item.quantity || 1);
      const unitPrice = parseFloat(item.unit_price || 0);
      const discount  = parseFloat(item.discount_percent || 0);
      const taxRate   = parseFloat(item.tax_rate ?? TAX_RATE);
      const lineBase  = qty * unitPrice * (1 - discount / 100);
      const lineTax   = lineBase * taxRate;
      const lineTotal = lineBase + lineTax;
      subtotal += lineBase;
      return { ...item, quantity: qty, unit_price: unitPrice, discount_percent: discount,
               tax_rate: taxRate, subtotal: lineBase, tax_amount: lineTax, total: lineTotal, sort_order: i };
    });

    const taxAmount = processedItems.reduce((s: number, it: any) => s + it.tax_amount, 0);
    const total     = subtotal + taxAmount;

    // Números de documento
    const invoiceNumber = await generateInvoiceNumber(client, user.tenant_id);
    const ncf           = await generateNCF(client, user.tenant_id, ncf_type);

    // Insertar factura
    const invRes = await client.query(
      `INSERT INTO invoices
         (tenant_id, invoice_number, ncf, ncf_type, ncf_expiry_date,
          client_id, opportunity_id, quote_id, status,
          subtotal, tax_rate, tax_amount, total,
          issue_date, due_date, payment_terms, payment_method,
          notes, internal_notes, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING *`,
      [
        user.tenant_id, invoiceNumber, ncf, ncf_type, ncf_expiry_date || null,
        client_id, opportunity_id || null, quote_id || null, status,
        subtotal, TAX_RATE, taxAmount, total,
        issue_date || new Date().toISOString().split('T')[0],
        due_date || null, payment_terms, payment_method || null,
        notes || null, internal_notes || null,
        user.id || user.userId
      ]
    );

    const invoice = invRes.rows[0];

    // Insertar ítems
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount_percent, tax_rate, subtotal, tax_amount, total, sort_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [invoice.id, item.product_id || null, item.description, item.quantity,
         item.unit_price, item.discount_percent, item.tax_rate,
         item.subtotal, item.tax_amount, item.total, item.sort_order]
      );
    }

    // ── ORDEN DE SALIDA DE INVENTARIO ────────────────────────────────────
    // Se dispara siempre al crear la factura (representa un compromiso de entrega)
    await releaseInventory(
      client, user.tenant_id, invoice.id, invoiceNumber,
      processedItems, user.id || user.userId
    );

    await client.query('COMMIT');
    res.status(201).json({ ...invoice, ncf, invoice_number: invoiceNumber });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Invoicing] Error creando factura:', error);
    // Errores de stock insuficiente o NCF agotado son errores de negocio (422)
    if (error.message?.includes('Stock insuficiente') || error.message?.includes('Secuencia NCF')) {
      return res.status(422).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ── PUT /api/invoices/:id/status ─────────────────────────────────────────

router.put('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, payment_method, amount_paid } = req.body;
    const VALID = ['draft','sent','paid','partial','overdue','cancelled','void'];

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ error: 'Status inválido', valid: VALID });
    }

    const result = await query(
      `UPDATE invoices
           SET status         = $1,
               payment_method = COALESCE($2, payment_method),
               amount_paid    = COALESCE($3, amount_paid),
               paid_date      = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE paid_date END,
               updated_at     = NOW()
         WHERE id = $4 AND tenant_id = $5 AND status != 'void'
         RETURNING *`,
      [status, payment_method || null, amount_paid ?? null, req.params.id, user.tenant_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada o anulada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Invoicing] Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /api/invoices/ncf-sequences ─────────────────────────────────────

router.get('/ncf/sequences', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'SELECT * FROM ncf_sequences WHERE tenant_id = $1 ORDER BY ncf_type',
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Invoicing] Error obteniendo secuencias NCF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
