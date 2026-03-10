"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PayPalGateway_1, AzulGateway_1, DLocalGateway_1, TPagoGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TPagoGateway = exports.DLocalGateway = exports.AzulGateway = exports.PayPalGateway = void 0;
const common_1 = require("@nestjs/common");
let PayPalGateway = PayPalGateway_1 = class PayPalGateway {
    constructor() {
        this.logger = new common_1.Logger(PayPalGateway_1.name);
    }
    initialize(config) { }
    async createSubscription(tenantId, planCode, paymentSource) {
        this.logger.log(`PayPal: Creando acuerdo de facturación para ${tenantId}`);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return {
            externalId: `I-${Math.random().toString().substring(2, 10)}`,
            status: 'ACTIVE',
            nextPaymentDate: futureDate,
        };
    }
    async processOneTimePayment(amount, currency, paymentSource) {
        return { id: 'paypal_trx_1', amount, currency, status: 'SUCCESS', gatewayReference: 'pay_ref_paypal' };
    }
    async cancelSubscription(externalId) { return true; }
    verifyWebhook(payload, signature) { return true; }
};
exports.PayPalGateway = PayPalGateway;
exports.PayPalGateway = PayPalGateway = PayPalGateway_1 = __decorate([
    (0, common_1.Injectable)()
], PayPalGateway);
let AzulGateway = AzulGateway_1 = class AzulGateway {
    constructor() {
        this.logger = new common_1.Logger(AzulGateway_1.name);
    }
    initialize(config) { }
    async createSubscription(tenantId, planCode, paymentSource) {
        this.logger.log(`Azul: Tokenizando tarjeta y procesando primer cobro para ${tenantId}`);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return {
            externalId: `azul_token_${paymentSource.token || 'temp_token'}`,
            status: 'ACTIVE',
            nextPaymentDate: futureDate,
        };
    }
    async processOneTimePayment(amount, currency, paymentSource) {
        return { id: 'azul_trx_1', amount, currency, status: 'SUCCESS', gatewayReference: 'azul_ref_123' };
    }
    async cancelSubscription(externalId) { return true; }
    verifyWebhook(payload, signature) { return true; }
};
exports.AzulGateway = AzulGateway;
exports.AzulGateway = AzulGateway = AzulGateway_1 = __decorate([
    (0, common_1.Injectable)()
], AzulGateway);
let DLocalGateway = DLocalGateway_1 = class DLocalGateway {
    constructor() {
        this.logger = new common_1.Logger(DLocalGateway_1.name);
    }
    initialize(config) { }
    async createSubscription(tenantId, planCode, paymentSource) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return { externalId: `dl_sub_1`, status: 'ACTIVE', nextPaymentDate: futureDate };
    }
    async processOneTimePayment(amount, currency, paymentSource) {
        return { id: 'dl_trx_1', amount, currency, status: 'SUCCESS', gatewayReference: 'dl_ref_1' };
    }
    async cancelSubscription(externalId) { return true; }
    verifyWebhook(payload, signature) { return true; }
};
exports.DLocalGateway = DLocalGateway;
exports.DLocalGateway = DLocalGateway = DLocalGateway_1 = __decorate([
    (0, common_1.Injectable)()
], DLocalGateway);
let TPagoGateway = TPagoGateway_1 = class TPagoGateway {
    constructor() {
        this.logger = new common_1.Logger(TPagoGateway_1.name);
    }
    initialize(config) { }
    async createSubscription(tenantId, planCode, paymentSource) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        return { externalId: `tpago_sub_id`, status: 'ACTIVE', nextPaymentDate: futureDate };
    }
    async processOneTimePayment(amount, currency, paymentSource) {
        return { id: 'tpago_trx_1', amount, currency, status: 'SUCCESS', gatewayReference: 'tpago_ref' };
    }
    async cancelSubscription(externalId) { return true; }
    verifyWebhook(payload, signature) { return true; }
};
exports.TPagoGateway = TPagoGateway;
exports.TPagoGateway = TPagoGateway = TPagoGateway_1 = __decorate([
    (0, common_1.Injectable)()
], TPagoGateway);
//# sourceMappingURL=other-gateways.js.map