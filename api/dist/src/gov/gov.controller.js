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
exports.GovController = void 0;
const common_1 = require("@nestjs/common");
const gov_service_1 = require("./gov.service");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
let GovController = class GovController {
    constructor(service) {
        this.service = service;
    }
    getStats(tenantId) {
        return this.service.getStats(tenantId);
    }
    findAll(tenantId) {
        return this.service.findAll(tenantId);
    }
    findOne(id, tenantId) {
        return this.service.findOne(id, tenantId);
    }
    create(tenantId, dto) {
        return this.service.create(tenantId, dto);
    }
    updateChecklistItem(govId, itemId, tenantId, dto) {
        return this.service.updateChecklistItem(govId, itemId, tenantId, dto);
    }
};
exports.GovController = GovController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GovController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GovController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GovController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GovController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':govId/checklist/:itemId'),
    __param(0, (0, common_1.Param)('govId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], GovController.prototype, "updateChecklistItem", null);
exports.GovController = GovController = __decorate([
    (0, common_1.Controller)('gov'),
    __metadata("design:paramtypes", [gov_service_1.GovService])
], GovController);
//# sourceMappingURL=gov.controller.js.map