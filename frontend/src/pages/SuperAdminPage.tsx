// ============================================
// ANTU CRM - Super Admin Page
// Panel de gestión de tenants y personalización
// ============================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';
import { ROLE_LABELS } from '@/types/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Tenant, LoginBackgroundType } from '@/types/tenant';
import { DEFAULT_TENANT, EXAMPLE_TENANT_SOLGRAF } from '@/types/tenant';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2,
  Palette,
  Layout,
  Plus,
  Trash2,
  Check,
  Eye,
  Save,
  RotateCcw,
  ExternalLink,
  BarChart3,
  Users2,
  TrendingUp,
  Package,
  Settings,
  FileText,
  CreditCard,
  Receipt,
  Globe,
  Phone,
  MapPin,
  Mail,
  User,
  UserCog,
  Brain,
  Cpu,
  Zap,
  Shield,
  ShieldCheck,
  Activity,
  UserPlus,
  LayoutDashboard,
  Target,
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  Landmark,
  Scale,
  Info,
  FileCheck,
  Globe2,
} from 'lucide-react';

// ============================================
// MOCK TENANTS
// ============================================

const MOCK_TENANTS: Tenant[] = [
  DEFAULT_TENANT,
  EXAMPLE_TENANT_SOLGRAF,
  {
    id: 'techsol_001',
    name: 'TechSolutions RD',
    subdomain: 'techsol',
    isActive: true,
    currency: 'DOP',
    timezone: 'America/Santo_Domingo',
    branding: {
      logo: {
        light: 'https://via.placeholder.com/200x60/5ED9CF/FFFFFF?text=TechSol',
        dark: 'https://via.placeholder.com/200x60/5ED9CF/FFFFFF?text=TechSol',
        favicon: '/favicon.ico',
      },
      colors: {
        primary: '#5ED9CF',
        secondary: '#4BC9BF',
        accent: '#F59E0B',
        loginBackground: {
          type: 'solid' as LoginBackgroundType,
          value: '#1E293B',
        },
      },
      login: {
        title: 'Bienvenido a TechSolutions',
        subtitle: 'Gestiona tus proyectos y clientes',
        showDemoCredentials: false,
        customMessage: 'Soporte técnico: soporte@techsol.com',
        features: [
          { icon: 'BarChart3', title: 'Gestión de Proyectos', description: 'Seguimiento de desarrollo' },
          { icon: 'Users', title: 'Clientes', description: 'Base de datos de clientes' },
          { icon: 'ClipboardList', title: 'Tickets', description: 'Soporte al cliente' },
        ],
      },
    },
    features: {
      modules: ['dashboard', 'contacts', 'opportunities'],
      enableForecast: true,
      enableAI: true,
    },
    limits: {
      maxUsers: 50,
      maxStorage: 5000,
      maxOpportunities: 2000,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================
// COLOR PICKER COMPONENT
// ============================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-700">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer overflow-hidden"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-sm"
        />
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  );
}

// ============================================
// TENANT LIST ITEM
// ============================================

interface TenantListItemProps {
  tenant: Tenant;
  isSelected: boolean;
  onSelect: () => void;
}

function TenantListItem({ tenant, isSelected, onSelect }: TenantListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left',
        isSelected
          ? 'bg-[rgba(94,217,207,0.1)] border-2 border-[rgb(94,217,207)]'
          : 'bg-white border-2 border-transparent hover:bg-slate-50'
      )}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[rgb(94,217,207)] shadow-sm shadow-[rgba(94,217,207,0.3)]"
      >
        <span className="text-white font-bold text-sm">{tenant.name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{tenant.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400">{tenant.subdomain}.antucrm.com</p>
          <Badge variant="outline" className="text-[10px] h-4 border-slate-100 bg-slate-50 text-slate-500">{tenant.currency}</Badge>
        </div>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          'text-xs',
          tenant.isActive
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-slate-100 text-slate-500'
        )}
      >
        {tenant.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    </button>
  );
}

// ============================================
// PREVIEW CARD
// ============================================

interface PreviewCardProps {
  tenant: Tenant;
}

