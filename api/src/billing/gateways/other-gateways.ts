import { IPaymentGateway, PaymentSource } from './payment-gateway.interface';
// SubscriptionStatus removed from prisma
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PayPalGateway implements IPaymentGateway {
    private readonly logger = new Logger(PayPalGateway.name);

    initialize(config: any) { }

    async createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource) {
        this.logger.log(`PayPal: Creando acuerdo de facturación para ${tenantId}`);

        // Simulación de aprobación de PayPal Billing Agreement
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);

        return {
            externalId: `I-${Math.random().toString().substring(2, 10)}`,
            status: 'ACTIVE',
            nextPaymentDate: futureDate,
        };
    }

    async processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource) {
        return { id: 'paypal_trx_1', amount, currency, status: 'SUCCESS' as const, gatewayReference: 'pay_ref_paypal' };
    }

    async cancelSubscription(externalId: string) { return true; }
    verifyWebhook(payload: any, signature: string) { return true; }
}

@Injectable()
export class AzulGateway implements IPaymentGateway {
    private readonly logger = new Logger(AzulGateway.name);

    initialize(config: any) { }

    async createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource) {
        // Azul no maneja suscripciones recurrentes automáticas tradicionales por defecto
        // Usamos el flujo de "Tokenización" para procesar cobros automáticos controlados por el backend (Merchant Managed)
        this.logger.log(`Azul: Tokenizando tarjeta y procesando primer cobro para ${tenantId}`);

        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);

        return {
            externalId: `azul_token_${paymentSource.token || 'temp_token'}`,
            status: 'ACTIVE',
            nextPaymentDate: futureDate,
        };
    }

    async processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource) {
        // POST https://pws.azul.com.do/webservices/HotSite.asmx/Process
        return { id: 'azul_trx_1', amount, currency, status: 'SUCCESS' as const, gatewayReference: 'azul_ref_123' };
    }

    async cancelSubscription(externalId: string) { return true; }
    verifyWebhook(payload: any, signature: string) { return true; }
}

@Injectable()
export class DLocalGateway implements IPaymentGateway {
    private readonly logger = new Logger(DLocalGateway.name);
    initialize(config: any) { }
    async createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return { externalId: `dl_sub_1`, status: 'ACTIVE', nextPaymentDate: futureDate };
    }
    async processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource) {
        return { id: 'dl_trx_1', amount, currency, status: 'SUCCESS' as const, gatewayReference: 'dl_ref_1' };
    }
    async cancelSubscription(externalId: string) { return true; }
    verifyWebhook(payload: any, signature: string) { return true; }
}

@Injectable()
export class TPagoGateway implements IPaymentGateway {
    private readonly logger = new Logger(TPagoGateway.name);
    initialize(config: any) { }
    async createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource) {
        // T-Pago es exclusivamente para pagos únicos vía móvil
        // Para suscripciones, se debe procesar como pago manual recurrente cada mes
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return { externalId: `tpago_sub_id`, status: 'ACTIVE', nextPaymentDate: futureDate };
    }
    async processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource) {
        return { id: 'tpago_trx_1', amount, currency, status: 'SUCCESS' as const, gatewayReference: 'tpago_ref' };
    }
    async cancelSubscription(externalId: string) { return true; }
    verifyWebhook(payload: any, signature: string) { return true; }
}
