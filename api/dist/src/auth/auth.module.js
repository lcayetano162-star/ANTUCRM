"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const mfa_service_1 = require("./mfa.service");
const mfa_controller_1 = require("./mfa.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const prisma_module_1 = require("../prisma/prisma.module");
const billing_module_1 = require("../billing/billing.module");
const common_2 = require("@nestjs/common");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_2.Global)(),
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            billing_module_1.BillingModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const privateKey = configService.get('JWT_PRIVATE_KEY') ||
                        Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64 || '', 'base64').toString();
                    const publicKey = configService.get('JWT_PUBLIC_KEY') ||
                        Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64 || '', 'base64').toString();
                    const jwtSecret = configService.get('JWT_SECRET');
                    if (jwtSecret && !privateKey) {
                        return {
                            secret: jwtSecret,
                            signOptions: {
                                algorithm: 'HS256',
                                expiresIn: configService.get('JWT_EXPIRATION', '8h'),
                            },
                        };
                    }
                    return {
                        privateKey,
                        publicKey,
                        signOptions: {
                            algorithm: 'RS256',
                            expiresIn: configService.get('JWT_EXPIRATION', '8h'),
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController, mfa_controller_1.MfaController],
        providers: [auth_service_1.AuthService, mfa_service_1.MfaService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, mfa_service_1.MfaService, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map