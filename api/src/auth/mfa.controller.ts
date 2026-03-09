import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar configuración de MFA — obtener secreto y URI' })
  async setup(@CurrentUser('sub') userId: string) {
    return this.mfaService.setupMfa(userId);
  }

  @Post('verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código TOTP y activar MFA' })
  async verifySetup(
    @CurrentUser('sub') userId: string,
    @Body('token') token: string,
  ) {
    return this.mfaService.verifyAndEnableMfa(userId, token);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar MFA (requiere código actual)' })
  async disable(
    @CurrentUser('sub') userId: string,
    @Body('token') token: string,
  ) {
    return this.mfaService.disableMfa(userId, token);
  }
}
