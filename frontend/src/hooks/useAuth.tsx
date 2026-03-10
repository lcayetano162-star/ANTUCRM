// ============================================
// ANTÜ CRM - AUTH CONTEXT & PROVIDER
// RBAC + ABAC Implementation with Security Hardening
// ============================================

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import type {
  AuthenticatedUser,
  UserRole,
  Permission,
  AuditLog,
  AuditAction,
} from '@/types/auth';
import { ROLE_PERMISSIONS, PLAN_CONFIG } from '@/types/auth';
import {
  loginRateLimiter,
  sessionManager,
  logSecurityEvent,
  emailSchema,
} from '@/lib/security';

// ============================================
// MOCK USERS - SEED DATA
// ============================================

const MOCK_USERS: AuthenticatedUser[] = [
  // Backend seed users (production credentials for fallback)
  {
    id: 'usr-seed-super',
    email: 'superadmin@antu.crm',
    firstName: 'Super',
    lastName: 'Admin',
    fullName: 'Super Admin',
    role: 'PLATFORM_ADMIN',
    tenantId: 'antu_default',
    tenantName: 'Canon República Dominicana',
    plan: 'ENTERPRISE',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.PLATFORM_ADMIN,
    attributes: { department: 'Platform' },
    mfaEnabled: false,
  },
  {
    id: 'usr-seed-admin',
    email: 'admin@antu.crm',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    role: 'TENANT_ADMIN',
    tenantId: 'antu_default',
    tenantName: 'Canon República Dominicana',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.TENANT_ADMIN,
    attributes: { department: 'General', canApproveDiscounts: true, maxDiscountPercent: 100 },
    mfaEnabled: false,
  },
  {
    id: 'usr-seed-manager',
    email: 'manager@antu.crm',
    firstName: 'Manager',
    lastName: 'User',
    fullName: 'Manager User',
    role: 'SALES_MANAGER',
    tenantId: 'antu_default',
    tenantName: 'Canon República Dominicana',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.SALES_MANAGER,
    attributes: { department: 'Ventas', canApproveDiscounts: true, maxDiscountPercent: 15 },
    mfaEnabled: false,
  },
  {
    id: 'usr-seed-user',
    email: 'user@antu.crm',
    firstName: 'Regular',
    lastName: 'User',
    fullName: 'Regular User',
    role: 'SALES_REP',
    tenantId: 'antu_default',
    tenantName: 'Canon República Dominicana',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.SALES_REP,
    attributes: { department: 'Ventas' },
    mfaEnabled: false,
  },
  // Legacy demo users (backward compatibility)
  {
    id: 'usr-001',
    email: 'admin@demo.com',
    firstName: 'Administrador',
    lastName: 'Demo',
    fullName: 'Administrador Demo',
    role: 'TENANT_ADMIN',
    tenantId: 'antu_default',
    tenantName: 'Antü CRM',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: '2026-03-01T09:30:00Z',
    createdAt: '2025-01-15T00:00:00Z',
    permissions: ROLE_PERMISSIONS.TENANT_ADMIN,
    attributes: {
      department: 'Administración',
      canApproveDiscounts: true,
      maxDiscountPercent: 100,
    },
    mfaEnabled: false,
  },
  {
    id: 'usr-002',
    email: 'gerente@demo.com',
    firstName: 'María',
    lastName: 'González',
    fullName: 'María González',
    role: 'SALES_MANAGER',
    tenantId: 'antu_default',
    tenantName: 'Antü CRM',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: '2026-03-01T08:15:00Z',
    createdAt: '2025-02-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.SALES_MANAGER,
    attributes: {
      department: 'Ventas',
      region: 'Santo Domingo',
      canApproveDiscounts: true,
      maxDiscountPercent: 15,
    },
    mfaEnabled: false,
  },
  {
    id: 'usr-008',
    email: 'vendedor2@demo.com',
    firstName: 'Laura',
    lastName: 'López',
    fullName: 'Laura López',
    role: 'SALES_REP',
    tenantId: 'antu_default',
    tenantName: 'Antü CRM',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: '2026-02-27T09:00:00Z',
    createdAt: '2025-07-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.SALES_REP,
    attributes: {
      department: 'Ventas',
      region: 'Santiago',
      canApproveDiscounts: false,
      maxDiscountPercent: 0,
    },
    mfaEnabled: false,
  },
  {
    id: 'usr-sol-001',
    email: 'admin@solgraf.com',
    firstName: 'Pedro',
    lastName: 'Solgraf',
    fullName: 'Pedro Solgraf',
    role: 'TENANT_ADMIN',
    tenantId: 'solgraf_001',
    tenantName: 'Soluciones Gráficas SRL',
    plan: 'BUSINESS',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.TENANT_ADMIN,
    attributes: { department: 'Gerencia' },
    mfaEnabled: false,
  },
  {
    id: 'usr-007',
    email: 'super@antu.com',
    firstName: 'Super',
    lastName: 'Admin',
    fullName: 'Super Admin',
    role: 'PLATFORM_ADMIN',
    tenantId: 'platform',
    tenantName: 'ANTÜ Platform',
    plan: 'ENTERPRISE',
    isActive: true,
    lastLoginAt: '2026-03-01T11:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.PLATFORM_ADMIN,
    attributes: {
      department: 'Platform',
    },
    mfaEnabled: false,
  },
  {
    id: 'usr-008',
    email: 'vendedor2@demo.com',
    firstName: 'Laura',
    lastName: 'López',
    fullName: 'Laura López',
    role: 'SALES_REP',
    tenantId: 'tenant-demo',
    tenantName: 'Empresa Demo SRL',
    plan: 'BUSINESS',
    isActive: true,
    lastLoginAt: '2026-02-27T09:00:00Z',
    createdAt: '2025-07-01T00:00:00Z',
    permissions: ROLE_PERMISSIONS.SALES_REP,
    attributes: {
      department: 'Ventas',
      region: 'Santiago',
      canApproveDiscounts: false,
      maxDiscountPercent: 0,
    },
    mfaEnabled: false,
  },
];

