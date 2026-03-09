// ============================================
// ANTU CRM - Sidebar Component (Left Navigation)
// RBAC + ABAC - Navigation based on permissions
// ============================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  FileText,
  Package,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  TrendingUp,
  CreditCard,
  Receipt,
  UserCog,
  Target,
  Megaphone,
  Users,
  Users2,
  ChevronDown,
  Layout,
  Wrench,
} from 'lucide-react';

// ============================================
// NAVIGATION ITEMS WITH PERMISSIONS
// ============================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  permission: string;
  badge?: number;
  badgeColor?: string;
  children?: NavItem[];
}

// Main navigation items with required permissions
const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: LayoutDashboard,
    path: '/',
    permission: 'dashboard:view_own',
  },
  {
    id: 'vendedores',
    label: 'navigation.vendedores',
    icon: Users2,
    path: '/vendedores',
    permission: 'vendedores:view',
  },
  {
    id: 'performance',
    label: 'navigation.performance',
    icon: TrendingUp,
    path: '/performance',
    permission: 'performance:view',
  },
  {
    id: 'activities',
    label: 'navigation.activities',
    icon: CheckSquare,
    path: '/activities',
    permission: 'activities:view',
  },
  {
    id: 'clients',
    label: 'navigation.clients',
    icon: Building2,
    path: '/clients',
    permission: 'clients:view',
  },
  {
    id: 'contacts',
    label: 'navigation.contacts',
    icon: Users,
    path: '/contacts',
    permission: 'contacts:view',
  },
  {
    id: 'opportunities',
    label: 'navigation.opportunities',
    icon: Target,
    path: '/opportunities',
    permission: 'opportunities:view',
  },
  {
    id: 'general-quotes',
    label: 'navigation.generalQuotes',
    icon: FileText,
    path: '/general-quotes',
    permission: 'quotes:view',
  },
  {
    id: 'quotes-mfp',
    label: 'navigation.quotesMFP',
    icon: FileText,
    path: '/quotes',
    permission: 'quotes:view',
  },
  {
    id: 'quotes',
    label: 'navigation.quotes',
    icon: FileText,
    path: '/quotes',
    permission: 'quotes:view',
  },
  {
    id: 'service',
    label: 'Servicio Técnico',
    icon: Wrench,
    path: '/service',
    permission: 'activities:view',
  },
  {
    id: 'inventory',
    label: 'navigation.inventory',
    icon: Package,
    path: '/inventory',
    permission: 'inventory:view',
  },
  {
    id: 'billing',
    label: 'navigation.billing',
    icon: Receipt,
    path: '/billing',
    permission: 'billing:view',
  },
  {
    id: 'cxc',
    label: 'navigation.cxc',
    icon: CreditCard,
    path: '/cxc',
    permission: 'cxc:view',
  },
  {
    id: 'marketing',
    label: 'navigation.marketing',
    icon: Megaphone,
    path: '/marketing',
    permission: 'dashboard:view_own',
  },
  {
    id: 'reports',
    label: 'navigation.reports',
    icon: BarChart3,
    path: '/reports',
    permission: 'reports:view_own',
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'settings',
    label: 'settings.title',
    icon: Settings,
    path: '/settings',
    permission: 'settings:view',
  },
  {
    id: 'users',
    label: 'settings.tabs.users',
    icon: UserCog,
    path: '/settings/users',
    permission: 'users:view',
  },
  {
    id: 'quotas',
    label: 'Configuración de Cuotas',
    icon: Target,
    path: '/settings/quotas',
    permission: 'settings:edit',
  },
];

