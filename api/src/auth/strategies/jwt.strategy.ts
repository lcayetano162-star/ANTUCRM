import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const privateKey = configService.get<string>('JWT_PRIVATE_KEY') ||
      Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64 || '', 'base64').toString();
    const publicKey = configService.get<string>('JWT_PUBLIC_KEY') ||
      Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64 || '', 'base64').toString();
    const jwtSecret = configService.get<string>('JWT_SECRET');
    const useHS256 = !!(jwtSecret && !privateKey);

    super({
      // Lee del cookie httpOnly primero; Bearer header como fallback (para API clients)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.['antu_at'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: useHS256 ? jwtSecret! : publicKey,
      algorithms: useHS256 ? ['HS256'] : ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido');
    }

    // Validate tokenVersion to support instant logout/revocation
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, tokenVersion: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido o desactivado');
    }

    const payloadVersion = (payload as any).tokenVersion ?? 0;
    if (user.tokenVersion !== payloadVersion) {
      throw new UnauthorizedException('Sesión invalidada. Por favor inicia sesión nuevamente.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  }
}
