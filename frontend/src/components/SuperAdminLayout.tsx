import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Globe,
  CreditCard,
  Settings,
  FileText,
  LogOut,
  Menu,
  ArrowLeft,
  Shield,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const navigation = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Empresas', href: '/super-admin/tenants', icon: Building2 },
  { name: 'Usuarios Globales', href: '/super-admin/users', icon: Globe },
  { name: 'Planes y Facturación', href: '/super-admin/billing', icon: CreditCard },
  { name: 'Configuración', href: '/super-admin/settings', icon: Settings },
  { name: 'Logs y Auditoría', href: '/super-admin/logs', icon: FileText },
]

export default function SuperAdminLayout() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente.',
    })
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/super-admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold text-slate-800">Antü CRM</span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Super Admin</span>
            </div>
          </Link>
        </div>

        {/* Back to CRM */}
        <div className="p-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Volver al CRM')}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet-50 text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-violet-600" : "text-slate-400")} />
                {t(item.name)}
              </Link>
            )
          })}
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-slate-600">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 rounded-xl hover:bg-slate-100 relative transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full ring-2 ring-white"></span>
            </button>
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-0 font-medium">
              <Shield className="w-3 h-3 mr-1.5" />
              Super Admin
            </Badge>
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
