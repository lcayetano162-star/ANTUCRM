import { query } from '../../../shared/config/database';
import nodemailer from 'nodemailer';

export class AutomationService {
  async trigger(event: string, data: any, tenantId: string): Promise<void> {
    try {
      const result = await query(
        "SELECT * FROM marketing_automations WHERE tenant_id = $1 AND status = 'active' AND trigger = $2",
        [tenantId, event]
      );
      for (const automation of result.rows) {
        const conditions = typeof automation.conditions === 'string' ? JSON.parse(automation.conditions) : automation.conditions;
        const actions = typeof automation.actions === 'string' ? JSON.parse(automation.actions) : automation.actions;
        if (this.checkConditions(conditions, data)) {
          await this.executeAutomation(actions, data, tenantId);
        }
      }
    } catch (error) {
      console.error('[AutomationService] Error en trigger:', error);
    }
  }

  checkConditions(conditions: any[], data: any): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(condition => {
      const value = data[condition.field];
      switch (condition.operator) {
        case 'equals': return value === condition.value;
        case 'not_equals': return value !== condition.value;
        case 'contains': return String(value).includes(condition.value);
        case 'greater_than': return Number(value) > Number(condition.value);
        case 'less_than': return Number(value) < Number(condition.value);
        default: return true;
      }
    });
  }

  async executeAutomation(actions: any[], data: any, tenantId: string): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email':
            await this.sendEmailAction(action, data, tenantId);
            break;
          case 'change_status':
            await this.changeStatusAction(action, data, tenantId);
            break;
          case 'assign_user':
            await this.assignUserAction(action, data, tenantId);
            break;
          case 'webhook':
            await this.webhookAction(action, data);
            break;
          case 'wait':
            await this.waitAction(action);
            break;
        }
      } catch (error) {
        console.error(`[AutomationService] Error ejecutando accion ${action.type}:`, error);
      }
    }
  }

  async sendEmailAction(action: any, data: any, tenantId: string): Promise<void> {
    try {
      const settingsResult = await query('SELECT * FROM tenant_email_settings WHERE tenant_id = $1', [tenantId]);
      if (settingsResult.rows.length === 0) return;

      const settings = settingsResult.rows[0];
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: { user: settings.smtp_user, pass: settings.smtp_password }
      });

      await transporter.sendMail({
        from: settings.from_email,
        to: data.email || action.to,
        subject: action.subject,
        html: action.body
      });
    } catch (error) {
      console.error('[AutomationService] Error enviando email en automatizacion:', error);
    }
  }

  async changeStatusAction(action: any, data: any, tenantId: string): Promise<void> {
    if (data.clientId) {
      await query('UPDATE clients SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3', [action.status, data.clientId, tenantId]);
    }
  }

  async assignUserAction(action: any, data: any, tenantId: string): Promise<void> {
    if (data.clientId) {
      await query('UPDATE clients SET assigned_to = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3', [action.userId, data.clientId, tenantId]);
    }
  }

  async webhookAction(action: any, data: any): Promise<void> {
    try {
      await fetch(action.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[AutomationService] Error en webhook:', error);
    }
  }

  async waitAction(action: any): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, (action.minutes || 0) * 60 * 1000));
  }
}

export const automationService = new AutomationService();
