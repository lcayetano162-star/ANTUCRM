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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
let BillingController = class BillingController {
    constructor(billing) {
        this.billing = billing;
    }
    async configureGateways(config) {
        return { success: true, message: 'Configuración actualizada' };
    }
    async getSubscription(req) {
        const { tenantId } = req.user;
        return this.billing.validatePlanLimits(tenantId, 'users', 0);
    }
    async checkout(req, data) {
        const { tenantId } = req.user;
        return this.billing.subscribe(tenantId, data.planCode, data.cycle, data.gateway, data.paymentSource);
    }
    async handleWebhook(gateway, payload, signatureStripe, signaturePaypal) {
        const signature = signatureStripe || signaturePaypal;
        return this.billing.handleGatewayWebhook(gateway.toUpperCase(), payload, signature);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('setup-config'),
    (0, require_permissions_decorator_1.RequirePermissions)('billing:write'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "configureGateways", null);
__decorate([
    (0, common_1.Get)('current-subscription'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('webhook/:gateway'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('gateway')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('stripe-signature')),
    __param(3, (0, common_1.Headers)('x-paypal-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "handleWebhook", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map