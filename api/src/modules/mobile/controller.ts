// ============================================
// MOBILE CONTROLLER - API endpoints for mobile app
// ============================================

import { Request, Response } from 'express';
import { pool } from '../../shared/config/database';

export class MobileController {
  
  // ============================================
  // DASHBOARD
  // ============================================
  
  async getDashboardStats(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Monthly revenue
      const revenueResult = await pool.query(`
        SELECT COALESCE(SUM(value), 0) as revenue
        FROM opportunities
        WHERE tenant_id = $1
          AND assigned_to = $2
          AND stage = 'closed_won'
          AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)
      `, [tenantId, userId]);

      // Active opportunities
      const opportunitiesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM opportunities
        WHERE tenant_id = $1
          AND assigned_to = $2
          AND stage NOT IN ('closed_won', 'closed_lost')
      `, [tenantId, userId]);

      // New leads this month
      const leadsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM clients
        WHERE tenant_id = $1
          AND created_by = $2
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `, [tenantId, userId]);

      // Today's calls
      const callsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM activities
        WHERE tenant_id = $1
          AND assigned_to = $2
          AND type = 'call'
          AND DATE(due_date) = CURRENT_DATE
          AND completed = true
      `, [tenantId, userId]);

      res.json({
        monthlyRevenue: parseFloat(revenueResult.rows[0]?.revenue || 0),
        activeOpportunities: parseInt(opportunitiesResult.rows[0]?.count || 0),
        newLeads: parseInt(leadsResult.rows[0]?.count || 0),
        todayCalls: parseInt(callsResult.rows[0]?.count || 0),
        conversionRate: 0 // TODO: calculate
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
  }

  async getTodayTasks(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          a.id,
          a.title,
          a.type,
          a.due_date as "dueTime",
          a.completed,
          c.first_name || ' ' || c.last_name as "clientName"
        FROM activities a
        LEFT JOIN contacts c ON a.contact_id = c.id
        WHERE a.tenant_id = $1
          AND a.assigned_to = $2
          AND DATE(a.due_date) = CURRENT_DATE
          AND a.deleted_at IS NULL
        ORDER BY a.due_date ASC
        LIMIT 5
      `, [tenantId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Today tasks error:', error);
      res.status(500).json({ error: 'Error fetching tasks' });
    }
  }

  async getHotOpportunities(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          o.id,
          o.title,
          o.value,
          o.stage,
          o.probability,
          o.expected_close_date as "expectedCloseDate",
          o.last_activity_at as "lastActivity",
          c.name as "clientName"
        FROM opportunities o
        JOIN clients c ON o.client_id = c.id
        WHERE o.tenant_id = $1
          AND o.assigned_to = $2
          AND o.stage NOT IN ('closed_won', 'closed_lost')
          AND o.deleted_at IS NULL
        ORDER BY o.probability DESC, o.value DESC
        LIMIT 5
      `, [tenantId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Hot opportunities error:', error);
      res.status(500).json({ error: 'Error fetching opportunities' });
    }
  }

  // ============================================
  // CLIENTS
  // ============================================
  
  async getClients(req: any, res: Response) {
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.city,
          c.is_hot as "isHot",
          c.last_contact_at as "lastContact",
          COUNT(DISTINCT o.id) as "totalOpportunities",
          COALESCE(SUM(o.value) FILTER (WHERE o.stage = 'closed_won'), 0) as "totalValue"
        FROM clients c
        LEFT JOIN opportunities o ON c.id = o.client_id AND o.deleted_at IS NULL
        WHERE c.tenant_id = $1
          AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.is_hot DESC, c.last_contact_at DESC NULLS LAST
      `, [tenantId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Clients error:', error);
      res.status(500).json({ error: 'Error fetching clients' });
    }
  }

  async getNearbyClients(req: any, res: Response) {
    const tenantId = req.tenant?.id;
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    try {
      // Using Haversine formula for distance calculation
      const result = await pool.query(`
        SELECT 
          id,
          name,
          address,
          latitude,
          longitude,
          (
            6371000 * acos(
              cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude))
            )
          ) as distance
        FROM clients
        WHERE tenant_id = $3
          AND deleted_at IS NULL
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND (
            6371000 * acos(
              cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude))
            )
          ) <= $4
        ORDER BY distance
        LIMIT 10
      `, [lat, lng, tenantId, radius]);

      res.json(result.rows);
    } catch (error) {
      console.error('Nearby clients error:', error);
      res.status(500).json({ error: 'Error fetching nearby clients' });
    }
  }

  async toggleHotClient(req: any, res: Response) {
    const { id } = req.params;
    const { isHot } = req.body;
    const tenantId = req.tenant?.id;

    try {
      await pool.query(`
        UPDATE clients
        SET is_hot = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [isHot, id, tenantId]);

      res.json({ success: true });
    } catch (error) {
      console.error('Toggle hot error:', error);
      res.status(500).json({ error: 'Error updating client' });
    }
  }

  // ============================================
  // OPPORTUNITIES
  // ============================================
  
  async getOpportunities(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          o.id,
          o.title,
          o.value,
          o.stage,
          o.probability,
          o.expected_close_date as "expectedCloseDate",
          o.last_activity_at as "lastActivity",
          o.is_hot as "isHot",
          c.name as "clientName"
        FROM opportunities o
        JOIN clients c ON o.client_id = c.id
        WHERE o.tenant_id = $1
          AND o.assigned_to = $2
          AND o.deleted_at IS NULL
        ORDER BY o.probability DESC, o.value DESC
      `, [tenantId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Opportunities error:', error);
      res.status(500).json({ error: 'Error fetching opportunities' });
    }
  }

  async updateOpportunityStage(req: any, res: Response) {
    const { id } = req.params;
    const { stage } = req.body;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    try {
      await pool.query(`
        UPDATE opportunities
        SET 
          stage = $1,
          updated_at = NOW(),
          last_activity_at = NOW(),
          updated_by = $2
        WHERE id = $3 AND tenant_id = $4
      `, [stage, userId, id, tenantId]);

      res.json({ success: true });
    } catch (error) {
      console.error('Update stage error:', error);
      res.status(500).json({ error: 'Error updating stage' });
    }
  }

  // ============================================
  // TASKS
  // ============================================
  
  async getTasks(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    const { filter = 'today' } = req.query;

    // Validar que el filtro sea uno de los permitidos (prevención SQL Injection)
    const VALID_FILTERS = ['today', 'upcoming', 'completed'] as const;
    type FilterType = typeof VALID_FILTERS[number];
    
    if (!VALID_FILTERS.includes(filter)) {
      return res.status(400).json({ 
        error: 'Invalid filter parameter',
        validOptions: VALID_FILTERS
      });
    }

    try {
      // Definir condiciones de fecha de forma segura (valores hardcodeados, no input del usuario)
      const dateConditions: Record<FilterType, { condition: string; params: any[] }> = {
        today: {
          condition: `AND DATE(a.due_date) = CURRENT_DATE AND a.completed = false`,
          params: []
        },
        upcoming: {
          condition: `AND DATE(a.due_date) > CURRENT_DATE AND a.completed = false`,
          params: []
        },
        completed: {
          condition: `AND a.completed = true`,
          params: []
        }
      };

      const { condition } = dateConditions[filter as FilterType];

      const result = await pool.query(`
        SELECT 
          a.id,
          a.title,
          a.type,
          a.priority,
          a.due_date as "dueDate",
          a.completed,
          a.completed_at as "completedAt",
          a.notes,
          c.first_name || ' ' || c.last_name as "clientName",
          o.title as "opportunityTitle"
        FROM activities a
        LEFT JOIN contacts c ON a.contact_id = c.id
        LEFT JOIN opportunities o ON a.opportunity_id = o.id
        WHERE a.tenant_id = $1
          AND a.assigned_to = $2
          AND a.deleted_at IS NULL
          ${condition}
        ORDER BY a.due_date ASC
      `, [tenantId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Tasks error:', error);
      res.status(500).json({ error: 'Error fetching tasks' });
    }
  }

  async completeTask(req: any, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    try {
      await pool.query(`
        UPDATE activities
        SET completed = true, completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND assigned_to = $3
      `, [id, tenantId, userId]);

      res.json({ success: true });
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Error completing task' });
    }
  }

  // ============================================
  // CHECK-IN
  // ============================================
  
  async createCheckIn(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    const { clientId, clientName, latitude, longitude, accuracy, notes, deviceId } = req.body;

    try {
      const result = await pool.query(`
        INSERT INTO check_ins (
          tenant_id, user_id, client_id, client_name,
          latitude, longitude, accuracy, notes, device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [tenantId, userId, clientId, clientName, latitude, longitude, accuracy, notes, deviceId]);

      // Update client last contact
      if (clientId) {
        await pool.query(`
          UPDATE clients
          SET last_contact_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND tenant_id = $2
        `, [clientId, tenantId]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: 'Error creating check-in' });
    }
  }

  async getCheckInHistory(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;

    try {
      const result = await pool.query(`
        SELECT 
          c.id,
          c.client_name as "clientName",
          c.latitude,
          c.longitude,
          c.notes,
          c.visit_purpose as "visitPurpose",
          c.created_at as "timestamp"
        FROM check_ins c
        WHERE c.tenant_id = $1
          AND c.user_id = $2
        ORDER BY c.created_at DESC
        LIMIT 20
      `, [tenantId, userId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Check-in history error:', error);
      res.status(500).json({ error: 'Error fetching check-in history' });
    }
  }

  // ============================================
  // VOICE NOTES
  // ============================================
  
  async createVoiceNote(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    
    try {
      const { duration, transcription, clientId, contactId, opportunityId } = req.body;
      const audioFile = req.file;

      // Save audio file reference
      const audioUrl = audioFile ? `/uploads/${audioFile.filename}` : null;

      const result = await pool.query(`
        INSERT INTO voice_notes (
          tenant_id, user_id, client_id, contact_id, opportunity_id,
          audio_url, duration, transcription, device_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [tenantId, userId, clientId, contactId, opportunityId, audioUrl, duration, transcription, req.body.deviceId]);

      // Create activity from transcription if available
      if (transcription) {
        await pool.query(`
          INSERT INTO activities (
            tenant_id, client_id, contact_id, opportunity_id,
            type, title, description, created_by, assigned_to, due_date
          ) VALUES ($1, $2, $3, $4, 'note', 'Nota de voz', $5, $6, $6, NOW())
        `, [tenantId, clientId, contactId, opportunityId, transcription, userId]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Voice note error:', error);
      res.status(500).json({ error: 'Error saving voice note' });
    }
  }

  async transcribeAudio(req: any, res: Response) {
    try {
      // For now, return a placeholder - integrate with OpenAI Whisper later
      res.json({ 
        transcription: '[Transcripción en desarrollo - integrar con OpenAI Whisper API]'
      });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Error transcribing audio' });
    }
  }

  // ============================================
  // BUSINESS CARD SCANNER
  // ============================================
  
  async scanBusinessCard(req: any, res: Response) {
    try {
      // For now, return mock data - integrate with OCR service later
      const mockData = {
        name: 'Nombre Extraído',
        company: 'Empresa',
        jobTitle: 'Cargo',
        email: 'email@ejemplo.com',
        phone: '+56912345678'
      };
      
      res.json({ extractedData: mockData });
    } catch (error) {
      console.error('OCR error:', error);
      res.status(500).json({ error: 'Error scanning business card' });
    }
  }

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================
  
  async savePushSubscription(req: any, res: Response) {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    const subscription = req.body;

    try {
      await pool.query(`
        INSERT INTO push_subscriptions (
          tenant_id, user_id, endpoint, p256dh, auth, subscription
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (endpoint) 
        DO UPDATE SET 
          p256dh = $4, 
          auth = $5, 
          subscription = $6,
          updated_at = NOW()
      `, [
        tenantId, 
        userId, 
        subscription.endpoint,
        subscription.keys?.p256dh || '',
        subscription.keys?.auth || '',
        JSON.stringify(subscription)
      ]);

      res.json({ success: true });
    } catch (error) {
      console.error('Push subscription error:', error);
      res.status(500).json({ error: 'Error saving subscription' });
    }
  }

  async removePushSubscription(req: any, res: Response) {
    const { endpoint } = req.body;

    try {
      await pool.query(`
        DELETE FROM push_subscriptions WHERE endpoint = $1
      `, [endpoint]);

      res.json({ success: true });
    } catch (error) {
      console.error('Push unsubscription error:', error);
      res.status(500).json({ error: 'Error removing subscription' });
    }
  }
}

export default MobileController;
