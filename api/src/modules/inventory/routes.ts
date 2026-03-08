import { Router, Request, Response } from 'express';
import { query, pool } from '../../shared/config/database';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';

const router = Router();

// ── PRODUCTS ──────────────────────────────────────────────────────────────

router.get('/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { search, type, is_active, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let conds = ['p.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let idx = 2;

    if (search)    { conds.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (type)      { conds.push(`p.type = $${idx++}`);      params.push(type); }
    if (is_active !== undefined) { conds.push(`p.is_active = $${idx++}`); params.push(is_active === 'true'); }

    const where = conds.join(' AND ');
    const result = await query(
      `SELECT p.*,
              COALESCE(i.quantity_on_hand, 0)  AS quantity_on_hand,
              COALESCE(i.quantity_reserved, 0) AS quantity_reserved,
              COALESCE(i.quantity_on_hand - i.quantity_reserved, 0) AS quantity_available
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
        WHERE ${where}
        ORDER BY p.name
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM products p WHERE ${where}`, params);
    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (error) {
    console.error('[Inventory] Error listando productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT p.*,
              COALESCE(i.quantity_on_hand, 0)  AS quantity_on_hand,
              COALESCE(i.quantity_reserved, 0) AS quantity_reserved,
              COALESCE(i.quantity_on_hand - i.quantity_reserved, 0) AS quantity_available,
              i.reorder_point, i.location
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
        WHERE p.id = $1 AND p.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Inventory] Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/products', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (req as any).user;
    const { sku, name, description, type = 'product', unit = 'unidad', price, cost, tax_rate = 0.18, initial_stock = 0, location } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name y price son requeridos' });
    }

    const prodRes = await client.query(
      `INSERT INTO products (tenant_id, sku, name, description, type, unit, price, cost, tax_rate, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user.tenant_id, sku || null, name, description, type, unit, price, cost || 0, tax_rate, user.id || user.userId]
    );
    const product = prodRes.rows[0];

    // Create inventory record for physical products
    if (type === 'product') {
      await client.query(
        `INSERT INTO inventory (tenant_id, product_id, quantity_on_hand, location)
          VALUES ($1, $2, $3, $4)`,
        [user.tenant_id, product.id, initial_stock, location || null]
      );

      if (parseFloat(initial_stock) > 0) {
        await client.query(
          `INSERT INTO inventory_movements (tenant_id, product_id, movement_type, quantity, reference_type, notes, created_by)
            VALUES ($1,$2,'in',$3,'manual','Stock inicial',$4)`,
          [user.tenant_id, product.id, initial_stock, user.id || user.userId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Inventory] Error creando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

router.put('/products/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sku, name, description, unit, price, cost, tax_rate, is_active } = req.body;
    const result = await query(
      `UPDATE products
           SET sku = COALESCE($1, sku), name = COALESCE($2, name), description = COALESCE($3, description),
               unit = COALESCE($4, unit), price = COALESCE($5, price), cost = COALESCE($6, cost),
               tax_rate = COALESCE($7, tax_rate), is_active = COALESCE($8, is_active), updated_at = NOW()
         WHERE id = $9 AND tenant_id = $10 RETURNING *`,
      [sku, name, description, unit, price, cost, tax_rate, is_active, req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Inventory] Error actualizando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── STOCK ADJUSTMENT ────────────────────────────────────────────────────

router.post('/products/:id/adjustment', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = (req as any).user;
    const { quantity, movement_type = 'adjustment', notes } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'quantity es requerido' });
    }

    const qty = parseFloat(quantity);
    const sign = movement_type === 'out' ? -1 : 1;

    const invRes = await client.query(
      'SELECT quantity_on_hand FROM inventory WHERE product_id = $1 AND tenant_id = $2',
      [req.params.id, user.tenant_id]
    );
    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado para este producto' });
    }

    const newQty = parseFloat(invRes.rows[0].quantity_on_hand) + (qty * sign);
    if (newQty < 0) {
      return res.status(400).json({ error: 'El ajuste resultaría en stock negativo' });
    }

    await client.query(
      'UPDATE inventory SET quantity_on_hand = $1, updated_at = NOW() WHERE product_id = $2 AND tenant_id = $3',
      [newQty, req.params.id, user.tenant_id]
    );

    await client.query(
      `INSERT INTO inventory_movements (tenant_id, product_id, movement_type, quantity, reference_type, notes, created_by)
        VALUES ($1,$2,$3,$4,'manual',$5,$6)`,
      [user.tenant_id, req.params.id, movement_type, qty, notes || null, user.id || user.userId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Ajuste aplicado', new_quantity_on_hand: newQty });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Inventory] Error en ajuste:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ── MOVEMENTS HISTORY ────────────────────────────────────────────────────

router.get('/movements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { product_id, movement_type, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let conds = ['m.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let idx = 2;

    if (product_id)    { conds.push(`m.product_id = $${idx++}`);    params.push(product_id); }
    if (movement_type) { conds.push(`m.movement_type = $${idx++}`); params.push(movement_type); }

    const where = conds.join(' AND ');
    const result = await query(
      `SELECT m.*, p.name AS product_name, p.sku,
              u.first_name || ' ' || u.last_name AS created_by_name
         FROM inventory_movements m
         JOIN products p ON m.product_id = p.id
         LEFT JOIN users u ON m.created_by = u.id
        WHERE ${where}
        ORDER BY m.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM inventory_movements m WHERE ${where}`, params);
    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (error) {
    console.error('[Inventory] Error listando movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
