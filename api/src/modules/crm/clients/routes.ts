import { Router, Request, Response } from 'express';
import { query } from '../../../shared/config/database';
import { authenticateToken } from '../../../shared/middleware/auth';

const router = Router();

// GET /api/clients - List clients with filters
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { search, type, status, assigned_to, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = ['c.tenant_id = $1'];
    const params: any[] = [user.tenant_id];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (type) {
      whereConditions.push(`c.contact_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    if (status) {
      whereConditions.push(`c.is_active = $${paramIndex}`);
      params.push(status === 'active');
      paramIndex++;
    }
    if (assigned_to) {
      whereConditions.push(`c.assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name as assigned_user_name,
              COUNT(DISTINCT co.id) as contacts_count,
              COUNT(DISTINCT o.id) as opportunities_count
       FROM clients c
       LEFT JOIN users u ON c.assigned_to = u.id
       LEFT JOIN contacts co ON co.client_id = c.id AND co.tenant_id = c.tenant_id
       LEFT JOIN opportunities o ON o.client_id = c.id AND o.tenant_id = c.tenant_id
       WHERE ${whereClause}
       GROUP BY c.id, u.first_name, u.last_name
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM clients c WHERE ${whereClause}`,
      params
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('[Clients] Error listando clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clients/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name as assigned_user_name
       FROM clients c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Clients] Error obteniendo cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clients
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name, email, phone, address, city, country,
      contact_type, type, is_active, source, notes, assigned_to,
      // Lead fields
      lead_score, lead_source, lead_status
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      `INSERT INTO clients
        (name, email, phone, address, city, country, contact_type, is_active, source,
         assigned_to, tenant_id, lead_score, lead_source, lead_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        name, email, phone, address, city, country,
        contact_type || type || 'lead',
        is_active !== undefined ? is_active : true,
        source,
        assigned_to || user.userId, user.tenant_id,
        lead_score || 0, lead_source, lead_status || 'new'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Clients] Error creando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clients/:id
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name, email, phone, address, city, country,
      contact_type, type, is_active, source, notes, assigned_to,
      lead_score, lead_source, lead_status
    } = req.body;

    const result = await query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        country = COALESCE($6, country),
        contact_type = COALESCE($7, contact_type),
        is_active = COALESCE($8, is_active),
        source = COALESCE($9, source),
        assigned_to = COALESCE($10, assigned_to),
        lead_score = COALESCE($11, lead_score),
        lead_source = COALESCE($12, lead_source),
        lead_status = COALESCE($13, lead_status),
        updated_at = NOW()
       WHERE id = $14 AND tenant_id = $15
       RETURNING *`,
      [
        name, email, phone, address, city, country,
        contact_type || type || null,
        is_active !== undefined ? is_active : null,
        source, assigned_to,
        lead_score, lead_source, lead_status,
        req.params.id, user.tenant_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Clients] Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('[Clients] Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clients/:id/convert - Convert lead to client
router.post('/:id/convert', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await query(
      `UPDATE clients 
       SET contact_type = 'client', lead_status = 'converted', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, user.tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Clients] Error convirtiendo lead:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
