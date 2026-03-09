import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { BillingBlocker } from '../payments/BillingBlocker';
import { Button } from '@/components/ui/button';
import { Shield, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { originalUser, stopImpersonation, user } = useAuth();
  const { isLocked } = useTenant();
  const location = useLocation();

  const isBillingPage = location.pathname === '/settings' && location.search.includes('tab=billing');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Billing Lock System */}
      {isLocked && !isBillingPage && <BillingBlocker />}
      {/* Impersonation Banner */}
      {originalUser && (
        <div
          className={cn(
            "fixed bottom-6 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500 transition-all",
            sidebarCollapsed ? "left-[calc(50%+40px)]" : "left-[calc(50%+128px)]",
            "-translate-x-1/2"
          )}
        >
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Modo Simulación</span>
                <span className="text-sm font-bold leading-none">
                  {user?.fullName} <span className="text-slate-400 font-normal ml-1">({user?.tenantName})</span>
                </span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-700" />

            <Button
              onClick={stopImpersonation}
              className="bg-white text-slate-900 hover:bg-slate-100 border-0 h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 group transition-all"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Volver a Super Admin
            </Button>
          </div>
        </div>
      )}

      {/* Global Header */}
      <div className="print:hidden">
        <Header sidebarCollapsed={sidebarCollapsed} />
      </div>

      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 print:m-0 print:p-0 print:pt-0',
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8 print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
