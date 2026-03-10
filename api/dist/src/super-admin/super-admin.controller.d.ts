import { SuperAdminService } from './super-admin.service';
import { AuthService } from '../auth/auth.service';
export declare class SuperAdminController {
    private readonly service;
    private readonly authService;
    constructor(service: SuperAdminService, authService: AuthService);
    getStats(user: any): Promise<{
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
    findTenants(user: any, search?: string): Promise<({
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
    findTenant(user: any, id: string): Promise<{
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
    createTenant(user: any, dto: any): Promise<{
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
    updateTenant(user: any, id: string, dto: any): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateSettings(user: any, id: string, dto: any): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    suspendTenant(user: any, id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    activateTenant(user: any, id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findPlans(user: any): Promise<({
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
    createPlan(user: any, dto: any): Promise<{
        id: string;
        code: string;
        priceMonthly: number;
        priceYearly: number;
        maxUsers: number;
        maxAdmins: number;
        maxStorage: number;
    }>;
    updatePlan(user: any, id: string, dto: any): Promise<{
        id: string;
        code: string;
        priceMonthly: number;
        priceYearly: number;
        maxUsers: number;
        maxAdmins: number;
        maxStorage: number;
    }>;
    getTenantUsers(user: any, id: string): Promise<{
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
    createTenantUser(user: any, id: string, dto: any): Promise<any>;
    deactivateUser(user: any, tenantId: string, userId: string): Promise<{
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
    resetTenantUserPassword(user: any, tenantId: string, userId: string, newPassword?: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
}
