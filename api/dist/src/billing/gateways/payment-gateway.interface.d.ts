export interface PaymentSource {
    type: 'card' | 'paypal' | 'bank_transfer' | 'tpago';
    token?: string;
    lastFour?: string;
}
export interface PaymentTransaction {
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    gatewayReference: string;
    metadata?: any;
}
export interface IPaymentGateway {
    initialize(config: any): void;
    createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource): Promise<{
        externalId: string;
        status: string;
        nextPaymentDate: Date;
    }>;
    processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource): Promise<PaymentTransaction>;
    cancelSubscription(externalId: string): Promise<boolean>;
    verifyWebhook(payload: any, signature: string): boolean;
}
