// ============================================
// ANTU CRM - Performance Hook
// Hook para manejar datos de desempeño
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type {
  PerformanceData,
  UserRole,
  PerformancePeriod,
  TeamMember
} from '@/types/performance';
import { api } from '@/lib/api';

// Datos mock base
const MOCK_PERFORMANCE_DATA: PerformanceData = {
  userId: '1',
  userName: 'Juan Pérez',
  userRole: 'SALES_REP',
  period: { month: 2, year: 2026, monthName: 'Febrero' },
  quota: {
    target: 58000,
    achieved: 45200,
    percentage: 78,
    remaining: 12800,
    projected: 52800,
    projectedPercentage: 91
  },
  annualQuota: {
    target: 696000,
    ytd: 98400,
    percentage: 85,
    quarterly: [
      { q: 1, percentage: 80 },
      { q: 2, percentage: 0 },
      { q: 3, percentage: 0 },
      { q: 4, percentage: 0 }
    ]
  },
  historical: [
    { period: 'Ene \'26', month: 1, year: 2026, target: 58000, achieved: 49300, percentage: 85 },
    { period: 'Dic \'25', month: 12, year: 2025, target: 58000, achieved: 56840, percentage: 98 },
    { period: 'Nov \'25', month: 11, year: 2025, target: 58000, achieved: 41760, percentage: 72 },
    { period: 'Oct \'25', month: 10, year: 2025, target: 58000, achieved: 60900, percentage: 105 },
    { period: 'Sep \'25', month: 9, year: 2025, target: 58000, achieved: 51040, percentage: 88 },
    { period: 'Ago \'25', month: 8, year: 2025, target: 58000, achieved: 37700, percentage: 65 },
    { period: 'Jul \'25', month: 7, year: 2025, target: 58000, achieved: 55100, percentage: 95 },
    { period: 'Jun \'25', month: 6, year: 2025, target: 58000, achieved: 52200, percentage: 90 },
    { period: 'May \'25', month: 5, year: 2025, target: 58000, achieved: 56840, percentage: 98 },
    { period: 'Abr \'25', month: 4, year: 2025, target: 58000, achieved: 43500, percentage: 75 },
    { period: 'Mar \'25', month: 3, year: 2025, target: 58000, achieved: 63800, percentage: 110 },
    { period: 'Feb \'25', month: 2, year: 2025, target: 58000, achieved: 51040, percentage: 88 },
  ],
  activities: {
    calls: { current: 12, target: 20, percentage: 60 },
    meetings: { current: 8, target: 12, percentage: 67 },
    emails: { current: 25, target: 30, percentage: 83 },
    visits: { current: 4, target: 6, percentage: 67 },
    opportunitiesCreated: { current: 3, target: 5, percentage: 60, value: 180000 }
  },
  badges: [
    {
      id: '1',
      name: 'Racha de 3 meses',
      description: 'Superó 100% de cuota por 3 meses consecutivos',
      icon: '🔥',
      color: '#F59E0B',
      earned: true,
      earnedAt: new Date('2025-10-15')
    },
    {
      id: '2',
      name: 'Top Closer',
      description: 'Mejor tasa de conversión del equipo',
      icon: '💎',
      color: '#0EA5E9',
      earned: true,
      earnedAt: new Date('2025-12-01')
    },
    {
      id: '3',
      name: '100 Llamadas',
      description: 'Completó 100 llamadas en un mes',
      icon: '📞',
      color: '#10B981',
      earned: false
    },
    {
      id: '4',
      name: 'Mega Deal',
      description: 'Cerró una oportunidad de $50K+',
      icon: '🏆',
      color: '#8B5CF6',
      earned: true,
      earnedAt: new Date('2025-11-20')
    }
  ],
  challenges: [
    {
      id: '1',
      title: 'Cierra $20K esta semana',
      description: 'Alcanza $20,000 en cierres esta semana',
      reward: 'Bono $500',
      progress: 15200,
      target: 20000,
      deadline: new Date('2026-02-28'),
      completed: false
    },
    {
      id: '2',
      title: '5 días de actividades completas',
      description: 'Completa 100% de actividades por 5 días seguidos',
      reward: 'Insignia Consistencia',
      progress: 3,
      target: 5,
      deadline: new Date('2026-03-05'),
      completed: false
    }
  ],
  insights: [
    {
      type: 'recommendation',
      title: 'Prioriza Canon MFP Renovación',
      description: 'Oportunidad de $25,000 con 80% probabilidad. Enviar contrato en los próximos 3 días.',
      action: 'Ver oportunidad',
      actionLink: '/opportunities/123',
      priority: 'high'
    },
    {
      type: 'trend',
      title: 'Tasa de cierre disminuyó 3%',
      description: 'Estás enfocándote en deals más grandes pero cerrando menos. Considera calificación más estricta.',
      priority: 'medium'
    },
    {
      type: 'opportunity',
      title: 'Reactiva oportunidades dormidas',
      description: 'Tienes 2 oportunidades sin actividad >30 días con valor combinado de $45,000.',
      action: 'Ver oportunidades',
      actionLink: '/opportunities?filter=dormant',
      priority: 'medium'
    }
  ],
  trends: [
    { metric: 'Ingresos', currentValue: 45200, previousValue: 39300, change: 15, changeType: 'positive' },
    { metric: 'Actividades', currentValue: 49, previousValue: 45, change: 8, changeType: 'positive' },
    { metric: 'Tasa de cierre', currentValue: 28, previousValue: 31, change: -3, changeType: 'negative' },
    { metric: 'Deal promedio', currentValue: 15000, previousValue: 12300, change: 22, changeType: 'positive' }
  ],
  teamRanking: {
    position: 3,
    total: 8,
    topPerformer: 'María G.',
    average: 72
  }
};

