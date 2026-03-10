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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const public_decorator_1 = require("./decorators/public.decorator");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const IS_PROD = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE_OPTS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
};
const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie('antu_at', accessToken, ACCESS_COOKIE_OPTS);
    res.cookie('antu_rt', refreshToken, REFRESH_COOKIE_OPTS);
}
function clearAuthCookies(res) {
    res.clearCookie('antu_at', { path: '/' });
    res.clearCookie('antu_rt', { path: '/api/v1/auth/refresh' });
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        if (!('requiresMfa' in result) && result.accessToken && result.refreshToken) {
            setAuthCookies(res, result.accessToken, result.refreshToken);
        }
        return result;
    }
    async register(dto, res) {
        const result = await this.authService.register(dto);
        if (result.accessToken && result.refreshToken) {
            setAuthCookies(res, result.accessToken, result.refreshToken);
        }
        return result;
    }
    async refreshTokens(dto, res) {
        const result = await this.authService.refreshTokens(dto.refreshToken);
        if (result.accessToken && result.refreshToken) {
            setAuthCookies(res, result.accessToken, result.refreshToken);
        }
        return result;
    }
    async getMe(user) {
        return { user };
    }
    async changePassword(userId, currentPassword, newPassword) {
        return this.authService.changePassword(userId, currentPassword, newPassword);
    }
    async adminResetPassword(user, targetUserId, newPassword) {
        return this.authService.adminResetPassword(targetUserId, user.tenantId, newPassword);
    }
    async logout(userId, res) {
        clearAuthCookies(res);
        return this.authService.logout(userId);
    }
    async mfaChallenge(userId, token, res) {
        const result = await this.authService.mfaChallenge(userId, token);
        if (result.accessToken && result.refreshToken) {
            setAuthCookies(res, result.accessToken, result.refreshToken);
        }
        return result;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(rate_limit_guard_1.LoginRateLimitGuard),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar sesión' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login exitoso' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciales inválidas' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Demasiados intentos' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(rate_limit_guard_1.LoginRateLimitGuard),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar nuevo usuario' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuario registrado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email ya existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refrescar tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tokens refrescados exitosamente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener información del usuario actual' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Información del usuario' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar contraseña del usuario autenticado' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contraseña actualizada correctamente' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Contraseña nueva demasiado corta' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Contraseña actual incorrecta' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)('currentPassword')),
    __param(2, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('admin-reset-password/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin resetea contraseña de un usuario del mismo tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contraseña reseteada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminResetPassword", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cerrar sesión e invalidar tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sesión cerrada correctamente' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('mfa-challenge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Completar login con código MFA' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login completado con MFA' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Código MFA inválido' }),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Body)('token')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaChallenge", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map