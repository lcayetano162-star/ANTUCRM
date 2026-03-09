import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { MfaService } from './mfa.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly billing: BillingService,
    private readonly mfaService: MfaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        isActive: true,
      },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException(
        'Cuenta bloqueada temporalmente. Intenta en 15 minutos',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts; lock if >= 5
      const newFailedAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const lockData: any = { failedLoginAttempts: newFailedAttempts };
      if (newFailedAttempts >= 5) {
        lockData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: lockData });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // If MFA is enabled, return challenge instead of tokens
    if (user.mfaEnabled) {
      return {
        requiresMfa: true,
        userId: user.id,
      };
    }

    const tokens = await this.generateTokens(user);

    // Actualizar último login y resetear intentos fallidos
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async mfaChallenge(userId: string, mfaToken: string) {
    const isValid = await this.mfaService.verifyMfaChallenge(userId, mfaToken);
    if (!isValid) throw new UnauthorizedException('Código MFA inválido');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Usuario inválido');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    return {
      user: this.sanitizeUser(user),
      ...(await this.generateTokens(user)),
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar límites del plan
    if (dto.tenantId) {
      const currentUsers = await this.prisma.user.count({ where: { tenantId: dto.tenantId } });
      const validation = await this.billing.validatePlanLimits(dto.tenantId, 'users', currentUsers);

      if (!validation.allowed) {
        throw new ConflictException(
          `Has alcanzado el límite de usuarios de tu plan (${validation.limit}). Por favor, mejora tu plan en Configuración.`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tenantId: dto.tenantId,
        roleId: dto.roleId,
      },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    const userId = payload?.sub;
    if (!userId) throw new ForbiddenException('Token malformado');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido o desactivado');
    }

    if (!user.tenant?.isActive) {
      throw new ForbiddenException('Cuenta suspendida');
    }

    if (user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Sesión invalidada. Por favor inicia sesión nuevamente.');
    }

    return this.generateTokens(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return { message: 'Contraseña actualizada correctamente' };
  }

  async adminResetPassword(targetUserId: string, tenantId: string, newPassword?: string) {
    // Validate user belongs to same tenant
    const user = await this.prisma.user.findFirst({ where: { id: targetUserId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado en este tenant');

    const rawPassword =
      newPassword || `Reset${Math.random().toString(36).slice(2, 8).toUpperCase()}!`;
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return {
      message: 'Contraseña reseteada. Comunica la contraseña temporal al usuario.',
      temporaryPassword: rawPassword,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  private async generateTokens(user: any) {
    const permissions = user.role?.permissions.map((rp: any) => rp.permission.code) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role?.name || 'USER',
      permissions,
      tokenVersion: user.tokenVersion ?? 0,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '8h',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 28800, // 8 horas en segundos
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized;
  }
}
