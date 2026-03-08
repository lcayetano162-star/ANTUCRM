import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { requireModule } from '../../../shared/middleware/moduleCheck';
import { authenticateToken } from '../../../shared/middleware/auth';

const router = Router();
router.use(requireModule('cpq'));

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.18');

function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `COT-${year}${month}-${random}`;
}

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, client_id, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let whereConditions = ['q.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;
    if (status) { whereConditions.push(`q.status = $${paramIndex}`); params.push(status); paramIndex++; }
    if (client_id) { whereConditions.push(`q.client_id = $${paramIndex}`); params.push(client_id); paramIndex++; }
    const whereClause = whereConditions.join(' AND ');
    const result = await query(
      `SELECT q.*, c.name as client_name, u.first_name || ' ' || u.last_name as created_by_name
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM quotes q WHERE ${whereClause}`, params);
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('[Quotes] Error listando cotizaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT q.*, c.name as client_name, u.first_name || ' ' || u.last_name as created_by_name
       FROM quotes q
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = $1 AND q.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cotizacion no encontrada' });

    const items = await query(
      `SELECT qi.* FROM quote_items qi
       JOIN quotes q ON q.id = qi.quote_id
       WHERE qi.quote_id = $1 AND q.tenant_id = $2
       ORDER BY qi.sort_order`,
      [req.params.id, user.tenant_id]
    );
    res.json({ ...result.rows[0], items: items.rows });
  } catch (error) {
    console.error('[Quotes] Error obteniendo cotizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { client_id, opportunity_id, notes, valid_until, items = [] } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id es requerido' });

    const quoteNumber = generateQuoteNumber();
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const tax_amount = subtotal * TAX_RATE;
    const total_onetime = subtotal + tax_amount;

    const quoteResult = await query(
      `INSERT INTO quotes (quote_number, client_id, opportunity_id, notes, valid_until, subtotal, tax_rate, tax_amount, total_onetime, status, tenant_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11) RETURNING *`,
      [quoteNumber, client_id, opportunity_id, notes, valid_until, subtotal, TAX_RATE, tax_amount, total_onetime, user.tenant_id, user.userId]
    );
    const quote = quoteResult.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO quote_items (quote_id, product_name, description, quantity, unit_price, discount_percent, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [quote.id, item.product_name || item.description || 'Producto', item.description, item.quantity, item.unit_price, item.discount || item.discount_percent || 0, item.quantity * item.unit_price]
      );
    }

    res.status(201).json(quote);
  } catch (error) {
    console.error('[Quotes] Error creando cotizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notes, valid_until, items } = req.body;

    const result = await query(
      `UPDATE quotes SET
        notes = COALESCE($1, notes), valid_until = COALESCE($2, valid_until), updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [notes, valid_until, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cotizacion no encontrada' });

    if (items !== undefined) {
      await query('DELETE FROM quote_items WHERE quote_id = $1', [req.params.id]);
      for (const item of items) {
        await query(
          `INSERT INTO quote_items (quote_id, product_name, description, quantity, unit_price, discount_percent, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [req.params.id, item.product_name || item.description || 'Producto', item.description, item.quantity, item.unit_price, item.discount || item.discount_percent || 0, item.quantity * item.unit_price]
        );
      }
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = subtotal * TAX_RATE;
      await query('UPDATE quotes SET subtotal=$1, tax_rate=$2, tax_amount=$3, total_onetime=$4, updated_at=NOW() WHERE id=$5 AND tenant_id=$6',
        [subtotal, TAX_RATE, tax_amount, subtotal + tax_amount, req.params.id, user.tenant_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Quotes] Error actualizando cotizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query('DELETE FROM quotes WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cotizacion no encontrada' });
    res.json({ message: 'Cotizacion eliminada exitosamente' });
  } catch (error) {
    console.error('[Quotes] Error eliminando cotizacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired'];
    if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: 'Status invalido', valid: validStatuses });
    const result = await query(
      'UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cotizacion no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Quotes] Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
