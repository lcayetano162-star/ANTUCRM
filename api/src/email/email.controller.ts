import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto, ConfigureEmailDto, EmailWebhookDto } from './dto/send-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  @Get('config')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getConfig(@CurrentTenant() tenantId: string) {
    const config = await this.emailService.getConfig(tenantId);
    if (!config) {
      return { configured: false };
    }
    return {
      configured: true,
      config: {
        id: config.id,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser,
        // No devolver password
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        isActive: config.isActive,
        createdAt: config.createdAt,
      },
    };
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @RequirePermissions('admin')
  async configure(
    @Body() dto: ConfigureEmailDto,
    @CurrentTenant() tenantId: string,
  ) {
    const config = await this.emailService.configure(tenantId, dto);
    return { success: true, config };
  }

  // ============================================
  // ENVÍO Y LISTADO
  // ============================================

  @Post('send')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async sendEmail(
    @Body() dto: SendEmailDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.emailService.sendEmail(tenantId, user.userId, dto);
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getMessages(
    @Query('contactId') contactId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @CurrentTenant() tenantId: string,
  ) {
    return this.emailService.getEmails(tenantId, {
      contactId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getStats(@CurrentTenant() tenantId: string) {
    return this.emailService.getStats(tenantId);
  }

  // ============================================
  // TRACKING (Público)
  // ============================================

  @Get('track/:trackingId')
  @Public()
  @HttpCode(HttpStatus.OK)
  async trackOpen(
    @Param('trackingId') trackingId: string,
    @Res() res: Response,
  ) {
    const pixel = await this.emailService.trackOpen(trackingId);
    
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  }

  // ============================================
  // WEBHOOK INBOUND (Público)
  // ============================================

  @Post('inbound')
  @Public()
  @HttpCode(HttpStatus.OK)
  async receiveInbound(
    @Body() payload: EmailWebhookDto,
    @Query('signature') signature: string,
  ) {
    await this.emailService.processInboundWebhook(payload, signature);
    return { received: true };
  }
}
