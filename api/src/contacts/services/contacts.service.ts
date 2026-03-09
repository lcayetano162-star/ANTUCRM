import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactsAIService } from './contacts-ai.service';
import { AuditService } from '../../audit/audit.service';
import {
  ContactsDashboard,
  ContactCard,
  ContactDetail,
  ContactKPIs,
  ContactFilter,
  ContactAIInsight,
  ContactActivity,
  ContactOpportunity,
  ContactNote,
  BulkActionResult,
  ContactScoringResult,
  NextBestAction,
  ContactHealthScore,
} from '../types/contacts.types';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactQueryDto } from '../dto/contact-query.dto';
import { BulkActionDto } from '../dto/bulk-action.dto';
import { UserRole } from '../../auth/types/auth.types';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: ContactsAIService,
    private readonly auditService: AuditService,
  ) { }

  async getDashboard(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    params: ContactQueryDto,
  ): Promise<ContactsDashboard> {
    const [aiInsights, kpis, filters, contacts, totalCount] = await Promise.all([
      this.aiService.generateDashboardInsights(tenantId, userId, userRole, params.focus),
      this.getKPIs(tenantId, userId, userRole),
      this.getAvailableFilters(tenantId, userId, userRole),
      this.getContactsList(tenantId, userId, userRole, params),
      this.getContactsCount(tenantId, userId, userRole, params),
    ]);

    return {
      aiInsights,
      kpis,
      filters,
      contacts,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: totalCount,
        totalPages: Math.ceil(totalCount / (params.limit || 20)),
      },
    };
  }

  async getContactById(
    tenantId: string,
    contactId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ContactDetail> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        ...this.getRoleBasedWhereClause(userId, userRole),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            address: true,
            city: true,
            country: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        opportunities: {
          where: { status: { not: 'LOST' } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            stage: true,
            value: true,
            probability: true,
            expectedCloseDate: true,
            status: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        tags: true,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    // Verificar acceso para vendedores
    if (userRole === UserRole.USER && contact.assignedToId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este contacto');
    }

    // Obtener insights de IA
    const [aiInsights, healthScore] = await Promise.all([
      this.aiService.generateContactInsights(tenantId, contactId),
      this.aiService.getContactHealthScore(tenantId, contactId),
    ]);

    return {
      ...this.mapToContactCard(contact),
      company: contact.company,
      assignedTo: contact.assignedTo,
      activities: contact.activities.map(this.mapToContactActivity),
      opportunities: contact.opportunities.map(this.mapToContactOpportunity),
      notes: contact.notes.map(this.mapToContactNote),
      aiInsights,
      healthScore,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  async createContact(
    tenantId: string,
    userId: string,
    data: CreateContactDto,
  ): Promise<ContactCard> {
    // Verificar unicidad de email
    if (data.email) {
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          tenantId,
          email: data.email,
          deletedAt: null,
        },
      });

      if (existingContact) {
        throw new ConflictException(`Ya existe un contacto con el email ${data.email}`);
      }
    }

    // Verificar que la empresa existe
    if (data.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: data.companyId, tenantId },
      });

      if (!company) {
        throw new NotFoundException(`Empresa con ID ${data.companyId} no encontrada`);
      }
    }

    const { tagIds, ...contactData } = data;
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        ...contactData,
        assignedToId: contactData.assignedToId || userId,
        tags: tagIds ? { connect: tagIds.map(id => ({ id })) } : undefined,
      } as any,
      include: {
        company: {
          select: { id: true, name: true, industry: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: true,
        _count: {
          select: {
            activities: true,
            opportunities: true,
            tasks: { where: { status: { not: 'COMPLETED' } } },
          },
        },
      },
    });

    // Registrar auditoría
    await this.auditService.log({
      tenantId,
      userId,
      action: 'CONTACT_CREATED',
      entityType: 'Contact',
      entityId: contact.id,
      metadata: { contactName: `${contact.firstName} ${contact.lastName}` },
    });

    return this.mapToContactCard(contact);
  }

  async updateContact(
    tenantId: string,
    contactId: string,
    userId: string,
    data: UpdateContactDto,
  ): Promise<ContactCard> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        deletedAt: null,
      },
      include: {
        company: { select: { id: true, name: true, industry: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: {
          select: {
            activities: true,
            opportunities: true,
            tasks: { where: { status: { not: 'COMPLETED' } } },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    // Verificar unicidad de email si se está actualizando
    if (data.email && data.email !== contact.email) {
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          tenantId,
          email: data.email,
          deletedAt: null,
          id: { not: contactId },
        },
      });

      if (existingContact) {
        throw new ConflictException(`Ya existe otro contacto con el email ${data.email}`);
      }
    }

    const { tagIds, ...contactData } = data;
    const updatedContact = await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        ...contactData,
        tags: tagIds ? { set: tagIds.map(id => ({ id })) } : undefined,
      },
      include: {
        company: { select: { id: true, name: true, industry: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: {
          select: {
            activities: true,
            opportunities: true,
            tasks: { where: { status: { not: 'COMPLETED' } } },
          },
        },
      },
    });

    // Registrar auditoría
    await this.auditService.log({
      tenantId,
      userId,
      action: 'CONTACT_UPDATED',
      entityType: 'Contact',
      entityId: contactId,
      metadata: { changes: Object.keys(data) },
    });

    return this.mapToContactCard(updatedContact);
  }

  async deleteContact(
    tenantId: string,
    contactId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    // Solo admin puede eliminar contactos asignados a otros
    if (userRole !== UserRole.ADMIN && contact.assignedToId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este contacto');
    }

    // Soft delete
    await this.prisma.contact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    });

    // Registrar auditoría
    await this.auditService.log({
      tenantId,
      userId,
      action: 'CONTACT_DELETED',
      entityType: 'Contact',
      entityId: contactId,
      metadata: { contactName: `${contact.firstName} ${contact.lastName}` },
    });
  }

  async bulkActions(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    data: BulkActionDto,
  ): Promise<BulkActionResult> {
    const { action, contactIds, params } = data;

    // Verificar que los contactos existen y el usuario tiene permiso
    const contacts = await this.prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        tenantId,
        deletedAt: null,
        ...this.getRoleBasedWhereClause(userId, userRole),
      },
      select: { id: true },
    });

    const validContactIds = contacts.map(c => c.id);
    const invalidIds = contactIds.filter(id => !validContactIds.includes(id));

    let processedCount = 0;

    switch (action) {
      case 'ASSIGN':
        if (!params?.assignedToId) {
          throw new ConflictException('Se requiere assignedToId para asignar contactos');
        }
        await this.prisma.contact.updateMany({
          where: { id: { in: validContactIds } },
          data: { assignedToId: params.assignedToId },
        });
        processedCount = validContactIds.length;
        break;

      case 'UPDATE_STATUS':
        if (!params?.status) {
          throw new ConflictException('Se requiere status para actualizar estado');
        }
        await this.prisma.contact.updateMany({
          where: { id: { in: validContactIds } },
          data: { status: params.status },
        });
        processedCount = validContactIds.length;
        break;

      case 'ADD_TAGS':
        if (!params?.tagIds?.length) {
          throw new ConflictException('Se requieren tagIds para agregar etiquetas');
        }
        // Actualizar relación many-to-many
        await Promise.all(
          validContactIds.map(contactId =>
            this.prisma.contact.update({
              where: { id: contactId },
              data: { tags: { connect: params.tagIds.map(id => ({ id })) } },
            }),
          ),
        );
        processedCount = validContactIds.length;
        break;

      case 'DELETE':
        await this.prisma.contact.updateMany({
          where: { id: { in: validContactIds } },
          data: { deletedAt: new Date() },
        });
        processedCount = validContactIds.length;
        break;

      default:
        throw new ConflictException(`Acción bulk no soportada: ${action}`);
    }

    // Registrar auditoría
    await this.auditService.log({
      tenantId,
      userId,
      action: `CONTACT_BULK_${action}`,
      entityType: 'Contact',
      metadata: { contactCount: processedCount, action },
    });

    return {
      success: true,
      processedCount,
      failedCount: invalidIds.length,
      failedIds: invalidIds.length > 0 ? invalidIds : undefined,
    };
  }

  async getContactInsights(
    tenantId: string,
    contactId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ContactAIInsight[]> {
    // Verificar acceso
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        ...this.getRoleBasedWhereClause(userId, userRole),
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    return this.aiService.generateContactInsights(tenantId, contactId);
  }

  async scoreContact(
    tenantId: string,
    contactId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ContactScoringResult> {
    // Verificar acceso
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        ...this.getRoleBasedWhereClause(userId, userRole),
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    return this.aiService.scoreContact(tenantId, contactId);
  }

  async getNextBestAction(
    tenantId: string,
    contactId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<NextBestAction> {
    // Verificar acceso
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
        ...this.getRoleBasedWhereClause(userId, userRole),
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contacto con ID ${contactId} no encontrado`);
    }

    return this.aiService.getNextBestAction(tenantId, contactId);
  }

  async searchContacts(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    query: string,
    limit: number = 10,
  ): Promise<ContactCard[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...this.getRoleBasedWhereClause(userId, userRole),
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      include: {
        company: { select: { id: true, name: true, industry: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: {
          select: {
            activities: true,
            opportunities: true,
            tasks: { where: { status: { not: 'COMPLETED' } } },
          },
        },
      },
    });

    return contacts.map(this.mapToContactCard);
  }

  // ==================== PRIVATE METHODS ====================

  private async getKPIs(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ContactKPIs> {
    const whereClause = {
      tenantId,
      deletedAt: null,
      ...this.getRoleBasedWhereClause(userId, userRole),
    };

    const [
      totalContacts,
      mainContacts,
      activeContacts,
      newContactsThisMonth,
      contactsWithOpportunities,
    ] = await Promise.all([
      this.prisma.contact.count({ where: whereClause }),
      this.prisma.contact.count({ where: { ...whereClause, isMainContact: true } }),
      this.prisma.contact.count({ where: { ...whereClause, status: 'ACTIVE' } }),
      this.prisma.contact.count({
        where: {
          ...whereClause,
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      this.prisma.contact.count({
        where: {
          ...whereClause,
          opportunities: { some: { status: { not: 'LOST' } } },
        },
      }),
    ]);

    // Calcular tendencia (comparación con mes anterior)
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0);

    const newContactsLastMonth = await this.prisma.contact.count({
      where: {
        ...whereClause,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    const trend = newContactsLastMonth > 0
      ? ((newContactsThisMonth - newContactsLastMonth) / newContactsLastMonth) * 100
      : 0;

    return {
      totalContacts: { value: totalContacts, trend },
      mainContacts: { value: mainContacts },
      activeContacts: { value: activeContacts },
      newContactsThisMonth: { value: newContactsThisMonth },
      contactsWithOpportunities: { value: contactsWithOpportunities },
    };
  }

  private async getAvailableFilters(
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ContactFilter[]> {
    const whereClause = { tenantId, deletedAt: null };

    const [
      statuses,
      industries,
      tags,
      assignees,
    ] = await Promise.all([
      this.prisma.contact.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      this.prisma.company.groupBy({
        by: ['industry'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.contactTag.findMany({
        where: whereClause,
        select: { id: true, name: true, color: true },
      }),
      userRole === UserRole.ADMIN
        ? this.prisma.user.findMany({
          where: { tenantId, isActive: true },
          select: { id: true, firstName: true, lastName: true },
        })
        : Promise.resolve([]),
    ]);

    const filters: ContactFilter[] = [
      {
        id: 'status',
        label: 'Estado',
        type: 'select',
        options: statuses.map(s => ({
          value: s.status,
          label: this.formatStatusLabel(s.status),
          count: s._count,
        })),
      },
      {
        id: 'industry',
        label: 'Industria',
        type: 'select',
        options: industries
          .filter(i => i.industry)
          .map(i => ({
            value: i.industry!,
            label: i.industry!,
          })),
      },
      {
        id: 'tags',
        label: 'Etiquetas',
        type: 'multiSelect',
        options: tags.map(t => ({
          value: t.id,
          label: t.name,
          color: t.color,
        })),
      },
    ];

    if (userRole === UserRole.ADMIN) {
      filters.push({
        id: 'assignedTo',
        label: 'Asignado a',
        type: 'select',
        options: assignees.map(u => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })),
      });
    }

    return filters;
  }

  private async getContactsList(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    params: ContactQueryDto,
  ): Promise<ContactCard[]> {
    const whereClause: any = {
      tenantId,
      deletedAt: null,
      ...this.getRoleBasedWhereClause(userId, userRole),
    };

    // Aplicar filtros
    if (params.status) whereClause.status = params.status;
    if (params.industry) whereClause.company = { industry: params.industry };
    if (params.tagIds?.length) whereClause.tags = { some: { id: { in: params.tagIds } } };
    if (params.assignedToId) whereClause.assignedToId = params.assignedToId;
    if (params.isMainContact !== undefined) whereClause.isMainContact = params.isMainContact;
    if (params.search) {
      whereClause.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { company: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const contacts = await this.prisma.contact.findMany({
      where: whereClause,
      skip: ((params.page || 1) - 1) * (params.limit || 20),
      take: params.limit || 20,
      orderBy,
      include: {
        company: { select: { id: true, name: true, industry: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        _count: {
          select: {
            activities: true,
            opportunities: true,
            tasks: { where: { status: { not: 'COMPLETED' } } },
          },
        },
      },
    });

    return contacts.map(this.mapToContactCard);
  }

  private async getContactsCount(
    tenantId: string,
    userId: string,
    userRole: UserRole,
    params: ContactQueryDto,
  ): Promise<number> {
    const whereClause: any = {
      tenantId,
      deletedAt: null,
      ...this.getRoleBasedWhereClause(userId, userRole),
    };

    if (params.status) whereClause.status = params.status;
    if (params.industry) whereClause.company = { industry: params.industry };
    if (params.tagIds?.length) whereClause.tags = { some: { id: { in: params.tagIds } } };
    if (params.assignedToId) whereClause.assignedToId = params.assignedToId;
    if (params.isMainContact !== undefined) whereClause.isMainContact = params.isMainContact;
    if (params.search) {
      whereClause.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { company: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.contact.count({ where: whereClause });
  }

  private getRoleBasedWhereClause(userId: string, userRole: UserRole): any {
    switch (userRole) {
      case UserRole.USER:
        return { assignedToId: userId };
      case UserRole.MANAGER:
        // Manager ve sus contactos y los de su equipo
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

  private mapToContactCard(contact: any): ContactCard {
    const fullName = `${contact.firstName} ${contact.lastName}`;
    const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

    // Calcular última actividad
    const lastActivity = contact.activities?.[0] || contact._count?.activities > 0
      ? { date: new Date(), type: 'NOTE', description: 'Actividad reciente', daysAgo: 0 }
      : null;

    return {
      id: contact.id,
      avatar: {
        initials,
        color: this.getAvatarColor(contact.id),
        imageUrl: contact.avatar,
      },
      fullName,
      jobTitle: contact.jobTitle,
      isMainContact: contact.isMainContact,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      hasWhatsApp: contact.hasWhatsApp,
      status: contact.status,
      score: contact.score || 0,
      lastActivity: lastActivity ? {
        date: lastActivity.date,
        type: lastActivity.type,
        description: lastActivity.description,
        daysAgo: lastActivity.daysAgo,
      } : undefined,
      pendingTasks: contact._count?.tasks || 0,
      opportunities: {
        count: contact._count?.opportunities || 0,
        totalValue: contact.opportunities?.reduce((sum: number, opp: any) => sum + (opp.value || 0), 0) || 0,
      },
      tags: contact.tags || [],
    };
  }

  private mapToContactActivity(activity: any): ContactActivity {
    return {
      id: activity.id,
      type: activity.type,
      description: activity.description,
      date: activity.createdAt,
      createdBy: activity.createdBy,
    };
  }

  private mapToContactOpportunity(opp: any): ContactOpportunity {
    return {
      id: opp.id,
      name: opp.name,
      stage: opp.stage,
      value: opp.value,
      probability: opp.probability,
      expectedCloseDate: opp.expectedCloseDate,
      status: opp.status,
    };
  }

  private mapToContactNote(note: any): ContactNote {
    return {
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      createdBy: note.createdBy,
    };
  }

  private formatStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'PROSPECT': 'Prospecto',
      'CUSTOMER': 'Cliente',
      'CHURNED': 'Perdido',
    };
    return labels[status] || status;
  }

  private getAvatarColor(id: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
