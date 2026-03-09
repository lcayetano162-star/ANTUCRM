import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BulkImportService } from '../contacts/services/bulk-import.service';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Import')
@ApiBearerAuth()
@Controller('import')
export class ImportController {
  constructor(private readonly bulkImport: BulkImportService) {}

  @Post('contacts')
  @RequirePermissions('contacts:write')
  @ApiOperation({
    summary: 'Importar contactos en masa',
    description:
      'Acepta un array JSON de hasta 5000 contactos. Procesa en lotes de 50. ' +
      'Crea empresas nuevas automaticamente. Omite emails duplicados. ' +
      'Campos: firstName*, lastName*, email, phone, jobTitle, company, hasWhatsApp.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Resultado de importacion: { total, imported, skipped, errors: [{ row, reason }] }',
  })
  importContacts(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('rows') rows: any[],
  ) {
    return this.bulkImport.importContacts(tenantId, userId, rows);
  }

  @Post('opportunities')
  @RequirePermissions('opportunities:write')
  @ApiOperation({
    summary: 'Importar oportunidades en masa',
    description:
      'Acepta un array JSON de hasta 2000 oportunidades. Procesa en lotes de 50. ' +
      'Campos: name*, stage, value, probability, description, expectedCloseDate, contactEmail, contactId. ' +
      'Si no se proporciona contactEmail/contactId se usa el primer contacto del tenant como fallback.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Resultado de importacion: { total, imported, skipped, errors: [{ row, reason }] }',
  })
  importOpportunities(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('rows') rows: any[],
  ) {
    return this.bulkImport.importOpportunities(tenantId, userId, rows);
  }
}
