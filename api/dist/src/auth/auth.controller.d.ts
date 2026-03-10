import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, res: Response): Promise<{
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
    register(dto: RegisterDto, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
    }>;
    refreshTokens(dto: RefreshTokenDto, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    getMe(user: any): Promise<{
        user: any;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    adminResetPassword(user: any, targetUserId: string, newPassword?: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    logout(userId: string, res: Response): Promise<{
        message: string;
    }>;
    mfaChallenge(userId: string, token: string, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
    }>;
}
