import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Receives client-side audit events and persists them to the DB.
   * Only the action, resource, description, severity, and metadata
   * come from the client — userId and tenantId are extracted from the JWT.
   */
  @Post('client-events')
  async logClientEvent(
    @CurrentUser() user: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: String(body.action || 'CLIENT_EVENT').slice(0, 100),
      entityType: String(body.resource || 'frontend').slice(0, 100),
      metadata: {
        description: String(body.description || '').slice(0, 500),
        severity: body.severity,
        ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
      },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    return { ok: true };
  }
}
