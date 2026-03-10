"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTaskDto = exports.CreateTaskDto = exports.ActivityQueryDto = exports.CreateActivityDto = exports.UpdateTaskSchema = exports.CreateTaskSchema = exports.ActivityQuerySchema = exports.CreateActivitySchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.CreateActivitySchema = zod_1.z.object({
    type: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP', 'SYSTEM']),
    description: zod_1.z.string().min(1),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    contactId: zod_1.z.string().uuid().optional(),
    opportunityId: zod_1.z.string().uuid().optional(),
});
exports.ActivityQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP', 'SYSTEM']).optional(),
    contactId: zod_1.z.string().uuid().optional(),
    opportunityId: zod_1.z.string().uuid().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
exports.CreateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: zod_1.z.string().datetime().optional(),
    contactId: zod_1.z.string().uuid().optional(),
    assignedToId: zod_1.z.string().uuid(),
});
exports.UpdateTaskSchema = exports.CreateTaskSchema.partial().extend({
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});
class CreateActivityDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateActivitySchema) {
}
exports.CreateActivityDto = CreateActivityDto;
class ActivityQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.ActivityQuerySchema) {
}
exports.ActivityQueryDto = ActivityQueryDto;
class CreateTaskDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateTaskSchema) {
}
exports.CreateTaskDto = CreateTaskDto;
class UpdateTaskDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateTaskSchema) {
}
exports.UpdateTaskDto = UpdateTaskDto;
//# sourceMappingURL=activity.dto.js.map