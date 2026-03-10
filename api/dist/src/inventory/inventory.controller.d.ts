import { InventoryService } from './inventory.service';
import { InventoryAIService } from './inventory-ai.service';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly aiService;
    constructor(inventoryService: InventoryService, aiService: InventoryAIService);
    getInventory(tenantId: string, page?: number, limit?: number): Promise<{
        items: ({
            category: {
                name: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
            };
            batches: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: import(".prisma/client").$Enums.BatchStatus;
                expiryDate: Date | null;
                batchNumber: string;
                quantity: number;
                productId: string;
            }[];
        } & {
            name: string;
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            sku: string;
            stockQuantity: number;
            minStock: number;
            maxStock: number | null;
            unitCost: number | null;
            unitPrice: number | null;
            categoryId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAlerts(tenantId: string): Promise<{
        lowStock: {
            name: string;
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            sku: string;
            stockQuantity: number;
            minStock: number;
            maxStock: number | null;
            unitCost: number | null;
            unitPrice: number | null;
            categoryId: string | null;
        }[];
        expiringSoon: ({
            product: {
                name: string;
                description: string | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                sku: string;
                stockQuantity: number;
                minStock: number;
                maxStock: number | null;
                unitCost: number | null;
                unitPrice: number | null;
                categoryId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.BatchStatus;
            expiryDate: Date | null;
            batchNumber: string;
            quantity: number;
            productId: string;
        })[];
        outOfStock: {
            name: string;
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            sku: string;
            stockQuantity: number;
            minStock: number;
            maxStock: number | null;
            unitCost: number | null;
            unitPrice: number | null;
            categoryId: string | null;
        }[];
        totalAlerts: number;
    }>;
    getPredictions(tenantId: string): Promise<any[]>;
    optimizeLocation(tenantId: string, productId: string): Promise<any>;
}
