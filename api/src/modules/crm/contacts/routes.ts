import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/contacts
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { client_id, search } = req.query;

    let whereConditions = ['co.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;

    if (client_id) {
      // Validate that the client belongs to the current tenant before filtering
      whereConditions.push(`co.client_id = $${paramIndex}`);
      whereConditions.push(`(SELECT tenant_id FROM clients WHERE id = $${paramIndex}) = $1`);
      params.push(client_id);
      paramIndex++;
    }
    if (search) {
      whereConditions.push(`(co.first_name ILIKE $${paramIndex} OR co.last_name ILIKE $${paramIndex} OR co.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await query(
      `SELECT co.*, c.name as client_name
       FROM contacts co
       LEFT JOIN clients c ON co.client_id = c.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY co.first_name, co.last_name`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Contacts] Error listando contactos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/contacts/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT co.*, c.name as client_name
       FROM contacts co
       LEFT JOIN clients c ON co.client_id = c.id
       WHERE co.id = $1 AND co.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Contacts] Error obteniendo contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/contacts
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { first_name, last_name, email, phone, mobile, position, department, client_id } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'first_name y last_name son requeridos' });
    }

    const result = await query(
      `INSERT INTO contacts (first_name, last_name, email, phone, mobile, position, department, client_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [first_name, last_name, email, phone, mobile, position, department, client_id, user.tenant_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Contacts] Error creando contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/contacts/:id
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { first_name, last_name, email, phone, mobile, position, department, client_id } = req.body;

    const result = await query(
      `UPDATE contacts SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        mobile = COALESCE($5, mobile),
        position = COALESCE($6, position),
        department = COALESCE($7, department),
        client_id = COALESCE($8, client_id),
        updated_at = NOW()
       WHERE id = $9 AND tenant_id = $10
       RETURNING *`,
      [first_name, last_name, email, phone, mobile, position, department, client_id, req.params.id, user.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Contacts] Error actualizando contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'DELETE FROM contacts WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('[Contacts] Error eliminando contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
