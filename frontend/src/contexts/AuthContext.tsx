// ============================================
// ANTU CRM - Auth Context
// Gestión de autenticación y usuario
// ============================================

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole, UserPreferences } from '@/types/tenant';

// ============================================
// MOCK USERS
// ============================================

const MOCK_USERS: Record<string, User> = {
  'superadmin@antu.com': {
    id: 'user_001',
    email: 'superadmin@antu.com',
    firstName: 'Super',
    lastName: 'Admin',
    avatar: undefined,
    role: 'SUPER_ADMIN',
    tenantId: 'antu_default',
    isActive: true,
    preferences: {
      theme: 'light',
      sidebarCollapsed: false,
      density: 'comfortable',
    },
  },
  'admin@antu.com': {
    id: 'user_002',
    email: 'admin@antu.com',
    firstName: 'Admin',
    lastName: 'Usuario',
    avatar: undefined,
    role: 'ADMIN',
    tenantId: 'antu_default',
    isActive: true,
    preferences: {
      theme: 'light',
      sidebarCollapsed: false,
      density: 'comfortable',
    },
  },
  'vendedor@antu.com': {
    id: 'user_003',
    email: 'vendedor@antu.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    avatar: undefined,
    role: 'USER',
    tenantId: 'antu_default',
    isActive: true,
    preferences: {
      theme: 'light',
      sidebarCollapsed: false,
      density: 'comfortable',
    },
  },
};

// ============================================
// CONTEXT DEFINITION
// ============================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, isSuperAdmin?: boolean) => Promise<boolean>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PERMISSIONS MAP
// ============================================

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'dashboard:read',
    'contacts:read',
    'contacts:write',
    'contacts:delete',
    'opportunities:read',
    'opportunities:write',
    'opportunities:delete',
    'quotes:read',
    'quotes:write',
    'inventory:read',
    'inventory:write',
    'tasks:read',
    'tasks:write',
    'tasks:delete',
    'reports:read',
    'settings:read',
    'settings:write',
  ],
  MANAGER: [
    'dashboard:read',
    'contacts:read',
    'contacts:write',
    'opportunities:read',
    'opportunities:write',
    'quotes:read',
    'quotes:write',
    'inventory:read',
    'tasks:read',
    'tasks:write',
    'reports:read',
  ],
  USER: [
    'dashboard:read',
    'contacts:read',
    'contacts:write',
    'opportunities:read',
    'opportunities:write',
    'quotes:read',
    'inventory:read',
    'tasks:read',
    'tasks:write',
  ],
};

// ============================================
// PROVIDER COMPONENT
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('antu_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse user session', e);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('antu_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('antu_session');
    }
  }, [user]);

  const login = useCallback(async (email: string, _password: string, isSuperAdmin = false): Promise<boolean> => {
    setIsLoading(true);

    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email.toLowerCase()];

    if (mockUser) {
      // Si es super admin, verificar que el email tenga permisos
      if (isSuperAdmin && mockUser.role !== 'SUPER_ADMIN') {
        setIsLoading(false);
        return false;
      }

      setUser(mockUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferences,
        },
      };
    });
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;

      const permissions = ROLE_PERMISSIONS[user.role] || [];
      return permissions.includes(permission) || permissions.includes('*');
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updatePreferences,
      hasPermission,
    }),
    [user, isLoading, login, logout, updatePreferences, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
