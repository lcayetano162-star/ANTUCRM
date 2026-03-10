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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_ai_service_1 = require("./dashboard-ai.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const auth_types_1 = require("../auth/types/auth.types");
let DashboardController = class DashboardController {
    constructor(dashboardService, aiService) {
        this.dashboardService = dashboardService;
        this.aiService = aiService;
    }
    async getSalesDashboard(tenantId, userId, userRole, period = 'month', queryUserId) {
        const targetUserId = queryUserId || userId;
        return this.dashboardService.getSalesDashboard(tenantId, targetUserId, userRole, period);
    }
    async getAIInsights(tenantId, userId, userRole) {
        return this.aiService.generateInsights(tenantId, userId, userRole);
    }
    async getKPIs(tenantId, userId, userRole, period = 'month') {
        return this.dashboardService.getKPIs(tenantId, userId, userRole, period);
    }
    async getTeam(tenantId) {
        return this.dashboardService.getTeamMembers(tenantId);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener dashboard de ventas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard obtenido exitosamente' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)('period')),
    __param(4, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSalesDashboard", null);
__decorate([
    (0, common_1.Get)('insights'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener insights de IA para el dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insights obtenidos exitosamente' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAIInsights", null);
__decorate([
    (0, common_1.Get)('kpis'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener KPIs del dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'KPIs obtenidos exitosamente' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener miembros del equipo (vendedores)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipo obtenido exitosamente' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTeam", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        dashboard_ai_service_1.DashboardAIService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map