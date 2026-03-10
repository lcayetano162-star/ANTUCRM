"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = exports.PaymentStatus = exports.BillingCycle = exports.SubscriptionStatus = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["UNPAID"] = "UNPAID";
    SubscriptionStatus["GRACE_PERIOD"] = "GRACE_PERIOD";
    SubscriptionStatus["CANCELED"] = "CANCELED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["MONTHLY"] = "MONTHLY";
    BillingCycle["YEARLY"] = "YEARLY";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
const invoice_service_1 = require("./invoice.service");
const stripe_gateway_1 = require("./gateways/stripe.gateway");
const other_gateways_1 = require("./gateways/other-gateways");
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma, invoices, stripe, paypal, azul, dlocal, tpago) {
        this.prisma = prisma;
        this.invoices = invoices;
        this.stripe = stripe;
        this.paypal = paypal;
        this.azul = azul;
        this.dlocal = dlocal;
        this.tpago = tpago;
        this.logger = new common_1.Logger(BillingService_1.name);
        this.gateways = new Map();
        this.gateways.set('STRIPE', stripe);
        this.gateways.set('PAYPAL', paypal);
        this.gateways.set('AZUL', azul);
        this.gateways.set('DLOCAL', dlocal);
        this.gateways.set('TPAGO', tpago);
    }
    async subscribe(tenantId, planCode, cycle, gatewayType, paymentSource) {
        const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        const gateway = this.gateways.get(gatewayType);
        if (!gateway)
            throw new common_1.ConflictException('Pasarela no disponible');
        const amount = cycle === BillingCycle.MONTHLY ? plan.priceMonthly : plan.priceYearly;
        try {
            const externalSub = await gateway.createSubscription(tenantId, planCode, paymentSource);
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
            try {
                await this.invoices.generateInvoice(payment.id);
            }
            catch (e) {
                this.logger.error(`Error generando factura inicial: ${e.message}`);
            }
            return { success: true, subscription };
        }
        catch (error) {
            this.logger.error(`Error en suscripción para tenant ${tenantId}: ${error.message}`);
            throw new common_1.ConflictException('Error al procesar el pago con la pasarela seleccionada');
        }
    }
    async checkAllExpirations() {
        const now = new Date();
        const expired = await this.prisma.subscription.findMany({
            where: {
                nextPaymentDate: { lt: now },
                status: { notIn: [SubscriptionStatus.UNPAID, SubscriptionStatus.CANCELED] }
            }
        });
        for (const sub of expired) {
            const daysPast = Math.floor((now.getTime() - sub.nextPaymentDate.getTime()) / (1000 * 3600 * 24));
            if (daysPast > 7) {
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: SubscriptionStatus.UNPAID }
                });
                await this.prisma.tenant.update({
                    where: { id: sub.tenantId },
                    data: { isActive: false }
                });
                this.logger.warn(`Tenant ${sub.tenantId} bloqueado por falta de pago.`);
            }
            else {
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: SubscriptionStatus.GRACE_PERIOD }
                });
            }
        }
    }
    async validatePlanLimits(tenantId, resource, currentCount) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true }
        });
        if (!subscription || subscription.status === SubscriptionStatus.UNPAID) {
            return { allowed: false, reason: 'Suscripción inactiva o impagada' };
        }
        const { plan } = subscription;
        let allowed = true;
        if (resource === 'users' && currentCount >= plan.maxUsers)
            allowed = false;
        if (resource === 'admins' && currentCount >= plan.maxAdmins)
            allowed = false;
        return { allowed, limit: plan[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`] };
    }
    async handleGatewayWebhook(gatewayType, payload, signature) {
        const gateway = this.gateways.get(gatewayType);
        if (!gateway || !gateway.verifyWebhook(payload, signature)) {
            throw new common_1.ConflictException('Webhook inválido');
        }
        const externalId = payload.subscription_id || payload.id;
        if (payload.event === 'payment_success') {
            await this.updateSubscriptionAfterPayment(externalId);
        }
    }
    async updateSubscriptionAfterPayment(externalId) {
        const sub = await this.prisma.subscription.findFirst({ where: { externalId } });
        if (!sub)
            return;
        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.billingCycle === BillingCycle.MONTHLY)
            nextDate.setMonth(nextDate.getMonth() + 1);
        else
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        await this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                nextPaymentDate: nextDate,
                lastPaymentDate: new Date()
            }
        });
        await this.prisma.tenant.update({
            where: { id: sub.tenantId },
            data: { isActive: true }
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        invoice_service_1.InvoiceService,
        stripe_gateway_1.StripeGateway,
        other_gateways_1.PayPalGateway,
        other_gateways_1.AzulGateway,
        other_gateways_1.DLocalGateway,
        other_gateways_1.TPagoGateway])
], BillingService);
//# sourceMappingURL=billing.service.js.map