import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    logClientEvent(user: any, body: any, req: any): Promise<{
        ok: boolean;
    }>;
}
