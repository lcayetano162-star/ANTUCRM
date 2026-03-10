import { MfaService } from './mfa.service';
export declare class MfaController {
    private readonly mfaService;
    constructor(mfaService: MfaService);
    setup(userId: string): Promise<{
        secret: string;
        otpauthUrl: string;
        qrDataUrl: string;
    }>;
    verifySetup(userId: string, token: string): Promise<{
        message: string;
    }>;
    disable(userId: string, token: string): Promise<{
        message: string;
    }>;
}
