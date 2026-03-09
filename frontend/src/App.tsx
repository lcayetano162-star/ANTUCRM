// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - Main App Component
// Code-split architecture with lazy loading for optimal performance
// ═══════════════════════════════════════════════════════════════════════════════

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { TenantProvider } from '@/contexts/TenantContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { PageLoader } from '@/components/loading/PageLoader';
import { Toaster } from '@/components/ui/sonner';
import type { Permission } from '@/types/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// EAGER LOADS (Critical path)
// ═══════════════════════════════════════════════════════════════════════════════

// Layout and auth pages are loaded immediately (critical for first render)
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADS (Code-split by route)
// ═══════════════════════════════════════════════════════════════════════════════

// Auth pages (non-critical)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
);

// Main pages (lazy loaded)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
const OpportunitiesPage = lazy(() =>
  import('@/pages/OpportunitiesPage').then(m => ({ default: m.OpportunitiesPage }))
);
const ContactsPage = lazy(() =>
  import('@/pages/ContactsPage').then(m => ({ default: m.ContactsPage }))
);
const UserManagementPage = lazy(() =>
  import('@/pages/settings/UserManagementPage').then(m => ({ default: m.UserManagementPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ChangePasswordPage = lazy(() =>
  import('@/pages/settings/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage }))
);
const VendedoresPage = lazy(() =>
  import('@/pages/VendedoresPage').then(m => ({ default: m.VendedoresPage }))
);
const PerformancePage = lazy(() =>
  import('@/pages/PerformancePage').then(m => ({ default: m.PerformancePage }))
);
const QuotaConfigPage = lazy(() =>
  import('@/pages/QuotaConfigPage').then(m => ({ default: m.QuotaConfigPage }))
);

// Feature pages (lazy loaded with prefetch)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage }))
);
const CustomersPage = lazy(() =>
  import('@/pages/CustomersPage').then(m => ({ default: m.CustomersPage }))
);
const QuotesPage = lazy(() =>
  import('@/pages/QuotesPage').then(m => ({ default: m.QuotesPage }))
);
const GeneralQuotesPage = lazy(() => import('./pages/GeneralQuotesPage'));
const MarketingPage = lazy(() =>
  import('@/modules/marketing/pages/MarketingPage').then(m => ({ default: m.MarketingPage }))
);
const ActivitiesPage = lazy(() =>
  import('@/pages/ActivitiesPage').then(m => ({ default: m.ActivitiesPage }))
);
const InventoryPage = lazy(() =>
  import('@/pages/InventoryPage').then(m => ({ default: m.InventoryPage }))
);
const InvoicesPage = lazy(() =>
  import('@/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage }))
);
const ReceivablesPage = lazy(() => import('@/pages/ReceivablesPage'));
const TasksPage = lazy(() =>
  import('@/pages/TasksPage').then(m => ({ default: m.TasksPage }))
);
const SaaSMetricsPage = lazy(() =>
  import('@/pages/SaaSMetricsPage').then(m => ({ default: m.SaaSMetricsPage }))
);
const SuperAdminPage = lazy(() =>
  import('@/pages/SuperAdminPage').then(m => ({ default: m.SuperAdminPage }))
);
const ServicePage = lazy(() =>
  import('@/pages/ServicePage').then(m => ({ default: m.ServicePage }))
);

// ═══════════════════════════════════════════════════════════════════════════════
// PREFETCH HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prefetch a route component for faster navigation
 * Call this on hover or when a route is likely to be visited
 */
export function prefetchRoute(route: string): void {
  const prefetchMap: Record<string, () => Promise<unknown>> = {
    '/opportunities': () => import('@/pages/OpportunitiesPage'),
    '/clients': () => import('@/pages/CustomersPage'),
    '/contacts': () => import('@/pages/ContactsPage'),
    '/quotes': () => import('@/pages/QuotesPage'),
    '/general-quotes': () => import('./pages/GeneralQuotesPage'),
    '/activities': () => import('@/pages/ActivitiesPage'),
    '/inventory': () => import('@/pages/InventoryPage'),
    '/billing': () => import('@/pages/InvoicesPage'),
    '/cxc': () => import('@/pages/ReceivablesPage'),
    '/tasks': () => import('@/pages/TasksPage'),
    '/settings/users': () => import('@/pages/settings/UserManagementPage'),
    '/settings/quotas': () => import('@/pages/QuotaConfigPage'),
    '/vendedores': () => import('@/pages/VendedoresPage'),
    '/performance': () => import('@/pages/PerformancePage'),
  };

  const prefetchFn = prefetchMap[route];
  if (prefetchFn && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchFn().catch(() => {
        // Silently fail prefetch - not critical
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE PROTECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  requiredModule?: string;
}

function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  requiredModule
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, isLoading, canAccessModule } = useAuth();

  if (isLoading) {
    return <PageLoader showLogo minDuration={0} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  // Check module access
  if (requiredModule && !canAccessModule(requiredModule)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader showLogo minDuration={0} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY ROUTE WRAPPER
// Wraps lazy components with Suspense and ErrorBoundary
// ═══════════════════════════════════════════════════════════════════════════════

interface LazyRouteProps {
  children: React.ReactNode;
  minDuration?: number;
}

function LazyRoute({ children, minDuration = 200 }: LazyRouteProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader minDuration={minDuration} showLogo />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <LazyRoute>
              <ForgotPasswordPage />
            </LazyRoute>
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <LazyRoute>
              <ResetPasswordPage />
            </LazyRoute>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - Home */}
        <Route
          index
          element={
            <LazyRoute minDuration={300}>
              <DashboardPage />
            </LazyRoute>
          }
        />

        {/* Sales Performance */}
        <Route
          path="performance"
          element={
            <ProtectedRoute requiredPermission="performance:view">
              <LazyRoute>
                <PerformancePage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Opportunities */}
        <Route
          path="opportunities"
          element={
            <ProtectedRoute requiredPermission="opportunities:view">
              <LazyRoute>
                <OpportunitiesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Clients */}
        <Route
          path="clients"
          element={
            <ProtectedRoute requiredPermission="clients:view">
              <LazyRoute>
                <CustomersPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="contacts"
          element={
            <ProtectedRoute requiredPermission="contacts:view">
              <LazyRoute>
                <ContactsPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* General Quotes */}
        <Route
          path="general-quotes"
          element={
            <ProtectedRoute requiredPermission="quotes:view" requiredModule="general-quotes">
              <LazyRoute>
                <GeneralQuotesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Quotes MFP */}
        <Route
          path="quotes"
          element={
            <ProtectedRoute requiredPermission="quotes:view" requiredModule="quotes-mfp">
              <LazyRoute>
                <QuotesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Marketing */}
        <Route
          path="marketing"
          element={
            <ProtectedRoute requiredPermission="dashboard:view_own">
              <LazyRoute>
                <MarketingPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Activities */}
        <Route
          path="activities"
          element={
            <ProtectedRoute requiredPermission="activities:view">
              <LazyRoute>
                <ActivitiesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="inventory"
          element={
            <ProtectedRoute requiredPermission="inventory:view">
              <LazyRoute>
                <InventoryPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Billing */}
        <Route
          path="billing"
          element={
            <ProtectedRoute requiredPermission="billing:view">
              <LazyRoute>
                <InvoicesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* CxC */}
        <Route
          path="cxc"
          element={
            <ProtectedRoute requiredPermission="cxc:view">
              <LazyRoute>
                <ReceivablesPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Tasks */}
        <Route
          path="tasks"
          element={
            <ProtectedRoute requiredPermission="activities:view">
              <LazyRoute>
                <TasksPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Servicio Técnico */}
        <Route
          path="service"
          element={
            <ProtectedRoute requiredPermission="activities:view">
              <LazyRoute>
                <ServicePage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredPermission="reports:view_own">
              <LazyRoute>
                <ReportsPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Vendedores */}
        <Route
          path="vendedores"
          element={
            <ProtectedRoute requiredPermission="vendedores:view">
              <LazyRoute>
                <VendedoresPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredPermission="settings:view">
              <LazyRoute>
                <SettingsPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/users"
          element={
            <ProtectedRoute requiredPermission="users:view">
              <LazyRoute>
                <UserManagementPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/security"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <ChangePasswordPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/quotas"
          element={
            <ProtectedRoute requiredPermission="settings:edit">
              <LazyRoute>
                <QuotaConfigPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Routes */}
        <Route
          path="admin/saas-metrics"
          element={
            <ProtectedRoute requiredPermission="reports:view_all">
              <LazyRoute>
                <SaaSMetricsPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/platform"
          element={
            <ProtectedRoute requiredPermission="settings:edit">
              <LazyRoute>
                <SuperAdminPage />
              </LazyRoute>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL TO TOP UTILITY
// ═══════════════════════════════════════════════════════════════════════════════
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'border-slate-200',
              }}
            />
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
