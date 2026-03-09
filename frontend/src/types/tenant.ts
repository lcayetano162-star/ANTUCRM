// ============================================
// ANTU CRM - Sistema Multi-Tenant
// Tipos para personalización de branding
// ============================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

export type LoginBackgroundType = 'gradient' | 'solid' | 'image';

export interface LoginFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LoginConfig {
  title: string;
  subtitle: string;
  showDemoCredentials: boolean;
  customMessage?: string;
  features: LoginFeature[];
}

export interface LoginBackground {
  type: LoginBackgroundType;
  value: string;
  overlay?: string;
}

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  loginBackground: LoginBackground;
}

export interface BrandingLogo {
  light: string;
  dark: string;
  favicon: string;
}

export interface BrandingConfig {
  logo: BrandingLogo;
  colors: BrandingColors;
  login: LoginConfig;
}

export interface TenantFeatures {
  modules: string[];
  enableForecast: boolean;
  enableAI: boolean;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number;
  maxOpportunities: number;
}

export type Currency = 'DOP' | 'USD' | 'EUR';

export type BillingStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'UNPAID' | 'SUSPENDED';

export interface TenantSubscription {
  planId: string;
  planName: string;
  status: BillingStatus;
  nextBillingDate: Date;
  gracePeriodEndsAt?: Date;
  lastPaymentDate?: Date;
  autoRenew: boolean;
}

export interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
  extension?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  isActive: boolean;
  // MONEDA INMUTABLE: Solo se configura al crear el tenant por Super Admin
  // NUNCA se actualiza por API de tenant - cambio requiere soporte manual
  currency: Currency;
  timezone: string;
  businessId?: string;
  phone?: string;
  address?: string;
  website?: string;
  primaryContact?: ContactPerson;
  collectionsContact?: ContactPerson;
  branding: BrandingConfig;
  features: TenantFeatures;
  limits: TenantLimits;
  subscription?: TenantSubscription;
  createdAt: Date;
  updatedAt: Date;
}

// Configuración por defecto de ANTU
export const DEFAULT_TENANT: Tenant = {
  id: 'antu_default',
  name: 'Antü CRM',
  subdomain: 'app',
  isActive: true,
  // MONEDA INMUTABLE: Configurada por Super Admin al crear tenant
  currency: 'DOP',
  timezone: 'America/Santo_Domingo',
  businessId: '132-45678-9',
  phone: '+1 (809) 555-0123',
  address: 'Av. Winston Churchill #123, Santo Domingo, RD',
  website: 'https://antucrm.com',
  primaryContact: {
    name: 'Soporte Antü',
    email: 'soporte@antu.com',
    phone: '+1 (809) 555-0124',
  },
  collectionsContact: {
    name: 'Cobros Antü',
    email: 'cobros@antu.com',
  },
  branding: {
    logo: {
      light: '/logo.png',
      dark: '/logo.png',
      favicon: '/favicon.ico',
    },
    colors: {
      primary: '#5ED9CF', // Turquoise
      secondary: '#0EA5E9', // Sky blue
      accent: '#F59E0B', // Amber
      loginBackground: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #5ED9CF 0%, #0EA5E9 100%)',
      },
    },
    login: {
      title: 'Bienvenido de vuelta',
      subtitle: 'Ingresa tus credenciales para acceder al CRM',
      showDemoCredentials: true,
      customMessage: '© 2024 Antü CRM - Todos los derechos reservados',
      features: [
        {
          icon: 'BarChart3',
          title: 'Pipeline de Ventas',
          description: 'Seguimiento de oportunidades',
        },
        {
          icon: 'Users',
          title: 'Gestión de Clientes',
          description: 'Base de datos completa',
        },
        {
          icon: 'ClipboardList',
          title: 'Tareas y Actividades',
          description: 'Organiza tu día a día',
        },
      ],
    },
  },
  features: {
    modules: [
      'dashboard',
      'vendedores',
      'performance',
      'clients',
      'contacts',
      'opportunities',
      'general-quotes',
      'quotes-mfp',
      'inventory',
      'billing',
      'cxc',
      'marketing',
      'activities',
      'reports',
      'settings',
      'users'
    ],
    enableForecast: true,
    enableAI: true,
  },
  limits: {
    maxUsers: 100,
    maxStorage: 10000,
    maxOpportunities: 10000,
  },
  subscription: {
    planId: 'PLAN-ENT',
    planName: 'Enterprise',
    status: 'ACTIVE',
    nextBillingDate: new Date(2026, 2, 15),
    autoRenew: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Ejemplo de tenant personalizado
export const EXAMPLE_TENANT_SOLGRAF: Tenant = {
  id: 'solgraf_001',
  name: 'Soluciones Gráficas SRL',
  subdomain: 'solgraf',
  isActive: true,
  // MONEDA INMUTABLE: Configurada por Super Admin al crear tenant
  currency: 'DOP',
  timezone: 'America/Santo_Domingo',
  branding: {
    logo: {
      light: 'https://via.placeholder.com/200x60/DC2626/FFFFFF?text=SolGraf',
      dark: 'https://via.placeholder.com/200x60/DC2626/FFFFFF?text=SolGraf',
      favicon: '/favicon.ico',
    },
    colors: {
      primary: '#5ED9CF', // Turquoise corporativo
      secondary: '#4BC9BF',
      accent: '#F59E0B',
      loginBackground: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #5ED9CF 0%, #4BC9BF 100%)',
      },
    },
    login: {
      title: 'Bienvenido a Soluciones Gráficas',
      subtitle: 'Gestiona tus cotizaciones y clientes',
      showDemoCredentials: false,
      customMessage: '¿Necesitas ayuda? Contacta a soporte: soporte@solgraficas.com',
      features: [
        {
          icon: 'Printer',
          title: 'Cotización de Impresos',
          description: 'Presupuestos instantáneos',
        },
        {
          icon: 'Users',
          title: 'Gestión de Clientes',
          description: 'Base de datos completa',
        },
        {
          icon: 'BarChart3',
          title: 'Pipeline de Ventas',
          description: 'Seguimiento de oportunidades',
        },
      ],
    },
  },
  features: {
    modules: ['dashboard', 'contacts', 'opportunities', 'general-quotes', 'inventory', 'billing', 'cxc', 'activities', 'reports', 'settings', 'users'],
    enableForecast: true,
    enableAI: false,
  },
  limits: {
    maxUsers: 10,
    maxStorage: 1000,
    maxOpportunities: 500,
  },
  subscription: {
    planId: 'PLAN-GEN',
    planName: 'General',
    status: 'ACTIVE',
    nextBillingDate: new Date(2026, 3, 1),
    autoRenew: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// TIPOS PARA SISTEMA DE NAVEGACIÓN
// ============================================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  badgeColor?: string;
  children?: NavItem[];
}

// ============================================
// TIPOS PARA HEALTH STATUS INDICATOR
// ============================================

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  contactId?: string;
  opportunityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthMetrics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  overdueTasks: Task[];
  status: HealthStatus;
}

// ============================================
// TIPOS PARA USUARIO
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
}
