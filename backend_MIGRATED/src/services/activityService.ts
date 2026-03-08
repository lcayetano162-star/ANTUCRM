import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para el registro de actividades
 * Gestiona llamadas, visitas, correos, whatsapp y notas
 */

export interface Activity {
  id: string;
  type: 'call' | 'visit' | 'email' | 'whatsapp' | 'note';
  description: string;
  duration?: number;
  outcome?: string;
  related_type: 'client' | 'opportunity' | 'contact';
  related_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityDTO {
  type: 'call' | 'visit' | 'email' | 'whatsapp' | 'note';
  description: string;
  duration?: number;
  outcome?: string;
  related_type: 'client' | 'opportunity' | 'contact';
  related_id: string;
  user_id: string;
}

export class ActivityService {
  /**
   * Crea una nueva actividad
   */
  public async create(data: CreateActivityDTO): Promise<Activity> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const result = await db.query(
        `INSERT INTO activities (id, type, description, duration, outcome, related_type, related_id, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [id, data.type, data.description, data.duration, data.outcome, data.related_type, data.related_id, data.user_id, now, now]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('[ActivityService] Error creando actividad:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las actividades con filtros
   */
  public async getAll(filters: {
    userId?: string;
    relatedType?: string;
    relatedId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Activity[]> {
    try {
      let query = `
        SELECT a.*, 
          u.first_name || ' ' || u.last_name as user_name
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters.userId) {
        query += ` AND a.user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }
      
      if (filters.relatedType) {
        query += ` AND a.related_type = $${paramIndex}`;
        params.push(filters.relatedType);
        paramIndex++;
      }
      
      if (filters.relatedId) {
        query += ` AND a.related_id = $${paramIndex}`;
        params.push(filters.relatedId);
        paramIndex++;
      }
      
      if (filters.startDate) {
        query += ` AND a.created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        query += ` AND a.created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      query += ` ORDER BY a.created_at DESC`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('[ActivityService] Error obteniendo actividades:', error);
      throw error;
    }
  }

  /**
   * Obtiene actividades de un usuario específico
   */
  public async getByUser(userId: string, filters?: { startDate?: string; endDate?: string }): Promise<Activity[]> {
    try {
      let query = `
        SELECT a.*, 
          u.first_name || ' ' || u.last_name as user_name
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;
      
      if (filters?.startDate) {
        query += ` AND a.created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters?.endDate) {
        query += ` AND a.created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      query += ` ORDER BY a.created_at DESC`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('[ActivityService] Error obteniendo actividades:', error);
      throw error;
    }
  }

  /**
   * Obtiene actividades relacionadas con un cliente, oportunidad o contacto
   */
  public async getByRelated(relatedType: string, relatedId: string): Promise<Activity[]> {
    try {
      const result = await db.query(
        `SELECT a.*, 
          u.first_name || ' ' || u.last_name as user_name
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.related_type = $1 AND a.related_id = $2
        ORDER BY a.created_at DESC`,
        [relatedType, relatedId]
      );
      return result.rows;
    } catch (error) {
      console.error('[ActivityService] Error obteniendo actividades:', error);
      throw error;
    }
  }

  /**
   * Obtiene una actividad por ID
   */
  public async getById(id: string): Promise<Activity | null> {
    try {
      const result = await db.query(
        'SELECT * FROM activities WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('[ActivityService] Error obteniendo actividad:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de actividades
   */
  public async getStats(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN type = 'call' THEN 1 END) as calls,
          COUNT(CASE WHEN type = 'visit' THEN 1 END) as visits,
          COUNT(CASE WHEN type = 'email' THEN 1 END) as emails,
          COUNT(CASE WHEN type = 'whatsapp' THEN 1 END) as whatsapp,
          COUNT(CASE WHEN type = 'note' THEN 1 END) as notes,
          COALESCE(SUM(duration), 0) as total_duration
        FROM activities
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }
      
      if (filters.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('[ActivityService] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Elimina una actividad
   */
  public async delete(id: string): Promise<void> {
    try {
      await db.query('DELETE FROM activities WHERE id = $1', [id]);
    } catch (error) {
      console.error('[ActivityService] Error eliminando actividad:', error);
      throw error;
    }
  }
}

// Exportar instancia
export const activityService = new ActivityService();
