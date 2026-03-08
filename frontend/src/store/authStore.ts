import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_MODULES: Record<string, boolean> = {
  crm: true, cpq: true, activities: true, marketing: true, performance: true,
  email: true, service_desk: true, inventory: true, invoicing: true
}

// Roles con acceso supervisor completo al módulo de Servicio Técnico
const SD_SUPERVISOR_ROLES = ['superadmin', 'admin', 'sales_manager', 'service_supervisor']

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId?: string
  isLandlord?: boolean
  enabledModules?: Record<string, boolean>
  gov_module_enabled?: boolean
  country?: string  // ISO 3166-1 alpha-2 — 'DO' = República Dominicana
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isServiceSupervisor: boolean
  isServiceTech: boolean
  enabledModules: Record<string, boolean>

  // Actions
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  setModules: (modules: Record<string, boolean>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      isServiceSupervisor: false,
      isServiceTech: false,
      enabledModules: DEFAULT_MODULES,

      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
        isSuperAdmin: user.role === 'superadmin',
        isServiceSupervisor: SD_SUPERVISOR_ROLES.includes(user.role),
        isServiceTech: user.role === 'service_tech',
        enabledModules: user.isLandlord ? DEFAULT_MODULES : (user.enabledModules || DEFAULT_MODULES)
      }),

      clearAuth: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        isSuperAdmin: false,
        isServiceSupervisor: false,
        isServiceTech: false,
        enabledModules: DEFAULT_MODULES
      }),

      setModules: (modules) => set({ enabledModules: modules }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isSuperAdmin: state.isSuperAdmin,
        isServiceSupervisor: state.isServiceSupervisor,
        isServiceTech: state.isServiceTech,
        enabledModules: state.enabledModules
      })
    }
  )
)
