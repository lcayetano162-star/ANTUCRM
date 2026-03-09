// ============================================
// ANTU CRM - Tenant Context
// Sistema multi-tenant para personalización
// ============================================

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Tenant, BrandingColors } from '@/types/tenant';
import { DEFAULT_TENANT, EXAMPLE_TENANT_SOLGRAF } from '@/types/tenant';

// ============================================
// UTILIDADES DE COLOR
// ============================================

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePastelPalette(baseColor: string) {
  const { h, s, l } = hexToHsl(baseColor);

  // Generar paleta pastel suave
  return {
    50: hslToHex(h, Math.min(s * 0.2, 15), 97),
    100: hslToHex(h, Math.min(s * 0.3, 25), 94),
    200: hslToHex(h, Math.min(s * 0.4, 35), 88),
    300: hslToHex(h, Math.min(s * 0.5, 45), 78),
    400: hslToHex(h, Math.min(s * 0.7, 55), 68),
    500: baseColor,
    600: hslToHex(h, Math.min(s * 1.1, 85), l * 0.85),
    700: hslToHex(h, Math.min(s * 1.2, 90), l * 0.7),
    800: hslToHex(h, Math.min(s * 1.3, 95), l * 0.55),
    900: hslToHex(h, Math.min(s * 1.4, 100), l * 0.4),
  };
}

function generateCSSVariables(colors: BrandingColors) {
  const primary = generatePastelPalette(colors.primary);
  const secondary = generatePastelPalette(colors.secondary);
  const accent = generatePastelPalette(colors.accent);

  return {
    // Primary palette (pastel)
    '--primary-50': primary[50],
    '--primary-100': primary[100],
    '--primary-200': primary[200],
    '--primary-300': primary[300],
    '--primary-400': primary[400],
    '--primary-500': primary[500],
    '--primary-600': primary[600],
    '--primary-700': primary[700],
    '--primary-800': primary[800],
    '--primary-900': primary[900],

    // Secondary palette
    '--secondary-50': secondary[50],
    '--secondary-100': secondary[100],
    '--secondary-200': secondary[200],
    '--secondary-500': secondary[500],
    '--secondary-600': secondary[600],
    '--secondary-700': secondary[700],

    // Accent palette
    '--accent-50': accent[50],
    '--accent-100': accent[100],
    '--accent-200': accent[200],
    '--accent-500': accent[500],
    '--accent-600': accent[600],

    // Semantic colors
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-primary-hover': primary[600],
    '--color-primary-light': primary[100],
    '--color-primary-lighter': primary[50],

    // Login background
    '--login-bg-overlay': colors.loginBackground.overlay || 'transparent',
    '--user-highlight': colors.primary,
    '--user-highlight-hover': primary[600],
    '--user-highlight-opaque': `rgba(${hexToRgb(colors.primary)}, 0.2)`,
  };
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ============================================
// CONTEXT DEFINITION
// ============================================

interface TenantContextType {
  tenant: Tenant;
  setTenant: (tenant: Tenant) => void;
  updateBranding: (branding: Partial<Tenant['branding']>) => void;
  cssVariables: Record<string, string>;
  applyTheme: () => void;
  isLoading: boolean;
  isLocked: boolean;
  lockReason?: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: Tenant;
}

export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
  const [tenant, setTenantState] = useState<Tenant>(initialTenant || DEFAULT_TENANT);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar tenant por dominio/subdominio o cargar desde localStorage
  useEffect(() => {
    const detectTenant = () => {
      // 1. Prioridad: Tenant guardado en localStorage (persistencia de sesión)
      const savedTenant = localStorage.getItem('antu_current_tenant');
      if (savedTenant) {
        try {
          setTenantState(JSON.parse(savedTenant));
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Error loading saved tenant', e);
        }
      }

      // 2. Prioridad: Detección por hostname
      const hostname = window.location.hostname;
      if (hostname.includes('solgraf')) {
        setTenantState(EXAMPLE_TENANT_SOLGRAF);
      } else {
        setTenantState(DEFAULT_TENANT);
      }

      setIsLoading(false);
    };

    detectTenant();
  }, []);

  const cssVariables = useMemo(() => {
    return generateCSSVariables(tenant.branding.colors);
  }, [tenant.branding.colors]);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [cssVariables]);

  // Aplicar tema automáticamente cuando cambia el tenant
  useEffect(() => {
    if (!isLoading) {
      applyTheme();
    }
  }, [applyTheme, isLoading]);

  const setTenant = useCallback((newTenant: Tenant) => {
    setTenantState(newTenant);
    localStorage.setItem('antu_current_tenant', JSON.stringify(newTenant));
  }, []);

  const updateBranding = useCallback((branding: Partial<Tenant['branding']>) => {
    setTenantState((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        ...branding,
        colors: {
          ...prev.branding.colors,
          ...(branding.colors || {}),
        },
        login: {
          ...prev.branding.login,
          ...(branding.login || {}),
        },
        logo: {
          ...prev.branding.logo,
          ...(branding.logo || {}),
        },
      },
    }));
  }, []);

  const isLocked = useMemo(() => {
    if (!tenant.subscription) return false;
    const { status, gracePeriodEndsAt } = tenant.subscription;

    if (status === 'UNPAID' || status === 'SUSPENDED') return true;
    if (status === 'PAST_DUE') {
      if (!gracePeriodEndsAt) return true;
      return new Date() > new Date(gracePeriodEndsAt);
    }
    return false;
  }, [tenant.subscription]);

  const lockReason = useMemo(() => {
    if (!isLocked || !tenant.subscription) return undefined;
    const { status } = tenant.subscription;
    if (status === 'SUSPENDED') return 'Cuenta suspendida por administración';
    if (status === 'UNPAID') return 'Pago no recibido';
    if (status === 'PAST_DUE') return 'Periodo de gracia vencido';
    return 'Problema con la suscripción';
  }, [isLocked, tenant.subscription]);

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      updateBranding,
      cssVariables,
      applyTheme,
      isLoading,
      isLocked,
      lockReason,
    }),
    [tenant, setTenant, updateBranding, cssVariables, applyTheme, isLoading, isLocked, lockReason]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// ============================================
// UTILIDADES EXPORTADAS
// ============================================

export { generatePastelPalette, generateCSSVariables, hexToHsl, hslToHex };
