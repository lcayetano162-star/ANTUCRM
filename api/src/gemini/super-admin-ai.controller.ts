import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { AntuAICore } from './antu-ai-core.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

function assertAdmin(user: any) {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
        throw new ForbiddenException('Solo administradores pueden acceder a configuración de IA');
    }
}

@UseGuards(JwtAuthGuard)
@Controller('super-admin/ai')
export class SuperAdminAIController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiCore: AntuAICore
    ) { }

    @Get('providers')
    async getProviders(@CurrentUser() user: any) {
        assertAdmin(user);
        const configs = await this.prisma.aIProviderConfig.findMany();
        // Mask API keys before returning
        return configs.map((c: any) => ({ ...c, apiKey: c.apiKey ? '***' : null }));
    }

    @Put('providers/:id')
    async updateProvider(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
        assertAdmin(user);
        if (body.apiKey) {
            body.apiKey = EncryptionService.encrypt(body.apiKey);
        }

        if (body.isActive) {
            await this.prisma.aIProviderConfig.updateMany({
                where: { NOT: { id } },
                data: { isActive: false }
            });
        }

        const updated = await this.prisma.aIProviderConfig.update({
            where: { id },
            data: body
        });

        await this.aiCore.refreshProviders();
        return { ...updated, apiKey: '***' };
    }

    @Get('prompts')
    async getPrompts(@CurrentUser() user: any) {
        assertAdmin(user);
        return this.prisma.promptTemplate.findMany();
    }

    @Put('prompts/:id')
    async updatePrompt(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
        assertAdmin(user);
        return this.prisma.promptTemplate.upsert({
            where: { id },
            update: body,
            create: { id, ...body }
        });
    }

    @Get('usage')
    async getUsage(@CurrentUser() user: any, @Query('tenantId') tenantId?: string) {
        assertAdmin(user);
        return this.prisma.aIUsageLog.findMany({
            where: tenantId ? { tenantId } : {},
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    @Post('executive-analysis')
    async executiveAnalysis(@CurrentUser() user: any) {
        assertAdmin(user);
        return {
            analysis: await this.aiCore.detectGlobalAnomalies()
        };
    }
}
