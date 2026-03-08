import { query } from '../../shared/config/database';

export type TriggerType =
  | 'deal_stuck'
  | 'contact_inactive'
  | 'task_overdue'
  | 'deal_won'
  | 'deal_lost'
  | 'stage_changed'
  | 'new_deal_created';

export type ActionType = 'create_task' | 'send_notification' | 'change_stage' | 'webhook';

interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  action_type: ActionType;
  action_config: Record<string, any>;
  is_active: boolean;
}

// ── Event-based: call this from any route when something happens ──────────────
export async function fireEvent(
  triggerType: TriggerType,
  tenantId: string,
  entityId: string,
  entityData: Record<string, any>
): Promise<void> {
  try {
    const rules = await query(
      `SELECT * FROM automation_rules WHERE tenant_id = $1 AND trigger_type = $2 AND is_active = true`,
      [tenantId, triggerType]
    );
    for (const rule of rules.rows) {
      // Non-blocking: don't await, let it run in background
      evaluateAndExecute(rule, entityId, 'opportunity', entityData).catch(e =>
        console.error('[AutomationEngine] Error ejecutando regla', rule.id, e.message)
      );
    }
  } catch (err: any) {
    console.error('[AutomationEngine] Error en fireEvent:', err.message);
  }
}

// ── Time-based: called by automationWorker on schedule ───────────────────────
export async function runScheduledChecks(): Promise<{ checked: number; fired: number }> {
  let fired = 0;
  let checked = 0;

  try {
    fired += await checkDealStuck();    checked++;
    fired += await checkContactInactive(); checked++;
    fired += await checkTaskOverdue();  checked++;
  } catch (err: any) {
    console.error('[AutomationEngine] Error en checks programados:', err.message);
  }

  return { checked, fired };
}

// ── Time-based checks ─────────────────────────────────────────────────────────
async function checkDealStuck(): Promise<number> {
  let count = 0;
  const rules = await query(
    `SELECT * FROM automation_rules WHERE trigger_type = 'deal_stuck' AND is_active = true`
  );

  for (const rule of rules.rows) {
    const days = rule.trigger_config?.days || 14;
    const stageFilter = rule.trigger_config?.stage && rule.trigger_config.stage !== 'any'
      ? `AND o.stage = ${JSON.stringify(rule.trigger_config.stage)}`
      : `AND o.stage NOT IN ('closed_won','closed_lost')`;

    const stuckDeals = await query(
      `SELECT o.id, o.name, o.stage, o.owner_id, o.estimated_revenue,
              EXTRACT(DAY FROM NOW() - o.updated_at)::int AS days_stuck,
              c.name AS client_name
       FROM opportunities o
       LEFT JOIN clients c ON o.client_id = c.id
       WHERE o.tenant_id = $1 ${stageFilter}
         AND o.updated_at < NOW() - ($2 || ' days')::INTERVAL
       ORDER BY days_stuck DESC`,
      [rule.tenant_id, days]
    );

    for (const deal of stuckDeals.rows) {
      const fired = await evaluateAndExecute(rule, deal.id, 'opportunity', deal);
      if (fired) count++;
    }
  }
  return count;
}

async function checkContactInactive(): Promise<number> {
  let count = 0;
  const rules = await query(
    `SELECT * FROM automation_rules WHERE trigger_type = 'contact_inactive' AND is_active = true`
  );

  for (const rule of rules.rows) {
    const days = rule.trigger_config?.days || 30;

    const staleContacts = await query(
      `SELECT c.id,
              c.first_name || ' ' || c.last_name AS name,
              c.assigned_to,
              cl.name AS company,
              EXTRACT(DAY FROM NOW() - COALESCE(
                (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = c.id AND a.tenant_id = $1),
                c.created_at
              ))::int AS days_inactive
       FROM contacts c
       LEFT JOIN clients cl ON c.client_id = cl.id
       WHERE c.tenant_id = $1
       HAVING EXTRACT(DAY FROM NOW() - COALESCE(
                (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = c.id AND a.tenant_id = $1),
                c.created_at
              )) > $2
       ORDER BY days_inactive DESC`,
      [rule.tenant_id, days]
    );

    for (const contact of staleContacts.rows) {
      const fired = await evaluateAndExecute(rule, contact.id, 'contact', contact);
      if (fired) count++;
    }
  }
  return count;
}

async function checkTaskOverdue(): Promise<number> {
  let count = 0;
  const rules = await query(
    `SELECT * FROM automation_rules WHERE trigger_type = 'task_overdue' AND is_active = true`
  );

  for (const rule of rules.rows) {
    const overdueTasks = await query(
      `SELECT t.id, t.title, t.assigned_to, t.due_date, t.related_to_id, t.related_to_type
       FROM tasks t
       WHERE t.tenant_id = $1
         AND t.status IN ('pending','in_progress')
         AND t.due_date < CURRENT_DATE
       ORDER BY t.due_date ASC`,
      [rule.tenant_id]
    );

    for (const task of overdueTasks.rows) {
      const fired = await evaluateAndExecute(rule, task.id, 'task', task);
      if (fired) count++;
    }
  }
  return count;
}

