// ============================================
// ANTU CRM - TIPOS DE AUTENTICACIÓN Y AUTORIZACIÓN
// RBAC + ABAC - Role-Based + Attribute-Based Access Control
// ============================================

// ============================================
// ROLES DEL SISTEMA
// ============================================

export type UserRole =
  | 'PLATFORM_ADMIN'    // Super Admin - ANTÜ Staff
  | 'TENANT_ADMIN'      // Administrador del cliente
  | 'SALES_MANAGER'     // Gerente de Ventas
  | 'SALES_REP'         // Vendedor
  | 'INVENTORY_MANAGER' // Gestor de Inventario
  | 'BILLING_MANAGER'   // Gestor de Facturación
  | 'COLLECTIONS_MANAGER'; // Gestor de CxC

export const ROLE_LABELS: Record<UserRole, string> = {
  PLATFORM_ADMIN: 'Super Administrador',
  TENANT_ADMIN: 'Administrador',
  SALES_MANAGER: 'Gerente de Ventas',
  SALES_REP: 'Vendedor',
  INVENTORY_MANAGER: 'Gestor de Inventario',
  BILLING_MANAGER: 'Gestor de Facturación',
  COLLECTIONS_MANAGER: 'Gestor de Cobros',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  PLATFORM_ADMIN: 'Acceso total a todos los tenants y configuración global',
  TENANT_ADMIN: 'Acceso total a su tenant, gestión de usuarios y configuración',
  SALES_MANAGER: 'Supervisión del equipo comercial, visibilidad total de ventas',
  SALES_REP: 'Gestión de propia cartera de clientes y oportunidades',
  INVENTORY_MANAGER: 'Control de stock, almacén y movimientos de inventario',
  BILLING_MANAGER: 'Emisión de facturas fiscales y cumplimiento DGII',
  COLLECTIONS_MANAGER: 'Gestión de cartera, cobranza y evaluación de crédito',
};

// ============================================
// PLANES DE SUSCRIPCIÓN
// ============================================

