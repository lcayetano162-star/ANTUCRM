"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = require("crypto");
let MfaService = class MfaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSecret() {
        return crypto.randomBytes(20).toString('base64url');
    }
    toBase32(buf) {
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
        if (bits > 0)
            result += alphabet[(value << (5 - bits)) & 31];
        return result;
    }
    buildOtpAuthUri(secret, email) {
        const issuer = encodeURIComponent('ANTU CRM');
        const user = encodeURIComponent(email);
        const base32 = this.toBase32(Buffer.from(secret, 'base64url'));
        return `otpauth://totp/${issuer}:${user}?secret=${base32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    }
    verifyToken(secret, token) {
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
            if (code === token)
                return true;
        }
        return false;
    }
    async setupMfa(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, mfaEnabled: true },
        });
        if (!user)
            throw new common_1.BadRequestException('Usuario no encontrado');
        if (user.mfaEnabled)
            throw new common_1.BadRequestException('MFA ya está activo. Deshabilítalo primero para configurar uno nuevo.');
        const secret = this.generateSecret();
        const otpauthUrl = this.buildOtpAuthUri(secret, user.email);
        const base32 = this.toBase32(Buffer.from(secret, 'base64url'));
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret },
        });
        return { secret: base32, otpauthUrl, qrDataUrl: otpauthUrl };
    }
    async verifyAndEnableMfa(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mfaSecret: true, mfaEnabled: true },
        });
        if (!user?.mfaSecret)
            throw new common_1.BadRequestException('Primero inicia la configuración de MFA');
        if (user.mfaEnabled)
            throw new common_1.BadRequestException('MFA ya está activo');
        if (!this.verifyToken(user.mfaSecret, token)) {
            throw new common_1.BadRequestException('Código inválido. Verifica la hora de tu dispositivo.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });
        return { message: 'MFA activado correctamente' };
    }
    async disableMfa(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mfaSecret: true, mfaEnabled: true },
        });
        if (!user?.mfaEnabled)
            throw new common_1.BadRequestException('MFA no está activo');
        if (!user.mfaSecret || !this.verifyToken(user.mfaSecret, token)) {
            throw new common_1.BadRequestException('Código inválido');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null },
        });
        return { message: 'MFA desactivado' };
    }
    async verifyMfaChallenge(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mfaSecret: true, mfaEnabled: true },
        });
        if (!user?.mfaEnabled || !user.mfaSecret)
            return false;
        return this.verifyToken(user.mfaSecret, token);
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map