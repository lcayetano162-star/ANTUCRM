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
exports.ContactsController = void 0;
const common_1 = require("@nestjs/common");
const contacts_service_1 = require("../services/contacts.service");
const contacts_ai_service_1 = require("../services/contacts-ai.service");
const bulk_import_service_1 = require("../services/bulk-import.service");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const require_permissions_decorator_1 = require("../../auth/decorators/require-permissions.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const common_2 = require("@nestjs/common");
const auth_types_1 = require("../../auth/types/auth.types");
const contact_query_dto_1 = require("../dto/contact-query.dto");
const create_contact_dto_1 = require("../dto/create-contact.dto");
const update_contact_dto_1 = require("../dto/update-contact.dto");
const bulk_action_dto_1 = require("../dto/bulk-action.dto");
const swagger_1 = require("@nestjs/swagger");
let ContactsController = class ContactsController {
    constructor(contactsService, aiService, bulkImport) {
        this.contactsService = contactsService;
        this.aiService = aiService;
        this.bulkImport = bulkImport;
    }
    async getDashboard(tenantId, userId, userRole, params) {
        return this.contactsService.getDashboard(tenantId, userId, userRole, params);
    }
    async searchContacts(tenantId, userId, userRole, query, limit) {
        return this.contactsService.searchContacts(tenantId, userId, userRole, query, limit ? parseInt(limit, 10) : 10);
    }
    async bulkActions(tenantId, userId, userRole, data) {
        return this.contactsService.bulkActions(tenantId, userId, userRole, data);
    }
    importContacts(tenantId, userId, rows) {
        return this.bulkImport.importContacts(tenantId, userId, rows);
    }
    async getContactById(tenantId, userId, userRole, contactId) {
        return this.contactsService.getContactById(tenantId, contactId, userId, userRole);
    }
    async createContact(tenantId, userId, data) {
        return this.contactsService.createContact(tenantId, userId, data);
    }
    async updateContact(tenantId, userId, contactId, data) {
        return this.contactsService.updateContact(tenantId, contactId, userId, data);
    }
    async deleteContact(tenantId, userId, userRole, contactId) {
        return this.contactsService.deleteContact(tenantId, contactId, userId, userRole);
    }
    async getContactInsights(tenantId, userId, userRole, contactId) {
        return this.contactsService.getContactInsights(tenantId, contactId, userId, userRole);
    }
    async scoreContact(tenantId, userId, userRole, contactId) {
        return this.contactsService.scoreContact(tenantId, contactId, userId, userRole);
    }
    async getNextBestAction(tenantId, userId, userRole, contactId) {
        return this.contactsService.getNextBestAction(tenantId, contactId, userId, userRole);
    }
};
exports.ContactsController = ContactsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener dashboard de contactos',
        description: 'Retorna el dashboard completo con KPIs, insights de IA, filtros y lista de contactos'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard de contactos obtenido exitosamente',
        type: Object
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Permisos insuficientes' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, contact_query_dto_1.ContactQueryDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar contactos',
        description: 'Búsqueda rápida de contactos por nombre, email o empresa'
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Término de búsqueda', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: 'Límite de resultados', required: false }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)('q')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "searchContacts", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Acciones masivas',
        description: 'Realizar acciones en múltiples contactos (asignar, cambiar estado, agregar tags, eliminar)'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, bulk_action_dto_1.BulkActionDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "bulkActions", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Importar contactos en masa',
        description: 'Importa un array JSON de contactos en lotes de 50, hasta 5000 registros. Crea empresas nuevas si no existen y omite emails duplicados.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Resultado de la importacion con conteo de importados, omitidos y errores por fila' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('rows')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "importContacts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener detalle de contacto',
        description: 'Retorna información completa del contacto incluyendo actividades, oportunidades y notas'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "getContactById", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear nuevo contacto',
        description: 'Crea un nuevo contacto con validación de email único'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_contact_dto_1.CreateContactDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "createContact", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:write'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar contacto',
        description: 'Actualiza los datos de un contacto existente'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_contact_dto_1.UpdateContactDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "updateContact", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Eliminar contacto',
        description: 'Elimina lógicamente un contacto (soft delete)'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "deleteContact", null);
__decorate([
    (0, common_1.Get)(':id/insights'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Insights de IA del contacto',
        description: 'Obtiene insights generados por IA sobre el contacto'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "getContactInsights", null);
__decorate([
    (0, common_1.Post)(':id/score'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Score del contacto',
        description: 'Calcula el score de valor del contacto usando IA'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "scoreContact", null);
__decorate([
    (0, common_1.Get)(':id/next-action'),
    (0, require_permissions_decorator_1.RequirePermissions)('contacts:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Próxima mejor acción',
        description: 'Obtiene la recomendación de IA para la próxima acción a tomar con el contacto'
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "getNextBestAction", null);
exports.ContactsController = ContactsController = __decorate([
    (0, swagger_1.ApiTags)('Contacts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('contacts'),
    __metadata("design:paramtypes", [contacts_service_1.ContactsService,
        contacts_ai_service_1.ContactsAIService,
        bulk_import_service_1.BulkImportService])
], ContactsController);
//# sourceMappingURL=contacts.controller.js.map