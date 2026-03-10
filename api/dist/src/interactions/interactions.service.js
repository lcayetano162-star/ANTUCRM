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
var InteractionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InteractionsService = InteractionsService_1 = class InteractionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InteractionsService_1.name);
    }
    async create(data, tenantId, userId) {
        let threadDepth = 0;
        if (data.parentId) {
            const parent = await this.prisma.interaction.findUnique({
                where: { id: data.parentId },
                select: { threadDepth: true }
            });
            if (parent) {
                threadDepth = (parent.threadDepth || 0) + 1;
            }
        }
        const interaction = await this.prisma.interaction.create({
            data: {
                tenantId,
                userId,
                clientId: data.clientId,
                contactId: data.contactId,
                opportunityId: data.opportunityId,
                type: data.channel,
                direction: data.direction,
                subject: data.subject,
                body: data.content,
                fromAddress: data.fromAddress,
                toAddress: data.toAddress,
                ccAddresses: data.ccAddresses,
                bccAddresses: data.bccAddresses,
                provider: data.provider || 'system',
                externalId: data.externalId,
                threadId: data.threadId,
                metadata: data.metadata || {},
                parentId: data.parentId,
                threadDepth,
                isPrivate: data.isPrivate || false,
                status: 'pending',
                aiStatus: 'pending',
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                contact: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        this.processAI(interaction).catch(err => this.logger.error('Error processing AI:', err));
        this.logger.log(`[Timeline] ${data.channel} ${data.direction}: ${interaction.id}`);
        return interaction;
    }
    async findByClient(tenantId, clientId, options = {}) {
        const { channels, limit = 50, offset = 0, includePrivate = false } = options;
        const where = {
            tenantId,
            clientId,
        };
        if (!includePrivate) {
            where.isPrivate = false;
        }
        if (channels?.length) {
            where.type = { in: channels };
        }
        const interactions = await this.prisma.interaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                contact: { select: { id: true, firstName: true, lastName: true, email: true } },
                opportunity: { select: { id: true, name: true } },
            },
        });
        return interactions;
    }
    async getThread(tenantId, threadId) {
        return this.prisma.interaction.findMany({
            where: { tenantId, threadId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async search(tenantId, searchTerm, clientId) {
        const where = {
            tenantId,
            body: { contains: searchTerm, mode: 'insensitive' },
        };
        if (clientId) {
            where.clientId = clientId;
        }
        return this.prisma.interaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async getSummary(tenantId, clientId) {
        const interactions = await this.prisma.interaction.findMany({
            where: {
                tenantId,
                clientId,
                isPrivate: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { aiInsight: true, createdAt: true },
        });
        const total = await this.prisma.interaction.count({
            where: {
                tenantId,
                clientId,
                isPrivate: false,
            },
        });
        const lastInteraction = interactions[0];
        const aiInsight = lastInteraction?.aiInsight;
        return {
            total,
            lastInteraction: lastInteraction?.createdAt || null,
            sentiment: aiInsight?.sentiment || null,
            aiSummary: aiInsight?.summary || null,
        };
    }
    async updateStatus(externalId, status, eventData) {
        const timestampField = this.getTimestampField(status);
        const updateData = { status };
        if (timestampField) {
            updateData[timestampField] = new Date();
        }
        await this.prisma.interaction.updateMany({
            where: { externalId },
            data: updateData,
        });
        const interaction = await this.prisma.interaction.findFirst({
            where: { externalId },
            select: { id: true, tenantId: true },
        });
        if (interaction) {
            await this.prisma.interactionEvent.create({
                data: {
                    interactionId: interaction.id,
                    tenantId: interaction.tenantId,
                    eventType: status,
                    eventData: eventData || {},
                    provider: eventData?.provider || 'unknown',
                },
            });
        }
    }
    async updateAIInsight(interactionId, insight) {
        return this.prisma.interaction.update({
            where: { id: interactionId },
            data: {
                aiInsight: insight,
                aiStatus: 'completed',
                aiProcessedAt: new Date(),
            },
        });
    }
    getTimestampField(status) {
        const map = {
            'sent': 'sentAt',
            'delivered': 'deliveredAt',
            'read': 'readAt',
            'replied': 'repliedAt',
        };
        return map[status] || null;
    }
    async processAI(interaction) {
    }
};
exports.InteractionsService = InteractionsService;
exports.InteractionsService = InteractionsService = InteractionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InteractionsService);
//# sourceMappingURL=interactions.service.js.map