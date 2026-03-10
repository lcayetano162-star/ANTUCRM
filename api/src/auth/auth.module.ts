import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { Global } from '@nestjs/common';

@Global()
@Module({
  imports: [
    PrismaModule,
    BillingModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const privateKey = configService.get<string>('JWT_PRIVATE_KEY') ||
          Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64 || '', 'base64').toString();
        const publicKey = configService.get<string>('JWT_PUBLIC_KEY') ||
          Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64 || '', 'base64').toString();
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (jwtSecret && !privateKey) {
          return {
            secret: jwtSecret,
            signOptions: {
              algorithm: 'HS256' as const,
              expiresIn: configService.get<string>('JWT_EXPIRATION', '8h') as any,
            },
          };
        }

        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256' as const,
            expiresIn: configService.get<string>('JWT_EXPIRATION', '8h') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, MfaService, JwtStrategy],
  exports: [AuthService, MfaService, JwtModule],
})
export class AuthModule { }