// ── Condition check: filter by value, gov flag, etc. ─────────────────────────
function checkConditions(triggerConfig: Record<string, any>, entityData: Record<string, any>): boolean {
  const value = parseFloat(entityData.estimated_revenue || entityData.value || 0);

  // Value threshold conditions
  if (triggerConfig.min_value != null && value < triggerConfig.min_value) return false;
  if (triggerConfig.max_value != null && value > triggerConfig.max_value) return false;

  // Government client condition
  if (triggerConfig.only_gov === true && !entityData.is_gov) return false;

  return true;
}

// ── Core evaluation: dedup + execute ─────────────────────────────────────────
async function evaluateAndExecute(
  rule: AutomationRule,
  entityId: string,
  entityType: string,
  entityData: Record<string, any>
): Promise<boolean> {
  // Check conditions (value thresholds, gov filter, etc.) before dedup
  if (!checkConditions(rule.trigger_config, entityData)) return false;

  // Deduplicate: don't fire the same rule for the same entity within 24h
  const alreadyFired = await query(
    `SELECT id FROM automation_logs
     WHERE rule_id = $1 AND entity_id = $2 AND status = 'success'
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [rule.id, entityId]
  );
  if (alreadyFired.rows.length > 0) return false;

  try {
    const actionResult = await executeAction(rule, entityId, entityType, entityData);

    await query(
      `INSERT INTO automation_logs
         (rule_id, tenant_id, entity_id, entity_type, status, trigger_data, action_result)
       VALUES ($1,$2,$3,$4,'success',$5,$6)`,
      [rule.id, rule.tenant_id, entityId, entityType,
       JSON.stringify(entityData), JSON.stringify(actionResult)]
    );

    await query(
      `UPDATE automation_rules SET run_count = run_count + 1, last_run_at = NOW() WHERE id = $1`,
      [rule.id]
    );

    return true;
  } catch (err: any) {
    await query(
      `INSERT INTO automation_logs
         (rule_id, tenant_id, entity_id, entity_type, status, trigger_data, error_message)
       VALUES ($1,$2,$3,$4,'error',$5,$6)`,
      [rule.id, rule.tenant_id, entityId, entityType,
       JSON.stringify(entityData), err.message]
    );
    return false;
  }
}

// ── Action execution ──────────────────────────────────────────────────────────
async function executeAction(
  rule: AutomationRule,
  entityId: string,
  entityType: string,
  entityData: Record<string, any>
): Promise<any> {
  const cfg = rule.action_config;

  switch (rule.action_type) {
    case 'create_task': {
      const title = interpolate(cfg.title || 'Seguimiento automático - {name}', entityData);
      const description = interpolate(cfg.description || '', entityData);
      // 'owner' = use the owner_id/assigned_to of the entity
      const assignedTo = cfg.assigned_to === 'owner'
        ? (entityData.owner_id || entityData.assigned_to)
        : (cfg.assigned_to_user_id || null);
      const dueDate = cfg.days_from_now != null
        ? new Date(Date.now() + cfg.days_from_now * 86400000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const taskResult = await query(
        `INSERT INTO tasks
           (title, description, assigned_to, due_date, priority,
            related_to_type, related_to_id, tenant_id, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$3) RETURNING id`,
        [title, description, assignedTo, dueDate, cfg.priority || 'high',
         entityType, entityId, rule.tenant_id]
      );
      return { task_created: taskResult.rows[0].id, title };
    }

    case 'send_notification': {
      const message = interpolate(
        cfg.message || 'Automatización "{rule_name}" activada para {name}',
        { ...entityData, rule_name: rule.name }
      );
      await query(
        `INSERT INTO automation_notifications
           (tenant_id, user_id, rule_id, entity_id, entity_type, message)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [rule.tenant_id,
         entityData.owner_id || entityData.assigned_to || null,
         rule.id, entityId, entityType, message]
      );
      return { notification_sent: true, message };
    }

    case 'change_stage': {
      if (entityType !== 'opportunity') throw new Error('change_stage solo aplica a oportunidades');
      const newStage = cfg.stage;
      if (!newStage) throw new Error('action_config.stage es requerido para change_stage');
      await query(
        `UPDATE opportunities SET stage = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [newStage, entityId, rule.tenant_id]
      );
      return { stage_changed_to: newStage };
    }

    case 'webhook': {
      if (!cfg.url) throw new Error('action_config.url es requerido para webhook');
      const response = await fetch(cfg.url, {
        method: cfg.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
        body: JSON.stringify({
          rule_id: rule.id,
          rule_name: rule.name,
          trigger: rule.trigger_type,
          entity_id: entityId,
          entity_type: entityType,
          data: entityData,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`Webhook respondió con status ${response.status}`);
      return { webhook_status: response.status, ok: true };
    }

    default:
      throw new Error(`Tipo de acción desconocido: ${(rule as any).action_type}`);
  }
}

// ── Template interpolation ────────────────────────────────────────────────────
function interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = data[key];
    return val != null ? String(val) : `{${key}}`;
  });
}
