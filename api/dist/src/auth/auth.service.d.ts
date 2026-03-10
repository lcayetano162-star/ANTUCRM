import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { MfaService } from './mfa.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly billing;
    private readonly mfaService;
    constructor(prisma: PrismaService, jwtService: JwtService, billing: BillingService, mfaService: MfaService);
    login(dto: LoginDto): Promise<{
        requiresMfa: boolean;
        userId: string;
    } | {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
        requiresMfa?: undefined;
        userId?: undefined;
    }>;
    mfaChallenge(userId: string, mfaToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    adminResetPassword(targetUserId: string, tenantId: string, newPassword?: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private sanitizeUser;
}
