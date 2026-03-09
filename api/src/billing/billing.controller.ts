import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    UseGuards,
    Req,
    HttpCode
} from '@nestjs/common';
import { BillingService } from './billing.service';

import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
    constructor(private readonly billing: BillingService) { }

    /**
     * SUPER ADMIN: Configurar pasarelas activas globalmente
     */
    @Post('setup-config')
    @RequirePermissions('billing:write')
    @UseGuards(RolesGuard)
    async configureGateways(@Body() config: { activeGateways: string[], settings: any }) {
        // Almacenar en la tabla global_billing_config
        return { success: true, message: 'Configuración actualizada' };
    }

    /**
     * TENANT: Obtener estado de suscripción actual
     */
    @Get('current-subscription')
    async getSubscription(@Req() req) {
        const { tenantId } = req.user;
        return this.billing.validatePlanLimits(tenantId, 'users', 0); // Ejemplo de validación
    }

    /**
     * TENANT: Iniciar Checkout
     */
    @Post('checkout')
    async checkout(@Req() req, @Body() data: {
        planCode: string,
        cycle: 'MONTHLY' | 'YEARLY',
        gateway: string,
        paymentSource: any
    }) {
        const { tenantId } = req.user;
        return this.billing.subscribe(
            tenantId,
            data.planCode,
            data.cycle as any,
            data.gateway,
            data.paymentSource
        );
    }

    /**
     * EXTERNO: Webhook de pasarela (Público)
     */
    @Post('webhook/:gateway')
    @HttpCode(200)
    async handleWebhook(
        @Param('gateway') gateway: string,
        @Body() payload: any,
        @Headers('stripe-signature') signatureStripe: string,
        @Headers('x-paypal-signature') signaturePaypal: string
    ) {
        const signature = signatureStripe || signaturePaypal;
        return this.billing.handleGatewayWebhook(gateway.toUpperCase(), payload, signature);
    }
}
