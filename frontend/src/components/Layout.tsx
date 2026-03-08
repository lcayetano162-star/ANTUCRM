import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  FileText,
  ClipboardList,
  LogOut,
  Menu,
  Crown,
  Mail,
  TrendingUp,
  Settings,
  Wrench,
  Package,
  Receipt,
  Plug,
  Zap,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

// nav key = Spanish label (used as translation key)
const ALL_NAV = [
  { name: 'Dashboard',        href: '/dashboard',    icon: LayoutDashboard },
  { name: 'Clientes',         href: '/clients',      icon: Users,          module: 'crm' },
  { name: 'Contactos',        href: '/contacts',     icon: UserCircle,     module: 'crm' },
  { name: 'Oportunidades',    href: '/opportunities', icon: Briefcase,     module: 'crm' },
  { name: 'Cotizaciones',     href: '/quotes',       icon: FileText,       module: 'cpq' },
  { name: 'Actividades',      href: '/activities',   icon: ClipboardList,  module: 'activities' },
  { name: 'Marketing',        href: '/marketing',    icon: Mail,           module: 'marketing' },
  { name: 'Mi Desempeño',     href: '/performance',  icon: TrendingUp,     module: 'performance' },
  { name: 'Inventario',       href: '/inventory',    icon: Package,        module: 'inventory' },
  { name: 'Facturación',      href: '/invoicing',    icon: Receipt,        module: 'invoicing' },
  { name: 'Servicio Técnico', href: '/service-desk',  icon: Wrench,  module: 'service_desk' },
  { name: 'Automatizaciones', href: '/automations',   icon: Zap,           module: 'crm' },
  { name: 'Antü Coach IA',   href: '/coach-ia',      icon: GraduationCap, module: 'crm' },
  { name: 'Integraciones',   href: '/integrations',  icon: Plug },
  { name: 'Configuración',    href: '/settings',      icon: Settings },
]

export default function Layout() {
  const location    = useLocation()
  const navigate    = useNavigate()
  const { user, clearAuth, isSuperAdmin, enabledModules } = useAuthStore()
  const { toast }   = useToast()
  const { t, lang } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = ALL_NAV.filter(item => !item.module || enabledModules[item.module] !== false)

  const handleLogout = () => {
    clearAuth()
    toast({
      title:       t('Sesión cerrada'),
      description: t('Has cerrado sesión exitosamente.'),
    })
    navigate('/login')
  }

  const dateLocale = lang === 'en' ? 'en-US' : 'es-DO'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-cyan-600">Antü</span>
            <span className="text-sm text-gray-500">CRM</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.name)}
              </Link>
            )
          })}

          {/* Super Admin Link */}
          {isSuperAdmin && (
            <Link
              to="/super-admin/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors mt-4"
            >
              <Crown className="w-5 h-5" />
              {t('Panel Super Admin')}
            </Link>
          )}
        </nav>

        {/* User info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <span className="text-cyan-700 font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('Cerrar sesión')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString(dateLocale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
