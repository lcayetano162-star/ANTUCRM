import { PrismaService } from '../prisma/prisma.service';
export declare class MfaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private generateSecret;
    private toBase32;
    private buildOtpAuthUri;
    verifyToken(secret: string, token: string): boolean;
    setupMfa(userId: string): Promise<{
        secret: string;
        otpauthUrl: string;
        qrDataUrl: string;
    }>;
    verifyAndEnableMfa(userId: string, token: string): Promise<{
        message: string;
    }>;
    disableMfa(userId: string, token: string): Promise<{
        message: string;
    }>;
    verifyMfaChallenge(userId: string, token: string): Promise<boolean>;
}
