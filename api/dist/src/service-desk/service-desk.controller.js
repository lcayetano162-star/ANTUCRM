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
exports.ServiceDeskController = void 0;
const common_1 = require("@nestjs/common");
const service_desk_service_1 = require("./service-desk.service");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
let ServiceDeskController = class ServiceDeskController {
    constructor(service) {
        this.service = service;
    }
    getKpis(tenantId) {
        return this.service.getKpis(tenantId);
    }
    findTickets(tenantId, page, limit, status, priority) {
        return this.service.findTickets(tenantId, Number(page) || 1, Number(limit) || 20, status, priority);
    }
    findOneTicket(id, tenantId) {
        return this.service.findOneTicket(id, tenantId);
    }
    createTicket(tenantId, userId, dto) {
        return this.service.createTicket(tenantId, userId, dto);
    }
    updateTicket(id, tenantId, dto) {
        return this.service.updateTicket(id, tenantId, dto);
    }
    createWorkOrder(ticketId, tenantId, dto) {
        return this.service.createWorkOrder(ticketId, tenantId, dto);
    }
    updateWorkOrder(id, tenantId, dto) {
        return this.service.updateWorkOrder(id, tenantId, dto);
    }
    addPart(woId, tenantId, dto) {
        return this.service.addPart(woId, tenantId, dto);
    }
};
exports.ServiceDeskController = ServiceDeskController;
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "findTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "findOneTicket", null);
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "updateTicket", null);
__decorate([
    (0, common_1.Post)('tickets/:ticketId/work-orders'),
    __param(0, (0, common_1.Param)('ticketId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "createWorkOrder", null);
__decorate([
    (0, common_1.Patch)('work-orders/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "updateWorkOrder", null);
__decorate([
    (0, common_1.Post)('work-orders/:woId/parts'),
    __param(0, (0, common_1.Param)('woId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServiceDeskController.prototype, "addPart", null);
exports.ServiceDeskController = ServiceDeskController = __decorate([
    (0, common_1.Controller)('service-desk'),
    __metadata("design:paramtypes", [service_desk_service_1.ServiceDeskService])
], ServiceDeskController);
//# sourceMappingURL=service-desk.controller.js.map