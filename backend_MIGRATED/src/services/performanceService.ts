import { db } from '../config/database';

/**
 * Servicio para el módulo de Desempeño
 * Gestiona métricas de ventas y actividades de vendedores
 */

export interface PerformanceMetrics {
  // Cuotas de venta
  monthlyQuota: number;
  monthlyAchieved: number;
  monthlyPercentage: number;
  yearlyQuota: number;
  yearlyAchieved: number;
  yearlyPercentage: number;
  
  // Actividades del mes
  activities: {
    calls: number;
    callsTarget: number;
    visits: number;
    visitsTarget: number;
    emails: number;
    emailsTarget: number;
    opportunitiesCreated: number;
    opportunitiesTarget: number;
  };
  
  // Oportunidades
  opportunities: {
    total: number;
    won: number;
    lost: number;
    pipeline: number;
    conversionRate: number;
  };
  
  // Histórico mensual
  monthlyHistory: {
    month: string;
    sales: number;
    quota: number;
    calls: number;
    visits: number;
  }[];
}

export class PerformanceService {
  /**
   * Obtiene las métricas de desempeño de un usuario
   */
  public async getMetrics(userId: string, period: 'month' | 'quarter' | 'year'): Promise<PerformanceMetrics> {
    try {
      // Obtener cuotas y targets del usuario
      const quotaResult = await db.query(
        `SELECT monthly_quota, yearly_quota, 
                calls_target, visits_target, emails_target, opportunities_target 
         FROM user_quotas WHERE user_id = $1`,
        [userId]
      );
      
      const monthlyQuota = quotaResult.rows[0]?.monthly_quota || 500000;
      const yearlyQuota = quotaResult.rows[0]?.yearly_quota || 6000000;
      const callsTarget = quotaResult.rows[0]?.calls_target || 60;
      const visitsTarget = quotaResult.rows[0]?.visits_target || 20;
      const emailsTarget = quotaResult.rows[0]?.emails_target || 100;
      const opportunitiesTarget = quotaResult.rows[0]?.opportunities_target || 10;

      // Calcular fechas según el período
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      // Obtener ventas del período
      const salesResult = await db.query(
        `SELECT COALESCE(SUM(estimated_revenue), 0) as total
         FROM opportunities 
         WHERE assigned_to = $1 
         AND stage = 'closed_won'
         AND updated_at >= $2 
         AND updated_at <= $3`,
        [userId, startDate, endDate]
      );
      
      const monthlyAchieved = parseFloat(salesResult.rows[0]?.total || 0);
      const monthlyPercentage = monthlyQuota > 0 ? (monthlyAchieved / monthlyQuota) * 100 : 0;

      // Obtener ventas del año
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearlySalesResult = await db.query(
        `SELECT COALESCE(SUM(estimated_revenue), 0) as total
         FROM opportunities 
         WHERE assigned_to = $1 
         AND stage = 'closed_won'
         AND updated_at >= $2`,
        [userId, yearStart]
      );
      
      const yearlyAchieved = parseFloat(yearlySalesResult.rows[0]?.total || 0);
      const yearlyPercentage = yearlyQuota > 0 ? (yearlyAchieved / yearlyQuota) * 100 : 0;

      // Obtener actividades del mes
      const activitiesResult = await db.query(
        `SELECT 
          COUNT(CASE WHEN type = 'call' THEN 1 END) as calls,
          COUNT(CASE WHEN type = 'visit' THEN 1 END) as visits,
          COUNT(CASE WHEN type = 'email' THEN 1 END) as emails
         FROM activities 
         WHERE user_id = $1 
         AND created_at >= $2`,
        [userId, startDate]
      );

      // Obtener oportunidades creadas
      const opportunitiesCreatedResult = await db.query(
        `SELECT COUNT(*) as count
         FROM opportunities 
         WHERE created_by = $1 
         AND created_at >= $2`,
        [userId, startDate]
      );

      // Obtener estadísticas de oportunidades
      const opportunitiesResult = await db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) as won,
          COUNT(CASE WHEN stage = 'closed_lost' THEN 1 END) as lost,
          COALESCE(SUM(CASE WHEN stage NOT IN ('closed_won', 'closed_lost') THEN estimated_revenue ELSE 0 END), 0) as pipeline
         FROM opportunities 
         WHERE assigned_to = $1`,
        [userId]
      );

      const oppStats = opportunitiesResult.rows[0];
      const totalClosed = parseInt(oppStats.won) + parseInt(oppStats.lost);
      const conversionRate = totalClosed > 0 ? (parseInt(oppStats.won) / totalClosed) * 100 : 0;

      // Obtener histórico mensual (últimos 6 meses)
      const monthlyHistory = await this.getHistory(userId, 6);

      return {
        monthlyQuota,
        monthlyAchieved,
        monthlyPercentage: Math.round(monthlyPercentage * 10) / 10,
        yearlyQuota,
        yearlyAchieved,
        yearlyPercentage: Math.round(yearlyPercentage * 10) / 10,
        activities: {
          calls: parseInt(activitiesResult.rows[0]?.calls || 0),
          callsTarget,
          visits: parseInt(activitiesResult.rows[0]?.visits || 0),
          visitsTarget,
          emails: parseInt(activitiesResult.rows[0]?.emails || 0),
          emailsTarget,
          opportunitiesCreated: parseInt(opportunitiesCreatedResult.rows[0]?.count || 0),
          opportunitiesTarget
        },
        opportunities: {
          total: parseInt(oppStats.total),
          won: parseInt(oppStats.won),
          lost: parseInt(oppStats.lost),
          pipeline: parseFloat(oppStats.pipeline),
          conversionRate: Math.round(conversionRate * 10) / 10
        },
        monthlyHistory
      };
    } catch (error) {
      console.error('[PerformanceService] Error obteniendo métricas:', error);
      throw error;
    }
  }

  /**
   * Obtiene el histórico mensual de desempeño
   */
  public async getHistory(userId: string, months: number): Promise<any[]> {
    try {
      const history = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        // Ventas del mes
        const salesResult = await db.query(
          `SELECT COALESCE(SUM(estimated_revenue), 0) as total
           FROM opportunities 
           WHERE assigned_to = $1 
           AND stage = 'closed_won'
           AND updated_at >= $2 
           AND updated_at <= $3`,
          [userId, monthDate, monthEnd]
        );
        
        // Actividades del mes
        const activitiesResult = await db.query(
          `SELECT 
            COUNT(CASE WHEN type = 'call' THEN 1 END) as calls,
            COUNT(CASE WHEN type = 'visit' THEN 1 END) as visits
           FROM activities 
           WHERE user_id = $1 
           AND created_at >= $2 
           AND created_at <= $3`,
          [userId, monthDate, monthEnd]
        );
        
        // Cuota mensual
        const quotaResult = await db.query(
          'SELECT monthly_quota FROM user_quotas WHERE user_id = $1',
          [userId]
        );
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        history.push({
          month: monthNames[monthDate.getMonth()],
          sales: parseFloat(salesResult.rows[0]?.total || 0),
          quota: quotaResult.rows[0]?.monthly_quota || 500000,
          calls: parseInt(activitiesResult.rows[0]?.calls || 0),
          visits: parseInt(activitiesResult.rows[0]?.visits || 0)
        });
      }
      
      return history;
    } catch (error) {
      console.error('[PerformanceService] Error obteniendo histórico:', error);
      throw error;
    }
  }

  /**
   * Obtiene métricas de todo el equipo
   */
  public async getTeamMetrics(): Promise<any[]> {
    try {
      const result = await db.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role
         FROM users u
         WHERE u.role = 'sales' OR u.role = 'vendedor'
         ORDER BY u.first_name`
      );
      
      const teamMetrics = [];
      
      for (const user of result.rows) {
        const metrics = await this.getMetrics(user.id, 'month');
        teamMetrics.push({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          metrics
        });
      }
      
      return teamMetrics;
    } catch (error) {
      console.error('[PerformanceService] Error obteniendo métricas del equipo:', error);
      throw error;
    }
  }

  /**
   * Actualiza la cuota de un vendedor
   */
  public async updateQuota(userId: string, monthlyQuota: number, yearlyQuota: number): Promise<any> {
    try {
      const result = await db.query(
        `INSERT INTO user_quotas (user_id, monthly_quota, yearly_quota, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET monthly_quota = $2, yearly_quota = $3, updated_at = NOW()
         RETURNING *`,
        [userId, monthlyQuota, yearlyQuota]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('[PerformanceService] Error actualizando cuota:', error);
      throw error;
    }
  }
}

// Exportar instancia
export const performanceService = new PerformanceService();
