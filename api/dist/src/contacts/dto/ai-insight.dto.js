"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextBestActionDto = exports.NextBestActionSchema = exports.ContactScoringDto = exports.ContactScoringSchema = exports.AIInsightDto = exports.AIInsightSchema = exports.AIInsightActionSchema = void 0;
const zod_1 = require("zod");
const nestjs_zod_1 = require("nestjs-zod");
exports.AIInsightActionSchema = zod_1.z.object({
    label: zod_1.z.string(),
    route: zod_1.z.string().optional(),
    params: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.AIInsightSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['CRITICAL_ALERT', 'FOLLOW_UP', 'OPPORTUNITY', 'ENGAGEMENT', 'RISK']),
    priority: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    action: exports.AIInsightActionSchema,
});
class AIInsightDto extends (0, nestjs_zod_1.createZodDto)(exports.AIInsightSchema) {
}
exports.AIInsightDto = AIInsightDto;
exports.ContactScoringSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    factors: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        weight: zod_1.z.number(),
        contribution: zod_1.z.number(),
    })),
    explanation: zod_1.z.string(),
});
class ContactScoringDto extends (0, nestjs_zod_1.createZodDto)(exports.ContactScoringSchema) {
}
exports.ContactScoringDto = ContactScoringDto;
exports.NextBestActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'WAIT']),
    priority: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    reason: zod_1.z.string(),
    suggestedTime: zod_1.z.string().optional(),
    suggestedMessage: zod_1.z.string().optional(),
});
class NextBestActionDto extends (0, nestjs_zod_1.createZodDto)(exports.NextBestActionSchema) {
}
exports.NextBestActionDto = NextBestActionDto;
//# sourceMappingURL=ai-insight.dto.js.map