const MOCK_TEAM_DATA: TeamMember[] = [
  { id: '1', name: 'María G.', quota: 58000, achieved: 63800, percentage: 110, activitiesPercentage: 95, trend: 'stable', pipeline: 420000 },
  { id: '2', name: 'Carlos R.', quota: 58000, achieved: 60900, percentage: 105, activitiesPercentage: 88, trend: 'stable', pipeline: 380000 },
  { id: '3', name: 'Juan P.', quota: 58000, achieved: 45200, percentage: 78, activitiesPercentage: 72, trend: 'up', pipeline: 340000 },
  { id: '4', name: 'Ana M.', quota: 58000, achieved: 41760, percentage: 72, activitiesPercentage: 65, trend: 'down', pipeline: 290000 },
  { id: '5', name: 'Pedro S.', quota: 58000, achieved: 38280, percentage: 66, activitiesPercentage: 58, trend: 'down', pipeline: 260000 },
  { id: '6', name: 'Luisa T.', quota: 58000, achieved: 29000, percentage: 50, activitiesPercentage: 45, trend: 'down', pipeline: 180000 },
];

export function usePerformance(userId?: string, userRole: UserRole = 'SALES_REP') {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [teamData, setTeamData] = useState<TeamMember[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>({
    month: 2,
    year: 2026,
    monthName: 'Febrero'
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const year = (selectedPeriod as any) === 'ANNUAL' ? new Date().getFullYear() : selectedPeriod.year;
      const periodParam = (selectedPeriod as any) === 'ANNUAL' ? 'ANNUAL' : `${selectedPeriod.month}`;

      // Construir URL con el ID de usuario si hay uno seleccionado
      let url = `/quotas/performance?year=${year}&period=${periodParam}`;
      if (selectedUserId) {
        url += `&userId=${selectedUserId}`;
      }

      const realData = await api.get<any>(url);

      const performanceData: PerformanceData = {
        ...MOCK_PERFORMANCE_DATA,
        salesOpsConfig: realData.salesOpsConfig,
        quota: {
          ...MOCK_PERFORMANCE_DATA.quota,
          target: Number(realData.targetQuota) || 0,
          achieved: Number(realData.totalWon) || 0,
          percentage: Number(realData.pacing) || 0,
          projected: Number(realData.forecast) || 0,
          projectedPercentage: Number(realData.forecastPercentage) || 0
        },
        annualQuota: {
          ...MOCK_PERFORMANCE_DATA.annualQuota,
          ytd: Number(realData.totalWon) || 0,
          percentage: Number(realData.pacing) || 0
        }
      };

      setData(performanceData);

      // Si es manager, obtenemos la lista de usuarios para el dropdown y la tabla de equipo
      if (userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SALES_MANAGER' || userRole === 'TENANT_ADMIN') {
        const quotasResponse = await api.get<any>(`/quotas?year=${year}`);
        if (quotasResponse.users) {
          const members: TeamMember[] = quotasResponse.users.map((u: any) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            quota: 58000, // En producción vendría de la DB
            achieved: 0,
            percentage: 0,
            activitiesPercentage: 0,
            trend: 'stable',
            pipeline: 0
          }));
          setTeamData(members);
        } else {
          setTeamData(MOCK_TEAM_DATA);
        }
      }
    } catch (e) {
      console.error(e);
      setData(MOCK_PERFORMANCE_DATA);
      if (userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SALES_MANAGER' || userRole === 'TENANT_ADMIN') {
        setTeamData(MOCK_TEAM_DATA);
      }
    }

    setLoading(false);
  }, [userRole, selectedUserId, selectedPeriod]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const refreshData = () => {
    fetchPerformanceData();
  };

  const getQuotaColor = (percentage: number): string => {
    if (percentage >= 100) return '#059669'; // Verde oscuro - meta alcanzada
    if (percentage >= 91) return '#10B981'; // Verde claro - cerca
    if (percentage >= 71) return '#F59E0B'; // Amarillo - en progreso
    if (percentage >= 41) return '#F97316'; // Naranja - en riesgo
    return '#EF4444'; // Rojo - crítico
  };

  const getQuotaLabel = (percentage: number): string => {
    if (percentage >= 100) return 'Meta alcanzada 🎉';
    if (percentage >= 91) return 'Cerca de la meta';
    if (percentage >= 71) return 'En progreso';
    if (percentage >= 41) return 'En riesgo';
    return 'Crítico - atención';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  };

  return {
    data,
    teamData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    selectedUserId,
    setSelectedUserId,
    refreshData,
    getQuotaColor,
    getQuotaLabel,
    getTrendIcon,
    isManager: userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SALES_MANAGER' || userRole === 'TENANT_ADMIN'
  };
}

export default usePerformance;
