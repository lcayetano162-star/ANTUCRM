import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billing;
    constructor(billing: BillingService);
    configureGateways(config: {
        activeGateways: string[];
        settings: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getSubscription(req: any): Promise<{
        allowed: boolean;
        reason: string;
        limit?: undefined;
    } | {
        allowed: boolean;
        limit: any;
        reason?: undefined;
    }>;
    checkout(req: any, data: {
        planCode: string;
        cycle: 'MONTHLY' | 'YEARLY';
        gateway: string;
        paymentSource: any;
    }): Promise<{
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
    handleWebhook(gateway: string, payload: any, signatureStripe: string, signaturePaypal: string): Promise<void>;
}
