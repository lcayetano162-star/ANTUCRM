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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SubscriptionGuard = class SubscriptionGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }
        if (!user?.tenantId) {
            return true;
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            include: {
                subscription: true
            }
        });
        if (!tenant) {
            throw new common_1.ForbiddenException('Tenant no encontrado');
        }
        if (!tenant.isActive) {
            throw new common_1.ForbiddenException({
                message: 'Tu suscripción ha expirado o el pago ha fallado.',
                code: 'SUBSCRIPTION_REQUIRED',
                status: tenant.subscription?.status || 'INACTIVE'
            });
        }
        if (tenant.subscription && ['UNPAID', 'CANCELED'].includes(tenant.subscription.status)) {
            throw new common_1.ForbiddenException({
                message: 'Tu cuenta requiere una suscripción activa.',
                code: 'SUBSCRIPTION_EXPIRED'
            });
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map