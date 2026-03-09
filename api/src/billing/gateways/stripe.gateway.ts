import { IPaymentGateway, PaymentSource } from './payment-gateway.interface';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeGateway implements IPaymentGateway {
    private readonly logger = new Logger(StripeGateway.name);
    private client: any; // Instancia de Stripe

    initialize(config: { apiKey: string }) {
        // this.client = new Stripe(config.apiKey, { apiVersion: '2023-10-16' });
        this.logger.log('Stripe inicializado.');
    }

    async createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource) {
        this.logger.log(`Creando suscripción Stripe para ${tenantId} con plan ${planCode}`);

        // 1. Crear o recuperar el Customer ID de Stripe
        // const customer = await this.client.customers.create({ email: ... });

        // 2. Adjuntar Payment Method (Token de Stripe.js desde el frontend)
        // await this.client.paymentMethods.attach(paymentSource.token, { customer: customer.id });

        // 3. Crear Suscripción Recurrente
        // const sub = await this.client.subscriptions.create({
        //   customer: customer.id,
        //   items: [{ price: planCode }],
        //   expand: ['latest_invoice.payment_intent'],
        // });

        // 4. MOCK: Retornar datos exitosos simulados
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        return {
            externalId: `sub_stripe_${Math.random().toString(36).substring(7)}`,
            status: 'ACTIVE',
            nextPaymentDate: nextMonth,
        };
    }

    async processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource) {
        // const paymentIntent = await this.client.paymentIntents.create({ ... });

        return {
            id: `trx_stripe_${Date.now()}`,
            amount,
            currency,
            status: 'SUCCESS' as const,
            gatewayReference: 'ch_fake_ref_12345',
        };
    }

    async cancelSubscription(externalId: string) {
        // await this.client.subscriptions.del(externalId);
        return true;
    }

    verifyWebhook(payload: any, signature: string) {
        // try {
        //   this.client.webhooks.constructEvent(payload, signature, webhookSecret);
        //   return true;
        // } catch (err) { return false; }
        return true; // Mock exitoso
    }
}