function PreviewCard({ tenant }: PreviewCardProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-300">
      {/* Mini Login Preview */}
      <div className="h-40 relative flex p-4" style={{ background: tenant.branding.colors.loginBackground.value }}>
        {/* Left Side (Form simulation) */}
        <div className="w-1/2 flex items-center justify-center pr-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg w-full max-w-[120px]">
            <div className="h-2 w-8 bg-slate-200 rounded mb-2 mx-auto" />
            <div className="h-6 w-full bg-slate-100 rounded mb-2" />
            <div className="h-6 w-full bg-slate-100 rounded" />
          </div>
        </div>
        {/* Right Side (Content simulation with Logo) */}
        <div className="w-1/2 flex flex-col justify-center pl-2 relative group">
          {tenant.branding.logo.light && (
            <img
              src={tenant.branding.logo.light}
              alt="Logo Preview"
              className="h-8 w-auto object-contain mb-2 self-start filter drop-shadow-md"
            />
          )}
          <div className="space-y-1">
            <div className="h-2 w-16 bg-white/40 rounded shadow-sm" />
            <div className="h-2 w-12 bg-white/20 rounded shadow-sm" />
          </div>
        </div>
      </div>
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-slate-200"
              style={{ backgroundColor: tenant.branding.colors.primary }}
            />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Tema Corporativo</span>
          </div>
          <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-400 border-slate-100">PREVIEW</Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN SUPER ADMIN PAGE
// ============================================

export function SuperAdminPage() {
  const { t } = useTranslation();
  const { tenant: currentTenant, setTenant } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('antu_all_tenants');
    return saved ? JSON.parse(saved) : MOCK_TENANTS;
  });
  const [selectedTenant, setSelectedTenant] = useState<Tenant>(tenants[0]);
  const [editedTenant, setEditedTenant] = useState<Tenant>(tenants[0]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'branding');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Persistir tenants en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('antu_all_tenants', JSON.stringify(tenants));
  }, [tenants]);
  const [, setShowPreview] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: '',
    subdomain: '',
    businessId: '',
    phone: '',
    address: '',
    website: '',
    primaryContactName: '',
    primaryContactEmail: '',
    collectionsContactName: '',
    collectionsContactEmail: '',
    collectionsContactPhone: '',
    collectionsContactExtension: '',
    currency: 'DOP' as 'DOP' | 'USD',
  });

  // AI Core State with Force Migration v3 (Stable Edition)
  const [aiProviders, setAiProviders] = useState(() => {
    const saved = localStorage.getItem('antu_ai_providers_v3');
    if (saved) return JSON.parse(saved);

    // Legacy cleanup
    localStorage.removeItem('antu_ai_providers');
    localStorage.removeItem('antu_ai_providers_v2');

    return [
      { id: 'gemini', name: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro', active: true, apiKeyName: 'VITE_GEMINI_API_KEY' },
      { id: 'openai', name: 'OpenAI GPT-5', model: 'gpt-5-turbo', active: false, apiKeyName: 'VITE_OPENAI_API_KEY' },
      { id: 'anthropic', name: 'Claude 4 Plus', model: 'claude-4-plus', active: false, apiKeyName: 'VITE_CLAUDE_API_KEY' },
      { id: 'kimi', name: 'Kimi (Moonshot)', model: 'moonshot-v3', active: false, apiKeyName: 'VITE_KIMI_API_KEY' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('antu_ai_providers_v3', JSON.stringify(aiProviders));
  }, [aiProviders]);

  const handleToggleAIProvider = (providerId: string) => {
    setAiProviders((prev: any[]) => prev.map((p: any) => ({
      ...p,
      active: p.id === providerId
    })));
    const provider = aiProviders.find((p: any) => p.id === providerId);
    toast.success(`Antü AI configurado`, {
      description: `Motor activo: ${provider?.name}`
    });
  };

  // User management states
  const { allUsers, createUserForTenant, deleteUser, toggleUserStatus, impersonateUser, impersonateTenant } = useAuth();

  const handleImpersonateTenant = () => {
    impersonateTenant(selectedTenant.id, selectedTenant.name);
  };

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'TENANT_ADMIN' as UserRole,
  });

  const tenantUsers = allUsers.filter(u => u.tenantId === selectedTenant.id);

  // Guardar lista de tenants cuando cambie
  useEffect(() => {
    localStorage.setItem('antu_all_tenants', JSON.stringify(tenants));
  }, [tenants]);

  // Fiscal State
  const [isRegularized, setIsRegularized] = useState(true);

  const handleSave = () => {
    setTenants((prev) =>
      prev.map((t) => (t.id === editedTenant.id ? editedTenant : t))
    );
    setSelectedTenant(editedTenant);

    // Si es el tenant actual, actualizarlo también
    if (currentTenant.id === editedTenant.id) {
      setTenant(editedTenant);
    }

    toast.success(`Cambios guardados para ${editedTenant.name}`, {
      description: 'La configuración se ha persistido correctamente.'
    });
  };

  const handleCreateTenant = () => {
    if (!newTenantData.name || !newTenantData.subdomain) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const newTenant: Tenant = {
      ...DEFAULT_TENANT,
      id: `tenant_${Date.now()}`,
      name: newTenantData.name,
      subdomain: newTenantData.subdomain.toLowerCase().replace(/\s+/g, ''),
      businessId: newTenantData.businessId,
      phone: newTenantData.phone,
      address: newTenantData.address,
      website: newTenantData.website,
      primaryContact: {
        name: newTenantData.primaryContactName,
        email: newTenantData.primaryContactEmail,
      },
      collectionsContact: {
        name: newTenantData.collectionsContactName,
        email: newTenantData.collectionsContactEmail,
        phone: newTenantData.collectionsContactPhone,
        extension: newTenantData.collectionsContactExtension,
      },
      currency: newTenantData.currency as 'DOP' | 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTenants(prev => [newTenant, ...prev]);
    setSelectedTenant(newTenant);
    setEditedTenant(newTenant);
    setIsCreateModalOpen(false);
    setNewTenantData({
      name: '',
      subdomain: '',
      businessId: '',
      phone: '',
      address: '',
      website: '',
      primaryContactName: '',
      primaryContactEmail: '',
      collectionsContactName: '',
      collectionsContactEmail: '',
      collectionsContactPhone: '',
      collectionsContactExtension: '',
      currency: 'DOP',
    });

    toast.success('Empresa creada correctamente');
  };

  const handleCreateUser = async () => {
    if (!newUserFormData.firstName || !newUserFormData.lastName || !newUserFormData.email) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const success = await createUserForTenant(selectedTenant.id, {
      firstName: newUserFormData.firstName,
      lastName: newUserFormData.lastName,
      email: newUserFormData.email,
      role: newUserFormData.role,
      tenantName: selectedTenant.name,
      plan: 'BUSINESS',
    });

    if (success) {
      toast.success('Usuario creado correctamente');
      setIsUserModalOpen(false);
    } else {
      toast.error('Error al crear el usuario');
    }
  };

  const handleReset = () => {
    setEditedTenant(selectedTenant);
  };

  const applyToCurrent = () => {
    setTenant(editedTenant);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Super Admin</h1>
          <p className="text-slate-500 mt-1">Gestión de tenants y personalización</p>
        </div>
        <Button
          className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Tenant List */}
        <Card className="lg:col-span-1 border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Tenants</CardTitle>
            <CardDescription>{tenants.length} empresas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {tenants.map((t) => (
                  <TenantListItem
                    key={t.id}
                    tenant={t}
                    isSelected={selectedTenant.id === t.id}
                    onSelect={() => {
                      setSelectedTenant(t);
                      setEditedTenant(t);
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-3 border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{selectedTenant.name}</CardTitle>
                <CardDescription>Configuración de marca y personalización</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 text-white hover:bg-slate-900 border-slate-700"
                  onClick={handleImpersonateTenant}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acceder al Ambiente
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="info">
                  <Building2 className="w-4 h-4 mr-2" />
                  Información
                </TabsTrigger>
                <TabsTrigger value="branding">
                  <Palette className="w-4 h-4 mr-2" />
                  Marca
                </TabsTrigger>
                <TabsTrigger value="login">
                  <Layout className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="users">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="modules">
                  <Package className="w-4 h-4 mr-2" />
                  Módulos
                </TabsTrigger>
                <TabsTrigger value="limits">
                  <Settings className="w-4 h-4 mr-2" />
                  Límites
                </TabsTrigger>
                <TabsTrigger value="ai-core">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Brain
                </TabsTrigger>
                <TabsTrigger value="obligations">
                  <Landmark className="w-4 h-4 mr-2" />
                  Obligaciones
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Usuarios del Tenant</h3>
                    <p className="text-sm text-slate-500">Gestiona los accesos administrativos para {selectedTenant.name}</p>
                  </div>
                  <Button
                    className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
                    onClick={() => {
                      setNewUserFormData({
                        firstName: '',
                        lastName: '',
                        email: selectedTenant.primaryContact?.email || '',
                        role: 'TENANT_ADMIN',
                      });
                      setIsUserModalOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nuevo Administrador
                  </Button>
                </div>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 h-10 flex items-center px-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex-[2]">Usuario</div>
                    <div className="flex-1">Rol</div>
                    <div className="flex-1">Estado</div>
                    <div className="w-24 text-right">Acciones</div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-slate-50">
                      {tenantUsers.length > 0 ? (
                        tenantUsers.map((user) => (
                          <div key={user.id} className="flex items-center px-4 py-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex-[2] flex items-center gap-3">
                              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-[var(--primary-100)] text-[var(--color-primary)] text-xs font-bold">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex-1">
                              <Badge variant="outline" className="font-medium bg-white text-slate-600 border-slate-200">
                                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              {user.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0">Activo</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-0">Inactivo</Badge>
                              )}
                            </div>
                            <div className="w-24 flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-cyan-600"
                                onClick={() => impersonateUser(user.email)}
                                title="Acceder como este usuario"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-teal-600"
                                onClick={() => toggleUserStatus(user.id)}
                              >
                                {user.isActive ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                          <User className="w-12 h-12 mb-3 opacity-20" />
                          <p>No hay usuarios creados para este tenant</p>
                          <p className="text-xs">Crea el primer administrador para que la empresa pueda operar.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Information Tab */}
              <TabsContent value="info" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                      Datos de la Empresa
                    </h3>
                    <div className="space-y-2">
                      <Label>Nombre Comercial</Label>
                      <Input
                        value={editedTenant.name}
                        onChange={(e) => setEditedTenant(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Empresarial (RNC / TAX ID)</Label>
                      <Input
                        value={editedTenant.businessId || ''}
                        onChange={(e) => setEditedTenant(prev => ({ ...prev, businessId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Página Web</Label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <Input
                          value={editedTenant.website || ''}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <Input
                          value={editedTenant.phone || ''}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección Física</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <Input
                          value={editedTenant.address || ''}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--color-primary)]" />
                        Contacto Principal
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={editedTenant.primaryContact?.name || ''}
                            onChange={(e) => setEditedTenant(prev => ({
                              ...prev,
                              primaryContact: { ...prev.primaryContact!, name: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Correo</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <Input
                              value={editedTenant.primaryContact?.email || ''}
                              onChange={(e) => setEditedTenant(prev => ({
                                ...prev,
                                primaryContact: { ...prev.primaryContact!, email: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                        Contacto de Cobros
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={editedTenant.collectionsContact?.name || ''}
                            onChange={(e) => setEditedTenant(prev => ({
                              ...prev,
                              collectionsContact: { ...prev.collectionsContact!, name: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Correo</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <Input
                              value={editedTenant.collectionsContact?.email || ''}
                              onChange={(e) => setEditedTenant(prev => ({
                                ...prev,
                                collectionsContact: { ...prev.collectionsContact!, email: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <Input
                              value={editedTenant.collectionsContact?.phone || ''}
                              onChange={(e) => setEditedTenant(prev => ({
                                ...prev,
                                collectionsContact: { ...prev.collectionsContact!, phone: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Extensión</Label>
                          <Input
                            placeholder="Ej. 101"
                            value={editedTenant.collectionsContact?.extension || ''}
                            onChange={(e) => setEditedTenant(prev => ({
                              ...prev,
                              collectionsContact: { ...prev.collectionsContact!, extension: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 font-bold flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[rgb(94,217,207)]" />
                        Vista Previa de Identidad
                      </Label>
                      <Badge variant="secondary" className="bg-[rgba(94,217,207,0.1)] text-[rgb(94,217,207)] hover:bg-[rgba(94,217,207,0.2)] border-0">
                        Live Preview
                      </Badge>
                    </div>
                    <PreviewCard tenant={editedTenant} />
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 font-medium h-11"
                      onClick={applyToCurrent}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Aplicar a mi sesión actual
                    </Button>
                  </div>

                  {/* Colors */}
                  <div className="space-y-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4 text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Paleta de Colores</h4>
                    </div>
                    <ColorPicker
                      label="Color Primario"
                      value={editedTenant.branding.colors.primary}
                      onChange={(color) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          branding: {
                            ...prev.branding,
                            colors: { ...prev.branding.colors, primary: color },
                          },
                        }))
                      }
                      description="Botones, enlaces e indicadores"
                    />
                    <ColorPicker
                      label="Color Secundario"
                      value={editedTenant.branding.colors.secondary}
                      onChange={(color) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          branding: {
                            ...prev.branding,
                            colors: { ...prev.branding.colors, secondary: color },
                          },
                        }))
                      }
                      description="Gradientes y elementos secundarios"
                    />
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Logo Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layout className="w-5 h-5 text-[rgb(94,217,207)]" />
                      <h3 className="font-bold text-slate-800">Identidad Visual (Logo)</h3>
                    </div>
                    <p className="text-sm text-slate-500">
                      Sube el logo de la empresa. Se recomienda un archivo PNG con fondo transparente.
                    </p>
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">Subir Logo Corporativo</Label>
                      <div className="flex flex-col gap-3">
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  toast.error('El archivo es demasiado grande (máx 2MB)');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64String = reader.result as string;
                                  setEditedTenant((prev) => ({
                                    ...prev,
                                    branding: {
                                      ...prev.branding,
                                      logo: { ...prev.branding.logo, light: base64String, dark: base64String },
                                    },
                                  }));
                                  toast.success('Logo cargado correctamente');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-[rgb(94,217,207)] hover:bg-[rgba(94,217,207,0.02)] transition-all flex flex-col gap-2"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            <Plus className="w-6 h-6 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">Seleccionar Imagen (PNG, JPG)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Tamaño máximo sugerido: 400x120px</span>
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        * Si no se sube un logo, el sistema usará el diseño estándar de Antü.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[160px]">
                    {editedTenant.branding.logo.light ? (
                      <div className="relative group w-full flex flex-col items-center">
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                          <img
                            src={editedTenant.branding.logo.light}
                            alt="Logo cargado"
                            className="max-h-20 w-auto object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              setEditedTenant((prev) => ({
                                ...prev,
                                branding: {
                                  ...prev.branding,
                                  logo: { ...prev.branding.logo, light: '', dark: '' },
                                },
                              }));
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Quitar Logo
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-slate-500 hover:bg-slate-100"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            Reemplazar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                          <Layout className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Sin logo configurado</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Login Background */}
                <div className="space-y-4">
                  <Label className="text-slate-700 font-medium">Fondo del Login</Label>
                  <div className="flex gap-4">
                    {(['gradient', 'solid', 'image'] as LoginBackgroundType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setEditedTenant((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              colors: {
                                ...prev.branding.colors,
                                loginBackground: {
                                  ...prev.branding.colors.loginBackground,
                                  type,
                                },
                              },
                            },
                          }))
                        }
                        className={cn(
                          'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors',
                          editedTenant.branding.colors.loginBackground.type === type
                            ? 'border-[var(--color-primary)] bg-[var(--primary-50)] text-[var(--color-primary)]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        {type === 'gradient' && 'Gradiente'}
                        {type === 'solid' && 'Sólido'}
                        {type === 'image' && 'Imagen'}
                      </button>
                    ))}
                  </div>

                  {editedTenant.branding.colors.loginBackground.type === 'gradient' && (
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Color 1"
                        value={editedTenant.branding.colors.primary}
                        onChange={() => { }}
                      />
                      <ColorPicker
                        label="Color 2"
                        value={editedTenant.branding.colors.secondary}
                        onChange={() => { }}
                      />
                    </div>
                  )}

                  {editedTenant.branding.colors.loginBackground.type === 'solid' && (
                    <ColorPicker
                      label="Color de fondo"
                      value={editedTenant.branding.colors.loginBackground.value}
                      onChange={(color) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          branding: {
                            ...prev.branding,
                            colors: {
                              ...prev.branding.colors,
                              loginBackground: {
                                ...prev.branding.colors.loginBackground,
                                value: color,
                              },
                            },
                          },
                        }))
                      }
                    />
                  )}
                </div>
              </TabsContent>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título del Login</Label>
                      <Input
                        value={editedTenant.branding.login.title}
                        onChange={(e) =>
                          setEditedTenant((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              login: { ...prev.branding.login, title: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input
                        value={editedTenant.branding.login.subtitle}
                        onChange={(e) =>
                          setEditedTenant((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              login: { ...prev.branding.login, subtitle: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mensaje personalizado (footer)</Label>
                      <Input
                        value={editedTenant.branding.login.customMessage}
                        onChange={(e) =>
                          setEditedTenant((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              login: { ...prev.branding.login, customMessage: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-700">Mostrar credenciales demo</p>
                        <p className="text-xs text-slate-400">Muestra usuarios de prueba en el login</p>
                      </div>
                      <Switch
                        checked={editedTenant.branding.login.showDemoCredentials}
                        onCheckedChange={(checked) =>
                          setEditedTenant((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              login: { ...prev.branding.login, showDemoCredentials: checked },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Features (máx. 3)</Label>
                    <div className="space-y-3">
                      {editedTenant.branding.login.features.map((feature, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Input
                              value={feature.title}
                              onChange={(e) => {
                                const newFeatures = [...editedTenant.branding.login.features];
                                newFeatures[index] = { ...feature, title: e.target.value };
                                setEditedTenant((prev) => ({
                                  ...prev,
                                  branding: {
                                    ...prev.branding,
                                    login: { ...prev.branding.login, features: newFeatures },
                                  },
                                }));
                              }}
                              className="font-medium"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500 hover:text-rose-600"
                              onClick={() => {
                                const newFeatures = editedTenant.branding.login.features.filter(
                                  (_, i) => i !== index
                                );
                                setEditedTenant((prev) => ({
                                  ...prev,
                                  branding: {
                                    ...prev.branding,
                                    login: { ...prev.branding.login, features: newFeatures },
                                  },
                                }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={feature.description}
                            onChange={(e) => {
                              const newFeatures = [...editedTenant.branding.login.features];
                              newFeatures[index] = { ...feature, description: e.target.value };
                              setEditedTenant((prev) => ({
                                ...prev,
                                branding: {
                                  ...prev.branding,
                                  login: { ...prev.branding.login, features: newFeatures },
                                },
                              }));
                            }}
                            className="text-sm"
                          />
                        </div>
                      ))}
                      {editedTenant.branding.login.features.length < 3 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setEditedTenant((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                login: {
                                  ...prev.branding.login,
                                  features: [
                                    ...prev.branding.login.features,
                                    { icon: 'BarChart3', title: 'Nueva Feature', description: 'Descripción' },
                                  ],
                                },
                              },
                            }));
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Añadir feature
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Modules Tab */}
              <TabsContent value="modules" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Módulos del Sistema</h3>
                    <p className="text-sm text-slate-500">Habilita o deshabilita funciones específicas para este cliente</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--primary-50)]"
                    onClick={() => {
                      const allModuleIds = [
                        'dashboard', 'vendedores', 'performance', 'clients', 'contacts',
                        'opportunities', 'general-quotes', 'quotes-mfp', 'activities',
                        'tasks', 'inventory', 'billing', 'cxc', 'marketing', 'reports',
                        'settings', 'users'
                      ];
                      setEditedTenant(prev => ({
                        ...prev,
                        features: { ...prev.features, modules: allModuleIds }
                      }));
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Habilitar Todos
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
                    { id: 'vendedores', label: 'Dashboard Vendedores', icon: Users2 },
                    { id: 'performance', label: 'Performance', icon: TrendingUp },
                    { id: 'clients', label: 'Clientes (Empresas)', icon: Building2 },
                    { id: 'contacts', label: 'Contactos', icon: Users },
                    { id: 'opportunities', label: 'Oportunidades', icon: Target },
                    { id: 'general-quotes', label: 'Cotización General', icon: FileText },
                    { id: 'quotes-mfp', label: 'Cotización MFP', icon: FileText },
                    { id: 'activities', label: 'Actividades', icon: CheckSquare },
                    { id: 'tasks', label: 'Tareas y Calendario', icon: Calendar },
                    { id: 'inventory', label: 'Inventario', icon: Package },
                    { id: 'billing', label: 'Facturación', icon: Receipt },
                    { id: 'cxc', label: 'Cuentas por Cobrar', icon: CreditCard },
                    { id: 'marketing', label: 'Marketing', icon: Megaphone },
                    { id: 'reports', label: 'Reportes Avanzados', icon: BarChart3 },
                    { id: 'settings', label: 'Configuración', icon: Settings },
                    { id: 'users', label: 'Gestión de Usuarios', icon: UserCog },
                  ].map((module) => {
                    const Icon = module.icon;
                    const isEnabled = editedTenant.features.modules.includes(module.id);
                    return (
                      <button
                        key={module.id}
                        onClick={() => {
                          const newModules = isEnabled
                            ? editedTenant.features.modules.filter((m) => m !== module.id)
                            : [...editedTenant.features.modules, module.id];
                          setEditedTenant((prev) => ({
                            ...prev,
                            features: { ...prev.features, modules: newModules },
                          }));
                        }}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          isEnabled
                            ? 'border-[rgb(94,217,207)] bg-[rgba(94,217,207,0.1)] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              isEnabled
                                ? 'bg-[rgb(94,217,207)] text-white'
                                : 'bg-slate-100 text-slate-400'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {isEnabled && <Check className="w-5 h-5 text-[rgb(94,217,207)]" />}
                        </div>
                        <p className={cn('mt-3 font-medium', isEnabled ? 'text-slate-800' : 'text-slate-500')}>
                          {module.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700">Forecasting AI</p>
                      <p className="text-xs text-slate-400">Predicciones de ventas con inteligencia artificial</p>
                    </div>
                    <Switch
                      checked={editedTenant.features.enableForecast}
                      onCheckedChange={(checked) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          features: { ...prev.features, enableForecast: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700">AI Assistant</p>
                      <p className="text-xs text-slate-400">Sugerencias y análisis con IA</p>
                    </div>
                    <Switch
                      checked={editedTenant.features.enableAI}
                      onCheckedChange={(checked) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          features: { ...prev.features, enableAI: checked },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Limits Tab */}
              <TabsContent value="limits" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Máximo de usuarios</Label>
                    <Input
                      type="number"
                      value={editedTenant.limits.maxUsers}
                      onChange={(e) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          limits: { ...prev.limits, maxUsers: parseInt(e.target.value) || 0 },
                        }))
                      }
                    />
                    <p className="text-xs text-slate-400">Usuarios permitidos en este tenant</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Almacenamiento (MB)</Label>
                    <Input
                      type="number"
                      value={editedTenant.limits.maxStorage}
                      onChange={(e) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          limits: { ...prev.limits, maxStorage: parseInt(e.target.value) || 0 },
                        }))
                      }
                    />
                    <p className="text-xs text-slate-400">Espacio de almacenamiento total</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de oportunidades</Label>
                    <Input
                      type="number"
                      value={editedTenant.limits.maxOpportunities}
                      onChange={(e) =>
                        setEditedTenant((prev) => ({
                          ...prev,
                          limits: { ...prev.limits, maxOpportunities: parseInt(e.target.value) || 0 },
                        }))
                      }
                    />
                    <p className="text-xs text-slate-400">Límite de oportunidades activas</p>
                  </div>
                </div>
              </TabsContent>

              {/* Subscription Billing Tab (Master Gateway) */}
              <TabsContent value="billing" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Active Gateways Config */}
                  <div className="md:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm border-l-4 border-l-[var(--color-primary)]">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
                          Pasarelas de Recaudación
                        </CardTitle>
                        <CardDescription>Activa los métodos de pago para los clientes</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { id: 'stripe', name: 'Stripe', active: true, badge: 'AUTO-RECURRENTE' },
                          { id: 'paypal', name: 'PayPal', active: true, badge: 'AUTO-RECURRENTE' },
                          { id: 'azul', name: 'Azul', active: false, badge: 'MANUAL' },
                          { id: 'dlocal', name: 'dLocal Go', active: false, badge: 'MANUAL' },
                          { id: 'tpago', name: 'T-Pago', active: false, badge: 'MANUAL' },
                        ].map((gateway) => (
                          <div key={gateway.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{gateway.name}</span>
                              <Badge className="text-[8px] h-4 w-fit bg-slate-100 text-slate-500 border-0">{gateway.badge}</Badge>
                            </div>
                            <Switch checked={gateway.active} />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-slate-50">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Configuración Fiscal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Moneda del Tenant (Crítico)</Label>
                          <Select
                            value={editedTenant.currency}
                            onValueChange={(val: any) => setEditedTenant(prev => ({ ...prev, currency: val }))}
                          >
                            <SelectTrigger className="h-8 font-bold">
                              <SelectValue placeholder="DOP" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DOP">DOP - Pesos</SelectItem>
                              <SelectItem value="USD">USD - Dólares</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Impuesto (ITBIS/IVA %)</Label>
                          <Input type="number" defaultValue="18" className="h-8" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Moneda Base</Label>
                          <Select defaultValue="DOP">
                            <SelectTrigger className="h-8 font-bold">
                              <SelectValue placeholder="DOP" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                              <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recaudación Stats & Invoices */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <CardContent className="pt-6">
                          <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Recaudación Mensual (Global)</p>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black mt-2">DOP 1,240,000</h3>
                            <h3 className="text-xl font-bold opacity-90">USD 14,500</h3>
                          </div>
                          <p className="text-[10px] mt-4 flex items-center gap-1 opacity-70 bg-white/10 w-fit px-2 py-0.5 rounded-full font-mono">
                            <Activity className="w-3 h-3" /> MULTI-CURRENCY ACTIVE
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-100 shadow-sm">
                        <CardContent className="pt-6">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Churn</p>
                          <h3 className="text-3xl font-black text-[var(--user-highlight)] mt-2">2.4%</h3>
                          <p className="text-xs mt-4 text-slate-500 font-medium">3 clientes en Grace Period</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-base font-bold">Gestión de Cobros</CardTitle>
                          <CardDescription>Clientes con estados de pago especiales</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-amber-100 text-amber-700 border-0">3 en Gracia</Badge>
                          <Badge className="bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)] border-0">1 Bloqueado</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { tenant: 'Corporación CDM', status: 'PAST_DUE', graceEnds: '05/03/2026', amount: 'DOP 25,000' },
                            { tenant: 'Grupo Financiero XYZ', status: 'UNPAID', graceEnds: 'VENCIDO', amount: 'DOP 12,000' },
                            { tenant: 'Industrias ABC', status: 'SUSPENDED', graceEnds: '-', amount: 'DOP 5,000' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 italic">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.tenant}</p>
                                <p className="text-[10px] text-slate-500">
                                  {item.status === 'PAST_DUE' ? `Periodo de Gracia hasta: ${item.graceEnds}` :
                                    item.status === 'UNPAID' ? 'Acceso bloqueado por falta de pago' : 'Cuenta suspendida manualmente'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-700">{item.amount}</p>
                                  <Badge className={cn(
                                    "text-[9px] h-4",
                                    item.status === 'PAST_DUE' ? 'bg-amber-500 text-white border-0' : 'bg-[var(--user-highlight)] text-white border-0 shadow-[0_2px_8px_rgba(60,215,202,0.4)]'
                                  )}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-[var(--color-primary)]">
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-[var(--color-primary)]">
                          Ver Reporte de Morosidad Completo
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-base font-bold">Recibos Recientes</CardTitle>
                          <CardDescription>Ultimos pagos realizados en el sistema</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">Exportar PDF</Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { tenant: 'Solgraf SRL', plan: 'Enterprise', amount: 'DOP 45,000', status: 'PAID', date: 'Hace 2 horas', gateway: 'Azul' },
                            { tenant: 'Farmacia Luz', plan: 'Business', amount: 'DOP 15,000', status: 'PENDING', date: 'Vence hoy', gateway: 'Stripe' },
                            { tenant: 'Impresos RD', plan: 'Starter', amount: 'DOP 5,000', status: 'FAILED', date: 'Hace 1 día', gateway: 'PayPal' },
                            { tenant: 'TecnoSoluciones', plan: 'Enterprise', amount: 'DOP 45,000', status: 'PAID', date: 'Hace 3 días', gateway: 'Stripe' },
                            { tenant: 'Distribuidora XYZ', plan: 'Business', amount: 'DOP 15,000', status: 'PAID', date: 'Hace 5 días', gateway: 'Azul' },
                          ].map((payment, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                              <div className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                                  {payment.tenant[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700">{payment.tenant}</p>
                                  <p className="text-xs text-slate-400">{payment.plan} · {payment.gateway}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">{payment.amount}</p>
                                <div className="flex items-center gap-1 justify-end">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    payment.status === 'PAID' ? 'bg-emerald-500' :
                                      payment.status === 'PENDING' ? 'bg-amber-500' : 'bg-[var(--user-highlight)] shadow-[0_0_5px_rgba(60,215,202,0.5)]'
                                  )} />
                                  <p className="text-[10px] text-slate-400 uppercase">{payment.status}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Antü AI Core Tab */}
              <TabsContent value="ai-core" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* AI Provider Settings */}
                  <div className="md:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
                          Motores de IA
                        </CardTitle>
                        <CardDescription>Selecciona el cerebro activo de Antü</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {aiProviders.map((provider: any) => (
                          <div
                            key={provider.id}
                            className={cn(
                              "relative p-4 rounded-xl border transition-all cursor-pointer",
                              provider.active
                                ? "bg-[var(--primary-50)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                                : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                            onClick={() => !provider.active && handleToggleAIProvider(provider.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-3 h-3 rounded-full",
                                  provider.active ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-200"
                                )} />
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{provider.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono uppercase">{provider.model}</p>
                                </div>
                              </div>
                              <Switch
                                checked={provider.active}
                                onCheckedChange={() => !provider.active && handleToggleAIProvider(provider.id)}
                              />
                            </div>
                            {provider.active && (
                              <div className="mt-3 pt-3 border-t border-[var(--primary-100)] space-y-2">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-400">API Key Configurada</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="password"
                                    value={import.meta.env[provider.apiKeyName] ? "************************" : "NO CONFIGURADA"}
                                    readOnly
                                    className={cn(
                                      "h-8 text-[10px] border-0 shadow-none font-mono",
                                      import.meta.env[provider.apiKeyName] ? "bg-white/50" : "bg-[var(--user-highlight-opaque)] text-[var(--user-highlight)]"
                                    )}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-[var(--color-primary)]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.info(`Configuración de ${provider.name}`, {
                                        description: "La API Key debe configurarse en el archivo .env del servidor."
                                      });
                                    }}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-slate-900 text-white shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-20 h-20" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Brain className="w-5 h-5 text-emerald-400" />
                          Executive Assistant
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mb-2">
                            <Activity className="w-3 h-3" /> ANÁLISIS DE SALUD GLOBAL
                          </p>
                          <p className="text-sm leading-relaxed text-slate-300">
                            "He detectado que el 80% de los usuarios están al 95% de su límite en el plan Bronce. Sugiero habilitar una notificación de 'Upgrade' masiva."
                          </p>
                        </div>
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold border-0 text-white shadow-lg">
                          Generar Reporte IA
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Prompt Registry & Usage */}
                  <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                            Registry de Prompts Maestros
                          </CardTitle>
                          <CardDescription>Personaliza las instrucciones globales de cada módulo</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nuevo Template
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { id: 'SALES', name: 'Insights de Ventas', v: '2.1' },
                            { id: 'MARKETING', name: 'Asistente de Campañas', v: '1.4' },
                            { id: 'BILLING', name: 'Predicción de Churn', v: '3.0' },
                          ].map((prompt) => (
                            <div key={prompt.id} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-between group">
                              <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                  {prompt.id[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{prompt.name}</p>
                                  <p className="text-xs text-slate-400">Versión {prompt.v} • Última edición hace 2 días</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100">
                                Editar Prompt
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-6">
                      <Card className="border-slate-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-500 font-medium">Consumo Total (Mes)</p>
                            <div className="p-2 bg-cyan-50 rounded-lg">
                              <Activity className="w-4 h-4 text-cyan-600" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Tokens Gemini</span>
                              <span className="font-bold text-slate-700">1.2M / 10M</span>
                            </div>
                            <Progress value={12} className="h-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Fiscal Obligations Tab */}
              <TabsContent value="obligations" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Cálculo de Obligaciones Fiscales</h3>
                    <p className="text-sm text-slate-500">Proyección de impuestos basada en facturación global (RD Context)</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-xl">
                    <Label className="text-xs font-bold text-slate-600">MODO REGULARIZADO (RNC)</Label>
                    <Switch
                      checked={isRegularized}
                      onCheckedChange={setIsRegularized}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Ingresos RD (DOP)</p>
                      <h4 className="text-xl font-bold text-slate-800 mt-1">DOP 1,240,000</h4>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> SUJETO A ITBIS
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Exportación (USD)</p>
                      <h4 className="text-xl font-bold text-slate-800 mt-1">USD 14,500</h4>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                        <Globe2 className="w-3 h-3" /> EXENTO ITBIS (Art. 342)
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-indigo-600 text-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold opacity-80 uppercase">Total ITBIS a Pagar</p>
                      <h4 className="text-xl font-bold mt-1">DOP 223,200</h4>
                      <p className="text-[9px] opacity-70 mt-1 italic">Calculado al 18% sobre ingresos RD</p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-slate-800 text-white">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold opacity-80 uppercase">Apropiación ISR (27%)</p>
                      <h4 className="text-xl font-bold mt-1">DOP 334,800</h4>
                      <p className="text-[9px] opacity-70 mt-1 font-mono">RETENCIÓN SUGERIDA</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-base font-bold text-slate-800">Detalle de Obligaciones ( {isRegularized ? 'FORMAL' : 'INFORMAL'} )</CardTitle>
                      </div>
                      <Badge className={cn(
                        "font-black border-0",
                        isRegularized ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {isRegularized ? '607 - FORMATO DE VENTAS' : 'RST - RÉGIMEN SIMPLIFICADO'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        {
                          name: t('superAdmin.obligations.itbis'),
                          desc: t('superAdmin.obligations.itbisDesc'),
                          amount: 'DOP 223,200',
                          due: 'Día 20 del mes',
                          formal: true
                        },
                        {
                          name: t('superAdmin.obligations.isr'),
                          desc: t('superAdmin.obligations.isrDesc'),
                          amount: 'DOP 334,800',
                          due: 'Anual (120 días post-cierre)',
                          formal: true
                        },
                        {
                          name: t('superAdmin.obligations.assetTax'),
                          desc: t('superAdmin.obligations.assetTaxDesc'),
                          amount: 'DOP 55,000',
                          due: 'Doble cuota Anual',
                          formal: true
                        },
                        {
                          name: t('superAdmin.obligations.itbisWithheld'),
                          desc: t('superAdmin.obligations.itbisWithheldDesc'),
                          amount: 'DOP 12,450',
                          due: 'Día 10 del mes',
                          formal: false
                        },
                        {
                          name: t('superAdmin.obligations.rst'),
                          desc: t('superAdmin.obligations.rstDesc'),
                          amount: 'Variable',
                          due: 'Trimestral',
                          formal: false
                        }
                      ].filter(o => isRegularized ? o.formal : !o.formal).map((obli, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{obli.name}</p>
                              <p className="text-xs text-slate-500">{obli.desc}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-800">{obli.amount}</p>
                            <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400">
                              <Info className="w-3 h-3" /> {t('superAdmin.obligations.due')}: {obli.due}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">{t('superAdmin.obligations.exportNoteTitle')}</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {t('superAdmin.obligations.exportNoteDesc')}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* MODAL CREAR TENANT */}
      < Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('superAdmin.tenants.createModal.title')}</DialogTitle>
            <DialogDescription>
              {t('superAdmin.tenants.createModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {/* Columna 1: Datos Base */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('superAdmin.tenants.createModal.identityAccess')}</h4>
                <div className="space-y-2">
                  <Label htmlFor="create-name">{t('superAdmin.tenants.createModal.nameLabel')}</Label>
                  <Input
                    id="create-name"
                    placeholder={t('superAdmin.tenants.createModal.namePlaceholder')}
                    value={newTenantData.name}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-subdomain">{t('superAdmin.tenants.createModal.subdomainLabel')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="create-subdomain"
                      placeholder={t('superAdmin.tenants.createModal.subdomainPlaceholder')}
                      value={newTenantData.subdomain}
                      onChange={(e) => setNewTenantData(prev => ({ ...prev, subdomain: e.target.value }))}
                    />
                    <span className="text-xs text-slate-400">.antucrm.com</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-business-id">{t('superAdmin.tenants.createModal.businessIdLabel')}</Label>
                  <Input
                    id="create-business-id"
                    placeholder={t('superAdmin.tenants.createModal.businessIdPlaceholder')}
                    value={newTenantData.businessId}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, businessId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-currency">{t('superAdmin.tenants.createModal.currencyLabel')}</Label>
                  <Select
                    value={newTenantData.currency}
                    onValueChange={(val) => setNewTenantData(prev => ({ ...prev, currency: val as 'DOP' | 'USD' }))}
                  >
                    <SelectTrigger id="create-currency">
                      <SelectValue placeholder="DOP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOP">{t('superAdmin.tenants.createModal.currencyDOP')}</SelectItem>
                      <SelectItem value="USD">{t('superAdmin.tenants.createModal.currencyUSD')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('superAdmin.tenants.createModal.locationWeb')}</h4>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.websiteLabel')}</Label>
                  <Input
                    placeholder={t('superAdmin.tenants.createModal.websitePlaceholder')}
                    value={newTenantData.website}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.addressLabel')}</Label>
                  <Input
                    placeholder={t('superAdmin.tenants.createModal.addressPlaceholder')}
                    value={newTenantData.address}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Columna 2: Contactos */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3 h-3" /> {t('superAdmin.tenants.createModal.primaryContact')}
                </h4>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.fullNameLabel')}</Label>
                  <Input
                    placeholder={t('superAdmin.tenants.createModal.fullNamePlaceholder')}
                    value={newTenantData.primaryContactName}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, primaryContactName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.emailLabel')}</Label>
                  <Input
                    type="email"
                    placeholder={t('superAdmin.tenants.createModal.emailPlaceholder')}
                    value={newTenantData.primaryContactEmail}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, primaryContactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.corpPhoneLabel')}</Label>
                  <Input
                    placeholder={t('superAdmin.tenants.createModal.phonePlaceholder')}
                    value={newTenantData.phone}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> {t('superAdmin.tenants.createModal.collectionsContact')}
                </h4>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.collectionsNameLabel')}</Label>
                  <Input
                    placeholder={t('superAdmin.tenants.createModal.collectionsNamePlaceholder')}
                    value={newTenantData.collectionsContactName}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, collectionsContactName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('superAdmin.tenants.createModal.collectionsEmailLabel')}</Label>
                  <Input
                    type="email"
                    placeholder={t('superAdmin.tenants.createModal.collectionsEmailPlaceholder')}
                    value={newTenantData.collectionsContactEmail}
                    onChange={(e) => setNewTenantData(prev => ({ ...prev, collectionsContactEmail: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <Label>{t('superAdmin.tenants.createModal.collectionsPhoneLabel')}</Label>
                    <Input
                      placeholder="+1 (000) 000-0000"
                      value={newTenantData.collectionsContactPhone}
                      onChange={(e) => setNewTenantData(prev => ({ ...prev, collectionsContactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('superAdmin.tenants.createModal.extLabel')}</Label>
                    <Input
                      placeholder={t('superAdmin.tenants.createModal.extPlaceholder')}
                      value={newTenantData.collectionsContactExtension}
                      onChange={(e) => setNewTenantData(prev => ({ ...prev, collectionsContactExtension: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              {t('superAdmin.tenants.createModal.discard')}
            </Button>
            <Button
              className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] px-8 text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
              onClick={handleCreateTenant}
            >
              {t('superAdmin.tenants.createModal.confirmCreate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* User Creation Modal */}
      < Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen} >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[rgb(94,217,207)]" />
              {t('superAdmin.tenants.createUserModal.title')}
            </DialogTitle>
            <DialogDescription>
              {t('superAdmin.tenants.createUserModal.description', { tenantName: selectedTenant.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('superAdmin.tenants.createUserModal.firstNameLabel')}</Label>
                <Input
                  placeholder={t('superAdmin.tenants.createUserModal.firstNamePlaceholder')}
                  value={newUserFormData.firstName}
                  onChange={(e) => setNewUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('superAdmin.tenants.createUserModal.lastNameLabel')}</Label>
                <Input
                  placeholder={t('superAdmin.tenants.createUserModal.lastNamePlaceholder')}
                  value={newUserFormData.lastName}
                  onChange={(e) => setNewUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('superAdmin.tenants.createUserModal.emailLabel')}</Label>
              <Input
                type="email"
                placeholder={t('superAdmin.tenants.createUserModal.emailPlaceholder')}
                value={newUserFormData.email}
                onChange={(e) => setNewUserFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('superAdmin.tenants.createUserModal.roleLabel')}</Label>
              <Badge className="w-full justify-center py-2 bg-slate-100 text-slate-700 hover:bg-slate-100 border-0">
                <Shield className="w-4 h-4 mr-2" />
                {t('superAdmin.tenants.createUserModal.roleValue')}
              </Badge>
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold mt-1">
                {t('superAdmin.tenants.createUserModal.roleDescription')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUserModalOpen(false)}>
              {t('superAdmin.tenants.createUserModal.cancel')}
            </Button>
            <Button
              className="bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white font-bold shadow-lg shadow-[rgba(94,217,207,0.2)]"
              onClick={handleCreateUser}
            >
              {t('superAdmin.tenants.createUserModal.createAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}