export type SubscriptionPlan = 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanLimits {
  name: string;
  price: number;
  maxUsers: number;
  maxAdmins: number;
  modules: string[];
  features: string[];
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanLimits> = {
  STARTER: {
    name: 'Starter',
    price: 99,
    maxUsers: 5,
    maxAdmins: 1,
    modules: ['dashboard', 'crm_basic', 'clients', 'contacts', 'opportunities', 'quotes', 'quotes-mfp', 'general-quotes', 'marketing', 'simple_billing', 'activities', 'service', 'inventory', 'settings', 'users', 'performance', 'quotas', 'back-to-crm'],
    features: [
      'CRM Básico',
      'Clientes',
      'Oportunidades',
      'Cotizaciones',
      'Facturación Simple',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 299,
    maxUsers: 20,
    maxAdmins: 2,
    modules: [
      'dashboard', 'crm_basic', 'clients', 'opportunities', 'quotes', 'quotes-mfp',
      'general-quotes', 'activities', 'service', 'marketing',
      'billing', 'inventory', 'cxc', 'reports', 'users', 'settings',
      'contacts', 'vendedores', 'performance', 'quotas', 'back-to-crm'
    ],
    features: [
      'Todos los módulos excepto IA avanzada',
      'API básica',
      'Reportes avanzados',
      'Inventario',
      'CxC Completo',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 799,
    maxUsers: Infinity,
    maxAdmins: Infinity,
    modules: [
      'dashboard', 'crm_basic', 'clients', 'opportunities', 'quotes', 'quotes-mfp',
      'general-quotes', 'activities', 'service', 'billing',
      'inventory', 'cxc', 'reports', 'marketing', 'users', 'settings',
      'ai_advanced', 'api_enterprise', 'webhooks', 'custom_integrations',
      'saas-metrics', 'platform-settings', 'contacts', 'vendedores',
      'performance', 'quotas', 'back-to-crm'
    ],
    features: [
      'Todos los módulos',
      'API Enterprise completa',
      'Webhooks',
      'Integraciones personalizadas',
      'Soporte 24/7',
    ],
  },
};

// ============================================
// PERMISOS DEL SISTEMA
// ============================================

export type Permission =
  // Clientes
  | 'clients:view'
  | 'clients:create'
  | 'clients:edit'
  | 'clients:delete'
  | 'clients:view_all'
  | 'clients:request_credit'
  | 'clients:approve_credit'
  // Contactos
  | 'contacts:view'
  | 'contacts:create'
  | 'contacts:edit'
  | 'contacts:delete'
  | 'contacts:view_all'
  // Oportunidades
  | 'opportunities:view'
  | 'opportunities:create'
  | 'opportunities:edit'
  | 'opportunities:delete'
  | 'opportunities:view_all'
  | 'opportunities:close'
  | 'opportunities:reassign'
  | 'opportunities:approve_discount'
  // Cotizaciones
  | 'quotes:view'
  | 'quotes:create'
  | 'quotes:edit'
  | 'quotes:delete'
  | 'quotes:view_all'
  | 'quotes:approve_special_price'
  | 'quotes:send'
  // Actividades
  | 'activities:view'
  | 'activities:create'
  | 'activities:edit'
  | 'activities:delete'
  | 'activities:view_all'
  | 'activities:reassign'
  // Inventario
  | 'inventory:view'
  | 'inventory:create'
  | 'inventory:edit'
  | 'inventory:delete'
  | 'inventory:adjust'
  | 'inventory:transfer'
  | 'inventory:receive'
  | 'inventory:dispatch'
  // Facturación
  | 'billing:view'
  | 'billing:create'
  | 'billing:edit'
  | 'billing:cancel'
  | 'billing:validate_prefactura'
  | 'billing:issue_ecf'
  | 'billing:generate_nc_nd'
  // CxC
  | 'cxc:view'
  | 'cxc:register_payment'
  | 'cxc:approve_credit_line'
  | 'cxc:modify_credit_limit'
  | 'cxc:freeze_credit'
  | 'cxc:manage_collections'
  | 'cxc:view_risk_report'
  // Usuarios
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:manage_permissions'
  | 'users:view_audit_logs'
  // Configuración
  | 'settings:view'
  | 'settings:edit'
  | 'settings:manage_integrations'
  | 'settings:configure_workflows'
  | 'settings:branding'
  // Reportes
  | 'reports:view_own'
  | 'reports:view_team'
  | 'reports:view_all'
  | 'reports:export'
  // Dashboard
  | 'dashboard:view_own'
  | 'dashboard:view_team'
  | 'dashboard:view_company'
  // Vendedores (Dashboard Manager)
  | 'vendedores:view'
  // Mi Desempeño
  | 'performance:view';

// ============================================
// MATRIZ DE PERMISOS POR ROL
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PLATFORM_ADMIN: [
    // Acceso total
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:view_all', 'clients:request_credit', 'clients:approve_credit',
    'contacts:view', 'contacts:create', 'contacts:edit', 'contacts:delete', 'contacts:view_all',
    'opportunities:view', 'opportunities:create', 'opportunities:edit', 'opportunities:delete', 'opportunities:view_all', 'opportunities:close', 'opportunities:reassign', 'opportunities:approve_discount',
    'quotes:view', 'quotes:create', 'quotes:edit', 'quotes:delete', 'quotes:view_all', 'quotes:approve_special_price', 'quotes:send',
    'activities:view', 'activities:create', 'activities:edit', 'activities:delete', 'activities:view_all', 'activities:reassign',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete', 'inventory:adjust', 'inventory:transfer', 'inventory:receive', 'inventory:dispatch',
    'billing:view', 'billing:create', 'billing:edit', 'billing:cancel', 'billing:validate_prefactura', 'billing:issue_ecf', 'billing:generate_nc_nd',
    'cxc:view', 'cxc:register_payment', 'cxc:approve_credit_line', 'cxc:modify_credit_limit', 'cxc:freeze_credit', 'cxc:manage_collections', 'cxc:view_risk_report',
    'users:view', 'users:create', 'users:edit', 'users:delete', 'users:manage_permissions', 'users:view_audit_logs',
    'settings:view', 'settings:edit', 'settings:manage_integrations', 'settings:configure_workflows', 'settings:branding',
    'reports:view_own', 'reports:view_team', 'reports:view_all', 'reports:export',
    'dashboard:view_own', 'dashboard:view_team', 'dashboard:view_company',
    'vendedores:view', 'performance:view',
  ],

  TENANT_ADMIN: [
    // Acceso total a su tenant
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:view_all', 'clients:request_credit', 'clients:approve_credit',
    'contacts:view', 'contacts:create', 'contacts:edit', 'contacts:delete', 'contacts:view_all',
    'opportunities:view', 'opportunities:create', 'opportunities:edit', 'opportunities:delete', 'opportunities:view_all', 'opportunities:close', 'opportunities:reassign', 'opportunities:approve_discount',
    'quotes:view', 'quotes:create', 'quotes:edit', 'quotes:delete', 'quotes:view_all', 'quotes:approve_special_price', 'quotes:send',
    'activities:view', 'activities:create', 'activities:edit', 'activities:delete', 'activities:view_all', 'activities:reassign',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete', 'inventory:adjust', 'inventory:transfer', 'inventory:receive', 'inventory:dispatch',
    'billing:view', 'billing:create', 'billing:edit', 'billing:cancel', 'billing:validate_prefactura', 'billing:issue_ecf', 'billing:generate_nc_nd',
    'cxc:view', 'cxc:register_payment', 'cxc:approve_credit_line', 'cxc:modify_credit_limit', 'cxc:freeze_credit', 'cxc:manage_collections', 'cxc:view_risk_report',
    'users:view', 'users:create', 'users:edit', 'users:delete', 'users:manage_permissions', 'users:view_audit_logs',
    'settings:view', 'settings:edit', 'settings:manage_integrations', 'settings:configure_workflows', 'settings:branding',
    'reports:view_own', 'reports:view_team', 'reports:view_all', 'reports:export',
    'dashboard:view_own', 'dashboard:view_team', 'dashboard:view_company',
    'vendedores:view', 'performance:view',
  ],

  SALES_MANAGER: [
    // Clientes - todos
    'clients:view', 'clients:create', 'clients:edit', 'clients:view_all', 'clients:request_credit',
    'contacts:view', 'contacts:create', 'contacts:edit', 'contacts:view_all',
    // Oportunidades - todos
    'opportunities:view', 'opportunities:create', 'opportunities:edit', 'opportunities:view_all', 'opportunities:close', 'opportunities:reassign', 'opportunities:approve_discount',
    // Cotizaciones - todos
    'quotes:view', 'quotes:create', 'quotes:edit', 'quotes:view_all', 'quotes:approve_special_price', 'quotes:send',
    // Actividades - todos
    'activities:view', 'activities:create', 'activities:edit', 'activities:view_all', 'activities:reassign',
    // Reportes
    'reports:view_own', 'reports:view_team', 'reports:export',
    // Dashboard
    'dashboard:view_own', 'dashboard:view_team',
    'vendedores:view', 'performance:view',
  ],

  SALES_REP: [
    // Clientes - solo propios
    'clients:view', 'clients:create', 'clients:edit', 'clients:request_credit',
    'contacts:view', 'contacts:create', 'contacts:edit',
    // Oportunidades - solo propias
    'opportunities:view', 'opportunities:create', 'opportunities:edit', 'opportunities:close',
    // Cotizaciones - solo propias
    'quotes:view', 'quotes:create', 'quotes:edit', 'quotes:send',
    // Actividades - solo propias
    'activities:view', 'activities:create', 'activities:edit',
    // Reportes
    'reports:view_own',
    // Dashboard
    'dashboard:view_own',
    'performance:view',
  ],

  INVENTORY_MANAGER: [
    // Inventario - todos
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:adjust', 'inventory:transfer', 'inventory:receive', 'inventory:dispatch',
    // Reportes
    'reports:view_own', 'reports:export',
    // Dashboard
    'dashboard:view_own',
  ],

  BILLING_MANAGER: [
    // Facturación - todos
    'billing:view', 'billing:create', 'billing:cancel', 'billing:validate_prefactura', 'billing:issue_ecf', 'billing:generate_nc_nd',
    // Clientes - solo datos fiscales básicos
    'clients:view',
    // Reportes
    'reports:view_own', 'reports:export',
    // Dashboard
    'dashboard:view_own',
  ],

  COLLECTIONS_MANAGER: [
    // CxC - todos
    'cxc:view', 'cxc:register_payment', 'cxc:approve_credit_line', 'cxc:modify_credit_limit', 'cxc:freeze_credit', 'cxc:manage_collections', 'cxc:view_risk_report',
    // Clientes - solo datos crediticios
    'clients:view',
    // Reportes
    'reports:view_own', 'reports:export',
    // Dashboard
    'dashboard:view_own',
  ],
};

// ============================================
// MÓDULOS DEL SISTEMA
// ============================================

export interface SystemModule {
  id: string;
  name: string;
  icon: string;
  path: string;
  requiredPermission: Permission;
  requiredPlan: SubscriptionPlan[];
  subModules?: SystemModule[];
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/',
    requiredPermission: 'dashboard:view_own',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'clients',
    name: 'Clientes',
    icon: 'Building2',
    path: '/clients',
    requiredPermission: 'clients:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'contacts',
    name: 'Contactos',
    icon: 'Users',
    path: '/contacts',
    requiredPermission: 'contacts:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'opportunities',
    name: 'Oportunidades',
    icon: 'Target',
    path: '/opportunities',
    requiredPermission: 'opportunities:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'quotes',
    name: 'Cotizaciones',
    icon: 'FileText',
    path: '/quotes',
    requiredPermission: 'quotes:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'inventory',
    name: 'Inventario',
    icon: 'Package',
    path: '/inventory',
    requiredPermission: 'inventory:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'billing',
    name: 'Facturación',
    icon: 'Receipt',
    path: '/billing',
    requiredPermission: 'billing:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'cxc',
    name: 'Cuentas por Cobrar',
    icon: 'CreditCard',
    path: '/cxc',
    requiredPermission: 'cxc:view',
    requiredPlan: ['BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'vendedores',
    name: 'Dashboard Vendedores',
    icon: 'BarChart3',
    path: '/vendedores',
    requiredPermission: 'vendedores:view',
    requiredPlan: ['BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'performance',
    name: 'Mi Desempeño',
    icon: 'TrendingUp',
    path: '/performance',
    requiredPermission: 'performance:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'reports',
    name: 'Reportes',
    icon: 'BarChart3',
    path: '/reports',
    requiredPermission: 'reports:view_own',
    requiredPlan: ['BUSINESS', 'ENTERPRISE'],
  },
  {
    id: 'settings',
    name: 'Configuración',
    icon: 'Settings',
    path: '/settings',
    requiredPermission: 'settings:view',
    requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
    subModules: [
      {
        id: 'users',
        name: 'Usuarios',
        icon: 'UserCog',
        path: '/settings/users',
        requiredPermission: 'users:view',
        requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
      },
      {
        id: 'integrations',
        name: 'Integraciones',
        icon: 'Plug',
        path: '/settings/integrations',
        requiredPermission: 'settings:manage_integrations',
        requiredPlan: ['ENTERPRISE'],
      },
      {
        id: 'quotas',
        name: 'Configuración de Cuotas',
        icon: 'Target',
        path: '/settings/quotas',
        requiredPermission: 'settings:edit',
        requiredPlan: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
      },
    ],
  },
];

// ============================================
// USUARIO AUTENTICADO
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  plan: SubscriptionPlan;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaVerified?: boolean;
  // ABAC attributes
  attributes: {
    department?: string;
    region?: string;
    canApproveDiscounts?: boolean;
    maxDiscountPercent?: number;
    allowedModules?: string[];
    restrictedModules?: string[];
    isVirtual?: boolean;
  };
}

// ============================================
// AUDITORÍA
// ============================================

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CREATE_CLIENT'
  | 'UPDATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'CREATE_OPPORTUNITY'
  | 'UPDATE_OPPORTUNITY'
  | 'CLOSE_OPPORTUNITY'
  | 'CREATE_QUOTE'
  | 'UPDATE_QUOTE'
  | 'SEND_QUOTE'
  | 'ISSUE_INVOICE'
  | 'REGISTER_PAYMENT'
  | 'APPROVE_CREDIT'
  | 'ADJUST_INVENTORY'
  | 'EXPORT_DATA'
  | 'VIEW_REPORT'
  | 'SETTINGS_CHANGE'
  | 'MFA_CHALLENGE'
  | 'DB_EXPORT_DOWNLOADED'
  | 'AUTH_FAILED_ATTEMPT'
  | 'KPI_QUOTA_MODIFIED'
  | 'TENANT_CONFIG_CHANGED'
  | 'OPP_STAGE_CHANGED';
