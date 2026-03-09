import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Guard simple de rate limiting en memoria.
 * Para producción usar @nestjs/throttler o Redis.
 * Límite: 10 intentos por IP cada 15 minutos.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip: string =
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      'unknown';

    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (entry) {
      if (now > entry.resetAt) {
        // Ventana expirada — reset
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
      }
      if (entry.count >= MAX_ATTEMPTS) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        throw new HttpException(
          `Demasiados intentos. Intenta de nuevo en ${retryAfterSec} segundos.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    return true;
  }
}
