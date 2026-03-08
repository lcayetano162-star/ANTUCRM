// ============================================
// MOBILE LAYOUT - Main layout for mobile app
// Bottom navigation, mobile-optimized header
// ============================================

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Target, 
  Briefcase,
  Settings,
  Menu,
  Bell,
  ChevronLeft,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePWA } from '@/hooks/usePWA';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, triggerSync } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Check for install banner
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('install-banner-dismissed');
    
    if (!isStandalone && !dismissed) {
      setShowInstallBanner(true);
    }
  }, []);

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/clients')) return 'Clientes';
    if (path.includes('/opportunities')) return 'Oportunidades';
    if (path.includes('/tasks')) return 'Tareas';
    if (path.includes('/checkin')) return 'Check-in';
    if (path.includes('/settings')) return 'Configuración';
    return 'Antu CRM';
  };

  const showBackButton = location.pathname !== '/mobile/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo192.png" alt="Antu" className="w-10 h-10 rounded-xl" />
              <div>
                <p className="font-medium">Instala Antu CRM</p>
                <p className="text-xs opacity-90">Acceso más rápido, sin navegador</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Instalar
              </Button>
              <button onClick={dismissInstallBanner} className="p-1">
                <span className="text-xl">&times;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full active:bg-gray-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : null}
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Offline indicator */}
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs mr-2">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            
            {/* Sync indicator */}
            {isSyncing && (
              <div className="p-2 mr-1">
                <RefreshCw className="w-5 h-5 text-[#128C7E] animate-spin" />
              </div>
            )}
            
            {/* Notifications */}
            <button className="p-2 relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col h-full py-6">
                  <div className="px-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-bold text-lg">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="flex-1 space-y-1 px-2">
                    <MobileNavLink to="/mobile/settings" icon={Settings}>
                      Configuración
                    </MobileNavLink>
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesión
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex items-center justify-around h-16">
          <BottomNavLink to="/mobile/dashboard" icon={Home} label="Inicio" />
          <BottomNavLink to="/mobile/clients" icon={Users} label="Clientes" />
          <BottomNavLink to="/mobile/opportunities" icon={Target} label="Oportunidades" />
          <BottomNavLink to="/mobile/tasks" icon={Briefcase} label="Tareas" />
        </div>
        
        {/* Safe area for iPhone X+ */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>
    </div>
  );
}

// Bottom navigation link
function BottomNavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center flex-1 h-full py-1",
          "transition-colors",
          isActive ? "text-[#128C7E]" : "text-gray-400"
        )
      }
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
    </NavLink>
  );
}

// Mobile nav link for sheet
function MobileNavLink({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive 
            ? "bg-[#128C7E]/10 text-[#128C7E]" 
            : "text-gray-700 hover:bg-gray-100"
        )
      }
    >
      <Icon className="w-5 h-5" />
      {children}
    </NavLink>
  );
}

export default MobileLayout;
