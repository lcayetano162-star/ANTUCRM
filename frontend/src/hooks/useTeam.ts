// ============================================
// ANTU CRM - Team Hook
// Hook para obtener la lista de vendedores/usuarios reales
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Vendedor {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
    active: boolean;
    joinDate: string;
}

export function useTeam() {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeam = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Vendedor[]>('/dashboard/team');
            setVendedores(Array.isArray(response) ? response : []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching team members:', err);
            setError('Error al cargar miembros del equipo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    return { vendedores, loading, error, refetch: fetchTeam };
}
