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
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
let WhatsAppController = class WhatsAppController {
    constructor(whatsAppService) {
        this.whatsAppService = whatsAppService;
    }
    async getConfig(tenantId) {
        const config = await this.whatsAppService.getConfig(tenantId);
        if (!config) {
            return { configured: false };
        }
        return {
            configured: true,
            config: {
                id: config.id,
                phoneNumberId: config.phoneNumberId,
                businessAccountId: config.businessAccountId,
                isActive: config.isActive,
                isVerified: config.isVerified,
                connectedAt: config.connectedAt,
                messagesSentToday: config.messagesSentToday,
                messagesSentDate: config.messagesSentDate,
                createdAt: config.createdAt,
            },
        };
    }
    async configure(dto, tenantId) {
        const config = await this.whatsAppService.configure(tenantId, dto);
        return { success: true, config };
    }
    async disconnect(tenantId) {
        await this.whatsAppService.disconnect(tenantId);
        return { success: true, message: 'WhatsApp disconnected' };
    }
    async sendMessage(dto, tenantId, user) {
        const result = await this.whatsAppService.sendMessage(tenantId, user.userId, dto);
        return { success: true, data: result };
    }
    async getMessages(contactId, page = '1', limit = '50', tenantId) {
        return this.whatsAppService.getMessages(tenantId, {
            contactId,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    async getConversations(tenantId) {
        return this.whatsAppService.getConversations(tenantId);
    }
    async verifyWebhook(mode, token, challenge) {
        const result = await this.whatsAppService.verifyWebhook(token, challenge, mode);
        if (result === null) {
            return { statusCode: 403 };
        }
        return result;
    }
    async receiveWebhook(payload, signature) {
        this.whatsAppService.processWebhook(payload, signature)
            .catch(error => {
            console.error('[WhatsApp] Webhook processing error:', error);
        });
        return { received: true };
    }
    async getTemplates(tenantId) {
        const templates = await this.prisma.whatsappTemplate.findMany({
            where: { tenantId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return { data: templates };
    }
    get prisma() {
        return this.whatsAppService.prisma;
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.ConfigureWhatsAppDto, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "configure", null);
__decorate([
    (0, common_1.Delete)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.SendMessageDto, String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "sendMessage", null);
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
], WhatsAppController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.WebhookPayloadDto, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "receiveWebhook", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getTemplates", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, common_1.Controller)('api/v1/whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map