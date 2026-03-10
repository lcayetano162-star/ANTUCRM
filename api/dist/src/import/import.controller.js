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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bulk_import_service_1 = require("../contacts/services/bulk-import.service");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
let ImportController = class ImportController {
    constructor(bulkImport) {
        this.bulkImport = bulkImport;
    }
    importContacts(tenantId, userId, rows) {
        return this.bulkImport.importContacts(tenantId, userId, rows);
    }
    importOpportunities(tenantId, userId, rows) {
        return this.bulkImport.importOpportunities(tenantId, userId, rows);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)('contacts'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Importar contactos en masa',
        description: 'Acepta un array JSON de hasta 5000 contactos. Procesa en lotes de 50. ' +
            'Crea empresas nuevas automaticamente. Omite emails duplicados. ' +
            'Campos: firstName*, lastName*, email, phone, jobTitle, company, hasWhatsApp.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Resultado de importacion: { total, imported, skipped, errors: [{ row, reason }] }',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('rows')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "importContacts", null);
__decorate([
    (0, common_1.Post)('opportunities'),
    (0, require_permissions_decorator_1.RequirePermissions)('opportunities:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Importar oportunidades en masa',
        description: 'Acepta un array JSON de hasta 2000 oportunidades. Procesa en lotes de 50. ' +
            'Campos: name*, stage, value, probability, description, expectedCloseDate, contactEmail, contactId. ' +
            'Si no se proporciona contactEmail/contactId se usa el primer contacto del tenant como fallback.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Resultado de importacion: { total, imported, skipped, errors: [{ row, reason }] }',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('rows')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "importOpportunities", null);
exports.ImportController = ImportController = __decorate([
    (0, swagger_1.ApiTags)('Import'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('import'),
    __metadata("design:paramtypes", [bulk_import_service_1.BulkImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map