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
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
const send_email_dto_1 = require("./dto/send-email.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let EmailController = class EmailController {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async getConfig(tenantId) {
        const config = await this.emailService.getConfig(tenantId);
        if (!config) {
            return { configured: false };
        }
        return {
            configured: true,
            config: {
                id: config.id,
                smtpHost: config.smtpHost,
                smtpPort: config.smtpPort,
                smtpSecure: config.smtpSecure,
                smtpUser: config.smtpUser,
                fromEmail: config.fromEmail,
                fromName: config.fromName,
                isActive: config.isActive,
                createdAt: config.createdAt,
            },
        };
    }
    async configure(dto, tenantId) {
        const config = await this.emailService.configure(tenantId, dto);
        return { success: true, config };
    }
    async sendEmail(dto, tenantId, user) {
        return this.emailService.sendEmail(tenantId, user.userId, dto);
    }
    async getMessages(contactId, page = '1', limit = '50', tenantId) {
        return this.emailService.getEmails(tenantId, {
            contactId,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    async getStats(tenantId) {
        return this.emailService.getStats(tenantId);
    }
    async trackOpen(trackingId, res) {
        const pixel = await this.emailService.trackOpen(trackingId);
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(pixel);
    }
    async receiveInbound(payload, signature) {
        await this.emailService.processInboundWebhook(payload, signature);
        return { received: true };
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_email_dto_1.ConfigureEmailDto, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "configure", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_email_dto_1.SendEmailDto, String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, common_1.Query)('contactId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('track/:trackingId'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('trackingId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "trackOpen", null);
__decorate([
    (0, common_1.Post)('inbound'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_email_dto_1.EmailWebhookDto, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "receiveInbound", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('api/v1/email'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map