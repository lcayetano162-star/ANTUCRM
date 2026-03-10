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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("./audit.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(auditService) {
        this.auditService = auditService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const path = request.route?.path || request.url;
        const auditActions = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!auditActions.includes(method) || !user) {
            return next.handle();
        }
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            const duration = Date.now() - startTime;
            const action = this.determineAction(method, path);
            if (action) {
                await this.auditService.log({
                    tenantId: user.tenantId,
                    userId: user.id,
                    action,
                    entityType: this.extractEntityType(path),
                    entityId: request.params?.id,
                    metadata: {
                        method,
                        path: request.url,
                        duration,
                        body: this.sanitizeBody(request.body),
                        response: this.sanitizeResponse(response),
                    },
                    ipAddress: request.ip,
                    userAgent: request.headers['user-agent'],
                });
            }
        }));
    }
    determineAction(method, path) {
        const entity = this.extractEntityType(path);
        switch (method) {
            case 'POST':
                return `${entity.toUpperCase()}_CREATED`;
            case 'PUT':
            case 'PATCH':
                return `${entity.toUpperCase()}_UPDATED`;
            case 'DELETE':
                return `${entity.toUpperCase()}_DELETED`;
            default:
                return null;
        }
    }
    extractEntityType(path) {
        const parts = path.split('/');
        const entityPart = parts.find((p) => ['contacts', 'companies', 'opportunities', 'tasks', 'inventory'].includes(p));
        return entityPart ? entityPart.slice(0, -1).toUpperCase() : 'UNKNOWN';
    }
    sanitizeBody(body) {
        if (!body)
            return null;
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.passwordHash;
        delete sanitized.token;
        return sanitized;
    }
    sanitizeResponse(response) {
        if (!response)
            return null;
        if (typeof response !== 'object')
            return response;
        const sanitized = { ...response };
        delete sanitized.password;
        delete sanitized.passwordHash;
        delete sanitized.token;
        delete sanitized.accessToken;
        delete sanitized.refreshToken;
        return sanitized;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map