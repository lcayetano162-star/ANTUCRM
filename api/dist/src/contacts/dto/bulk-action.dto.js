"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkActionDto = exports.BulkActionSchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.BulkActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['ASSIGN', 'UPDATE_STATUS', 'ADD_TAGS', 'DELETE']),
    contactIds: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'Debe seleccionar al menos un contacto'),
    params: zod_1.z.object({
        assignedToId: zod_1.z.string().uuid().optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
        tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }).optional(),
});
class BulkActionDto extends (0, nestjs_zod_1.createZodDto)(exports.BulkActionSchema) {
}
exports.BulkActionDto = BulkActionDto;
//# sourceMappingURL=bulk-action.dto.js.map