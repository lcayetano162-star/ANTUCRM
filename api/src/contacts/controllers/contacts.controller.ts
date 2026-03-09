import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactsService } from '../services/contacts.service';
import { ContactsAIService } from '../services/contacts-ai.service';
import { BulkImportService } from '../services/bulk-import.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '../../auth/types/auth.types';
import { ContactQueryDto } from '../dto/contact-query.dto';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { BulkActionDto } from '../dto/bulk-action.dto';
import {
  ContactsDashboard,
  ContactDetail,
  ContactCard,
  BulkActionResult,
  ContactAIInsight,
  ContactScoringResult,
  NextBestAction,
} from '../types/contacts.types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly aiService: ContactsAIService,
    private readonly bulkImport: BulkImportService,
  ) { }

  @Get()
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Obtener dashboard de contactos',
    description: 'Retorna el dashboard completo con KPIs, insights de IA, filtros y lista de contactos'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard de contactos obtenido exitosamente',
    type: Object
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async getDashboard(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() params: ContactQueryDto,
  ): Promise<ContactsDashboard> {
    return this.contactsService.getDashboard(tenantId, userId, userRole, params);
  }

  @Get('search')
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Buscar contactos',
    description: 'Búsqueda rápida de contactos por nombre, email o empresa'
  })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiQuery({ name: 'limit', description: 'Límite de resultados', required: false })
  async searchContacts(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<ContactCard[]> {
    return this.contactsService.searchContacts(
      tenantId,
      userId,
      userRole,
      query,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('bulk')
  @RequirePermissions('contacts:write')
  @ApiOperation({
    summary: 'Acciones masivas',
    description: 'Realizar acciones en múltiples contactos (asignar, cambiar estado, agregar tags, eliminar)'
  })
  async bulkActions(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() data: BulkActionDto,
  ): Promise<BulkActionResult> {
    return this.contactsService.bulkActions(tenantId, userId, userRole, data);
  }

  @Post('import')
  @RequirePermissions('contacts:write')
  @ApiOperation({
    summary: 'Importar contactos en masa',
    description: 'Importa un array JSON de contactos en lotes de 50, hasta 5000 registros. Crea empresas nuevas si no existen y omite emails duplicados.',
  })
  @ApiResponse({ status: 201, description: 'Resultado de la importacion con conteo de importados, omitidos y errores por fila' })
  importContacts(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('rows') rows: any[],
  ) {
    return this.bulkImport.importContacts(tenantId, userId, rows);
  }

  @Get(':id')
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Obtener detalle de contacto',
    description: 'Retorna información completa del contacto incluyendo actividades, oportunidades y notas'
  })
  async getContactById(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') contactId: string,
  ): Promise<ContactDetail> {
    return this.contactsService.getContactById(tenantId, contactId, userId, userRole);
  }

  @Post()
  @RequirePermissions('contacts:write')
  @ApiOperation({
    summary: 'Crear nuevo contacto',
    description: 'Crea un nuevo contacto con validación de email único'
  })
  async createContact(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() data: CreateContactDto,
  ): Promise<ContactCard> {
    return this.contactsService.createContact(tenantId, userId, data);
  }

  @Patch(':id')
  @RequirePermissions('contacts:write')
  @ApiOperation({
    summary: 'Actualizar contacto',
    description: 'Actualiza los datos de un contacto existente'
  })
  async updateContact(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') contactId: string,
    @Body() data: UpdateContactDto,
  ): Promise<ContactCard> {
    return this.contactsService.updateContact(tenantId, contactId, userId, data);
  }

  @Delete(':id')
  @RequirePermissions('contacts:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar contacto',
    description: 'Elimina lógicamente un contacto (soft delete)'
  })
  async deleteContact(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') contactId: string,
  ): Promise<void> {
    return this.contactsService.deleteContact(tenantId, contactId, userId, userRole);
  }

  // ==================== AI ENDPOINTS ====================

  @Get(':id/insights')
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Insights de IA del contacto',
    description: 'Obtiene insights generados por IA sobre el contacto'
  })
  async getContactInsights(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') contactId: string,
  ): Promise<ContactAIInsight[]> {
    return this.contactsService.getContactInsights(tenantId, contactId, userId, userRole);
  }

  @Post(':id/score')
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Score del contacto',
    description: 'Calcula el score de valor del contacto usando IA'
  })
  async scoreContact(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') contactId: string,
  ): Promise<ContactScoringResult> {
    return this.contactsService.scoreContact(tenantId, contactId, userId, userRole);
  }

  @Get(':id/next-action')
  @RequirePermissions('contacts:read')
  @ApiOperation({
    summary: 'Próxima mejor acción',
    description: 'Obtiene la recomendación de IA para la próxima acción a tomar con el contacto'
  })
  async getNextBestAction(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') contactId: string,
  ): Promise<NextBestAction> {
    return this.contactsService.getNextBestAction(tenantId, contactId, userId, userRole);
  }
}
