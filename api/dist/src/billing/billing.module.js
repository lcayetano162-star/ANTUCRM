"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const billing_service_1 = require("./billing.service");
const invoice_service_1 = require("./invoice.service");
const billing_controller_1 = require("./billing.controller");
const stripe_gateway_1 = require("./gateways/stripe.gateway");
const other_gateways_1 = require("./gateways/other-gateways");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => auth_module_1.AuthModule)],
        providers: [
            billing_service_1.BillingService,
            invoice_service_1.InvoiceService,
            stripe_gateway_1.StripeGateway,
            other_gateways_1.PayPalGateway,
            other_gateways_1.AzulGateway,
            other_gateways_1.DLocalGateway,
            other_gateways_1.TPagoGateway
        ],
        controllers: [billing_controller_1.BillingController],
        exports: [billing_service_1.BillingService, invoice_service_1.InvoiceService],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map