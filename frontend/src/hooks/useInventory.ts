import { useState, useEffect, useCallback } from 'react';

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer' | 'reservation' | 'release';

export interface ProductStock {
    physical: number;
    reserved: number;
    available: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    category: string;
    brand: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    status: 'active' | 'inactive';
    stock: ProductStock;
    location: {
        warehouse: string;
        zone: string;
        shelf: string;
    };
    lastUpdated: string;
}

export interface InventoryMovement {
    id: string;
    type: MovementType;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    sourceType: string;
    sourceId?: string;
    userId: string;
    userName: string;
    notes?: string;
    createdAt: string;
}

const INITIAL_PRODUCTS: Product[] = [
    {
        id: 'p1',
        sku: 'HP-664-N',
        name: 'Tinta HP 664 Negro Original',
        description: 'Cartucho de tinta negra HP 664 para impresoras DeskJet',
        category: 'Consumibles > Tinta > HP',
        brand: 'HP',
        unit: 'unidad',
        costPrice: 450,
        salePrice: 890,
        status: 'active',
        stock: {
            physical: 15,
            reserved: 12,
            available: 3,
            minStock: 10,
            maxStock: 50,
            reorderPoint: 15,
        },
        location: {
            warehouse: 'Almacén Principal',
            zone: 'A',
            shelf: 'A-12',
        },
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'p4',
        sku: 'HP-LJP-M404',
        name: 'Impresora HP LaserJet Pro M404',
        description: 'Impresora láser monocromática profesional',
        category: 'Equipos > Impresoras > Láser',
        brand: 'HP',
        unit: 'unidad',
        costPrice: 18500,
        salePrice: 26000,
        status: 'active',
        stock: {
            physical: 8,
            reserved: 3,
            available: 5,
            minStock: 5,
            maxStock: 20,
            reorderPoint: 8,
        },
        location: {
            warehouse: 'Almacén Principal',
            zone: 'C',
            shelf: 'C-01',
        },
        lastUpdated: new Date().toISOString(),
    },
];

export function useInventory() {
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('antu_inventory_products');
        return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    });

    const [movements, setMovements] = useState<InventoryMovement[]>(() => {
        const saved = localStorage.getItem('antu_inventory_movements');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('antu_inventory_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('antu_inventory_movements', JSON.stringify(movements));
    }, [movements]);

    const addMovement = useCallback((movement: Omit<InventoryMovement, 'id' | 'createdAt' | 'stockBefore' | 'stockAfter'>) => {
        setProducts(prevProducts => {
            const productIndex = prevProducts.findIndex(p => p.id === movement.productId);
            if (productIndex === -1) return prevProducts;

            const product = prevProducts[productIndex];
            const stockBefore = product.stock.physical;
            let stockAfter = stockBefore;
            let reservedAfter = product.stock.reserved;

            // Logic for different movement types
            switch (movement.type) {
                case 'entry':
                    stockAfter += movement.quantity;
                    break;
                case 'exit':
                    stockAfter -= Math.abs(movement.quantity);
                    break;
                case 'reservation':
                    reservedAfter += Math.abs(movement.quantity);
                    break;
                case 'release':
                    reservedAfter -= Math.abs(movement.quantity);
                    break;
                case 'adjustment':
                    stockAfter = movement.quantity; // In adjustment, quantity is the new target
                    break;
            }

            const updatedProduct = {
                ...product,
                stock: {
                    ...product.stock,
                    physical: stockAfter,
                    reserved: reservedAfter,
                    available: stockAfter - reservedAfter,
                },
                lastUpdated: new Date().toISOString(),
            };

            const newMovement: InventoryMovement = {
                ...movement,
                id: `mov-${Date.now()}`,
                createdAt: new Date().toISOString(),
                stockBefore,
                stockAfter,
            };

            setMovements(prevMovements => [newMovement, ...prevMovements]);

            const newProducts = [...prevProducts];
            newProducts[productIndex] = updatedProduct;
            return newProducts;
        });
    }, []);

    const createReservationFromOpportunity = useCallback((opportunityId: string, opportunityName: string, items: { sku: string; quantity: number; name: string }[], userName: string, userId: string) => {
        items.forEach(item => {
            const product = products.find(p => p.sku === item.sku);
            if (product) {
                addMovement({
                    type: 'reservation',
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    quantity: item.quantity,
                    sourceType: 'OPPORTUNITY_CLOSED',
                    sourceId: opportunityId,
                    userId,
                    userName,
                    notes: `Reserva automática por cierre de oportunidad: ${opportunityName}`,
                });
            }
        });
    }, [products, addMovement]);

    return {
        products,
        movements,
        addMovement,
        createReservationFromOpportunity,
    };
}
