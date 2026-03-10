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
exports.SuperAdminAIController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/services/encryption.service");
const antu_ai_core_service_1 = require("./antu-ai-core.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
function assertAdmin(user) {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
        throw new common_1.ForbiddenException('Solo administradores pueden acceder a configuración de IA');
    }
}
let SuperAdminAIController = class SuperAdminAIController {
    constructor(prisma, aiCore) {
        this.prisma = prisma;
        this.aiCore = aiCore;
    }
    async getProviders(user) {
        assertAdmin(user);
        const configs = await this.prisma.aIProviderConfig.findMany();
        return configs.map((c) => ({ ...c, apiKey: c.apiKey ? '***' : null }));
    }
    async updateProvider(user, id, body) {
        assertAdmin(user);
        if (body.apiKey) {
            body.apiKey = encryption_service_1.EncryptionService.encrypt(body.apiKey);
        }
        if (body.isActive) {
            await this.prisma.aIProviderConfig.updateMany({
                where: { NOT: { id } },
                data: { isActive: false }
            });
        }
        const updated = await this.prisma.aIProviderConfig.update({
            where: { id },
            data: body
        });
        await this.aiCore.refreshProviders();
        return { ...updated, apiKey: '***' };
    }
    async getPrompts(user) {
        assertAdmin(user);
        return this.prisma.promptTemplate.findMany();
    }
    async updatePrompt(user, id, body) {
        assertAdmin(user);
        return this.prisma.promptTemplate.upsert({
            where: { id },
            update: body,
            create: { id, ...body }
        });
    }
    async getUsage(user, tenantId) {
        assertAdmin(user);
        return this.prisma.aIUsageLog.findMany({
            where: tenantId ? { tenantId } : {},
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
    async executiveAnalysis(user) {
        assertAdmin(user);
        return {
            analysis: await this.aiCore.detectGlobalAnomalies()
        };
    }
};
exports.SuperAdminAIController = SuperAdminAIController;
__decorate([
    (0, common_1.Get)('providers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Put)('providers/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "updateProvider", null);
__decorate([
    (0, common_1.Get)('prompts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "getPrompts", null);
__decorate([
    (0, common_1.Put)('prompts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "updatePrompt", null);
__decorate([
    (0, common_1.Get)('usage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Post)('executive-analysis'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAIController.prototype, "executiveAnalysis", null);
exports.SuperAdminAIController = SuperAdminAIController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('super-admin/ai'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        antu_ai_core_service_1.AntuAICore])
], SuperAdminAIController);
//# sourceMappingURL=super-admin-ai.controller.js.map