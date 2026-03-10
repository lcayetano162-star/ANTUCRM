import { PrismaService } from '../prisma/prisma.service';
export declare class MarketingService {
    private prisma;
    constructor(prisma: PrismaService);
    findCampaigns(tenantId: string, status?: string): Promise<({
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
    findOneCampaign(id: string, tenantId: string): Promise<{
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
    createCampaign(tenantId: string, userId: string, dto: any): Promise<{
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
    updateCampaign(id: string, tenantId: string, dto: any): Promise<{
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
    addRecipients(campaignId: string, tenantId: string, contactIds: string[]): Promise<{
        added: number;
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        completed: number;
        totalSent: number;
        totalOpened: number;
        totalClicked: number;
    }>;
}
