import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { LanguageProvider } from '@/contexts/LanguageContext'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Clients from '@/pages/Clients'
import Contacts from '@/pages/Contacts'
import Opportunities from '@/pages/Opportunities'
import Quotes from '@/pages/Quotes'
import Activities from '@/pages/Activities'
import Marketing from '@/pages/Marketing'
import MyPerformance from '@/pages/MyPerformance'
import Settings from '@/pages/Settings'
import SuperAdminDashboard from '@/pages/super-admin/SuperAdminDashboard'
import SuperAdminPlans from '@/pages/super-admin/SuperAdminPlans'
import SuperAdminTenants from '@/pages/super-admin/SuperAdminTenants'
import SuperAdminAdmins from '@/pages/super-admin/SuperAdminAdmins'
import SuperAdminGlobalUsers from '@/pages/super-admin/SuperAdminGlobalUsers'
import SuperAdminBilling from '@/pages/super-admin/SuperAdminBilling'
import SuperAdminSettings from '@/pages/super-admin/SuperAdminSettings'
import SuperAdminLogs from '@/pages/super-admin/SuperAdminLogs'
import ServicePage from '@/pages/ServicePage'
import Inventory from '@/pages/Inventory'
import Invoicing from '@/pages/Invoicing'
import IntegrationsPage from '@/pages/Integrations'
import Automations from '@/pages/Automations'
import CoachIA from '@/pages/CoachIA'
import Email from '@/pages/Email'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Layout from '@/components/Layout'
import SuperAdminLayout from '@/components/SuperAdminLayout'

// Mobile Pages
import { 
  MobileLayout, 
  MobileDashboard, 
  MobileClients, 
  MobileOpportunities, 
  MobileTasks, 
  MobileCheckIn 
} from '@/pages/mobile'

// Protected Route Component
function ProtectedRoute({ children, requireSuperAdmin = false }: { children: React.ReactNode, requireSuperAdmin?: boolean }) {
  const { isAuthenticated, isSuperAdmin } = useAuthStore()
  const { isMobile } = useIsMobile()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Mobile Redirect - Redirect mobile users to mobile app
function MobileRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const { isMobile, isStandalone } = useIsMobile()
  const currentPath = window.location.pathname
  
  if (!isAuthenticated) {
    return <>{children}</>
  }
  
  // If on mobile and not already in mobile routes, redirect to mobile app
  if ((isMobile || isStandalone) && !currentPath.startsWith('/mobile')) {
    return <Navigate to="/mobile/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Mobile Routes */}
        <Route path="/mobile" element={
          <ProtectedRoute>
            <MobileLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/mobile/dashboard" replace />} />
          <Route path="dashboard" element={<MobileDashboard />} />
          <Route path="clients" element={<MobileClients />} />
          <Route path="opportunities" element={<MobileOpportunities />} />
          <Route path="tasks" element={<MobileTasks />} />
          <Route path="checkin" element={<MobileCheckIn />} />
        </Route>

        {/* Protected Tenant Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MobileRedirect>
              <Layout />
            </MobileRedirect>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="activities" element={<Activities />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="performance" element={<MyPerformance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="service-desk" element={<ServicePage />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="invoicing" element={<Invoicing />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="automations" element={<Automations />} />
          <Route path="coach-ia" element={<CoachIA />} />
          <Route path="email" element={<Email />} />
        </Route>
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" element={
          <ProtectedRoute requireSuperAdmin>
            <SuperAdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="plans" element={<SuperAdminPlans />} />
          <Route path="tenants" element={<SuperAdminTenants />} />
          <Route path="admins" element={<SuperAdminAdmins />} />
          <Route path="users" element={<SuperAdminGlobalUsers />} />
          <Route path="billing" element={<SuperAdminBilling />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="logs" element={<SuperAdminLogs />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
      <SonnerToaster richColors position="top-right" />
    </LanguageProvider>
  )
}

export default App
