// ============================================
// ANTU CRM - Dashboard Insights Hook
// Hook para obtener recomendaciones generadas por IA
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AIInsight {
    type: 'warning' | 'opportunity' | 'forecast';
    message: string;
    suggestion: string;
    action: string;
    actionLink?: string;
}

export function useDashboardInsights() {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<any[]>('/dashboard/insights');
            const responseArray = Array.isArray(response) ? response : [];
            const mappedInsights: AIInsight[] = responseArray.map(i => ({
                type: (i.type || '').toLowerCase().includes('risk') || (i.type || '').toLowerCase().includes('critical') ? 'warning' :
                    (i.type || '').toLowerCase().includes('opp') ? 'opportunity' : 'forecast',
                message: i.title || i.message || 'Alerta de IA',
                suggestion: i.description || i.suggestion || '',
                action: i.action?.label || 'Ver más',
                actionLink: i.action?.route || '#'
            }));
            setInsights(mappedInsights);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching dashboard insights:', err);
            // Solo mostramos error si es algo crítico, de lo contrario devolvemos array vacío
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    return { insights, loading, error, refetch: fetchInsights };
}
