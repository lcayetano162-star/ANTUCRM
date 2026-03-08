import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../config/database';

const VALID_SCOPES = [
  'read:crm','write:crm',
  'read:invoices','write:invoices',
  'read:inventory','write:inventory',
  'read:service','write:service',
];

/**
 * Middleware: autentica via API Key (X-API-Key header o Bearer token).
 * Adjunta req.apiKeyUser = { tenant_id, scopes, key_id }
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const rawKey =
    req.headers['x-api-key'] as string ||
    (req.headers['authorization'] as string)?.replace(/^Bearer\s+/i, '');

  if (!rawKey) {
    return res.status(401).json({ error: 'API key requerida', hint: 'Enviar X-API-Key header o Authorization: Bearer <key>' });
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const result = await query(
      `SELECT id, tenant_id, scopes, name FROM api_keys
        WHERE key_hash = $1
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'API key inválida o revocada' });
    }

    const key = result.rows[0];

    // Actualizar last_used_at sin bloquear (fire & forget)
    query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [key.id]).catch(() => {});

    (req as any).apiKeyUser = {
      tenant_id: key.tenant_id,
      scopes:    key.scopes,
      key_id:    key.id,
      key_name:  key.name
    };

    next();
  } catch (err) {
    console.error('[ApiKeyAuth] Error:', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

/**
 * Middleware: verifica que la API key tenga el scope requerido.
 * Usar después de authenticateApiKey.
 */
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKeyUser = (req as any).apiKeyUser;
    if (!apiKeyUser) return res.status(401).json({ error: 'No autenticado' });

    const scopes: string[] = apiKeyUser.scopes || [];
    if (!scopes.includes(scope)) {
      return res.status(403).json({
        error: `Scope insuficiente. Se requiere: ${scope}`,
        your_scopes: scopes
      });
    }
    next();
  };
}

export const VALID_SCOPES_LIST = VALID_SCOPES;
