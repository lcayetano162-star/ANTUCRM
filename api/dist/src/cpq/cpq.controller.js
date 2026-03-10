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
exports.MpsController = exports.QuotesController = void 0;
const common_1 = require("@nestjs/common");
const cpq_service_1 = require("./cpq.service");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
let QuotesController = class QuotesController {
    constructor(service) {
        this.service = service;
    }
    findAll(tenantId, page, limit) {
        return this.service.findQuotes(tenantId, Number(page) || 1, Number(limit) || 20);
    }
    findOne(id, tenantId) {
        return this.service.findOneQuote(id, tenantId);
    }
    create(tenantId, userId, dto) {
        return this.service.createQuote(tenantId, userId, dto);
    }
    updateStatus(id, tenantId, status) {
        return this.service.updateQuoteStatus(id, tenantId, status);
    }
};
exports.QuotesController = QuotesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "updateStatus", null);
exports.QuotesController = QuotesController = __decorate([
    (0, common_1.Controller)('cpq/quotes'),
    __metadata("design:paramtypes", [cpq_service_1.CpqService])
], QuotesController);
let MpsController = class MpsController {
    constructor(service) {
        this.service = service;
    }
    findAll(tenantId, page, limit) {
        return this.service.findMpsQuotes(tenantId, Number(page) || 1, Number(limit) || 20);
    }
    create(tenantId, userId, dto) {
        return this.service.createMpsQuote(tenantId, userId, dto);
    }
    approve(id, tenantId, userId, approved, notes) {
        return this.service.approveMpsQuote(id, tenantId, userId, approved, notes);
    }
};
exports.MpsController = MpsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MpsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MpsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Body)('approved')),
    __param(4, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Boolean, String]),
    __metadata("design:returntype", void 0)
], MpsController.prototype, "approve", null);
exports.MpsController = MpsController = __decorate([
    (0, common_1.Controller)('cpq/mps'),
    __metadata("design:paramtypes", [cpq_service_1.CpqService])
], MpsController);
//# sourceMappingURL=cpq.controller.js.map