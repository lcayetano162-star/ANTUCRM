"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactQueryDto = exports.ContactQuerySchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.ContactQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'CHURNED']).optional(),
    industry: zod_1.z.string().optional(),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    isMainContact: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt', 'score']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    focus: zod_1.z.enum(['CRITICAL', 'FOLLOW_UP', 'OPPORTUNITY', 'ENGAGEMENT', 'RISK']).optional(),
});
class ContactQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.ContactQuerySchema) {
}
exports.ContactQueryDto = ContactQueryDto;
//# sourceMappingURL=contact-query.dto.js.map