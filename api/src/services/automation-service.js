// ============================================
// SERVICIO DE AUTOMATIZACIONES
// ============================================

const { query } = require('../config/database');
const QueueService = require('./queue-service');

class AutomationService {
  
  /**
   * Ejecuta automatizaciones basadas en un disparador
   */
  static async trigger(triggerType, context) {
    try {
      const { tenantId, contactId, ...extraData } = context;

      // Buscar automatizaciones activas con este trigger
      const automations = await query(`
        SELECT * FROM marketing_automations 
        WHERE tenant_id = $1 
          AND trigger_type = $2 
          AND status = 'active'
      `, [tenantId, triggerType]);

      for (const automation of automations.rows) {
        // Verificar condiciones
        const shouldExecute = await this.checkConditions(
          automation.conditions,
          contactId,
          extraData
        );

        if (shouldExecute) {
          await this.executeAutomation(automation, contactId, tenantId);
        }
      }

    } catch (error) {
      console.error('Automation trigger error:', error);
    }
  }

  /**
   * Verifica si se cumplen las condiciones de la automatización
   */
  static async checkConditions(conditions, contactId, extraData) {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    try {
      const conditionsArray = typeof conditions === 'string' 
        ? JSON.parse(conditions) 
        : conditions;

      for (const condition of conditionsArray) {
        const { field, operator, value } = condition;

        // Obtener valor del contacto
        const contact = await query(`
          SELECT ${field} FROM clients WHERE id = $1
        `, [contactId]);

        if (contact.rows.length === 0) return false;

        const fieldValue = contact.rows[0][field];

        // Evaluar condición
        let conditionMet = false;
        switch (operator) {
          case '=':
          case '==':
            conditionMet = fieldValue == value;
            break;
          case '!=':
            conditionMet = fieldValue != value;
            break;
          case '>':
            conditionMet = parseFloat(fieldValue) > parseFloat(value);
            break;
          case '>=':
            conditionMet = parseFloat(fieldValue) >= parseFloat(value);
            break;
          case '<':
            conditionMet = parseFloat(fieldValue) < parseFloat(value);
            break;
          case '<=':
            conditionMet = parseFloat(fieldValue) <= parseFloat(value);
            break;
          case 'contains':
            conditionMet = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
            break;
          default:
            conditionMet = false;
        }

        if (!conditionMet) return false;
      }

      return true;

    } catch (error) {
      console.error('Check conditions error:', error);
      return false;
    }
  }

  /**
   * Ejecuta las acciones de una automatización
   */
  static async executeAutomation(automation, contactId, tenantId) {
    try {
      // Obtener acciones ordenadas
      const actions = await query(`
        SELECT * FROM automation_actions 
        WHERE automation_id = $1 
        ORDER BY sequence ASC
      `, [automation.id]);

      for (const action of actions.rows) {
        const config = typeof action.action_config === 'string'
          ? JSON.parse(action.action_config)
          : action.action_config;

        switch (action.action_type) {
          case 'send_email':
            await this.sendEmailAction(config, contactId, tenantId);
            break;
          
          case 'change_status':
            await this.changeStatusAction(config, contactId);
            break;
          
          case 'assign_user':
            await this.assignUserAction(config, contactId);
            break;
          
          case 'add_tag':
            await this.addTagAction(config, contactId);
            break;
          
          case 'webhook':
            await this.webhookAction(config, contactId, tenantId);
            break;
          
          case 'wait':
            await this.waitAction(config);
            break;
          
          default:
            console.log(`Unknown action type: ${action.action_type}`);
        }
      }

      // Registrar ejecución
      await query(`
        INSERT INTO automation_execution_logs (automation_id, contact_id, status)
        VALUES ($1, $2, 'success')
      `, [automation.id, contactId]);

      // Actualizar contador
      await query(`
        UPDATE marketing_automations 
        SET execution_count = execution_count + 1, last_executed_at = NOW()
        WHERE id = $1
      `, [automation.id]);

    } catch (error) {
      console.error('Execute automation error:', error);
      
      // Registrar error
      await query(`
        INSERT INTO automation_execution_logs (automation_id, contact_id, status, error_message)
        VALUES ($1, $2, 'failed', $3)
      `, [automation.id, contactId, error.message]);
    }
  }

  /**
   * Acción: Enviar email
   */
  static async sendEmailAction(config, contactId, tenantId) {
    const { template_id, subject, content, from_name, from_email } = config;

    // Obtener datos del contacto
    const contact = await query(`
      SELECT email, first_name, last_name 
      FROM clients WHERE id = $1
    `, [contactId]);

    if (contact.rows.length === 0 || !contact.rows[0].email) {
      throw new Error('Contacto no tiene email');
    }

    const { email, first_name, last_name } = contact.rows[0];

    // Personalizar contenido
    const personalizedContent = content
      .replace(/{{first_name}}/g, first_name || '')
      .replace(/{{last_name}}/g, last_name || '')
      .replace(/{{email}}/g, email);

    // Agregar a cola de envío
    const trackingId = require('../utils/tracking').generateTrackingId();
    
    await query(`
      INSERT INTO email_queue (
        tenant_id, contact_id,
        to_email, to_name, subject,
        body_html, body_text,
        tracking_id, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      tenantId,
      contactId,
      email,
      `${first_name} ${last_name}`.trim(),
      subject,
      personalizedContent,
      '',
      trackingId
    ]);
  }

  /**
   * Acción: Cambiar estado del lead
   */
  static async changeStatusAction(config, contactId) {
    const { lead_status } = config;

    await query(`
      UPDATE clients 
      SET lead_status = $1, updated_at = NOW()
      WHERE id = $2
    `, [lead_status, contactId]);
  }

  /**
   * Acción: Asignar a usuario
   */
  static async assignUserAction(config, contactId) {
    const { user_id } = config;

    await query(`
      UPDATE clients 
      SET assigned_to = $1, assigned_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [user_id, contactId]);
  }

  /**
   * Acción: Agregar etiqueta (si implementas sistema de tags)
   */
  static async addTagAction(config, contactId) {
    // Implementar si tienes tabla de tags
    console.log('Add tag action:', config);
  }

  /**
   * Acción: Llamar webhook externo
   */
  static async webhookAction(config, contactId, tenantId) {
    const { url, method = 'POST', headers = {} } = config;

    // Obtener datos del contacto
    const contact = await query(`
      SELECT * FROM clients WHERE id = $1
    `, [contactId]);

    if (contact.rows.length === 0) return;

    // Llamar webhook
    try {
      const fetch = require('node-fetch');
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          event: 'automation_triggered',
          contact: contact.rows[0],
          tenant_id: tenantId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook action error:', error);
    }
  }

  /**
   * Acción: Esperar (delay)
   */
  static async waitAction(config) {
    const { delay_minutes = 0 } = config;
    
    if (delay_minutes > 0) {
      await new Promise(resolve => setTimeout(resolve, delay_minutes * 60 * 1000));
    }
  }
}

module.exports = AutomationService;
