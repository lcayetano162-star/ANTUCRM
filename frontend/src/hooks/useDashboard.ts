// ============================================
// ANTU CRM - Dashboard Hook
// Hook para obtener métricas reales del backend
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface DashboardKPIs {
    totalRevenue: number;
    totalDeals: number;
    newContacts: number;
    activeOpportunities: number;
}

export interface SalesTrendItem {
    month: string;
    value: number;
    count: number;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    contact?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface Opportunity {
    id: string;
    name: string;
    value: number;
    status: string;
    contact?: {
        firstName: string;
        lastName: string;
        company?: { name: string };
    };
}

export interface DashboardData {
    kpis: DashboardKPIs;
    recentActivities: Activity[];
    topOpportunities: Opportunity[];
    salesTrend: SalesTrendItem[];
    funnel: { stage: string; count: number; value: number }[];
    topVendedores: { name: string; value: number; percentage: number }[];
    period: string;
}

export function useDashboard(period: string = 'month', userId?: string) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/dashboard/sales?period=${period}`;
            if (userId) {
                url += `&userId=${userId}`;
            }
            const response = await api.get<DashboardData>(url);
            setData(response);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    }, [period, userId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return { data, loading, error, refetch: fetchDashboardData };
}
