// ============================================
// ANTU CRM - PERMISSION GATE COMPONENT
// Control de acceso a elementos de UI basado en permisos
// ============================================

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Permission, UserRole } from '@/types/auth';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// ============================================
// PERMISSION GATE PROPS
// ============================================

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  role?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
  lockMessage?: string;
}

// ============================================
// PERMISSION GATE COMPONENT
// ============================================

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  fallback = null,
  showLockIcon = false,
  lockMessage = 'No tienes permiso para ver esto',
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  // Check permission-based access
  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && hasAllPermissions(permissions);
    } else {
      hasAccess = hasAccess && hasAnyPermission(permissions);
    }
  }

  // Check role-based access
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback or lock icon
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockIcon) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm p-2">
        <Lock className="w-4 h-4" />
        <span>{lockMessage}</span>
      </div>
    );
  }

  return null;
}

// ============================================
// PERMISSION BUTTON COMPONENT
// Botón que se deshabilita visualmente si no hay permiso
// ============================================

interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
  permission: Permission;
  disabledMessage?: string;
}

export function PermissionButton({
  permission,
  disabledMessage = 'No tienes permiso para esta acción',
  children,
  className,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { hasPermission } = useAuth();
  const hasAccess = hasPermission(permission);

  return (
    <Button
      className={cn(className)}
      disabled={disabled || !hasAccess}
      title={!hasAccess ? disabledMessage : undefined}
      {...props}
    >
      {!hasAccess && <Lock className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  );
}

// ============================================
// PERMISSION LINK COMPONENT
// Enlace que se oculta si no hay permiso
// ============================================

interface PermissionLinkProps extends React.ComponentProps<typeof Link> {
  permission: Permission;
}

export function PermissionLink({
  permission,
  children,
  ...props
}: PermissionLinkProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return null;
  }

  return <Link {...props}>{children}</Link>;
}

// ============================================
// MODULE ACCESS GATE
// Control de acceso a módulos completos
// ============================================

interface ModuleAccessGateProps {
  children: React.ReactNode;
  moduleId: string;
  fallback?: React.ReactNode;
}

export function ModuleAccessGate({
  children,
  moduleId,
  fallback = null,
}: ModuleAccessGateProps) {
  const { canAccessModule } = useAuth();
  const hasAccess = canAccessModule(moduleId);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ADMIN ONLY GATE
// Atajo para elementos solo de administrador
// ============================================

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <PermissionGate 
      role={['TENANT_ADMIN', 'PLATFORM_ADMIN']} 
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

// ============================================
// MANAGER ONLY GATE
// Atajo para elementos de gerente o superior
// ============================================

interface ManagerOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ManagerOnly({ children, fallback = null }: ManagerOnlyProps) {
  return (
    <PermissionGate 
      role={['TENANT_ADMIN', 'PLATFORM_ADMIN', 'SALES_MANAGER']} 
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

// ============================================
// OWNER OR ADMIN GATE
// Para recursos que solo el propietario o admin puede ver/editar
// ============================================

interface OwnerOrAdminProps {
  children: React.ReactNode;
  ownerId: string;
  fallback?: React.ReactNode;
}

export function OwnerOrAdmin({ children, ownerId, fallback = null }: OwnerOrAdminProps) {
  const { user, hasRole } = useAuth();
  
  const isOwner = user?.id === ownerId;
  const isAdmin = hasRole(['TENANT_ADMIN', 'PLATFORM_ADMIN']);
  
  if (isOwner || isAdmin) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
