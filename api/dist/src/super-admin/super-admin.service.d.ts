import { PrismaService } from '../prisma/prisma.service';
export declare class SuperAdminService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllTenants(search?: string): Promise<({
        subscription: {
            plan: {
                id: string;
                code: string;
                priceMonthly: number;
                priceYearly: number;
                maxUsers: number;
                maxAdmins: number;
                maxStorage: number;
            };
        } & {
            id: string;
            tenantId: string;
            status: string;
            externalId: string | null;
            planId: string;
            billingCycle: string;
            paymentMethod: string | null;
            nextPaymentDate: Date;
            lastPaymentDate: Date;
        };
        _count: {
            opportunities: number;
            contacts: number;
            users: number;
        };
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOneTenant(id: string): Promise<{
        subscription: {
            plan: {
                id: string;
                code: string;
                priceMonthly: number;
                priceYearly: number;
                maxUsers: number;
                maxAdmins: number;
                maxStorage: number;
            };
        } & {
            id: string;
            tenantId: string;
            status: string;
            externalId: string | null;
            planId: string;
            billingCycle: string;
            paymentMethod: string | null;
            nextPaymentDate: Date;
            lastPaymentDate: Date;
        };
        _count: {
            activities: number;
            opportunities: number;
            contacts: number;
            users: number;
        };
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            lastLoginAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createTenant(dto: any): Promise<{
        tenant: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        };
        admin: {
            id: string;
            email: string;
            temporaryPassword: any;
        };
        message: string;
    }>;
    updateTenant(id: string, dto: any): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateTenantSettings(id: string, settings: Record<string, any>): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    suspendTenant(id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    activateTenant(id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAllPlans(): Promise<({
        _count: {
            subscriptions: number;
        };
    } & {
        id: string;
        code: string;
        priceMonthly: number;
        priceYearly: number;
        maxUsers: number;
        maxAdmins: number;
        maxStorage: number;
    })[]>;
    createPlan(dto: any): Promise<{
        id: string;
        code: string;
        priceMonthly: number;
        priceYearly: number;
        maxUsers: number;
        maxAdmins: number;
        maxStorage: number;
    }>;
    updatePlan(id: string, dto: any): Promise<{
        id: string;
        code: string;
        priceMonthly: number;
        priceYearly: number;
        maxUsers: number;
        maxAdmins: number;
        maxStorage: number;
    }>;
    getTenantUsers(tenantId: string): Promise<{
        role: {
            name: string;
            id: string;
        };
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        lastLoginAt: Date;
        createdAt: Date;
    }[]>;
    createTenantUser(tenantId: string, dto: any): Promise<any>;
    deactivateTenantUser(userId: string, tenantId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        roleId: string | null;
        managerId: string | null;
        tokenVersion: number;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
    }>;
    getPlatformStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        totalContacts: number;
        recentTenants: ({
            subscription: {
                plan: {
                    id: string;
                    code: string;
                    priceMonthly: number;
                    priceYearly: number;
                    maxUsers: number;
                    maxAdmins: number;
                    maxStorage: number;
                };
            } & {
                id: string;
                tenantId: string;
                status: string;
                externalId: string | null;
                planId: string;
                billingCycle: string;
                paymentMethod: string | null;
                nextPaymentDate: Date;
                lastPaymentDate: Date;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
}
