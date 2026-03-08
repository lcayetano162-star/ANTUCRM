import { db } from '../../../shared/config/database';

export interface CreateActivityDTO {
  type: 'call' | 'visit' | 'email' | 'whatsapp' | 'note';
  description: string;
  duration?: number;
  outcome?: string;
  related_type: 'client' | 'opportunity' | 'contact';
  related_id: string;
  user_id: string;
  tenant_id?: string;
}

export class ActivityService {
  async create(data: CreateActivityDTO): Promise<any> {
    const result = await db.query(
      'INSERT INTO activities (type, subject, description, related_to_type, related_to_id, performed_by, tenant_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [data.type, data.description, data.description, data.related_type, data.related_id, data.user_id, data.tenant_id || null]
    );
    return result.rows[0];
  }

  async getAll(filters: { userId?: string; relatedType?: string; relatedId?: string; limit?: number; offset?: number }): Promise<any[]> {
    let conditions = [];
    const params: any[] = [];
    let idx = 1;
    if (filters.userId) { conditions.push(`performed_by = $${idx++}`); params.push(filters.userId); }
    if (filters.relatedType) { conditions.push(`related_to_type = $${idx++}`); params.push(filters.relatedType); }
    if (filters.relatedId) { conditions.push(`related_to_id = $${idx++}`); params.push(filters.relatedId); }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await db.query(
      `SELECT * FROM activities ${where} ORDER BY performed_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, filters.limit || 50, filters.offset || 0]
    );
    return result.rows;
  }

  async getByUser(userId: string, limit = 50, offset = 0): Promise<any[]> {
    const result = await db.query(
      'SELECT * FROM activities WHERE performed_by = $1 ORDER BY performed_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  async getByRelated(relatedType: string, relatedId: string): Promise<any[]> {
    const result = await db.query(
      'SELECT * FROM activities WHERE related_to_type = $1 AND related_to_id = $2 ORDER BY performed_at DESC',
      [relatedType, relatedId]
    );
    return result.rows;
  }

  async getStats(userId: string, startDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const result = await db.query(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN type = 'call' THEN 1 END) as calls, COUNT(CASE WHEN type = 'visit' THEN 1 END) as visits, COUNT(CASE WHEN type = 'email' THEN 1 END) as emails, COUNT(CASE WHEN type = 'whatsapp' THEN 1 END) as whatsapp, COUNT(CASE WHEN type = 'note' THEN 1 END) as notes FROM activities WHERE performed_by = $1 AND performed_at >= $2",
      [userId, start]
    );
    return result.rows[0];
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db.query('DELETE FROM activities WHERE id = $1 AND performed_by = $2 RETURNING id', [id, userId]);
    return result.rows.length > 0;
  }
}

export const activityService = new ActivityService();
