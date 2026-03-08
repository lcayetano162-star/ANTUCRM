// ============================================
// HEALTH CHECK - Production Readiness
// ============================================

import { pool } from '../shared/config/database';
import { query } from '../shared/config/database';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: { status: boolean; latency: number; message?: string };
    diskSpace: { status: boolean; message?: string };
    memory: { status: boolean; used: number; total: number };
    emailWorker: { status: boolean; message?: string };
  };
  metrics: {
    uptime: number;
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    database: { status: false, latency: -1 },
    diskSpace: { status: true },
    memory: { status: true, used: 0, total: 0 },
    emailWorker: { status: process.env.EMAIL_WORKER_ENABLED !== 'false' },
  };

  // Check Database
  try {
    const start = Date.now();
    await query('SELECT 1');
    checks.database = {
      status: true,
      latency: Date.now() - start,
    };
  } catch (error: any) {
    checks.database = {
      status: false,
      latency: -1,
      message: error.message,
    };
  }

  // Check Memory
  const used = process.memoryUsage();
  checks.memory = {
    status: used.heapUsed < 1024 * 1024 * 1024, // 1GB threshold
    used: Math.round(used.heapUsed / 1024 / 1024),
    total: Math.round(used.heapTotal / 1024 / 1024),
  };

  // Determine overall status
  let status: HealthStatus['status'] = 'healthy';
  if (!checks.database.status) {
    status = 'unhealthy';
  } else if (!checks.memory.status || !checks.diskSpace.status) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    checks,
    metrics: {
      uptime: process.uptime(),
      activeConnections: pool.totalCount,
      totalRequests: 0, // Would need to track this
      errorRate: 0, // Would need to track this
    },
  };
}

// Check específico para backups
export async function checkBackupStatus(): Promise<{
  lastBackup: Date | null;
  status: 'ok' | 'warning' | 'critical';
  nextBackup: Date;
}> {
  try {
    const result = await query(
      `SELECT MAX(created_at) as last_backup 
       FROM audit_logs 
       WHERE action = 'backup_completed'`,
      []
    );

    const lastBackup = result.rows[0]?.last_backup 
      ? new Date(result.rows[0].last_backup) 
      : null;
    
    const now = new Date();
    const hoursSinceBackup = lastBackup 
      ? (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60)
      : Infinity;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (hoursSinceBackup > 48) status = 'critical';
    else if (hoursSinceBackup > 25) status = 'warning';

    const nextBackup = new Date();
    nextBackup.setHours(2, 0, 0, 0); // 2 AM tomorrow
    if (nextBackup < now) nextBackup.setDate(nextBackup.getDate() + 1);

    return { lastBackup, status, nextBackup };
  } catch (error) {
    return {
      lastBackup: null,
      status: 'critical',
      nextBackup: new Date(),
    };
  }
}