// ============================================
// AUTH CONTEXT TYPE
// ============================================

interface AuthContextType {
  // User state
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;

  // Authentication actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (email: string) => void;
  clearLoginError: () => void;

  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Role checks
  hasRole: (role: UserRole | UserRole[]) => boolean;

  // ABAC checks
  canApproveDiscount: (percent: number) => boolean;
  canAccessModule: (moduleId: string) => boolean;

  // Plan limits
  getPlanLimits: () => { maxUsers: number; maxAdmins: number; currentUsers: number; currentAdmins: number };
  canCreateUser: (role: UserRole) => { allowed: boolean; reason?: string };
  canCreateAdmin: () => { allowed: boolean; reason?: string };

  // User management (for Super Admin & Tenant Admin)
  users: AuthenticatedUser[];
  allUsers: AuthenticatedUser[];
  originalUser: AuthenticatedUser | null;
  createUser: (userData: Partial<AuthenticatedUser>) => Promise<boolean>;
  createUserForTenant: (tenantId: string, userData: Partial<AuthenticatedUser>) => Promise<boolean>;
  updateUser: (userId: string, userData: Partial<AuthenticatedUser>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  impersonateUser: (email: string) => void;
  impersonateTenant: (tenantId: string, tenantName: string) => void;
  stopImpersonation: () => void;

  // Audit
  logAction: (action: AuditAction, resource: string, details?: Record<string, unknown>) => void;
  auditLogs: AuditLog[];

  // Security
  remainingLoginAttempts: number;
  isRateLimited: boolean;
  rateLimitMessage: string;

  // MFA
  mfaPendingUserId: string | null;
  clearMfaPending: () => void;
}

// ============================================
// CREATE CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// MOCK AUDIT LOGS
// ============================================

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    userId: 'usr-002',
    userEmail: 'gerente@demo.com',
    userRole: 'SALES_MANAGER',
    tenantId: 'antu_default',
    action: 'OPP_STAGE_CHANGED',
    resource: 'opportunity',
    resourceId: 'opp-102',
    details: {
      old_value: { stage: 'Proponer', amount: 45000 },
      new_value: { stage: 'Cerrada Ganada', amount: 42000 }
    },
    ipAddress: '190.167.XX.XX',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-03-03T10:30:15Z',
    success: true,
  },
  {
    id: 'log-002',
    userId: 'usr-008',
    userEmail: 'vendedor2@demo.com',
    userRole: 'SALES_REP',
    tenantId: 'antu_default',
    action: 'DB_EXPORT_DOWNLOADED',
    resource: 'reports',
    resourceId: 'export-clients',
    details: { format: 'excel', rows_exported: 15420, filters_applied: 'all' },
    ipAddress: '190.167.XX.XX',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-03-03T09:15:00Z',
    success: true,
  },
  {
    id: 'log-003',
    userId: 'unknown',
    userEmail: 'admin@demo.com',
    userRole: 'SALES_REP',
    tenantId: 'antu_default',
    action: 'AUTH_FAILED_ATTEMPT',
    resource: 'session',
    resourceId: 'auth',
    details: { reason: 'Invalid or expired credentials', attempts: 4 },
    ipAddress: '8.8.4.4',
    userAgent: 'Python/3.9 Requests',
    timestamp: '2026-03-03T03:20:00Z',
    success: false,
  },
  {
    id: 'log-004',
    userId: 'usr-001',
    userEmail: 'admin@demo.com',
    userRole: 'TENANT_ADMIN',
    tenantId: 'antu_default',
    action: 'KPI_QUOTA_MODIFIED',
    resource: 'settings',
    resourceId: 'quota-q2',
    details: {
      old_value: { quota_q2_sales: 1500000 },
      new_value: { quota_q2_sales: 2000000 }
    },
    ipAddress: '190.167.XX.XX',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-03-02T14:10:00Z',
    success: true,
  },
  {
    id: 'log-005',
    userId: 'usr-001',
    userEmail: 'admin@demo.com',
    userRole: 'TENANT_ADMIN',
    tenantId: 'antu_default',
    action: 'TENANT_CONFIG_CHANGED',
    resource: 'settings',
    resourceId: 'tenant',
    details: {
      old_value: { require_mfa: false },
      new_value: { require_mfa: true }
    },
    ipAddress: '190.167.XX.XX',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-03-01T11:20:00Z',
    success: true,
  },
];


