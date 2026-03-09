import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const path = request.route?.path || request.url;

    // Solo auditar operaciones de escritura
    const auditActions = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!auditActions.includes(method) || !user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;

        // Determinar la acción basada en el método y path
        const action = this.determineAction(method, path);

        if (action) {
          await this.auditService.log({
            tenantId: user.tenantId,
            userId: user.id,
            action,
            entityType: this.extractEntityType(path),
            entityId: request.params?.id,
            metadata: {
              method,
              path: request.url,
              duration,
              body: this.sanitizeBody(request.body),
              response: this.sanitizeResponse(response),
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        }
      }),
    );
  }

  private determineAction(method: string, path: string): string | null {
    const entity = this.extractEntityType(path);

    switch (method) {
      case 'POST':
        return `${entity.toUpperCase()}_CREATED`;
      case 'PUT':
      case 'PATCH':
        return `${entity.toUpperCase()}_UPDATED`;
      case 'DELETE':
        return `${entity.toUpperCase()}_DELETED`;
      default:
        return null;
    }
  }

  private extractEntityType(path: string): string {
    const parts = path.split('/');
    const entityPart = parts.find((p) =>
      ['contacts', 'companies', 'opportunities', 'tasks', 'inventory'].includes(p),
    );
    return entityPart ? entityPart.slice(0, -1).toUpperCase() : 'UNKNOWN';
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.token;
    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;
    if (typeof response !== 'object') return response;

    const sanitized = { ...response };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.token;
    delete sanitized.accessToken;
    delete sanitized.refreshToken;

    return sanitized;
  }
}
