// ============================================
// ANTU CRM - Quota Configuration Hook
// Hook para manejar configuración de cuotas
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  QuotaConfig,
  CompanyGoal,
  TeamQuota,
  SellerQuota,
  SpecialPeriod,
  QuotaValidation,
  QuotaChangeLog,
} from '@/types/quota';

// Datos mock para desarrollo
const MOCK_QUOTA_CONFIG: QuotaConfig = {
  fiscalYear: {
    type: 'CUSTOM',
    startMonth: 4,
    startDay: 1,
    endMonth: 3,
    endDay: 31,
    year: 2026,
    label: 'Abril 2025 - Marzo 2026',
  },
  companyGoal: {
    totalRevenue: 10000000,
    currency: 'USD',
    revenueTypes: [
      { id: '1', name: 'Ventas Nuevas', percentage: 60, amount: 6000000 },
      { id: '2', name: 'Renovaciones', percentage: 30, amount: 3000000 },
      { id: '3', name: 'Upsell/Cross-sell', percentage: 10, amount: 1000000 },
    ],
    regions: [
      { id: '1', name: 'República Dominicana', percentage: 50, amount: 5000000 },
      { id: '2', name: 'México', percentage: 30, amount: 3000000 },
      { id: '3', name: 'Colombia', percentage: 20, amount: 2000000 },
    ],
    activityBenchmarks: {
      callsPerMonth: 150,
      meetingsPerMonth: 20,
      opportunitiesPerMonth: 10,
      conversionRateTarget: 25,
    },
  },
  teams: [
    {
      id: 'team-a',
      name: 'Equipo A',
      territory: 'Norte',
      percentageOfTotal: 40,
      annualQuota: 4000000,
      monthlyQuota: 333333,
      managerName: 'Eduardo Sanchez',
      members: ['1', '2', '3', '4'],
    },
    {
      id: 'team-b',
      name: 'Equipo B',
      territory: 'Sur',
      percentageOfTotal: 35,
      annualQuota: 3500000,
      monthlyQuota: 291667,
      managerName: 'Marlin Ramos',
      members: ['5', '6', '7'],
    },
    {
      id: 'team-c',
      name: 'Equipo C',
      territory: 'Este',
      percentageOfTotal: 25,
      annualQuota: 2500000,
      monthlyQuota: 208333,
      managerName: 'Ricardo Alarcon',
      members: ['8', '9'],
    },
  ],
  sellers: [
    {
      id: '1',
      name: 'María G.',
      email: 'maria@antu.com',
      teamId: 'team-a',
      level: 'SENIOR',
      percentageOfTeam: 30,
      annualQuota: 1200000,
      monthlyQuota: 100000,
      managerName: 'Eduardo Sanchez',
    },
    {
      id: '2',
      name: 'Carlos R.',
      email: 'carlos@antu.com',
      teamId: 'team-a',
      level: 'SENIOR',
      percentageOfTeam: 25,
      annualQuota: 1000000,
      monthlyQuota: 83333,
      managerName: 'Eduardo Sanchez',
    },
    {
      id: '3',
      name: 'Juan P.',
      email: 'juan@antu.com',
      teamId: 'team-a',
      level: 'MID',
      percentageOfTeam: 25,
      annualQuota: 1000000,
      monthlyQuota: 83333,
      managerName: 'Eduardo Sanchez',
    },
    {
      id: '4',
      name: 'Ana M.',
      email: 'ana@antu.com',
      teamId: 'team-a',
      level: 'JUNIOR',
      percentageOfTeam: 20,
      annualQuota: 800000,
      monthlyQuota: 66667,
      managerName: 'Eduardo Sanchez',
    },
    {
      id: '5',
      name: 'Pedro S.',
      email: 'pedro@antu.com',
      teamId: 'team-b',
      level: 'MID',
      percentageOfTeam: 35,
      annualQuota: 1225000,
      monthlyQuota: 102083,
      managerName: 'Marlin Ramos',
    },
    {
      id: '6',
      name: 'Luisa T.',
      email: 'luisa@antu.com',
      teamId: 'team-b',
      level: 'JUNIOR',
      percentageOfTeam: 30,
      annualQuota: 1050000,
      monthlyQuota: 87500,
      managerName: 'Marlin Ramos',
    },
    {
      id: '7',
      name: 'Roberto M.',
      email: 'roberto@antu.com',
      teamId: 'team-b',
      level: 'MID',
      percentageOfTeam: 35,
      annualQuota: 1225000,
      monthlyQuota: 102083,
      managerName: 'Marlin Ramos',
    },
    {
      id: '8',
      name: 'Diana K.',
      email: 'diana@antu.com',
      teamId: 'team-c',
      level: 'SENIOR',
      percentageOfTeam: 55,
      annualQuota: 1375000,
      monthlyQuota: 114583,
      managerName: 'Ricardo Alarcon',
    },
    {
      id: '9',
      name: 'Fernando L.',
      email: 'fernando@antu.com',
      teamId: 'team-c',
      level: 'MID',
      percentageOfTeam: 45,
      annualQuota: 1125000,
      monthlyQuota: 93750,
      managerName: 'Ricardo Alarcon',
    },
  ],
  monthlyDistribution: [
    { month: 4, monthName: 'Abr', percentageOfYear: 6, teamAmounts: { 'team-a': 240000, 'team-b': 210000, 'team-c': 150000 } },
    { month: 5, monthName: 'May', percentageOfYear: 7, teamAmounts: { 'team-a': 280000, 'team-b': 245000, 'team-c': 175000 } },
    { month: 6, monthName: 'Jun', percentageOfYear: 8, teamAmounts: { 'team-a': 320000, 'team-b': 280000, 'team-c': 200000 } },
    { month: 7, monthName: 'Jul', percentageOfYear: 9, teamAmounts: { 'team-a': 360000, 'team-b': 315000, 'team-c': 225000 } },
    { month: 8, monthName: 'Ago', percentageOfYear: 8, teamAmounts: { 'team-a': 320000, 'team-b': 280000, 'team-c': 200000 } },
    { month: 9, monthName: 'Sep', percentageOfYear: 9, teamAmounts: { 'team-a': 360000, 'team-b': 315000, 'team-c': 225000 } },
    { month: 10, monthName: 'Oct', percentageOfYear: 10, teamAmounts: { 'team-a': 400000, 'team-b': 350000, 'team-c': 250000 } },
    { month: 11, monthName: 'Nov', percentageOfYear: 10, teamAmounts: { 'team-a': 400000, 'team-b': 350000, 'team-c': 250000 } },
    { month: 12, monthName: 'Dic', percentageOfYear: 11, teamAmounts: { 'team-a': 440000, 'team-b': 385000, 'team-c': 275000 } },
    { month: 1, monthName: 'Ene', percentageOfYear: 10, teamAmounts: { 'team-a': 400000, 'team-b': 350000, 'team-c': 250000 } },
    { month: 2, monthName: 'Feb', percentageOfYear: 6, teamAmounts: { 'team-a': 240000, 'team-b': 210000, 'team-c': 150000 } },
    { month: 3, monthName: 'Mar', percentageOfYear: 6, teamAmounts: { 'team-a': 240000, 'team-b': 210000, 'team-c': 150000 } },
  ],
  specialPeriods: [
    {
      id: '1',
      name: 'Q1 Push',
      startMonth: 4,
      endMonth: 6,
      objective: '110% de cuota',
      reward: 'Bono $500',
      targetPercentage: 110,
    },
    {
      id: '2',
      name: 'Verano',
      startMonth: 7,
      endMonth: 8,
      objective: '50 deals cerrados',
      reward: 'Día libre extra',
    },
    {
      id: '3',
      name: 'Cierre de Año',
      startMonth: 11,
      endMonth: 12,
      objective: '$2M adicionales',
      reward: 'Viaje del equipo',
    },
  ],
  activityMetrics: [
    { id: '1', name: 'Llamadas/mes', key: 'callsPerMonth', levels: { JUNIOR: 100, MID: 120, SENIOR: 150, ELITE: 180 } },
    { id: '2', name: 'Reuniones/mes', key: 'meetingsPerMonth', levels: { JUNIOR: 12, MID: 16, SENIOR: 20, ELITE: 25 } },
    { id: '3', name: 'Propuestas/mes', key: 'proposalsPerMonth', levels: { JUNIOR: 5, MID: 8, SENIOR: 10, ELITE: 15 } },
    { id: '4', name: 'Nuevos clientes/mes', key: 'newCustomersPerMonth', levels: { JUNIOR: 8, MID: 10, SENIOR: 12, ELITE: 15 } },
    { id: '5', name: 'Tasa de cierre', key: 'conversionRate', levels: { JUNIOR: 15, MID: 20, SENIOR: 25, ELITE: 30 } },
    { id: '6', name: 'Ticket promedio', key: 'avgTicket', levels: { JUNIOR: 30000, MID: 50000, SENIOR: 75000, ELITE: 100000 } },
  ],
  isPublished: false,
};

