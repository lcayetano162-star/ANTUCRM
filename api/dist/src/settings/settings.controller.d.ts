import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly service;
    constructor(service: SettingsService);
    getSettings(tenantId: string): Promise<any>;
    updateSettings(tenantId: string, dto: Record<string, any>): Promise<any>;
    getModules(tenantId: string): Promise<any>;
}
