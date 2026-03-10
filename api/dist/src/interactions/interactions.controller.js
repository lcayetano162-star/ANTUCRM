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
exports.InteractionsController = void 0;
const common_1 = require("@nestjs/common");
const interactions_service_1 = require("./interactions.service");
const create_interaction_dto_1 = require("./dto/create-interaction.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
let InteractionsController = class InteractionsController {
    constructor(interactionsService) {
        this.interactionsService = interactionsService;
    }
    async create(dto, tenantId, user) {
        const interaction = await this.interactionsService.create(dto, tenantId, user.userId);
        return {
            success: true,
            data: interaction,
        };
    }
    async getTimeline(clientId, query, tenantId) {
        const channels = query.channels
            ? query.channels.split(',').map(c => c.trim().toUpperCase())
            : undefined;
        const timeline = await this.interactionsService.findByClient(tenantId, clientId, {
            channels,
            limit: parseInt(query.limit || '50'),
            offset: parseInt(query.offset || '0'),
            includePrivate: query.includePrivate === 'true',
        });
        return {
            success: true,
            data: timeline,
            pagination: {
                limit: parseInt(query.limit || '50'),
                offset: parseInt(query.offset || '0'),
                hasMore: timeline.length === parseInt(query.limit || '50'),
            },
        };
    }
    async getThread(threadId, tenantId) {
        const thread = await this.interactionsService.getThread(tenantId, threadId);
        return {
            success: true,
            data: thread,
        };
    }
    async search(dto, tenantId) {
        if (!dto.q || dto.q.length < 3) {
            return {
                success: false,
                error: 'Search term must be at least 3 characters',
            };
        }
        const results = await this.interactionsService.search(tenantId, dto.q, dto.clientId);
        return {
            success: true,
            data: results,
            count: results.length,
        };
    }
    async getSummary(clientId, tenantId) {
        const summary = await this.interactionsService.getSummary(tenantId, clientId);
        return {
            success: true,
            data: summary,
        };
    }
    async createNote(dto, tenantId, user) {
        if (!dto.clientId || !dto.content) {
            return {
                success: false,
                error: 'clientId and content are required',
            };
        }
        const note = await this.interactionsService.create({
            clientId: dto.clientId,
            channel: 'NOTE',
            direction: 'INTERNAL',
            content: dto.content,
            fromAddress: user.email,
            toAddress: 'internal',
            isPrivate: true,
        }, tenantId, user.userId);
        return {
            success: true,
            data: note,
        };
    }
};
exports.InteractionsController = InteractionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_interaction_dto_1.CreateInteractionDto, String, Object]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('timeline/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_interaction_dto_1.TimelineQueryDto, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)('thread/:threadId'),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "getThread", null);
__decorate([
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_interaction_dto_1.SearchInteractionDto, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('summary/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('note'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InteractionsController.prototype, "createNote", null);
exports.InteractionsController = InteractionsController = __decorate([
    (0, common_1.Controller)('api/v1/interactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [interactions_service_1.InteractionsService])
], InteractionsController);
//# sourceMappingURL=interactions.controller.js.map