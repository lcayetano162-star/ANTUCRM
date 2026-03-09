import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/types/auth.types';

@Injectable()
export class DashboardAIService {
  private readonly logger = new Logger(DashboardAIService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  async generateInsights(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<any[]> {
    try {
      if (!this.gemini.isAvailable()) {
        return this.getDefaultInsights();
      }

      const whereClause = this.getRoleBasedWhereClause(userId, userRole);

      // Obtener datos relevantes
      const [
        recentOpportunities,
        recentActivities,
        contactsWithoutActivity,
      ] = await Promise.all([
        this.prisma.opportunity.findMany({
          where: { tenantId, ...whereClause },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            contact: { select: { firstName: true, lastName: true } },
          },
        }),
        this.prisma.activity.findMany({
          where: { tenantId, ...whereClause },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.contact.findMany({
          where: {
            tenantId,
            ...whereClause,
            activities: { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          },
          take: 10,
        }),
      ]);

      const prompt = `Analiza estos datos de CRM y genera 3-5 insights accionables:

Oportunidades recientes: ${JSON.stringify(recentOpportunities)}
Actividades recientes: ${JSON.stringify(recentActivities)}
Contactos sin actividad (30 días): ${contactsWithoutActivity.length}

Genera insights en formato JSON con esta estructura:
[{
  "type": "CRITICAL_ALERT" | "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "title": "string",
  "description": "string",
  "action": { "label": "string", "route": "string" }
}]`;

      const insights = await this.gemini.generateStructured<any[]>(prompt, {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: 'string',
            priority: 'string',
            title: 'string',
            description: 'string',
            action: 'object',
          },
        },
      });

      return insights;
    } catch (error) {
      this.logger.error('Error generando insights', error);
      return this.getDefaultInsights();
    }
  }

  private getDefaultInsights(): any[] {
    return [
      {
        type: 'ENGAGEMENT',
        priority: 'MEDIUM',
        title: 'Bienvenido a ANTU CRM',
        description: 'Los insights de IA aparecerán aquí cuando haya más datos.',
        action: { label: 'Ver tutorial', route: '/help' },
      },
    ];
  }

  private getRoleBasedWhereClause(userId: string, userRole: UserRole): any {
    switch (userRole) {
      case UserRole.USER:
        return { assignedToId: userId };
      case UserRole.MANAGER:
        return {
          OR: [
            { assignedToId: userId },
            { assignedTo: { managerId: userId } },
          ],
        };
      case UserRole.ADMIN:
      default:
        return {};
    }
  }
}
