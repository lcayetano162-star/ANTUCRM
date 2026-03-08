import { query } from '../config/database';

// ─── System log ───────────────────────────────────────────────────────────────
export async function logSystem(data: {
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  details?: string;
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  tenantName?: string;
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO system_logs
         (level, category, message, details, user_id, user_email,
          tenant_id, tenant_name, ip_address, request_id, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        data.level, data.category, data.message, data.details ?? null,
        data.userId ?? null, data.userEmail ?? null,
        data.tenantId ?? null, data.tenantName ?? null, data.ipAddress ?? null,
        data.requestId ?? null, data.userAgent ?? null,
      ]
    );
  } catch (err) {
    // Never let logging break the main flow
    console.error('[Logger] Failed to write system log:', err);
  }
}

// ─── Audit log ────────────────────────────────────────────────────────────────
// Immutable: DB triggers (migration 018) prevent UPDATE or DELETE on this table.
export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'LOGIN' | 'LOGOUT'
  | 'ACCESS_DENIED' | 'EXPORT'
  | 'CONFIG_CHANGE' | 'PASSWORD_CHANGE' | 'PERMISSION_CHANGE';

export async function logAudit(data: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  tenantName?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
         (action, entity_type, entity_id, user_id, user_email,
          tenant_id, tenant_name, changes, ip_address, request_id, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        data.action, data.entityType, data.entityId ?? null,
        data.userId ?? null, data.userEmail ?? null,
        data.tenantId ?? null, data.tenantName ?? null,
        JSON.stringify(data.changes ?? {}),
        data.ipAddress ?? null, data.requestId ?? null, data.userAgent ?? null,
      ]
    );
  } catch (err) {
    console.error('[Logger] Failed to write audit log:', err);
  }
}
