import { MarketingService } from './marketing.service';
export declare class MarketingController {
    private readonly service;
    constructor(service: MarketingService);
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        completed: number;
        totalSent: number;
        totalOpened: number;
        totalClicked: number;
    }>;
    findAll(tenantId: string, status?: string): Promise<({
        _count: {
            recipients: number;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        createdById: string;
        subject: string | null;
        body: string;
        sentAt: Date | null;
        channel: import(".prisma/client").$Enums.CampaignChannel;
        sentCount: number;
        openCount: number;
        clickCount: number;
        scheduledAt: Date | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        recipients: ({
            contact: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: string;
            contactId: string;
            openedAt: Date | null;
            clickedAt: Date | null;
            sentAt: Date | null;
            campaignId: string;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        createdById: string;
        subject: string | null;
        body: string;
        sentAt: Date | null;
        channel: import(".prisma/client").$Enums.CampaignChannel;
        sentCount: number;
        openCount: number;
        clickCount: number;
        scheduledAt: Date | null;
    }>;
    create(tenantId: string, userId: string, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        createdById: string;
        subject: string | null;
        body: string;
        sentAt: Date | null;
        channel: import(".prisma/client").$Enums.CampaignChannel;
        sentCount: number;
        openCount: number;
        clickCount: number;
        scheduledAt: Date | null;
    }>;
    update(id: string, tenantId: string, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        createdById: string;
        subject: string | null;
        body: string;
        sentAt: Date | null;
        channel: import(".prisma/client").$Enums.CampaignChannel;
        sentCount: number;
        openCount: number;
        clickCount: number;
        scheduledAt: Date | null;
    }>;
    addRecipients(id: string, tenantId: string, contactIds: string[]): Promise<{
        added: number;
    }>;
}
