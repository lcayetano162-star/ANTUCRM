"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityQueryDto = exports.UpdateOpportunityDto = exports.CreateOpportunityDto = exports.OpportunityQuerySchema = exports.UpdateOpportunitySchema = exports.CreateOpportunitySchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.CreateOpportunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    stage: zod_1.z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED']).default('LEAD'),
    value: zod_1.z.number().positive().optional(),
    probability: zod_1.z.number().min(0).max(100).optional(),
    expectedCloseDate: zod_1.z.string().datetime().optional(),
    contactId: zod_1.z.string().uuid(),
    assignedToId: zod_1.z.string().uuid().optional(),
});
exports.UpdateOpportunitySchema = exports.CreateOpportunitySchema.partial().extend({
    status: zod_1.z.enum(['OPEN', 'WON', 'LOST', 'CLOSED']).optional(),
    actualCloseDate: zod_1.z.string().datetime().optional(),
});
exports.OpportunityQuerySchema = zod_1.z.object({
    stage: zod_1.z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED']).optional(),
    status: zod_1.z.enum(['OPEN', 'WON', 'LOST', 'CLOSED']).optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    contactId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
class CreateOpportunityDto extends (0, nestjs_zod_1.createZodDto)(exports.CreateOpportunitySchema) {
}
exports.CreateOpportunityDto = CreateOpportunityDto;
class UpdateOpportunityDto extends (0, nestjs_zod_1.createZodDto)(exports.UpdateOpportunitySchema) {
}
exports.UpdateOpportunityDto = UpdateOpportunityDto;
class OpportunityQueryDto extends (0, nestjs_zod_1.createZodDto)(exports.OpportunityQuerySchema) {
}
exports.OpportunityQueryDto = OpportunityQueryDto;
//# sourceMappingURL=opportunity.dto.js.map