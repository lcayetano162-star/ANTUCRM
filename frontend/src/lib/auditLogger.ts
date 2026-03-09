import type { AuditLog, AuditAction, AuditSeverity } from '../types/audit';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

class AuditLogger {
    private static instance: AuditLogger;
    // In-memory fallback buffer (max 200 entries, cleared on page close)
    private buffer: AuditLog[] = [];

    private constructor() { }

    public static getInstance(): AuditLogger {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }

    public async log(params: {
        action: AuditAction;
        resource: string;
        description: string;
        userId: string;
        userEmail: string;
        userName: string;
        tenantId: string;
        severity?: AuditSeverity;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const newLog: AuditLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            severity: params.severity || 'INFO',
            ...params,
        };

        // Keep in-memory buffer as fallback
        this.buffer = [newLog, ...this.buffer].slice(0, 200);

        // Persist to backend (non-blocking — fire and forget)
        this.sendToBackend(newLog).catch(() => {
            // Backend unavailable — log stays in memory buffer only
        });
    }

    private async sendToBackend(log: AuditLog): Promise<void> {
        const token = sessionStorage.getItem('antu_access_token');
        if (!token) return;

        await fetch(`${API_URL}/audit/client-events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                action: log.action,
                resource: log.resource,
                description: log.description,
                severity: log.severity,
                metadata: log.metadata,
            }),
        });
    }

    /** Returns in-memory buffer (current session only) */
    public getLogs(): AuditLog[] {
        return [...this.buffer];
    }

    public clearLogs(): void {
        this.buffer = [];
    }
}

export const auditLogger = AuditLogger.getInstance();
