"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsModule = void 0;
const common_1 = require("@nestjs/common");
const contacts_controller_1 = require("./controllers/contacts.controller");
const contacts_service_1 = require("./services/contacts.service");
const contacts_ai_service_1 = require("./services/contacts-ai.service");
const bulk_import_service_1 = require("./services/bulk-import.service");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const config_1 = require("@nestjs/config");
let ContactsModule = class ContactsModule {
};
exports.ContactsModule = ContactsModule;
exports.ContactsModule = ContactsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule, config_1.ConfigModule],
        controllers: [contacts_controller_1.ContactsController],
        providers: [contacts_service_1.ContactsService, contacts_ai_service_1.ContactsAIService, bulk_import_service_1.BulkImportService],
        exports: [contacts_service_1.ContactsService, contacts_ai_service_1.ContactsAIService, bulk_import_service_1.BulkImportService],
    })
], ContactsModule);
//# sourceMappingURL=contacts.module.js.map