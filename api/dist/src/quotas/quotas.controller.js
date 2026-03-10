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
exports.QuotasController = void 0;
const common_1 = require("@nestjs/common");
const quotas_service_1 = require("./quotas.service");
const quota_dto_1 = require("./dto/quota.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let QuotasController = class QuotasController {
    constructor(quotasService) {
        this.quotasService = quotasService;
    }
    getQuotas(req, yearStr) {
        const role = req.user.role?.name || req.user.role;
        const allowedRoles = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'];
        if (!allowedRoles.includes(role)) {
            throw new common_1.ForbiddenException('No tienes permisos para ver cuotas.');
        }
        const tenantId = req.user.tenantId;
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getQuotas(tenantId, year);
    }
    saveQuotas(req, dto) {
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new common_1.ForbiddenException('No tienes permisos para guardar cuotas.');
        }
        const tenantId = req.user.tenantId;
        return this.quotasService.saveQuotas(tenantId, dto);
    }
    async getPerformance(req, yearStr, period, queryUserId) {
        const tenantId = req.user.tenantId;
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role?.name || req.user.role || 'USER';
        const isManager = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'].includes(requestingUserRole);
        let targetUserId = requestingUserId;
        let targetRole = requestingUserRole;
        if (queryUserId && isManager) {
            targetUserId = queryUserId;
            if (targetUserId !== requestingUserId) {
                targetRole = 'SALES_REP';
            }
        }
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getPerformance(tenantId, targetUserId, targetRole, year, period);
    }
    getSalesOpsConfig(req, yearStr) {
        const tenantId = req.user.tenantId;
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new common_1.ForbiddenException('No tienes permisos.');
        }
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return this.quotasService.getSalesOpsConfig(tenantId, year);
    }
    saveSalesOpsConfig(req, payload) {
        const tenantId = req.user.tenantId;
        const role = req.user.role?.name || req.user.role;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new common_1.ForbiddenException('No tienes permisos para guardar configuración de Sales Ops.');
        }
        return this.quotasService.saveSalesOpsConfig(tenantId, payload);
    }
};
exports.QuotasController = QuotasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuotasController.prototype, "getQuotas", null);
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, quota_dto_1.BulkUpdateQuotaDto]),
    __metadata("design:returntype", void 0)
], QuotasController.prototype, "saveQuotas", null);
__decorate([
    (0, common_1.Get)('performance'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('period')),
    __param(3, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], QuotasController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Get)('sales-ops'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuotasController.prototype, "getSalesOpsConfig", null);
__decorate([
    (0, common_1.Post)('sales-ops'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuotasController.prototype, "saveSalesOpsConfig", null);
exports.QuotasController = QuotasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('quotas'),
    __metadata("design:paramtypes", [quotas_service_1.QuotasService])
], QuotasController);
//# sourceMappingURL=quotas.controller.js.map