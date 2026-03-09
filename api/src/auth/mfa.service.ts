import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSecret(): string {
    return crypto.randomBytes(20).toString('base64url');
  }

  private toBase32(buf: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    for (const byte of buf) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
    return result;
  }

  private buildOtpAuthUri(secret: string, email: string): string {
    const issuer = encodeURIComponent('ANTU CRM');
    const user = encodeURIComponent(email);
    const base32 = this.toBase32(Buffer.from(secret, 'base64url'));
    return `otpauth://totp/${issuer}:${user}?secret=${base32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  verifyToken(secret: string, token: string): boolean {
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    for (const delta of [-1, 0, 1]) {
      const counter = timeStep + delta;
      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64url'));
      const buf = Buffer.alloc(8);
      buf.writeBigUInt64BE(BigInt(counter));
      hmac.update(buf);
      const hash = hmac.digest();
      const offset = hash[hash.length - 1] & 0x0f;
      const code = ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
        .toString()
        .padStart(6, '0');
      if (code === token) return true;
    }
    return false;
  }

  async setupMfa(
    userId: string,
  ): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.mfaEnabled)
      throw new BadRequestException(
        'MFA ya está activo. Deshabilítalo primero para configurar uno nuevo.',
      );

    const secret = this.generateSecret();
    const otpauthUrl = this.buildOtpAuthUri(secret, user.email);
    const base32 = this.toBase32(Buffer.from(secret, 'base64url'));

    // Store pending secret (not yet enabled — mfaEnabled stays false until verify-setup)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret: base32, otpauthUrl, qrDataUrl: otpauthUrl };
  }

  async verifyAndEnableMfa(
    userId: string,
    token: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });
    if (!user?.mfaSecret)
      throw new BadRequestException('Primero inicia la configuración de MFA');
    if (user.mfaEnabled) throw new BadRequestException('MFA ya está activo');

    if (!this.verifyToken(user.mfaSecret, token)) {
      throw new BadRequestException(
        'Código inválido. Verifica la hora de tu dispositivo.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA activado correctamente' };
  }

  async disableMfa(
    userId: string,
    token: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });
    if (!user?.mfaEnabled) throw new BadRequestException('MFA no está activo');
    if (!user.mfaSecret || !this.verifyToken(user.mfaSecret, token)) {
      throw new BadRequestException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { message: 'MFA desactivado' };
  }

  async verifyMfaChallenge(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });
    if (!user?.mfaEnabled || !user.mfaSecret) return false;
    return this.verifyToken(user.mfaSecret, token);
  }
}