const MOCK_CHANGE_LOG: QuotaChangeLog[] = [
  {
    id: '1',
    timestamp: new Date('2025-03-15T10:30:00'),
    userId: 'admin1',
    userName: 'Admin Usuario',
    action: 'CREATE',
    entityType: 'COMPANY',
    entityId: 'company',
    changes: { totalRevenue: { old: 0, new: 10000000 } },
  },
  {
    id: '2',
    timestamp: new Date('2025-03-15T11:00:00'),
    userId: 'admin1',
    userName: 'Admin Usuario',
    action: 'CREATE',
    entityType: 'TEAM',
    entityId: 'team-a',
    changes: { annualQuota: { old: 0, new: 4000000 } },
  },
];

export function useQuotaConfig() {
  const [config, setConfig] = useState<QuotaConfig>(MOCK_QUOTA_CONFIG);
  const [changeLog] = useState<QuotaChangeLog[]>(MOCK_CHANGE_LOG);
  const [hasChanges, setHasChanges] = useState(false);

  // Validaciones
  const validation = useMemo<QuotaValidation>(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar suma de equipos
    const teamsTotal = config.teams.reduce((sum, t) => sum + t.annualQuota, 0);
    if (teamsTotal !== config.companyGoal.totalRevenue) {
      errors.push(`La suma de cuotas de equipos ($${teamsTotal.toLocaleString()}) no coincide con la meta empresarial ($${config.companyGoal.totalRevenue.toLocaleString()})`);
    }

    // Validar suma de vendedores por equipo
    config.teams.forEach((team) => {
      const teamSellers = config.sellers.filter((s) => s.teamId === team.id);
      const sellersTotal = teamSellers.reduce((sum, s) => sum + s.annualQuota, 0);
      if (sellersTotal !== team.annualQuota) {
        errors.push(`Equipo ${team.name}: La suma de vendedores ($${sellersTotal.toLocaleString()}) no coincide con la cuota del equipo ($${team.annualQuota.toLocaleString()})`);
      }
    });

    // Validar porcentajes de revenue
    const revenueTotal = config.companyGoal.revenueTypes.reduce((sum, r) => sum + r.percentage, 0);
    if (revenueTotal !== 100) {
      errors.push(`La suma de porcentajes de tipos de ingreso debe ser 100% (actual: ${revenueTotal}%)`);
    }

    // Advertencias
    const highQuotaSellers = config.sellers.filter((s) => s.annualQuota > 1500000);
    if (highQuotaSellers.length > 0) {
      warnings.push(`${highQuotaSellers.length} vendedor(es) tienen cuotas mayores a $1.5M. Verificar que sean alcanzables.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalAssigned: teamsTotal,
      totalExpected: config.companyGoal.totalRevenue,
      difference: teamsTotal - config.companyGoal.totalRevenue,
    };
  }, [config]);

  // Actualizar meta empresarial
  const updateCompanyGoal = useCallback((updates: Partial<CompanyGoal>) => {
    setConfig((prev) => ({
      ...prev,
      companyGoal: { ...prev.companyGoal, ...updates },
    }));
    setHasChanges(true);
  }, []);

  // Actualizar tipo de ingreso
  const updateRevenueType = useCallback((id: string, percentage: number) => {
    setConfig((prev) => ({
      ...prev,
      companyGoal: {
        ...prev.companyGoal,
        revenueTypes: prev.companyGoal.revenueTypes.map((rt) =>
          rt.id === id
            ? {
              ...rt,
              percentage,
              amount: Math.round((prev.companyGoal.totalRevenue * percentage) / 100),
            }
            : rt
        ),
      },
    }));
    setHasChanges(true);
  }, []);

  // Actualizar equipo
  const updateTeam = useCallback((id: string, updates: Partial<TeamQuota>) => {
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === id
          ? {
            ...t,
            ...updates,
            monthlyQuota: updates.annualQuota ? Math.round(updates.annualQuota / 12) : t.monthlyQuota,
          }
          : t
      ),
    }));
    setHasChanges(true);
  }, []);

  // Actualizar vendedor
  const updateSeller = useCallback((id: string, updates: Partial<SellerQuota>) => {
    setConfig((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === id
          ? {
            ...s,
            ...updates,
            monthlyQuota: updates.annualQuota ? Math.round(updates.annualQuota / 12) : s.monthlyQuota,
          }
          : s
      ),
    }));
    setHasChanges(true);
  }, []);

  // Agregar equipo
  const addTeam = useCallback((team: Omit<TeamQuota, 'id' | 'monthlyQuota'>) => {
    const newTeam: TeamQuota = {
      ...team,
      id: `team-${Date.now()}`,
      monthlyQuota: Math.round(team.annualQuota / 12),
    };
    setConfig((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));
    setHasChanges(true);
    toast.success('Equipo agregado exitosamente');
  }, []);

  // Eliminar equipo
  const removeTeam = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== id),
      sellers: prev.sellers.filter((s) => s.teamId !== id),
    }));
    setHasChanges(true);
    toast.success('Equipo eliminado');
  }, []);

  // Agregar vendedor
  const addSeller = useCallback((seller: Omit<SellerQuota, 'id' | 'monthlyQuota'>) => {
    const newSeller: SellerQuota = {
      ...seller,
      id: `seller-${Date.now()}`,
      monthlyQuota: Math.round(seller.annualQuota / 12),
    };
    setConfig((prev) => ({
      ...prev,
      sellers: [...prev.sellers, newSeller],
    }));
    setHasChanges(true);
    toast.success('Vendedor agregado exitosamente');
  }, []);

  // Eliminar vendedor
  const removeSeller = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      sellers: prev.sellers.filter((s) => s.id !== id),
    }));
    setHasChanges(true);
    toast.success('Vendedor eliminado');
  }, []);

  // Agregar período especial
  const addSpecialPeriod = useCallback((period: Omit<SpecialPeriod, 'id'>) => {
    const newPeriod: SpecialPeriod = {
      ...period,
      id: `period-${Date.now()}`,
    };
    setConfig((prev) => ({
      ...prev,
      specialPeriods: [...prev.specialPeriods, newPeriod],
    }));
    setHasChanges(true);
  }, []);

  // Eliminar período especial
  const removeSpecialPeriod = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      specialPeriods: prev.specialPeriods.filter((p) => p.id !== id),
    }));
    setHasChanges(true);
  }, []);

  // Publicar cuotas
  const publishQuotas = useCallback(() => {
    if (!validation.isValid) {
      toast.error('No se pueden publicar cuotas con errores de validación');
      return false;
    }

    setConfig((prev) => ({
      ...prev,
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: 'Admin Usuario',
    }));
    setHasChanges(false);
    toast.success('Cuotas publicadas exitosamente');
    return true;
  }, [validation.isValid]);

  // Guardar borrador
  const saveDraft = useCallback(() => {
    // Simular guardado
    setHasChanges(false);
    toast.success('Borrador guardado');
  }, []);

  // Resetear cambios
  const resetChanges = useCallback(() => {
    setConfig(MOCK_QUOTA_CONFIG);
    setHasChanges(false);
    toast.info('Cambios descartados');
  }, []);

  // Calcular cuota mensual para un vendedor
  const getSellerMonthlyQuota = useCallback((sellerId: string, month: number) => {
    const seller = config.sellers.find((s) => s.id === sellerId);
    if (!seller) return 0;

    const monthDist = config.monthlyDistribution.find((m) => m.month === month);
    if (!monthDist) return seller.monthlyQuota;

    const team = config.teams.find((t) => t.id === seller.teamId);
    if (!team) return seller.monthlyQuota;

    const teamMonthlyAmount = monthDist.teamAmounts[team.id] || team.monthlyQuota;
    return Math.round((teamMonthlyAmount * seller.percentageOfTeam) / 100);
  }, [config]);

  return {
    config,
    changeLog,
    hasChanges,
    validation,
    updateCompanyGoal,
    updateRevenueType,
    updateTeam,
    updateSeller,
    addTeam,
    removeTeam,
    addSeller,
    removeSeller,
    addSpecialPeriod,
    removeSpecialPeriod,
    publishQuotas,
    saveDraft,
    resetChanges,
    getSellerMonthlyQuota,
  };
}

export default useQuotaConfig;
