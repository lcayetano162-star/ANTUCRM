// ============================================
// ANTU CRM - Customers with AI Hook
// Gestión de clientes con inteligencia artificial predictiva
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type {
  Customer,
  CustomerFilter,
  CustomerStats,
  ProductRecommendation,
  CopilotMessage,
  CopilotContext,
  CustomerEnrichmentResult,
} from '@/types/customer';
import { getCopilotResponse } from '@/lib/ai';

// ============================================
// MOCK DATA - Clientes de ejemplo con IA
// ============================================

const generateMockCustomers = (): Customer[] => {
  const now = new Date();

  return [
    {
      id: '1',
      name: 'Corporación Dominicana de Impresión',
      legalName: 'CORDOMIMP SRL',
      rnc: '101-12345-6',
      type: 'COMPANY',
      status: 'ACTIVE',
      email: 'contacto@cordomimp.com.do',
      phone: '+1 (809) 555-0101',
      website: 'www.cordomimp.com.do',
      address: 'Av. Winston Churchill #456, Piantini',
      city: 'Santo Domingo',
      country: 'República Dominicana',
      industry: 'Tecnología',
      size: 'MEDIUM',
      employeeCount: 85,
      annualRevenue: 45000000,

      // AI Data
      healthScore: {
        overall: 87,
        financial: 95,
        engagement: 82,
        relational: 85,
        lastUpdated: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        nextUpdate: new Date(now.getTime() + 22 * 60 * 60 * 1000),
      },
      healthScoreDetails: [
        {
          category: 'financial',
          score: 95,
          weight: 0.35,
          factors: [
            { name: 'Pagos puntuales', score: 100, description: '100% de pagos a tiempo' },
            { name: 'Volumen creciente', score: 90, description: '+15% vs año anterior' },
            { name: 'Días promedio de pago', score: 95, description: '28 días (vs 30 permitidos)' },
          ],
        },
        {
          category: 'engagement',
          score: 82,
          weight: 0.35,
          factors: [
            { name: 'Frecuencia de interacciones', score: 75, description: '3.2 interacciones/mes' },
            { name: 'Tasa de respuesta', score: 85, description: '85% de emails respondidos' },
            { name: 'Uso de portal', score: 80, description: 'Login 2x por semana' },
          ],
        },
        {
          category: 'relational',
          score: 85,
          weight: 0.30,
          factors: [
            { name: 'Antigüedad', score: 90, description: '3 años de relación' },
            { name: 'Satisfacción NPS', score: 80, description: '8/10 en última encuesta' },
            { name: 'Contactos múltiples', score: 85, description: '3 contactos activos' },
          ],
        },
      ],
      aiInsights: [
        {
          id: '1',
          type: 'BUYING_MOMENT',
          title: 'Momento de compra detectado',
          description: 'Cliente está en ciclo de renovación. Probabilidad de 78% de compra esta semana.',
          probability: 78,
          confidence: 92,
          actionable: true,
          actionText: 'Crear oportunidad',
          actionUrl: '/opportunities/new?customer=1',
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        },
        {
          id: '2',
          type: 'RISK',
          title: 'Competencia activa detectada',
          description: 'El cliente recibió cotización de Xerox hace 5 días según datos públicos.',
          confidence: 75,
          actionable: true,
          actionText: 'Ver estrategia recomendada',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      ],
      productRecommendations: [
        {
          id: '1',
          productCode: 'HP-M608',
          productName: 'HP LaserJet Enterprise M608dn',
          matchScore: 94,
          reason: 'Empresas del mismo tamaño en sector financiero suelen necesitar alta velocidad B/N',
          potentialValue: 125000,
          currency: 'DOP',
          similarCustomers: ['Banco Popular', 'BHD León'],
        },
        {
          id: '2',
          productName: 'Solución de Gestión Documental',
          productCode: 'DOC-MGMT-PRO',
          matchScore: 87,
          reason: 'Detectado crecimiento en personal administrativo (+15% vs año pasado)',
          potentialValue: 180000,
          currency: 'DOP',
          similarCustomers: ['Claro RD', 'Altice'],
        },
      ],
      churnPrediction: {
        riskLevel: 'LOW',
        probability: 12,
        factors: [
          { factor: 'Relación de 3+ años', impact: 'POSITIVE', weight: 0.25 },
          { factor: 'Múltiples contactos', impact: 'POSITIVE', weight: 0.20 },
          { factor: 'Satisfacción NPS alta', impact: 'POSITIVE', weight: 0.30 },
        ],
        protectiveFactors: [
          'Relación de 3+ años',
          'Múltiples contactos en la cuenta (3)',
          'Satisfacción NPS: 8/10',
        ],
        riskFactors: [],
        recommendedActions: ['Mantener contacto regular', 'Ofrecer novedades'],
        lastUpdated: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      hiddenOpportunities: [
        {
          id: '1',
          type: 'CROSS_SELL',
          title: 'Cross-sell: Equipos Color',
          description: 'El cliente compra solo impresoras B/N, pero según análisis de su industria y tamaño, debería tener 30% de equipos color.',
          potentialValue: 180000,
          currency: 'DOP',
          probability: 72,
          reasoning: 'Empresas financieras de similar tamaño promedian 30% de equipos color',
          suggestedApproach: 'Presentar estudio de ROI de impresión color para documentos ejecutivos',
          detectedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          type: 'UP_SELL',
          title: 'Up-sell: Plan Enterprise',
          description: 'Volumen de impresión creció 40% en 6 meses. Recomendación: Migrar a plan enterprise con costo por copia reducido.',
          potentialValue: 60000,
          currency: 'DOP',
          probability: 65,
          reasoning: 'Crecimiento de volumen indica necesidad de plan más flexible',
          suggestedApproach: 'Mostrar ahorro proyectado con nuevo plan',
          detectedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        },
      ],

      // Financial
      creditLine: 0,
      creditLineCurrency: 'DOP',
      creditLineStatus: 'NONE',
      paymentBehavior: 'EXCELLENT',
      averagePaymentDays: 28,
      totalPurchases: 2450000,

      // Relationships
      assignedTo: 'user1',
      assignedToName: 'Juan Pérez',
      contacts: [
        {
          id: 'c1',
          customerId: '1',
          firstName: 'María',
          lastName: 'González',
          email: 'm.gonzalez@cordomimp.com.do',
          phone: '+1 (809) 555-0102',
          position: 'Directora de Operaciones',
          isPrimary: true,
          isDecisionMaker: true,
          createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'c2',
          customerId: '1',
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          email: 'c.rodriguez@cordomimp.com.do',
          phone: '+1 (809) 555-0103',
          position: 'Gerente de TI',
          isPrimary: false,
          isDecisionMaker: false,
          createdAt: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000),
        },
      ],

      // Communication
      lastContactDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      communicationHistory: [
        {
          id: 'comm1',
          type: 'CALL',
          direction: 'OUTBOUND',
          title: 'Llamada de seguimiento',
          duration: 15,
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          sentiment: {
            overall: 'POSITIVE',
            score: 85,
            intent: 'Compra',
            keywords: ['urgente', 'renovación', 'mejorar eficiencia'],
            nextSteps: ['Enviar propuesta formal antes del viernes'],
            analyzedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          },
          aiSummary: 'Cliente mostró alto interés en renovación. Mencionó presupuesto aprobado y urgencia por cierre de mes.',
          aiInsights: ['Mencionó competencia activa', 'Presupuesto aprobado', 'Timeline: 2 semanas'],
        },
        {
          id: 'comm2',
          type: 'EMAIL',
          direction: 'OUTBOUND',
          title: 'Cotización #2024-001',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          aiSummary: 'Email enviado con cotización. Cliente abrió 3 veces, mostró alto interés.',
          aiInsights: ['Abierto 3 veces', 'Tiempo de lectura: 4m 30s', 'Links clickeados: Precios'],
        },
      ],

      createdAt: new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      tags: ['VIP', 'Renovación', 'Tecnología'],
    },
    {
      id: '2',
      name: 'Grupo Financiero del Caribe',
      legalName: 'GRUFICAR SA',
      rnc: '102-98765-4',
      type: 'COMPANY',
      status: 'ACTIVE',
      email: 'info@gruficar.com',
      phone: '+1 (809) 555-0201',
      address: 'Av. John F. Kennedy #789, Naco',
      city: 'Santo Domingo',
      country: 'República Dominicana',
      industry: 'Financiero',
      size: 'LARGE',
      employeeCount: 250,
      annualRevenue: 120000000,

      healthScore: {
        overall: 72,
        financial: 85,
        engagement: 65,
        relational: 68,
        lastUpdated: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        nextUpdate: new Date(now.getTime() + 19 * 60 * 60 * 1000),
      },
      aiInsights: [
        {
          id: '3',
          type: 'ALERT',
          title: 'Patrón inusual detectado',
          description: 'El cliente siempre paga el día 15, este mes aún no ha procesado el pago (día 18).',
          confidence: 65,
          actionable: true,
          actionText: 'Llamar ahora',
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        },
      ],
      productRecommendations: [],
      hiddenOpportunities: [],
      churnPrediction: {
        riskLevel: 'MEDIUM',
        probability: 35,
        factors: [
          { factor: 'Reducción en engagement', impact: 'NEGATIVE', weight: 0.40 },
          { factor: 'Retraso en pago', impact: 'NEGATIVE', weight: 0.30 },
        ],
        protectiveFactors: ['Buen historial de 2 años'],
        riskFactors: ['Retraso en último pago', 'Menos interacciones'],
        recommendedActions: ['Llamar de manera consultiva', 'Verificar satisfacción'],
        lastUpdated: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },

      assignedTo: 'user1',
      assignedToName: 'Juan Pérez',
      contacts: [],
      communicationHistory: [],
      createdAt: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      tags: ['Financiero', 'Atención'],
    },
    {
      id: '3',
      name: 'Constructora del Caribe',
      legalName: 'CONSCARIBE SRL',
      rnc: '103-45678-9',
      type: 'COMPANY',
      status: 'ACTIVE',
      email: 'proyectos@conscaribe.com.do',
      phone: '+1 (809) 555-0301',
      city: 'Santiago',
      country: 'República Dominicana',
      industry: 'Construcción',
      size: 'LARGE',
      employeeCount: 180,

      healthScore: {
        overall: 91,
        financial: 88,
        engagement: 95,
        relational: 90,
        lastUpdated: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        nextUpdate: new Date(now.getTime() + 23 * 60 * 60 * 1000),
      },
      aiInsights: [
        {
          id: '4',
          type: 'OPPORTUNITY',
          title: 'Nuevo proyecto detectado',
          description: 'Según noticias públicas, la constructora inició proyecto de $50M en Punta Cana.',
          probability: 85,
          confidence: 88,
          actionable: true,
          actionText: 'Preparar propuesta',
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        },
      ],
      productRecommendations: [
        {
          id: '3',
          productCode: 'MFP-C450',
          productName: 'Multifuncional Color A3 - 45ppm',
          matchScore: 89,
          reason: 'Grandes proyectos requieren impresión de planos en color',
          potentialValue: 285000,
          currency: 'DOP',
          similarCustomers: ['Constructora Bisonó', 'Grupo Estrella'],
        },
      ],
      hiddenOpportunities: [],

      assignedTo: 'user1',
      assignedToName: 'Juan Pérez',
      contacts: [],
      communicationHistory: [],
      createdAt: new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      tags: ['VIP', 'Construcción', 'Crecimiento'],
    },
  ];
};

// ============================================
// HOOK
// ============================================

interface UseCustomersWithAIReturn {
  customers: Customer[];
  stats: CustomerStats;
  loading: boolean;
  selectedCustomer: Customer | null;

  // Actions
  selectCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  enrichCustomer: (id: string) => Promise<CustomerEnrichmentResult>;

  // AI Actions
  generateHealthScore: (customerId: string) => void;
  refreshAIInsights: (customerId: string) => void;
  getProductRecommendations: (customerId: string) => ProductRecommendation[];
  predictChurn: (customerId: string) => void;
  detectOpportunities: (customerId: string) => void;

  // Copilot
  copilotMessages: CopilotMessage[];
  sendCopilotMessage: (message: string, context?: CopilotContext) => void;
  clearCopilot: () => void;

  // Filters
  filterCustomers: (filter: CustomerFilter) => Customer[];
  searchCustomers: (query: string) => Customer[];
  getCustomersByRisk: (risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => Customer[];
  getCustomersWithOpportunities: () => Customer[];
  getTopCustomersByHealth: (limit?: number) => Customer[];
}

export function useCustomersWithAI(): UseCustomersWithAIReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);

  // Initialize: try API first, fallback to localStorage/mock
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Backend contacts endpoint returns data we can map to customers
        const response = await api.get<any>('/contacts');
        const apiContacts = response.contacts || response || [];
        // Group contacts by company to build customer list
        const customerMap = new Map<string, Customer>();
        for (const c of apiContacts) {
          const companyId = c.company?.id || c.companyId;
          if (companyId && !customerMap.has(companyId)) {
            const mockData = generateMockCustomers();
            const template = mockData[0]; // Use as AI data template
            customerMap.set(companyId, {
              ...template,
              id: companyId,
              name: c.company?.name || 'Sin empresa',
              email: c.email || '',
              phone: c.phone || '',
              city: c.address?.city || 'República Dominicana',
              status: c.status === 'active' ? 'ACTIVE' : 'PROSPECT',
              createdAt: new Date(c.createdAt || Date.now()),
              updatedAt: new Date(c.updatedAt || Date.now()),
              contacts: [{
                id: c.id,
                firstName: c.fullName?.split(' ')[0] || '',
                lastName: c.fullName?.split(' ').slice(1).join(' ') || '',
                email: c.email || '',
                phone: c.phone || '',
                position: c.jobTitle || '',
                isPrimary: c.isMainContact || true,
                isDecisionMaker: false,
                customerId: companyId,
                createdAt: new Date(c.createdAt || Date.now()),
              }],
            });
          }
        }
        if (customerMap.size > 0) {
          setCustomers(Array.from(customerMap.values()));
        } else {
          // No data from API, use mock
          setCustomers(generateMockCustomers());
        }
      } catch (error: any) {
        console.warn('⚠️ Backend unreachable for customers, using local data:', error.message);
        const saved = localStorage.getItem('antu_customers');
        if (saved) {
          setCustomers(JSON.parse(saved));
        } else {
          const mockData = generateMockCustomers();
          setCustomers(mockData);
        }
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  // Save to localStorage as cache whenever customers change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('antu_customers', JSON.stringify(customers));
    }
  }, [customers, loading]);

  // Stats
  const stats = useMemo<CustomerStats>(() => {
    const active = customers.filter((c) => c.status === 'ACTIVE').length;
    const prospects = customers.filter((c) => c.status === 'PROSPECT').length;
    const churned = customers.filter((c) => c.status === 'CHURNED').length;

    const healthScores = customers
      .filter((c) => c.healthScore)
      .map((c) => c.healthScore!.overall);
    const avgHealthScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
      : 0;

    const highRiskCount = customers.filter(
      (c) => c.churnPrediction?.riskLevel === 'HIGH' || c.churnPrediction?.riskLevel === 'CRITICAL'
    ).length;

    const opportunitiesCount = customers.reduce(
      (sum, c) => sum + (c.hiddenOpportunities?.length || 0),
      0
    );

    const totalPipeline = customers.reduce((sum, c) => {
      const customerPipeline = (c.hiddenOpportunities || []).reduce((p, o) => p + o.potentialValue, 0);
      return sum + customerPipeline;
    }, 0);

    return {
      total: customers.length,
      active,
      prospects,
      churned,
      avgHealthScore,
      highRiskCount,
      opportunitiesCount,
      totalPipeline,
    };
  }, [customers]);

  // Actions
  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const customerId = Math.random().toString(36).substr(2, 9);

    // Asignar el ID correcto
    const generatedContacts = (customer.contacts || []).map(contact => ({
      ...contact,
      customerId: customerId
    }));

    const newCustomer: Customer = {
      ...customer,
      hiddenOpportunities: customer.hiddenOpportunities || [],
      productRecommendations: customer.productRecommendations || [],
      communicationHistory: customer.communicationHistory || [],
      contacts: generatedContacts,
      aiInsights: customer.aiInsights || [],
      id: customerId,
      createdAt: now,
      updatedAt: now,
    };

    // Try creating via backend API
    if (generatedContacts.length > 0) {
      const mainContact = generatedContacts[0];
      try {
        await api.post('/contacts', {
          firstName: mainContact.firstName || 'Contacto',
          lastName: mainContact.lastName || '',
          email: mainContact.email || customer.email || '',
          phone: mainContact.phone || customer.phone || '',
          jobTitle: mainContact.position || '',
          isMainContact: mainContact.isPrimary || true,
          tags: ['Nuevo Cliente'],
        });
      } catch (apiError: any) {
        console.warn('⚠️ Could not create contact in backend, saving locally:', apiError.message);
        // Fallback: sync with localStorage contacts
        try {
          const savedContactsStr = localStorage.getItem('antu_contacts');
          let savedContacts: any[] = [];
          if (savedContactsStr) {
            savedContacts = JSON.parse(savedContactsStr);
          }
          const newUIContact = {
            id: mainContact.id,
            firstName: mainContact.firstName || 'Contacto',
            lastName: mainContact.lastName || '',
            email: mainContact.email || customer.email || '',
            phone: mainContact.phone || customer.phone || '',
            company: { id: customerId, name: customer.name || '' },
            position: mainContact.position || 'Contacto',
            location: customer.city || 'República Dominicana',
            status: customer.status === 'ACTIVE' ? 'customer' : 'prospect',
            score: 85,
            isMainContact: mainContact.isPrimary,
            hasWhatsApp: !!mainContact.phone,
            lastActivity: { date: new Date().toISOString(), type: 'Creación', description: 'Contacto creado', daysAgo: 0 },
            pendingTasks: 0,
            opportunities: { count: 0, totalValue: 0 },
            tags: ['Nuevo Cliente'],
            assignedTo: 'Usuario Actual',
            createdAt: new Date().toISOString(),
          };
          savedContacts.unshift(newUIContact);
          localStorage.setItem('antu_contacts', JSON.stringify(savedContacts));
          window.dispatchEvent(new Event('storage'));
        } catch (error) {
          console.error('Error synchronizing contacts:', error);
        }
      }
    }

    setCustomers((prev) => [...prev, newCustomer]);
    toast.success('Cliente creado exitosamente');
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      )
    );
    toast.success('Cliente actualizado');
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    toast.success('Cliente eliminado');
  }, []);

  const enrichCustomer = useCallback(async (id: string): Promise<CustomerEnrichmentResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result: CustomerEnrichmentResult = {
      customerId: id,
      enrichedFields: [
        { source: 'DGII', field: 'legalName', value: 'CORPORACIÓN DOMINICANA DE IMPRESIÓN SRL', confidence: 95, verified: true },
        { source: 'LinkedIn', field: 'employeeCount', value: '85', confidence: 80, verified: false },
        { source: 'Web', field: 'website', value: 'www.cordomimp.com.do', confidence: 90, verified: true },
      ],
      suggestions: ['Enfoque en escalabilidad', 'Contactar a Director de Operaciones'],
      competitors: ['Xerox', 'Canon'],
      news: ['Amplian operaciones al Cibao'],
      similarCompanies: ['Claro RD', 'Altice'],
    };

    toast.success('Cliente enriquecido con datos de IA');
    return result;
  }, []);

  // AI Actions
  const generateHealthScore = useCallback((_customerId: string) => {
    toast.info('Generando Health Score con IA...');
    // Simulate AI calculation
    setTimeout(() => {
      toast.success('Health Score actualizado');
    }, 1000);
  }, []);

  const refreshAIInsights = useCallback((_customerId: string) => {
    toast.info('Analizando datos con IA...');
    setTimeout(() => {
      toast.success('Insights de IA actualizados');
    }, 1500);
  }, []);

  const getProductRecommendations = useCallback((customerId: string): ProductRecommendation[] => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.productRecommendations || [];
  }, [customers]);

  const predictChurn = useCallback((_customerId: string) => {
    toast.info('Analizando riesgo de pérdida...');
    setTimeout(() => {
      toast.success('Predicción de churn completada');
    }, 2000);
  }, []);

  const detectOpportunities = useCallback((_customerId: string) => {
    toast.info('Buscando oportunidades ocultas...');
    setTimeout(() => {
      toast.success('Oportunidades detectadas');
    }, 2000);
  }, []);

  // Copilot con integración real de Gemini
  const sendCopilotMessage = useCallback(async (message: string, context?: CopilotContext) => {
    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setCopilotMessages((prev) => [...prev, userMessage]);

    // Simulate thinking time and call real Gemini API
    try {
      const response = await getCopilotResponse(message, context);

      const aiResponse: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.error ? `⚠️ Error de Antü AI: ${response.error}` : response.text,
        timestamp: new Date(),
        suggestions: response.error ? ['Reintentar', 'Configurar API Key'] : ['Redactar email', 'Preparar llamada', 'Ver historial'],
        actions: response.error ? [] : [
          { label: 'Crear actividad', action: 'create_activity' },
          { label: 'Ver oportunidades', action: 'view_opportunities' },
        ],
      };

      setCopilotMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in sendCopilotMessage:', error);
      const errorResponse: CopilotMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Hubo un problema de conexión con Antü AI. Por favor verifica tu conexión y la API Key en el Super Admin.',
        timestamp: new Date(),
      };
      setCopilotMessages((prev) => [...prev, errorResponse]);
    }
  }, []);

  const clearCopilot = useCallback(() => {
    setCopilotMessages([]);
  }, []);

  // Filters
  const filterCustomers = useCallback((filter: CustomerFilter) => {
    return customers.filter((customer) => {
      if (filter.status && !filter.status.includes(customer.status)) return false;
      if (filter.type && !filter.type.includes(customer.type)) return false;
      if (filter.size && customer.size && !filter.size.includes(customer.size)) return false;
      if (filter.industry && customer.industry && !filter.industry.includes(customer.industry)) return false;
      if (filter.assignedTo && customer.assignedTo !== filter.assignedTo) return false;
      if (filter.country && customer.country !== filter.country) return false;
      if (filter.healthScoreMin && customer.healthScore && customer.healthScore.overall < filter.healthScoreMin) return false;
      if (filter.healthScoreMax && customer.healthScore && customer.healthScore.overall > filter.healthScoreMax) return false;
      if (filter.churnRisk && customer.churnPrediction?.riskLevel !== filter.churnRisk) return false;
      if (filter.hasOpportunities && customer.hiddenOpportunities.length === 0) return false;
      return true;
    });
  }, [customers]);

  const searchCustomers = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.legalName?.toLowerCase().includes(lowerQuery) ||
        c.rnc?.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        c.industry?.toLowerCase().includes(lowerQuery)
    );
  }, [customers]);

  const getCustomersByRisk = useCallback((risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    return customers.filter((c) => c.churnPrediction?.riskLevel === risk);
  }, [customers]);

  const getCustomersWithOpportunities = useCallback(() => {
    return customers.filter((c) => c.hiddenOpportunities.length > 0);
  }, [customers]);

  const getTopCustomersByHealth = useCallback((limit = 10) => {
    return customers
      .filter((c) => c.healthScore)
      .sort((a, b) => (b.healthScore?.overall || 0) - (a.healthScore?.overall || 0))
      .slice(0, limit);
  }, [customers]);

  return {
    customers,
    stats,
    loading,
    selectedCustomer,
    selectCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    enrichCustomer,
    generateHealthScore,
    refreshAIInsights,
    getProductRecommendations,
    predictChurn,
    detectOpportunities,
    copilotMessages,
    sendCopilotMessage,
    clearCopilot,
    filterCustomers,
    searchCustomers,
    getCustomersByRisk,
    getCustomersWithOpportunities,
    getTopCustomersByHealth,
  };
}

export default useCustomersWithAI;
