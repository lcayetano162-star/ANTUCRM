import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    UNPAID = 'UNPAID',
    GRACE_PERIOD = 'GRACE_PERIOD',
    CANCELED = 'CANCELED'
}
export enum BillingCycle {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY'
}
export enum PaymentStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}
import { IPaymentGateway, PaymentSource } from './gateways/payment-gateway.interface';
import { InvoiceService } from './invoice.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { PayPalGateway, AzulGateway, DLocalGateway, TPagoGateway } from './gateways/other-gateways';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);
    private gateways: Map<string, IPaymentGateway> = new Map();

    constructor(
        private readonly prisma: PrismaService,
        private readonly invoices: InvoiceService,
        private readonly stripe: StripeGateway,
        private readonly paypal: PayPalGateway,
        private readonly azul: AzulGateway,
        private readonly dlocal: DLocalGateway,
        private readonly tpago: TPagoGateway,
    ) {
        this.gateways.set('STRIPE', stripe);
        this.gateways.set('PAYPAL', paypal);
        this.gateways.set('AZUL', azul);
        this.gateways.set('DLOCAL', dlocal);
        this.gateways.set('TPAGO', tpago);
    }

    /**
     * Procesa la suscripción inicial o el cambio de plan
     */
    async subscribe(
        tenantId: string,
        planCode: string,
        cycle: BillingCycle,
        gatewayType: string,
        paymentSource: PaymentSource
    ) {
        const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
        if (!plan) throw new NotFoundException('Plan no encontrado');

        const gateway = this.gateways.get(gatewayType);
        if (!gateway) throw new ConflictException('Pasarela no disponible');

        const amount = cycle === BillingCycle.MONTHLY ? plan.priceMonthly : plan.priceYearly;

        try {
            // 1. Crear suscripción en la pasarela (Stripe/PayPal soporta recurrencia nativa)
            const externalSub = await gateway.createSubscription(tenantId, planCode, paymentSource);

            // 2. Persistir en base de datos
            const subscription = await this.prisma.subscription.upsert({
                where: { tenantId },
                update: {
                    planId: plan.id,
                    status: externalSub.status,
                    billingCycle: cycle,
                    nextPaymentDate: externalSub.nextPaymentDate,
                    externalId: externalSub.externalId,
                    paymentMethod: gatewayType,
                    lastPaymentDate: new Date(),
                },
                create: {
                    tenantId,
                    planId: plan.id,
                    status: externalSub.status,
                    billingCycle: cycle,
                    nextPaymentDate: externalSub.nextPaymentDate,
                    externalId: externalSub.externalId,
                    paymentMethod: gatewayType,
                    lastPaymentDate: new Date(),
                }
            });

            // 3. Registrar Log de Pago
            const payment = await this.prisma.paymentLog.create({
                data: {
                    subscriptionId: subscription.id,
                    tenantId,
                    amount: Number(amount),
                    currency: 'DOP',
                    status: PaymentStatus.SUCCESS,
                    gateway: gatewayType,
                    gatewayRef: externalSub.externalId,
                    paidAt: new Date(),
                    metadata: { planCode, cycle }
                }
            });

            // 4. Generar Factura
            try {
                await this.invoices.generateInvoice(payment.id);
            } catch (e) {
                this.logger.error(`Error generando factura inicial: ${e.message}`);
            }

            return { success: true, subscription };
        } catch (error) {
            this.logger.error(`Error en suscripción para tenant ${tenantId}: ${error.message}`);
            throw new ConflictException('Error al procesar el pago con la pasarela seleccionada');
        }
    }

    /**
     * Lógica de bloqueo autónomo: Verifica expiración
     * Ejecutado por cron job cada medianoche
     */
    async checkAllExpirations() {
        const now = new Date();

        // 1. Identificar suscripciones expiradas que aún no están bloqueadas
        const expired = await this.prisma.subscription.findMany({
            where: {
                nextPaymentDate: { lt: now },
                status: { notIn: [SubscriptionStatus.UNPAID, SubscriptionStatus.CANCELED] }
            }
        });

        for (const sub of expired) {
            const daysPast = Math.floor((now.getTime() - sub.nextPaymentDate.getTime()) / (1000 * 3600 * 24));

            if (daysPast > 7) { // Periodo de gracia de 7 días
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: SubscriptionStatus.UNPAID }
                });

                // Inactivar tenant
                await this.prisma.tenant.update({
                    where: { id: sub.tenantId },
                    data: { isActive: false }
                });

                this.logger.warn(`Tenant ${sub.tenantId} bloqueado por falta de pago.`);
            } else {
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: SubscriptionStatus.GRACE_PERIOD }
                });
            }
        }
    }

    /**
     * Validación de límites del plan (ABAC / Enforcement)
     */
    async validatePlanLimits(tenantId: string, resource: 'users' | 'admins' | 'storage', currentCount: number) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true }
        });

        if (!subscription || subscription.status === SubscriptionStatus.UNPAID) {
            return { allowed: false, reason: 'Suscripción inactiva o impagada' };
        }

        const { plan } = subscription;
        let allowed = true;

        if (resource === 'users' && currentCount >= plan.maxUsers) allowed = false;
        if (resource === 'admins' && currentCount >= plan.maxAdmins) allowed = false;

        return { allowed, limit: plan[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`] };
    }

    /**
     * Webhook Handler Central
     */
    async handleGatewayWebhook(gatewayType: string, payload: any, signature: string) {
        const gateway = this.gateways.get(gatewayType);
        if (!gateway || !gateway.verifyWebhook(payload, signature)) {
            throw new ConflictException('Webhook inválido');
        }

        // Lógica específica por tipo de evento (Simplificada)
        // En producción usaríamos un switch por platform (stripe.invoice.paid vs paypal.payment.completed)
        const externalId = payload.subscription_id || payload.id;

        if (payload.event === 'payment_success') {
            await this.updateSubscriptionAfterPayment(externalId);
        }
    }

    private async updateSubscriptionAfterPayment(externalId: string) {
        const sub = await this.prisma.subscription.findFirst({ where: { externalId } });
        if (!sub) return;

        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.billingCycle === BillingCycle.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        else nextDate.setFullYear(nextDate.getFullYear() + 1);

        await this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                nextPaymentDate: nextDate,
                lastPaymentDate: new Date()
            }
        });

        // Rehabilitar tenant si estaba bloqueado
        await this.prisma.tenant.update({
            where: { id: sub.tenantId },
            data: { isActive: true }
        });
    }
}
