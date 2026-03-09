export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'USER_CREATE'
    | 'USER_UPDATE'
    | 'USER_DELETE'
    | 'USER_STATUS_CHANGE'
    | 'TENANT_UPDATE'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_RESET_REQUEST'
    | 'MFA_ENABLE'
    | 'MFA_DISABLE'
    | 'API_KEY_GENERATE'
    | 'DATA_EXPORT';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    userName: string;
    action: AuditAction;
    resource: string; // e.g., 'User Management', 'Security Settings'
    description: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>; // For storing diffs or extra context
    severity: AuditSeverity;
    tenantId: string;
}
