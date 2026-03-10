import { IPaymentGateway, PaymentSource } from './payment-gateway.interface';
export declare class PayPalGateway implements IPaymentGateway {
    private readonly logger;
    initialize(config: any): void;
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
export declare class AzulGateway implements IPaymentGateway {
    private readonly logger;
    initialize(config: any): void;
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
export declare class DLocalGateway implements IPaymentGateway {
    private readonly logger;
    initialize(config: any): void;
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
export declare class TPagoGateway implements IPaymentGateway {
    private readonly logger;
    initialize(config: any): void;
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
