"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StripeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeGateway = void 0;
const common_1 = require("@nestjs/common");
let StripeGateway = StripeGateway_1 = class StripeGateway {
    constructor() {
        this.logger = new common_1.Logger(StripeGateway_1.name);
    }
    initialize(config) {
        this.logger.log('Stripe inicializado.');
    }
    async createSubscription(tenantId, planCode, paymentSource) {
        this.logger.log(`Creando suscripción Stripe para ${tenantId} con plan ${planCode}`);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return {
            externalId: `sub_stripe_${Math.random().toString(36).substring(7)}`,
            status: 'ACTIVE',
            nextPaymentDate: nextMonth,
        };
    }
    async processOneTimePayment(amount, currency, paymentSource) {
        return {
            id: `trx_stripe_${Date.now()}`,
            amount,
            currency,
            status: 'SUCCESS',
            gatewayReference: 'ch_fake_ref_12345',
        };
    }
    async cancelSubscription(externalId) {
        return true;
    }
    verifyWebhook(payload, signature) {
        return true;
    }
};
exports.StripeGateway = StripeGateway;
exports.StripeGateway = StripeGateway = StripeGateway_1 = __decorate([
    (0, common_1.Injectable)()
], StripeGateway);
//# sourceMappingURL=stripe.gateway.js.map