import { Controller, Post, Patch, Body, Param, HttpCode, HttpStatus, Get, UseGuards, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginRateLimitGuard } from '../common/guards/rate-limit.guard';

const IS_PROD = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000, // 8h
};
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('antu_at', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('antu_rt', refreshToken, REFRESH_COOKIE_OPTS);
}

function clearAuthCookies(res: Response) {
  res.clearCookie('antu_at', { path: '/' });
  res.clearCookie('antu_rt', { path: '/api/v1/auth/refresh' });
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    if (!('requiresMfa' in result) && result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Public()
  @UseGuards(LoginRateLimitGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refrescados exitosamente' })
  async refreshTokens(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario actual' })
  @ApiResponse({ status: 200, description: 'Información del usuario' })
  async getMe(@CurrentUser() user: any) {
    return { user };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Contraseña nueva demasiado corta' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(userId, currentPassword, newPassword);
  }

  @Patch('admin-reset-password/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin resetea contraseña de un usuario del mismo tenant' })
  @ApiResponse({ status: 200, description: 'Contraseña reseteada' })
  async adminResetPassword(
    @CurrentUser() user: any,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body('newPassword') newPassword?: string,
  ) {
    return this.authService.adminResetPassword(targetUserId, user.tenantId, newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar tokens' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res);
    return this.authService.logout(userId);
  }

  @Public()
  @Post('mfa-challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar login con código MFA' })
  @ApiResponse({ status: 200, description: 'Login completado con MFA' })
  @ApiResponse({ status: 401, description: 'Código MFA inválido' })
  async mfaChallenge(
    @Body('userId') userId: string,
    @Body('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.mfaChallenge(userId, token);
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }
}
