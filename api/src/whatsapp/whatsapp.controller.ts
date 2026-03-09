import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Query, 
  Param, 
  UseGuards,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto, ConfigureWhatsAppDto, WebhookPayloadDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/v1/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  @Get('config')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getConfig(@CurrentTenant() tenantId: string) {
    const config = await this.whatsAppService.getConfig(tenantId);
    if (!config) {
      return { configured: false };
    }
    return {
      configured: true,
      config: {
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        isActive: config.isActive,
        isVerified: config.isVerified,
        connectedAt: config.connectedAt,
        messagesSentToday: config.messagesSentToday,
        messagesSentDate: config.messagesSentDate,
        createdAt: config.createdAt,
      },
    };
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @RequirePermissions('admin')
  async configure(
    @Body() dto: ConfigureWhatsAppDto,
    @CurrentTenant() tenantId: string,
  ) {
    const config = await this.whatsAppService.configure(tenantId, dto);
    return { success: true, config };
  }

  @Delete('config')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @RequirePermissions('admin')
  async disconnect(@CurrentTenant() tenantId: string) {
    await this.whatsAppService.disconnect(tenantId);
    return { success: true, message: 'WhatsApp disconnected' };
  }

  // ============================================
  // MENSAJES
  // ============================================

  @Post('send')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.whatsAppService.sendMessage(tenantId, user.userId, dto);
    return { success: true, data: result };
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getMessages(
    @Query('contactId') contactId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @CurrentTenant() tenantId: string,
  ) {
    return this.whatsAppService.getMessages(tenantId, {
      contactId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getConversations(@CurrentTenant() tenantId: string) {
    return this.whatsAppService.getConversations(tenantId);
  }

  // ============================================
  // WEBHOOK (Público - para Meta)
  // ============================================

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = await this.whatsAppService.verifyWebhook(token, challenge, mode);
    if (result === null) {
      return { statusCode: 403 };
    }
    return result;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    // Responder inmediatamente a Meta (no bloquear)
    // Procesar en background
    this.whatsAppService.processWebhook(payload, signature)
      .catch(error => {
        console.error('[WhatsApp] Webhook processing error:', error);
      });
    
    return { received: true };
  }

  // ============================================
  // TEMPLATES
  // ============================================

  @Get('templates')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getTemplates(@CurrentTenant() tenantId: string) {
    const templates = await this.prisma.whatsappTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: templates };
  }

  private get prisma() {
    return (this.whatsAppService as any).prisma;
  }
}
