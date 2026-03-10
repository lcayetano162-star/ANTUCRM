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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const super_admin_service_1 = require("./super-admin.service");
const auth_service_1 = require("../auth/auth.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
function assertAdmin(user) {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
        throw new common_1.ForbiddenException('Solo administradores pueden acceder a esta sección');
    }
}
let SuperAdminController = class SuperAdminController {
    constructor(service, authService) {
        this.service = service;
        this.authService = authService;
    }
    getStats(user) {
        assertAdmin(user);
        return this.service.getPlatformStats();
    }
    findTenants(user, search) {
        assertAdmin(user);
        return this.service.findAllTenants(search);
    }
    findTenant(user, id) {
        assertAdmin(user);
        return this.service.findOneTenant(id);
    }
    createTenant(user, dto) {
        assertAdmin(user);
        return this.service.createTenant(dto);
    }
    updateTenant(user, id, dto) {
        assertAdmin(user);
        return this.service.updateTenant(id, dto);
    }
    updateSettings(user, id, dto) {
        assertAdmin(user);
        return this.service.updateTenantSettings(id, dto);
    }
    suspendTenant(user, id) {
        assertAdmin(user);
        return this.service.suspendTenant(id);
    }
    activateTenant(user, id) {
        assertAdmin(user);
        return this.service.activateTenant(id);
    }
    findPlans(user) {
        assertAdmin(user);
        return this.service.findAllPlans();
    }
    createPlan(user, dto) {
        assertAdmin(user);
        return this.service.createPlan(dto);
    }
    updatePlan(user, id, dto) {
        assertAdmin(user);
        return this.service.updatePlan(id, dto);
    }
    getTenantUsers(user, id) {
        assertAdmin(user);
        return this.service.getTenantUsers(id);
    }
    createTenantUser(user, id, dto) {
        assertAdmin(user);
        return this.service.createTenantUser(id, dto);
    }
    deactivateUser(user, tenantId, userId) {
        assertAdmin(user);
        return this.service.deactivateTenantUser(userId, tenantId);
    }
    resetTenantUserPassword(user, tenantId, userId, newPassword) {
        assertAdmin(user);
        return this.authService.adminResetPassword(userId, tenantId, newPassword);
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "findTenants", null);
__decorate([
    (0, common_1.Get)('tenants/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "findTenant", null);
__decorate([
    (0, common_1.Post)('tenants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Put)('tenants/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updateTenant", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/settings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/suspend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "suspendTenant", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/activate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "activateTenant", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "findPlans", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Get)('tenants/:id/users'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getTenantUsers", null);
__decorate([
    (0, common_1.Post)('tenants/:id/users'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "createTenantUser", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/users/:userId/deactivate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/users/:userId/reset-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "resetTenantUserPassword", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('super-admin'),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService,
        auth_service_1.AuthService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map