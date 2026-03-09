import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { tenantStorage } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant no especificado');
    }

    // Store in request for direct access
    request.tenantId = user.tenantId;

    // Establish tenant context in AsyncLocalStorage using enterWith() so the context
    // persists for the remainder of this async execution chain (including the handler).
    // tenantStorage.run() with a callback loses context after canActivate returns,
    // because the handler runs outside that callback. enterWith() fixes this.
    tenantStorage.enterWith({ tenantId: user.tenantId, userId: user.id });

    return true;
  }
}