const PLATFORM_ADMIN_ITEMS: NavItem[] = [
  {
    id: 'saas-metrics',
    label: 'navigation.saasMetrics',
    icon: TrendingUp,
    path: '/admin/saas-metrics',
    permission: 'reports:view_all',
  },
  {
    id: 'platform-settings',
    label: 'navigation.platformSettings',
    icon: Layout,
    path: '/admin/platform',
    permission: 'settings:edit',
  },
  {
    id: 'platform-users',
    label: 'navigation.users',
    icon: UserCog,
    path: '/admin/platform?tab=users',
    permission: 'users:view',
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, canAccessModule } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const isAdminView = location.pathname.startsWith('/admin');
  const showCommercialModules = !isAdminView || !isPlatformAdmin;

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    // Check children first to determine visibility of parent group
    const accessibleChildren = item.children?.filter(child =>
      hasPermission(child.permission as any) && canAccessModule(child.id)
    ) || [];

    const hasChildren = item.children && item.children.length > 0;

    // Permission check for the item
    const hasPermissionAccess = hasPermission(item.permission as any);
    const hasPlanAccess = hasChildren ? accessibleChildren.length > 0 : canAccessModule(item.id);

    const hasAccess = hasPermissionAccess && hasPlanAccess;

    if (!hasAccess) return null;

    const active = isActive(item.path);
    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.id);

    const content = (
      <div className="space-y-1">
        <button
          onClick={(e) => {
            if (hasChildren && !collapsed) {
              toggleExpand(item.id, e);
            } else {
              navigate(item.path);
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'group relative',
            active && !hasChildren
              ? 'bg-[rgb(94,217,207)] text-white shadow-[0_4px_12px_rgba(94,217,207,0.4)]'
              : 'text-slate-500 hover:bg-[rgba(94,217,207,0.1)] hover:text-[rgb(94,217,207)]',
            collapsed && 'justify-center px-2',
            isChild && 'pl-11 py-2'
          )}
        >
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
              active && !hasChildren
                ? 'bg-white/20 text-white border border-white/10'
                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[rgb(94,217,207)]',
              isChild && 'w-2 h-2 rounded-full bg-slate-200'
            )}
          >
            {!isChild ? <Icon className="w-5 h-5" /> : null}
          </div>

          {
            !collapsed && (
              <>
                <span className={cn(
                  "flex-1 text-left text-sm font-medium",
                  active && !hasChildren ? "text-white" : "text-slate-600"
                )}>
                  {item.label.includes('.') ? t(item.label) : item.label}
                </span>

                {hasChildren && (
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    active ? "text-white" : "text-slate-400",
                    isExpanded ? "rotate-180" : ""
                  )} />
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="default"
                    className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold ${item.badgeColor || 'bg-[var(--user-highlight)]'}`}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </>
            )
          }

          {
            collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${item.badgeColor || 'bg-[var(--user-highlight)]'}`}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )
          }
        </button >

        {hasChildren && isExpanded && !collapsed && (
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.children?.map(child => renderNavItem(child, true))}
          </div>
        )
        }
      </div >
    );

    if (collapsed) {
      return (
        <TooltipProvider key={item.id} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {t(item.label)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.id}>{content}</div>;
  };

  // Get user initials
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Get role display name
  const getRoleDisplay = (role?: string) => {
    if (!role) return t('auth.roles.user');
    const roleKey = role.toLowerCase().replace('_', '');
    // Mapping specific keys if needed, or follow a pattern
    const mapping: Record<string, string> = {
      'platformadmin': 'superAdmin',
      'tenantadmin': 'admin',
      'salesmanager': 'manager',
      'salesrep': 'user',
    };
    const key = mapping[roleKey] || 'user';
    return t(`auth.roles.${key}`);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-[60]',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            'py-4 flex flex-col items-center justify-center border-b border-slate-100 transition-all duration-300',
            collapsed ? 'px-2 min-h-[4rem]' : 'px-4 min-h-[5rem]'
          )}
        >
          <img
            src="/antu-logo.png"
            alt="Antü CRM"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed ? "w-[22px] h-auto" : "w-[60px] h-auto"
            )}
          />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
          <nav className="space-y-4 px-3 py-4 h-full">
            {/* Platform Admin Navigation */}
            {isPlatformAdmin && (
              <div>
                {!collapsed && (
                  <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {t('navigation.superAdmin')}
                  </p>
                )}
                <div className="space-y-1">
                  {/* Link a CRM solo si estamos en vista admin */}
                  {isAdminView && renderNavItem({
                    id: 'back-to-crm',
                    label: 'navigation.backToCrm',
                    icon: LayoutDashboard,
                    path: '/',
                    permission: 'dashboard:view_own',
                  })}
                  {PLATFORM_ADMIN_ITEMS.map((item) => renderNavItem(item))}
                </div>
              </div>
            )}

            {/* Main Navigation */}
            {showCommercialModules && (
              <div className="mb-4">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {t('navigation.main')}
                  </p>
                )}
                <div className="space-y-1">
                  {MAIN_NAV_ITEMS.map((item) => renderNavItem(item))}
                </div>
              </div>
            )}

            {/* Admin Navigation */}
            {showCommercialModules && (
              <PermissionGate permission="settings:edit">
                <div className="mb-4">
                  {!collapsed && (
                    <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {t('navigation.admin')}
                    </p>
                  )}
                  <div className="space-y-1">
                    {ADMIN_NAV_ITEMS.map((item) => renderNavItem(item))}
                  </div>
                </div>
              </PermissionGate>
            )}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="p-3 border-t border-slate-100">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl transition-colors',
              'hover:bg-slate-50',
              collapsed && 'justify-center'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-300)] flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--color-primary)] font-semibold text-sm">
                {getInitials(user?.firstName, user?.lastName)}
              </span>
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {getRoleDisplay(user?.role)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-[rgb(94,217,207)] hover:bg-[rgba(94,217,207,0.1)]"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggle}
          className={cn(
            'absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200',
            'flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)]',
            'hover:border-[var(--color-primary)] transition-all duration-200 shadow-sm'
          )}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;