// ============================================
// AUTH PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [users, setUsers] = useState<AuthenticatedUser[]>(MOCK_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [originalUser, setOriginalUser] = useState<AuthenticatedUser | null>(null);
  const [mfaPendingUserId, setMfaPendingUserId] = useState<string | null>(null);

  // Rate limiting state
  const [rateLimitState, setRateLimitState] = useState({
    remainingAttempts: 5,
    isRateLimited: false,
    rateLimitMessage: '',
  });

  // ==========================================
  // AUDIT
  // ==========================================

  const logAction = useCallback((action: AuditAction, resource: string, details?: Record<string, unknown>) => {
    if (!user) return;

    const newLog: AuditLog = {
      id: `log-${String(auditLogs.length + 1).padStart(3, '0')}`,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      tenantId: user.tenantId,
      action,
      resource,
      details,
      ipAddress: '190.167.XX.XX', // In production, get from request
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
      success: true,
    };

    setAuditLogs(prev => [newLog, ...prev]);
  }, [user, auditLogs.length]);


  // Initialize - check for saved session
  useEffect(() => {
    const session = sessionManager.getSession();
    if (session) {
      // 1. Try to recover from sessionStorage (user data never goes to localStorage)
      const savedUser = sessionStorage.getItem('antu_current_user');
      const savedOriginal = sessionStorage.getItem('antu_original_user');

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // Refresh permissions from local code to ensure new permissions are available
          if (parsedUser.role && ROLE_PERMISSIONS[parsedUser.role as UserRole]) {
            parsedUser.permissions = ROLE_PERMISSIONS[parsedUser.role as UserRole];
          }
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing saved user', e);
        }
      } else {
        // Fallback to MOCK_USERS if not found in sessionStorage (regular login)
        const foundUser = MOCK_USERS.find(u => u.id === session.userId);
        if (foundUser) {
          setUser(foundUser);
        }
      }

      if (savedOriginal) {
        try {
          setOriginalUser(JSON.parse(savedOriginal));
        } catch (e) {
          console.error('Error parsing saved original user', e);
        }
      }
    } else {
      // No valid session, clear session storage
      sessionStorage.removeItem('antu_current_user');
      sessionStorage.removeItem('antu_original_user');
    }

    // Use a small timeout to ensure state propagation before removing loader
    // This prevents ProtectedRoute from seeing user=null + isLoading=false momentarily
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);

    // Setup session expiry callback
    sessionManager.onExpire(() => {
      setUser(null);
      sessionStorage.removeItem('antu_current_user');
      sessionStorage.removeItem('antu_original_user');
      window.location.href = '/login?reason=session_expired';
    });

    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);

    // Validate email format
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setLoginError('Email inválido');
      return false;
    }

    // Check rate limiting
    const rateLimitCheck = loginRateLimiter.check(email);
    setRateLimitState({
      remainingAttempts: rateLimitCheck.remainingAttempts,
      isRateLimited: !rateLimitCheck.allowed,
      rateLimitMessage: rateLimitCheck.message,
    });

    if (!rateLimitCheck.allowed) {
      setLoginError(rateLimitCheck.message);
      logSecurityEvent('LOGIN_RATE_LIMITED', { email });
      return false;
    }

    try {
      setIsLoading(true);

      const normalizedEmail = email.trim().toLowerCase();
      // Determine tenant slug from email domain or use default
      const tenantSlug = normalizedEmail.includes('antu.crm') ? 'antu_default' : 'antu_default';

      // ============================================
      // REAL API CALL TO BACKEND
      // ============================================
      let authenticatedUser: AuthenticatedUser;
      let accessToken: string;
      let refreshToken: string;

      try {
        // Call the real backend auth endpoint
        const response = await apiRequest<{
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
          requiresMfa?: boolean;
          userId?: string;
          user?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            tenantId: string;
          };
        }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail, password }),
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantSlug,
          },
        });

        // If MFA is required, signal the UI to show the MFA challenge
        if (response.requiresMfa && response.userId) {
          setMfaPendingUserId(response.userId);
          return false; // login not complete yet — MfaChallenge will complete it
        }

        accessToken = response.accessToken!;
        refreshToken = response.refreshToken!;

        // Map backend role to frontend role
        const roleMap: Record<string, UserRole> = {
          'SUPER_ADMIN': 'PLATFORM_ADMIN',
          'ADMIN': 'TENANT_ADMIN',
          'MANAGER': 'SALES_MANAGER',
          'USER': 'SALES_REP',
          'VIEWER': 'SALES_REP',
        };

        const user = response.user!;
        const frontendRole = roleMap[user.role] || 'SALES_REP';

        authenticatedUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          role: frontendRole,
          tenantId: user.tenantId,
          tenantName: 'ANTÜ CRM',
          plan: 'BUSINESS',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          permissions: ROLE_PERMISSIONS[frontendRole] || [],
          attributes: {
            department: 'General',
            canApproveDiscounts: frontendRole === 'TENANT_ADMIN' || frontendRole === 'SALES_MANAGER',
            maxDiscountPercent: frontendRole === 'TENANT_ADMIN' ? 100 : frontendRole === 'SALES_MANAGER' ? 15 : 0,
          },
          mfaEnabled: false,
        };
      } catch (apiError: any) {
        // Demo mode is only available in development when explicitly enabled via env var
        const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
        const isDev = import.meta.env.DEV;

        if (!isDev || !demoPassword) {
          throw new Error('No se puede conectar con el servidor. Intente más tarde.');
        }

        console.warn('⚠️ Backend no disponible, modo demo activo (solo desarrollo)');

        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
        if (!mockUser || password !== demoPassword) {
          throw new Error('Credenciales inválidas');
        }

        accessToken = 'demo-access-token';
        refreshToken = 'demo-refresh-token';
        authenticatedUser = {
          ...mockUser,
          permissions: ROLE_PERMISSIONS[mockUser.role as UserRole] || [],
          attributes: mockUser.attributes || {},
        };
      }

      // Store tokens and tenant info
      sessionStorage.setItem('antu_access_token', accessToken);
      sessionStorage.setItem('antu_refresh_token', refreshToken);
      sessionStorage.setItem('antu_tenant_id', tenantSlug);

      // Create secure session in sessionManager
      sessionManager.createSession({
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        tenantId: authenticatedUser.tenantId,
        permissions: authenticatedUser.permissions,
      });

      setUser(authenticatedUser);
      sessionStorage.setItem('antu_current_user', JSON.stringify(authenticatedUser));
      loginRateLimiter.recordAttempt(email, true);
      loginRateLimiter.reset(email);

      logAction('LOGIN', 'session', { email });
      logSecurityEvent('LOGIN_SUCCESS', { email, userId: authenticatedUser.id });

      return true;
    } catch (error: any) {
      loginRateLimiter.recordAttempt(email, false);
      setLoginError(error.message || 'Error de conexión con el servidor');

      const updatedCheck = loginRateLimiter.check(email);
      setRateLimitState({
        remainingAttempts: updatedCheck.remainingAttempts,
        isRateLimited: !updatedCheck.allowed,
        rateLimitMessage: updatedCheck.message,
      });

      logSecurityEvent('LOGIN_FAILED', { email, reason: error.message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logAction]);

  const logout = useCallback(() => {
    if (user) {
      logAction('LOGOUT', 'session', { email: user.email });
      logSecurityEvent('LOGOUT', { email: user.email, userId: user.id });
    }
    sessionManager.destroySession('LOGOUT');
    setUser(null);
    setOriginalUser(null);
    sessionStorage.removeItem('antu_current_user');
    sessionStorage.removeItem('antu_original_user');
    setLoginError(null);
  }, [user]);

  const switchUser = useCallback((email: string) => {
    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      const userWithTimestamp = {
        ...foundUser,
        lastLoginAt: new Date().toISOString(),
      };

      // Create new session for switched user
      sessionManager.createSession({
        userId: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        tenantId: foundUser.tenantId,
        permissions: foundUser.permissions,
      });

      setUser(userWithTimestamp);
      sessionStorage.setItem('antu_current_user', JSON.stringify(userWithTimestamp));
      logSecurityEvent('USER_SWITCHED', { email, userId: foundUser.id });
    }
  }, [users]);

  const impersonateUser = useCallback((email: string) => {
    if (!user || user.role !== 'PLATFORM_ADMIN') return;

    // Solo permitir impersonificación si es un super admin real
    if (!originalUser) {
      setOriginalUser(user);
    }
    switchUser(email);
    logAction('LOGIN', 'impersonation', { targetEmail: email });
  }, [user, originalUser, switchUser, logAction]);

  const impersonateTenant = useCallback((tenantId: string, tenantName: string) => {
    // Solo permitir si el usuario es PLATFORM_ADMIN o si ya estamos impersonando (originalUser existe)
    if (!user) return;
    if (user.role !== 'PLATFORM_ADMIN' && !originalUser) return;

    // Si no estamos impersonando todavía, guardar el usuario actual como original
    if (!originalUser) {
      setOriginalUser(user);
    }

    // Create a virtual admin user for this tenant
    const virtualUser: AuthenticatedUser = {
      id: `system-admin-${tenantId}`,
      email: `admin@${tenantId}.system`,
      firstName: 'Administrador',
      lastName: 'del Sistema',
      fullName: `Admin ${tenantName}`,
      role: 'TENANT_ADMIN',
      tenantId: tenantId,
      tenantName: tenantName,
      plan: 'BUSINESS',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS.TENANT_ADMIN,
      attributes: {
        isVirtual: true,
        department: 'Soporte Técnico de Plataforma',
      },
      mfaEnabled: false,
    };

    // Create session for virtual user
    sessionManager.createSession({
      userId: virtualUser.id,
      email: virtualUser.email,
      role: virtualUser.role,
      tenantId: virtualUser.tenantId,
      permissions: virtualUser.permissions,
    });

    setUser(virtualUser);
    sessionStorage.setItem('antu_current_user', JSON.stringify(virtualUser));
    sessionStorage.setItem('antu_original_user', JSON.stringify(originalUser || user));
    logAction('LOGIN', 'tenant_impersonation', { tenantId, tenantName });

    // Forzar redirección al dashboard del nuevo tenant
    window.location.href = '/';
  }, [user, originalUser, logAction]);

  const stopImpersonation = useCallback(() => {
    if (originalUser) {
      const adminToRestore = originalUser;
      sessionManager.createSession({
        userId: adminToRestore.id,
        email: adminToRestore.email,
        role: adminToRestore.role,
        tenantId: adminToRestore.tenantId,
        permissions: adminToRestore.permissions,
      });

      setUser(adminToRestore);
      sessionStorage.setItem('antu_current_user', JSON.stringify(adminToRestore));
      sessionStorage.removeItem('antu_original_user');
      setOriginalUser(null);
      logAction('LOGIN', 'stop_impersonation', { email: adminToRestore.email });

      // Redirigir al panel de super admin de forma limpia
      window.location.href = '/admin/platform';
    }
  }, [originalUser, logAction]);

  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  // ==========================================
  // PERMISSION CHECKS (RBAC)
  // ==========================================

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(p => user.permissions.includes(p));
  }, [user]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(p => user.permissions.includes(p));
  }, [user]);

  // ==========================================
  // ROLE CHECKS
  // ==========================================

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  // ==========================================
  // ABAC CHECKS
  // ==========================================

  const canApproveDiscount = useCallback((percent: number): boolean => {
    if (!user) return false;
    if (!user.attributes.canApproveDiscounts) return false;
    return (user.attributes.maxDiscountPercent || 0) >= percent;
  }, [user]);

  const canAccessModule = useCallback((moduleId: string): boolean => {
    if (!user) return false;

    // First check if it's a platform-specific module
    const PLATFORM_MODULES = ['saas-metrics', 'platform-settings', 'platform-users'];
    if (PLATFORM_MODULES.includes(moduleId)) {
      return user.role === 'PLATFORM_ADMIN';
    }

    // 1. First check plan limits - if it's not in the plan, it's definitely not allowed
    const planConfig = PLAN_CONFIG[user.plan];
    const isAllowedByPlan = planConfig?.modules.includes(moduleId) || planConfig?.modules.some(m => m.startsWith(moduleId));

    if (!isAllowedByPlan) return false;

    // 2. Platform admin can access anything in their plan
    if (user.role === 'PLATFORM_ADMIN') return true;

    // 3. Check if module is explicitly disabled in tenant features from localStorage
    const savedTenants = typeof window !== 'undefined' ? localStorage.getItem('antu_all_tenants') : null;
    if (savedTenants) {
      try {
        const tenants = JSON.parse(savedTenants);
        const tenant = tenants.find((t: any) => t.id === user.tenantId);

        // If we found the tenant and it has a modules list, follow it
        // BUT for TENANT_ADMIN we might want to be more permissive in a demo
        if (tenant && tenant.features?.modules) {
          // Aseguramos que los módulos core nuevos siempre sean accesibles si el plan lo permite
          const CORE_MODULES = ['quotas', 'performance', 'clients', 'contacts', 'service'];
          if (CORE_MODULES.includes(moduleId)) return isAllowedByPlan;

          return tenant.features.modules.includes(moduleId);
        }
      } catch (e) {
        console.error('Error parsing tenants for permission check', e);
      }
    }

    // 4. Default to plan access
    return isAllowedByPlan;
  }, [user]);

  // ==========================================
  // PLAN LIMITS
  // ==========================================

  const getPlanLimits = useCallback(() => {
    if (!user) return { maxUsers: 0, maxAdmins: 0, currentUsers: 0, currentAdmins: 0 };

    const planConfig = PLAN_CONFIG[user.plan];
    const tenantUsers = users.filter(u => u.tenantId === user.tenantId && u.isActive);
    const currentUsers = tenantUsers.length;
    const currentAdmins = tenantUsers.filter(u => u.role === 'TENANT_ADMIN').length;

    return {
      maxUsers: planConfig.maxUsers,
      maxAdmins: planConfig.maxAdmins,
      currentUsers,
      currentAdmins,
    };
  }, [user, users]);

  const canCreateUser = useCallback((role: UserRole): { allowed: boolean; reason?: string } => {
    if (!user) return { allowed: false, reason: 'No autenticado' };

    const limits = getPlanLimits();

    // Check if at user limit
    if (limits.maxUsers !== Infinity && limits.currentUsers >= limits.maxUsers) {
      return {
        allowed: false,
        reason: `Límite de usuarios alcanzado (${limits.currentUsers}/${limits.maxUsers}). Upgrade para agregar más.`
      };
    }

    // Check admin creation limits
    if (role === 'TENANT_ADMIN') {
      return canCreateAdmin();
    }

    return { allowed: true };
  }, [user, getPlanLimits]);

  const canCreateAdmin = useCallback((): { allowed: boolean; reason?: string } => {
    if (!user) return { allowed: false, reason: 'No autenticado' };

    const limits = getPlanLimits();

    // Check if at admin limit
    if (limits.maxAdmins !== Infinity && limits.currentAdmins >= limits.maxAdmins) {
      return {
        allowed: false,
        reason: `Su plan ${user.plan} permite máximo ${limits.maxAdmins} administrador(es).`
      };
    }

    return { allowed: true };
  }, [user, getPlanLimits]);

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  const createUserForTenant = useCallback(async (tenantId: string, userData: Partial<AuthenticatedUser>): Promise<boolean> => {
    if (!user) return false;

    // Check permission - Super Admin or Tenant Admin
    if (!hasPermission('users:create') && user.role !== 'PLATFORM_ADMIN') {
      return false;
    }

    // Check plan limits only for regular tenants (not for platform admin)
    if (user.role !== 'PLATFORM_ADMIN') {
      const canCreate = canCreateUser(userData.role || 'SALES_REP');
      if (!canCreate.allowed) {
        return false;
      }
    }

    const newUser: AuthenticatedUser = {
      id: `usr-${String(users.length + 1).padStart(3, '0')}`,
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      role: userData.role || 'SALES_REP',
      tenantId: tenantId,
      tenantName: userData.tenantName || (tenantId === user.tenantId ? user.tenantName : 'Tenant'),
      plan: userData.plan || (tenantId === user.tenantId ? user.plan : 'BUSINESS'),
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS[userData.role || 'SALES_REP'],
      attributes: userData.attributes || {},
      mfaEnabled: false,
    };

    setUsers(prev => [...prev, newUser]);

    // Log action
    logAction('CREATE_USER', 'user', {
      targetEmail: newUser.email,
      targetRole: newUser.role,
      targetTenantId: tenantId
    });

    return true;
  }, [user, users.length, hasPermission, canCreateUser, logAction]);

  const createUser = useCallback(async (userData: Partial<AuthenticatedUser>): Promise<boolean> => {
    if (!user) return false;
    return createUserForTenant(user.tenantId, userData);
  }, [user, createUserForTenant]);

  const updateUser = useCallback(async (userId: string, userData: Partial<AuthenticatedUser>): Promise<boolean> => {
    if (!user) return false;

    if (!hasPermission('users:edit')) {
      return false;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...userData };
        if (userData.firstName || userData.lastName) {
          updated.fullName = `${userData.firstName || u.firstName} ${userData.lastName || u.lastName}`.trim();
        }
        // Update permissions if role changed
        if (userData.role && userData.role !== u.role) {
          updated.permissions = ROLE_PERMISSIONS[userData.role];
        }
        return updated;
      }
      return u;
    }));

    logAction('UPDATE_USER', 'user', { targetUserId: userId, changes: Object.keys(userData) });
    return true;
  }, [user, hasPermission]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false;

    if (!hasPermission('users:delete')) {
      return false;
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return false;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    logAction('DELETE_USER', 'user', { targetUserId: userId });
    return true;
  }, [user, hasPermission]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false;

    if (!hasPermission('users:edit')) {
      return false;
    }

    // Prevent self-deactivation
    if (userId === user.id) {
      return false;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    }));

    const targetUser = users.find(u => u.id === userId);
    logAction('UPDATE_USER', 'user', {
      targetUserId: userId,
      status: targetUser?.isActive ? 'deactivated' : 'activated'
    });

    return true;
  }, [user, users, hasPermission]);


  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    loginError,
    login,
    logout,
    switchUser,
    clearLoginError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canApproveDiscount,
    canAccessModule,
    getPlanLimits,
    canCreateUser,
    canCreateAdmin,
    users: users.filter(u => u.tenantId === user?.tenantId),
    allUsers: users,
    originalUser,
    createUser,
    createUserForTenant,
    updateUser,
    deleteUser,
    toggleUserStatus,
    impersonateUser,
    impersonateTenant,
    stopImpersonation,
    logAction,
    auditLogs: auditLogs.filter(l => l.tenantId === user?.tenantId),
    mfaPendingUserId,
    clearMfaPending: () => setMfaPendingUserId(null),
    remainingLoginAttempts: rateLimitState.remainingAttempts,
    isRateLimited: rateLimitState.isRateLimited,
    rateLimitMessage: rateLimitState.rateLimitMessage,
  }), [
    user,
    isLoading,
    loginError,
    login,
    logout,
    switchUser,
    clearLoginError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canApproveDiscount,
    canAccessModule,
    getPlanLimits,
    canCreateUser,
    canCreateAdmin,
    users,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    impersonateUser,
    impersonateTenant,
    stopImpersonation,
    logAction,
    auditLogs,
    rateLimitState,
    mfaPendingUserId,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// USE AUTH HOOK
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// USE PERMISSIONS HOOK (Convenience)
// ============================================

export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };
}
