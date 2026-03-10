import { PrismaService } from '../prisma/prisma.service';
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    UNPAID = "UNPAID",
    GRACE_PERIOD = "GRACE_PERIOD",
    CANCELED = "CANCELED"
}
export declare enum BillingCycle {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export declare enum PaymentStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}
import { PaymentSource } from './gateways/payment-gateway.interface';
import { InvoiceService } from './invoice.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { PayPalGateway, AzulGateway, DLocalGateway, TPagoGateway } from './gateways/other-gateways';
export declare class BillingService {
    private readonly prisma;
    private readonly invoices;
    private readonly stripe;
    private readonly paypal;
    private readonly azul;
    private readonly dlocal;
    private readonly tpago;
    private readonly logger;
    private gateways;
    constructor(prisma: PrismaService, invoices: InvoiceService, stripe: StripeGateway, paypal: PayPalGateway, azul: AzulGateway, dlocal: DLocalGateway, tpago: TPagoGateway);
    subscribe(tenantId: string, planCode: string, cycle: BillingCycle, gatewayType: string, paymentSource: PaymentSource): Promise<{
        success: boolean;
        subscription: {
            id: string;
            tenantId: string;
            status: string;
            externalId: string | null;
            planId: string;
            billingCycle: string;
            paymentMethod: string | null;
            nextPaymentDate: Date;
            lastPaymentDate: Date;
        };
    }>;
    checkAllExpirations(): Promise<void>;
    validatePlanLimits(tenantId: string, resource: 'users' | 'admins' | 'storage', currentCount: number): Promise<{
        allowed: boolean;
        reason: string;
        limit?: undefined;
    } | {
        allowed: boolean;
        limit: any;
        reason?: undefined;
    }>;
    handleGatewayWebhook(gatewayType: string, payload: any, signature: string): Promise<void>;
    private updateSubscriptionAfterPayment;
}
