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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const billing_service_1 = require("../billing/billing.service");
const mfa_service_1 = require("./mfa.service");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwtService, billing, mfaService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.billing = billing;
        this.mfaService = mfaService;
    }
    async login(dto) {
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.HttpException('Cuenta bloqueada temporalmente. Intenta en 15 minutos', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            const newFailedAttempts = (user.failedLoginAttempts ?? 0) + 1;
            const lockData = { failedLoginAttempts: newFailedAttempts };
            if (newFailedAttempts >= 5) {
                lockData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await this.prisma.user.update({ where: { id: user.id }, data: lockData });
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (user.mfaEnabled) {
            return {
                requiresMfa: true,
                userId: user.id,
            };
        }
        const tokens = await this.generateTokens(user);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
        });
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async mfaChallenge(userId, mfaToken) {
        const isValid = await this.mfaService.verifyMfaChallenge(userId, mfaToken);
        if (!isValid)
            throw new common_1.UnauthorizedException('Código MFA inválido');
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
        if (!user || !user.isActive)
            throw new common_1.UnauthorizedException('Usuario inválido');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
        });
        return {
            user: this.sanitizeUser(user),
            ...(await this.generateTokens(user)),
        };
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        if (dto.tenantId) {
            const currentUsers = await this.prisma.user.count({ where: { tenantId: dto.tenantId } });
            const validation = await this.billing.validatePlanLimits(dto.tenantId, 'users', currentUsers);
            if (!validation.allowed) {
                throw new common_1.ConflictException(`Has alcanzado el límite de usuarios de tu plan (${validation.limit}). Por favor, mejora tu plan en Configuración.`);
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
    async refreshTokens(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Token de refresco inválido o expirado');
        }
        const userId = payload?.sub;
        if (!userId)
            throw new common_1.ForbiddenException('Token malformado');
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
            throw new common_1.UnauthorizedException('Usuario no válido o desactivado');
        }
        if (!user.tenant?.isActive) {
            throw new common_1.ForbiddenException('Cuenta suspendida');
        }
        if (user.tokenVersion !== (payload.tokenVersion ?? 0)) {
            throw new common_1.UnauthorizedException('Sesión invalidada. Por favor inicia sesión nuevamente.');
        }
        return this.generateTokens(user);
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid)
            throw new common_1.UnauthorizedException('Contraseña actual incorrecta');
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash, tokenVersion: { increment: 1 } },
        });
        return { message: 'Contraseña actualizada correctamente' };
    }
    async adminResetPassword(targetUserId, tenantId, newPassword) {
        const user = await this.prisma.user.findFirst({ where: { id: targetUserId, tenantId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado en este tenant');
        const rawPassword = newPassword || `Reset${Math.random().toString(36).slice(2, 8).toUpperCase()}!`;
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
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
        return { message: 'Sesión cerrada correctamente' };
    }
    async generateTokens(user) {
        const permissions = user.role?.permissions.map((rp) => rp.permission.code) || [];
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
            expiresIn: 28800,
        };
    }
    sanitizeUser(user) {
        const { passwordHash, mfaSecret, ...sanitized } = user;
        return sanitized;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        billing_service_1.BillingService,
        mfa_service_1.MfaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map