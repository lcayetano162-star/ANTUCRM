import { IPaymentGateway, PaymentSource } from './payment-gateway.interface';
export declare class StripeGateway implements IPaymentGateway {
    private readonly logger;
    private client;
    initialize(config: {
        apiKey: string;
    }): void;
    createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource): Promise<{
        externalId: string;
        status: string;
        nextPaymentDate: Date;
    }>;
    processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: "SUCCESS";
        gatewayReference: string;
    }>;
    cancelSubscription(externalId: string): Promise<boolean>;
    verifyWebhook(payload: any, signature: string): boolean;
}
