

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
    /**
     * Inicializa la pasarela con las credenciales correspondientes
     */
    initialize(config: any): void;

    /**
     * Crea una suscripción recurrente
     */
    createSubscription(tenantId: string, planCode: string, paymentSource: PaymentSource): Promise<{
        externalId: string;
        status: string;
        nextPaymentDate: Date;
    }>;

    /**
     * Procesa un pago único (para renovación manual)
     */
    processOneTimePayment(amount: number, currency: string, paymentSource: PaymentSource): Promise<PaymentTransaction>;

    /**
     * Cancela una suscripción
     */
    cancelSubscription(externalId: string): Promise<boolean>;

    /**
     * Verifica la autenticidad de un webhook
     */
    verifyWebhook(payload: any, signature: string): boolean;
}
