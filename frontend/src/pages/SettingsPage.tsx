// ============================================
// ANTU CRM - Módulo de Configuración
// Gestión de usuarios, configuración personal y del tenant
// Moneda inmutable - Solo lectura para todos los usuarios
// ============================================

import { useState, useMemo } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import CryptoJS from 'crypto-js';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DocumentHubTab } from '@/components/settings/DocumentHubTab';
import { EmailDomainTab } from '@/components/settings/EmailDomainTab';
import type { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  User,
  Building2,
  Shield,
  Bell,
  Palette,
  Globe,
  Clock,
  Camera,
  Edit2,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Lock,
  CreditCard,
  TrendingUp,
  LogOut,
  Save,
  RefreshCw,
  Crown,
  CheckCircle2,
  ShieldAlert,
  Zap,
  FileText,
  History,
  Eye,
  ScrollText,
  Smartphone,
  KeyRound,
  QrCode,
  FileSpreadsheet,
  Download,
  Database,
  Upload,
  Link2,
  Info,
  Mail,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type UserStatus = 'active' | 'inactive';
type Currency = 'DOP' | 'USD' | 'EUR';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  team?: string;
  reportsTo?: string;
  lastLogin?: Date;
  createdAt: Date;
  locale: string;
  timezone: string;
}



interface UserSettings {
  locale: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'normal' | 'comfortable';
  accentColor: string;
  notifications: {
    emailDailySummary: boolean;
    emailOpportunityAlerts: boolean;
    emailAll: boolean;
    inAppSound: boolean;
    inAppDesktop: boolean;
    whatsAppVisits: boolean;
    whatsAppWeekly: boolean;
  };
}

import { AlertCircle } from 'lucide-react';

// ============================================
// MOCK DATA
// ============================================

const MOCK_USERS: UserData[] = [
  {
    id: 'u1',
    firstName: 'María',
    lastName: 'García',
    email: 'maria.garcia@solucionesgraficas.com',
    phone: '+1 809 555 0101',
    role: 'TENANT_ADMIN',
    status: 'active',
    team: 'Administración',
    lastLogin: new Date(2026, 1, 27, 14, 30),
    createdAt: new Date(2023, 2, 15),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
  {
    id: 'u2',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@solucionesgraficas.com',
    phone: '+1 809 555 0102',
    role: 'SALES_MANAGER',
    status: 'active',
    team: 'Ventas Corporativas',
    lastLogin: new Date(2026, 1, 28, 9, 15),
    createdAt: new Date(2023, 5, 20),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
  {
    id: 'u3',
    firstName: 'Carlos',
    lastName: 'López',
    email: 'carlos.lopez@solucionesgraficas.com',
    phone: '+1 809 555 0103',
    role: 'SALES_REP',
    status: 'active',
    team: 'Ventas Corporativas',
    reportsTo: 'u2',
    lastLogin: new Date(2026, 1, 26, 16, 45),
    createdAt: new Date(2024, 0, 10),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
  {
    id: 'u4',
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@solucionesgraficas.com',
    phone: '+1 809 555 0104',
    role: 'SALES_REP',
    status: 'active',
    team: 'Ventas Retail',
    reportsTo: 'u2',
    lastLogin: new Date(2026, 1, 25, 11, 20),
    createdAt: new Date(2024, 4, 15),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
  {
    id: 'u5',
    firstName: 'Pedro',
    lastName: 'Santos',
    email: 'pedro.santos@solucionesgraficas.com',
    phone: '+1 809 555 0105',
    role: 'SALES_REP',
    status: 'inactive',
    team: 'Ventas Retail',
    reportsTo: 'u2',
    lastLogin: new Date(2025, 11, 15, 10, 0),
    createdAt: new Date(2024, 7, 1),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
  {
    id: 'u6',
    firstName: 'Laura',
    lastName: 'Fernández',
    email: 'laura.fernandez@solucionesgraficas.com',
    phone: '+1 809 555 0106',
    role: 'SALES_REP',
    status: 'active',
    team: 'Soporte',
    lastLogin: new Date(2026, 1, 27, 8, 30),
    createdAt: new Date(2024, 2, 10),
    locale: 'en-US',
    timezone: 'America/New_York',
  },
  {
    id: 'u7',
    firstName: 'Miguel',
    lastName: 'Rodríguez',
    email: 'miguel.rodriguez@solucionesgraficas.com',
    phone: '+1 809 555 0107',
    role: 'SALES_REP',
    status: 'active',
    team: 'Ventas Corporativas',
    reportsTo: 'u2',
    lastLogin: new Date(2026, 1, 28, 7, 45),
    createdAt: new Date(2024, 5, 20),
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
  },
];

// const TENANT_SETTINGS: TenantSettings = {
//   name: 'Soluciones Gráficas SRL',
//   industry: 'Impresión y Gráficos',
//   country: 'República Dominicana',
//   address: 'Av. Winston Churchill 456, Santo Domingo',
//   phone: '+1 809 555 0100',
//   website: 'https://www.solucionesgraficas.com',
//   currency: 'DOP',
//   timezone: 'America/Santo_Domingo',
//   primaryColor: '#0D9488',
//   secondaryColor: '#0EA5E9',
// };

const DEFAULT_USER_SETTINGS: UserSettings = {
  locale: 'es-DO',
  timezone: 'America/Santo_Domingo',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  theme: 'light',
  density: 'normal',
  accentColor: 'blue',
  notifications: {
    emailDailySummary: true,
    emailOpportunityAlerts: true,
    emailAll: false,
    inAppSound: true,
    inAppDesktop: true,
    whatsAppVisits: true,
    whatsAppWeekly: false,
  },
};

// ============================================
// CONSTANTS
// ============================================

const ROLE_CONFIG: Record<string, { label: string; description: string; color: string; bg: string }> = {
  TENANT_ADMIN: { label: 'Administrador', description: 'Acceso total al tenant', color: 'text-violet-600', bg: 'bg-violet-50' },
  SALES_MANAGER: { label: 'Gerente', description: 'Gestiona equipo de ventas', color: 'text-blue-600', bg: 'bg-blue-50' },
  SALES_REP: { label: 'Vendedor', description: 'Usuario estándar', color: 'text-slate-600', bg: 'bg-slate-50' },
};

const CURRENCY_CONFIG: Record<Currency, { label: string; symbol: string; flag: string }> = {
  DOP: { label: 'Peso Dominicano', symbol: 'RD$', flag: '🇩🇴' },
  USD: { label: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
  EUR: { label: 'Euro', symbol: '€', flag: '🇪🇺' },
};

const INDUSTRIES = [
  'Impresión y Gráficos',
  'Tecnología',
  'Manufactura',
  'Servicios Financieros',
  'Retail',
  'Salud',
  'Educación',
  'Construcción',
  'Otro',
];

const COUNTRIES = [
  { code: 'DO', name: 'República Dominicana', timezone: 'America/Santo_Domingo' },
  { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York' },
  { code: 'MX', name: 'México', timezone: 'America/Mexico_City' },
  { code: 'CO', name: 'Colombia', timezone: 'America/Bogota' },
  { code: 'PE', name: 'Perú', timezone: 'America/Lima' },
  { code: 'CL', name: 'Chile', timezone: 'America/Santiago' },
  { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'ES', name: 'España', timezone: 'Europe/Madrid' },
];

const TIMEZONES = [
  { value: 'America/Santo_Domingo', label: 'Santo Domingo (GMT-4)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5/-4)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4/-3)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)' },
];

// ============================================
// SUBSCRIPTION & BILLING TAB

function SubscriptionTab() {
  const { tenant } = useTenant();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const PLAN_OPTIONS = [
    {
      code: 'STARTER',
      name: 'Bronce',
      priceMonthly: 99,
      priceYearly: 990,
      features: ['5 Usuarios', 'CRM Básico', '5GB Almacenamiento'],
      color: 'bg-slate-500',
      icon: Users
    },
    {
      code: 'BUSINESS',
      name: 'Plata',
      priceMonthly: 299,
      priceYearly: 2990,
      features: ['20 Usuarios', 'Inventario y CxC', '50GB Almacenamiento', 'Reportes Avanzados'],
      color: 'bg-[var(--color-primary)]',
      icon: Zap,
      popular: true
    },
    {
      code: 'ENTERPRISE',
      name: 'Oro',
      priceMonthly: 799,
      priceYearly: 7990,
      features: ['Usuarios Ilimitados', 'API Enterprise', 'Soporte 24/7', 'IA Avanzada'],
      color: 'bg-amber-500',
      icon: Crown
    },
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowCheckout(false);
      // En producción aquí se llamaría a billingService.subscribe()
      alert('Suscripción actualizada con éxito. Se ha generado su factura en PDF.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[var(--color-primary)] to-sky-500" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-100)] flex items-center justify-center text-[var(--color-primary)]">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Plan Enterprise (Oro)</h3>
                <p className="text-sm text-slate-500">Próximo pago: 15 de Marzo, 2026 ({formatCurrency(billingCycle === 'monthly' ? 799 : 7990, tenant?.currency)})</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-100 text-emerald-600 border-0">Activa</Badge>
              <Button variant="outline" size="sm" onClick={() => setShowCheckout(true)}>Mejorar Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Limits & Usage */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Límites y Uso</CardTitle>
            <CardDescription>Consumo actual de tu plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Usuarios (12/20)</span>
                <span className="text-slate-800 font-bold">60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Almacenamiento (5GB/50GB)</span>
                <span className="text-slate-800 font-bold">10%</span>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Payment History Card */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Historial de Pagos</CardTitle>
            <CardDescription>Descarga tus comprobantes fiscales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Factura Feb 2026</p>
                      <p className="text-[10px] text-slate-400">15 Feb 2026 · Azul Payment</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[var(--color-primary)]">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Renovar o Mejorar tu Plan</DialogTitle>
            <DialogDescription className="text-center">
              Selecciona el plan que mejor se adapte a tu crecimiento
            </DialogDescription>
          </DialogHeader>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mt-4">
            <div className="bg-slate-100 p-1 rounded-full inline-flex items-center gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", billingCycle === 'monthly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", billingCycle === 'yearly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                Anual <span className="text-emerald-500 ml-1">(-20%)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {PLAN_OPTIONS.map((plan) => (
              <div
                key={plan.code}
                onClick={() => setSelectedPlan(plan)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl",
                  selectedPlan?.code === plan.code ? "border-[var(--color-primary)] bg-[var(--primary-50)]" : "border-slate-100 bg-white",
                  plan.popular && "ring-2 ring-[var(--color-primary)] ring-offset-2"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    Más Popular
                  </span>
                )}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg", plan.color)}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">{plan.name}</h4>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black text-slate-900">
                    {formatCurrency(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly, tenant?.currency)}
                  </span>
                  <span className="text-slate-400 text-sm">/{billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="mt-8 border-t pt-8 space-y-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
                Método de Pago
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'stripe', name: 'Stripe', info: 'Tarjetas & Apple' },
                  { id: 'paypal', name: 'PayPal', info: 'Saldo & Cuenta' },
                  { id: 'azul', name: 'Azul', info: 'Local RD' },
                  { id: 'dlocal', name: 'dLocal', info: 'LatAm Cash' },
                  { id: 'tpago', name: 'T-Pago', info: 'Móvil RD' },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGateway(gw.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      selectedGateway === gw.id ? "border-[var(--color-primary)] bg-[var(--primary-50)]" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <p className="text-xs font-bold text-slate-800">{gw.name}</p>
                    <p className="text-[9px] text-slate-400 leading-tight mt-1">{gw.info}</p>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tus datos están protegidos. No almacenamos los números de tu tarjeta. Al proceder, aceptas nuestros <span className="text-[var(--color-primary)] cursor-pointer hover:underline">Términos de Servicio</span> y la facturación recurrente.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowCheckout(false)}>Cancelar</Button>
                <Button
                  className="bg-gradient-to-r from-[var(--color-primary)] to-sky-500 text-white font-bold px-8 shadow-lg shadow-sky-200"
                  disabled={isProcessing}
                  onClick={handleCheckout}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    `Pagar ${formatCurrency(billingCycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly, tenant?.currency)}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// AUDIT LOGS TAB
// ============================================

// ============================================
// UTILS
// ============================================

function getDaysSince(date: Date): number {
  return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// USER MANAGEMENT TAB (Admin/Manager)
// ============================================

function UserManagementTab() {
  const [users, setUsers] = useState<UserData[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'SALES_REP' as UserRole,
    team: '',
  });

  const handleCreateUser = () => {
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const newUser: UserData = {
      id: `u${Date.now()}`,
      firstName: newUserData.firstName,
      lastName: newUserData.lastName,
      email: newUserData.email,
      phone: newUserData.phone,
      role: newUserData.role,
      status: 'active',
      team: newUserData.team,
      createdAt: new Date(),
      locale: 'es-DO',
      timezone: 'America/Santo_Domingo',
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsNewUserModalOpen(false);
    setNewUserData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'SALES_REP',
      team: '',
    });
    toast.success('Usuario creado correctamente');
  };

  // Plan limits (mock)
  const planLimit = 10;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;
  const availableSlots = planLimit - activeUsers;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-6">
      {/* Plan Usage Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Plan actual:</span>
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                  Profesional ({planLimit} usuarios)
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Usuarios activos:</span>
                  <span className="font-semibold text-slate-800">
                    {activeUsers}/{planLimit}
                  </span>
                </div>
                <div className="flex-1 max-w-[200px]">
                  <Progress value={(activeUsers / planLimit) * 100} className="h-2" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Usuarios inactivos: {inactiveUsers} (no cuentan para el límite)
              </p>
            </div>
            <Button variant="outline" className="shrink-0">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="USER">Vendedor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
              onClick={() => setIsNewUserModalOpen(true)}
              disabled={availableSlots <= 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo usuario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Usuario</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Email</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Rol</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Estado</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Último acceso</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-[var(--primary-100)] text-[var(--color-primary)] text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                        {user.team && <p className="text-xs text-slate-500">{user.team}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', ROLE_CONFIG[user.role].bg, ROLE_CONFIG[user.role].color)}>
                      {ROLE_CONFIG[user.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                      <span className={cn('text-sm', user.status === 'active' ? 'text-slate-700' : 'text-slate-400')}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <span className="text-sm text-slate-500">
                        {getDaysSince(user.lastLogin) === 0 ? 'Hoy' : `${getDaysSince(user.lastLogin)} días`}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                            {user.status === 'active' ? (
                              <><X className="w-4 h-4 mr-2" /> Desactivar</>
                            ) : (
                              <><Check className="w-4 h-4 mr-2" /> Activar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteUser(user.id)}>
                            <LogOut className="w-4 h-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="font-medium text-violet-800">Insights</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-violet-700">
              • Tienes {availableSlots} usuarios disponibles en tu plan Profesional
            </p>
            <p className="text-sm text-violet-700">
              • {inactiveUsers} usuarios inactivos ocupan espacio (considerar eliminar)
            </p>
            <p className="text-sm text-violet-700">
              • María García no ha iniciado sesión en {getDaysSince(MOCK_USERS[0].lastLogin || new Date())} días
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New User Modal */}
      <Dialog open={isNewUserModalOpen} onOpenChange={setIsNewUserModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Plan: Profesional ({planLimit} usuarios) | Usados: {activeUsers} | Disponibles: {availableSlots}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej. María"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  placeholder="Ej. García"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="maria@solucionesgraficas.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="+1 809 555 0123"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({ ...newUserData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT_ADMIN">Administrador</SelectItem>
                  <SelectItem value="SALES_MANAGER">Gerente</SelectItem>
                  <SelectItem value="SALES_REP">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select
                value={newUserData.team}
                onValueChange={(value) => setNewUserData({ ...newUserData, team: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administración">Administración</SelectItem>
                  <SelectItem value="Ventas Corporativas">Ventas Corporativas</SelectItem>
                  <SelectItem value="Ventas Retail">Ventas Retail</SelectItem>
                  <SelectItem value="Soporte">Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Nota:</p>
                  <p>La moneda del sistema es DOP (configurado por ANTU), no editable.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
              onClick={handleCreateUser}
            >
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// PERSONAL SETTINGS TAB
// ============================================

function PersonalSettingsTab() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupCompleted, setMfaSetupCompleted] = useState(user?.mfaEnabled || false);

  const [settings, setSettings] = useState<UserSettings>({
    ...DEFAULT_USER_SETTINGS,
    locale: i18n.language === 'en' ? 'en-US' : 'es-DO'
  });

  const handleLanguageChange = (val: string) => {
    setSettings({ ...settings, locale: val });
    const langCode = val.split('-')[0];
    i18n.changeLanguage(langCode);
    toast.success(t('common.saveSuccess'));
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.attributes?.department || 'Ventas Corporativas'
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    const success = await new Promise(resolve => setTimeout(() => resolve(true), 1000));
    if (success) {
      toast.success('Información actualizada correctamente');
    } else {
      toast.error('Error al actualizar la información');
    }
    setIsSaving(false);
  };

  const currencyInfo = CURRENCY_CONFIG[tenant?.currency as Currency || 'DOP'];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-[var(--primary-200)] to-[var(--primary-300)] text-[var(--color-primary)]">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button size="sm" variant="secondary" className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs">
                <Camera className="w-3 h-3 mr-1" />
                {t('actions.edit')}
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-800">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                  {t(`auth.roles.${user?.role === 'TENANT_ADMIN' ? 'admin' : user?.role === 'SALES_MANAGER' ? 'manager' : 'user'}`)}
                </Badge>
                <span className="text-sm text-slate-400">|</span>
                <span className="text-sm text-slate-500">{formData.department}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isSaving ? t('actions.loading') : t('settings.save')}
              </Button>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled
              />
              <p className="text-[10px] text-slate-400">El email no puede ser modificado por el usuario</p>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security Settings */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Seguridad de la cuenta</CardTitle>
          </div>
          <CardDescription>Protege el acceso a tu cuenta de ANTU CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <KeyRound className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t('settings.personal.changePassword')}</p>
                <p className="text-sm text-slate-500">
                  {t('settings.personal.securityDesc')}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/settings/security')} className="whitespace-nowrap">
              {t('settings.personal.changePassword')}
            </Button>
          </div>

          {/* MFA Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", mfaSetupCompleted ? "bg-green-100" : "bg-amber-100")}>
                <Smartphone className={cn("w-5 h-5", mfaSetupCompleted ? "text-green-700" : "text-amber-700")} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t('settings.personal.mfa')}</p>
                <p className="text-sm text-slate-500 max-w-lg">
                  {t('settings.personal.mfaDesc')}
                </p>
                {mfaSetupCompleted && (
                  <Badge className="mt-2 text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    {t('contacts.status.active')}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant={mfaSetupCompleted ? "destructive" : "default"}
              onClick={() => mfaSetupCompleted ? setMfaSetupCompleted(false) : setShowMfaDialog(true)}
              className="whitespace-nowrap"
            >
              {mfaSetupCompleted ? `${t('actions.delete')} MFA` : `${t('contacts.status.active')} MFA`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">{t('settings.preferences.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.preferences.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.preferences.language')}</Label>
            <Select value={settings.locale} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-DO">Español (Latinoamérica)</SelectItem>
                <SelectItem value="en-US">English (United States)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">
              <Info className="w-4 h-4 inline mr-1" />
              {t('common.at')} {currencyInfo.symbol} ({currencyInfo.label}) — {t('settings.personal.currency')}
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('settings.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Date & Time Settings */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Formato de fecha y hora</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.personal.dateFormat')}</Label>
            <Select value={settings.dateFormat} onValueChange={(v) => setSettings({ ...settings, dateFormat: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">28/02/2026 (DD/MM/AAAA)</SelectItem>
                <SelectItem value="MM/DD/YYYY">02/28/2026 (MM/DD/AAAA)</SelectItem>
                <SelectItem value="YYYY-MM-DD">2026-02-28 (AAAA-MM-DD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.personal.timeFormat')}</Label>
            <Select value={settings.timeFormat} onValueChange={(v) => setSettings({ ...settings, timeFormat: v as '12h' | '24h' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">3:30 p.m. (12h)</SelectItem>
                <SelectItem value="24h">15:30 (24h)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.personal.timezone')}</Label>
            <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 bg-slate-50 rounded text-sm text-slate-500">
            {t('settings.personal.preview')}: 28/02/2026 | 3:30 p.m.
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('settings.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Currency Info (Read-only) */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">{t('settings.personal.financialInfo')}</CardTitle>
          </div>
          <CardDescription>{t('settings.personal.readOnly')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currencyInfo.flag}</span>
              <div>
                <p className="font-medium text-slate-800">
                  {currencyInfo.label} ({currencyInfo.symbol})
                </p>
                <p className="text-sm text-slate-500">{t('settings.personal.systemCurrency')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              {t('settings.personal.notifications.supportNote')}{' '}
              <a href="mailto:soporte@antucrm.com" className="text-[var(--color-primary)] hover:underline">
                soporte@antucrm.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">{t('settings.personal.notifications.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">{t('settings.personal.notifications.email')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">{t('settings.personal.notifications.dailySummary')} (8:00 a.m.)</Label>
                <Switch
                  checked={settings.notifications.emailDailySummary}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailDailySummary: v },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">{t('settings.personal.notifications.opportunityAlerts')}</Label>
                <Switch
                  checked={settings.notifications.emailOpportunityAlerts}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailOpportunityAlerts: v },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Todos los emails del sistema</Label>
                <Switch
                  checked={settings.notifications.emailAll}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAll: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">En aplicación</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Sonido para notificaciones</Label>
                <Switch
                  checked={settings.notifications.inAppSound}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, inAppSound: v },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Notificaciones de escritorio</Label>
                <Switch
                  checked={settings.notifications.inAppDesktop}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, inAppDesktop: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('settings.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Apariencia</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="flex gap-2">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSettings({ ...settings, theme })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm transition-all',
                    settings.theme === theme
                      ? 'border-[var(--color-primary)] bg-[var(--primary-50)] text-[var(--color-primary)]'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {theme === 'light' && 'Claro'}
                  {theme === 'dark' && 'Oscuro'}
                  {theme === 'auto' && 'Automático'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Densidad de información</Label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'comfortable'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => setSettings({ ...settings, density })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm transition-all',
                    settings.density === density
                      ? 'border-[var(--color-primary)] bg-[var(--primary-50)] text-[var(--color-primary)]'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {density === 'compact' && 'Compacta'}
                  {density === 'normal' && 'Normal'}
                  {density === 'comfortable' && 'Cómoda'}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* MFA Setup Dialog */}
      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="sm:max-w-md bg-white border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle>Activar Autenticación de Dos Factores</DialogTitle>
            <DialogDescription>
              Escanea el código QR con tu aplicación autenticadora (Google Authenticator, Authy, etc.) e introduce el código temporal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
              <div className="w-48 h-48 bg-slate-50 flex items-center justify-center relative rounded overflow-hidden">
                <QrCode className="w-32 h-32 text-slate-200" strokeWidth={1} />
                <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/ANTU%20CRM:demo%40antucrm.com?secret=JBSWY3DPEHPK3PXP&issuer=ANTU%20CRM')] bg-contain bg-center bg-no-repeat" />
              </div>
            </div>
            <div className="text-center w-full space-y-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Código manual</p>
              <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-md text-slate-800 select-all border border-slate-200">
                JBSW Y3DP EHPK 3PXP
              </code>
            </div>
            <div className="w-full space-y-2 pt-2">
              <Label className="text-slate-600">Código de verificación (6 dígitos)</Label>
              <Input
                type="text"
                placeholder="000 000"
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-slate-50/50"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowMfaDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={mfaCode.length !== 6}
              onClick={() => {
                setMfaSetupCompleted(true);
                setShowMfaDialog(false);
                toast.success('MFA se ha activado correctamente para tu cuenta.');
              }}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              Verificar y Activar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// TENANT SETTINGS TAB (Admin only)
// ============================================

function TenantSettingsTab() {
  const { tenant, updateBranding } = useTenant();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    industry: 'Tecnología', // Fallback as Tenant type doesn't have it yet
    country: 'República Dominicana',
    address: '',
    phone: '',
    website: '',
    primaryColor: tenant?.branding?.colors?.primary || '#0D9488',
    secondaryColor: tenant?.branding?.colors?.secondary || '#0EA5E9',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call and update context
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateBranding({
      colors: {
        ...tenant.branding.colors,
        primary: formData.primaryColor,
        secondary: formData.secondaryColor
      }
    });

    toast.success('Configuración de empresa actualizada');
    setIsSaving(false);
  };

  const currencyInfo = CURRENCY_CONFIG[tenant?.currency as Currency || 'DOP'];

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Información de la empresa</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la empresa</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Industria</Label>
              <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sitio web</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Marca y personalización</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Logo principal</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-300 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Subir logo</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo dark mode</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-300 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Subir logo</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-300 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Subir icono</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color primario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-14 h-10 p-1"
                />
                <Input value={formData.primaryColor} readOnly className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color secundario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-14 h-10 p-1"
                />
                <Input value={formData.secondaryColor} readOnly className="flex-1" />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Financial Info (Read-only) */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Información financiera</CardTitle>
            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Solo lectura</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{currencyInfo.flag}</span>
              <div>
                <p className="font-semibold text-slate-800 text-lg">
                  {currencyInfo.label} ({currencyInfo.symbol})
                </p>
                <p className="text-sm text-slate-500">Moneda del sistema</p>
              </div>
              <div className="ml-auto">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Configurado por ANTU CRM al crear la empresa</p>
              <p className="mt-1">
                Para solicitar cambio de moneda contactar a{' '}
                <a href="mailto:soporte@antucrm.com" className="underline hover:no-underline">
                  soporte@antucrm.com
                </a>
              </p>
              <p className="mt-1 text-xs">
                Nota: Los cambios de moneda requieren migración de datos y pueden tener costos asociados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Seguridad y acceso</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Requerir MFA para todos los usuarios</p>
                <p className="text-sm text-slate-500">Autenticación de dos factores obligatoria</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Sesión expira después de 8 horas</p>
                <p className="text-sm text-slate-500">Cierre automático por inactividad</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Notificar admin de logins desde nuevos dispositivos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700">Política de contraseñas</p>
            <p className="text-sm text-slate-500">Mínimo 8 caracteres, 1 mayúscula, 1 número</p>
            <Button variant="link" className="p-0 h-auto text-[var(--color-primary)]">
              Editar política
            </Button>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--color-primary)]">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// BULK IMPORT TAB (Admin only)
// ============================================

function BulkImportTab() {
  const [isUploading, setIsUploading] = useState(false);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  const handleDownloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      clients: '/templates/plantilla_clientes.xlsx',
      inventory: '/templates/plantilla_inventario.xlsx',
      history: '/templates/plantilla_ventas.xlsx'
    };

    const filePath = templates[type];
    if (filePath) {
      const link = document.createElement('a');
      link.href = filePath;
      link.download = filePath.split('/').pop() || 'plantilla.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Descargando plantilla de ${type}...`, {
        description: 'El archivo se ha generado con los campos requeridos.'
      });
    }
  };

  const handleUpload = () => {
    setIsUploading(true);

    // Simulación de procesamiento con validación de limpieza
    setTimeout(() => {
      setIsUploading(false);

      // En una implementación real, aquí filtraríamos las filas que coincidan 
      // con nuestros registros de ejemplo (ej. juane@ejemplo.com o PROD-001)
      const mockProcessed = 124;
      const mockSkippedExamples = 1;

      toast.success('Importación finalizada con éxito', {
        description: `Procesados: ${mockProcessed} registros. Omitidos: ${mockSkippedExamples} (detectado como fila de ejemplo de la plantilla).`,
        duration: 5000,
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Carga Masiva de Información</h3>
            <p className="text-sm text-slate-500">Configura tu tenant rápidamente importando tus datos existentes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { id: 'clients', name: 'Clientes y Contactos', icon: Users, count: '0' },
            { id: 'inventory', name: 'Productos e Inventario', icon: Database, count: '0' },
            { id: 'history', name: 'Historial de Ventas', icon: TrendingUp, count: '0' },
          ].map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                <Badge variant="secondary" className="text-[10px]">{item.count} registros</Badge>
              </div>
              <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600" onClick={() => handleDownloadTemplate(item.id)}>
                <Download className="w-3 h-3 mr-1" /> Descargar Plantilla
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Reglas de Plantillas Protegidas (Excel):</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Protección de Documento:</strong> La plantilla ahora es un archivo de Excel protegido. Solo se pueden editar las celdas debajo de los encabezados (hacia abajo). No es posible escribir en otras áreas para prevenir errores.</li>
                <li><strong>Información Requerida:</strong> Las columnas marcadas con un asterisco (*) son obligatorias y no pueden quedar vacías.</li>
                <li><strong>Formatos Específicos:</strong> Respete los valores cerrados listados en los encabezados (ej. SI/NO, ACTIVE/PROSPECT/CUSTOMER).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-500" />
              Subir Archivo
            </CardTitle>
            <CardDescription>Formatos soportados: .xlsx (Plantillas de descarga oficial)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 group-hover:text-blue-400 mb-3 transition-colors" />
                <p className="text-sm font-medium text-slate-700">Arrastra tu archivo aquí</p>
                <p className="text-xs text-slate-400 mt-1">o haz clic para buscar en tu equipo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>Sube únicamente los archivos Excel (.xlsx) descargados desde esta plataforma con los datos grabados.</span>
            </div>
            <Button className="w-full bg-[var(--color-primary)]" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {isUploading ? 'Procesando...' : 'Iniciar Importación'}
            </Button>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-slate-500" />
              Integraciones Directas
            </CardTitle>
            <CardDescription>Carga datos automáticamente desde cualquier servicio (Incluido en todos los planes)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'google', name: 'Google Sheets', desc: 'Sync en tiempo real de hojas de cálculo', status: 'Listo para conectar', colorIcon: 'text-emerald-600' },
              { id: 'api', name: 'API de Terceros', desc: 'Conecta tu sistema ERP o CRM anterior', status: 'Acceso Total', colorIcon: 'text-blue-600' },
              { id: 'webhook', name: 'Webhooks de Entrada', desc: 'Recibe datos mediante disparadores externos', status: 'Activo', colorIcon: 'text-violet-600' },
            ].map((integ) => (
              <div key={integ.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-slate-50", integ.colorIcon)}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{integ.name}</p>
                    <p className="text-xs text-slate-500">{integ.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">{integ.status}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setActiveIntegration(integ.id)}
                  >
                    Configurar
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="link" className="w-full text-xs text-slate-500 h-auto">
                <Plus className="w-3 h-3 mr-1" /> Solicitar nueva integración personalizada
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Historial de Importaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] uppercase font-bold text-slate-400">Fecha</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400">Concepto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400">Estado</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-slate-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-xs text-slate-500 italic" colSpan={4}>
                  No hay importaciones previas en este tenant.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration Settings Modal */}
      <Dialog open={!!activeIntegration} onOpenChange={(open) => !open && setActiveIntegration(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              {activeIntegration === 'google' ? 'Configurar Google Sheets' :
                activeIntegration === 'api' ? 'Configurar API de Terceros' : 'Configurar Webhooks'}
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros para sincronizar tus datos automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeIntegration === 'google' && (
              <>
                <div className="space-y-2">
                  <Label>Google Sheet URL</Label>
                  <Input placeholder="https://docs.google.com/spreadsheets/d/..." />
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la Hoja</Label>
                  <Input placeholder="Ej. Clientes_ANTU" />
                </div>
              </>
            )}

            {activeIntegration === 'api' && (
              <>
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <Input placeholder="https://api.tu-sistema.com/v1/data" />
                </div>
                <div className="space-y-2">
                  <Label>API Key / Token</Label>
                  <Input type="password" placeholder="antu_sk_..." />
                </div>
              </>
            )}

            {activeIntegration === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label>Webhook URL (Generada automáticamente)</Label>
                  <div className="flex gap-2">
                    <Input value="https://antu-crm.hooks.io/inbound/tenant-12345" readOnly className="bg-slate-50 font-mono text-[10px]" />
                    <Button variant="outline" size="sm">Copiar</Button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Envía tus datos en formato JSON a esta URL.</p>
              </>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex gap-3">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-semibold">Soporte ANTÜ:</span> Como estamos en despliegue inicial, nuestro equipo técnico te ayudará con la conexión sin costo adicional.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveIntegration(null)}>Cancelar</Button>
            <Button className="bg-[var(--color-primary)]" onClick={() => {
              toast.success('Configuración guardada correctamente');
              setActiveIntegration(null);
            }}>
              Guardar y Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// AUDIT LOGS TAB (Admin only)
// ============================================

function AuditLogsTab() {
  const { auditLogs } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      const logDate = log.timestamp.split('T')[0];
      if (dateFilterStart && logDate < dateFilterStart) matchesDate = false;
      if (dateFilterEnd && logDate > dateFilterEnd) matchesDate = false;

      const matchesAction = actionFilter ? log.action === actionFilter : true;
      const matchesResource = resourceFilter ? log.resource === resourceFilter : true;

      return matchesSearch && matchesDate && matchesAction && matchesResource;
    });
  }, [auditLogs, searchTerm, dateFilterStart, dateFilterEnd, actionFilter, resourceFilter]);

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(auditLogs.map(log => log.resource)));

  const getActionColor = (action: string) => {
    if (action.includes('DB_') || action.includes('DELETE') || action.includes('FAILED')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('UPDATE') || action.includes('MODIFIED') || action.includes('CHANGED') || action.includes('EDIT')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (action.includes('CREATE') || action.includes('LOGIN_SUCCESS')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  const handleExportDetails = () => {
    const dataToExport = JSON.stringify(filteredLogs, null, 2);
    // Generar SHA-256 Hash
    const hash = CryptoJS.SHA256(dataToExport).toString(CryptoJS.enc.Hex);

    // Crear el contenido final con firma
    const finalContent = `=== ANTÜ CRM SECURE AUDIT LOG EXPORT ===\nTIMESTAMP: ${new Date().toISOString()}\nINTEGRITY_HASH (SHA-256): ${hash}\n==========================================\n\n${dataToExport}`;

    // Iniciar descarga
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Bitácora exportada correctamente', {
      description: 'El archivo resultante incluye un hash de seguridad SHA-256.'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Auditoría de Sistema</h2>
          <p className="text-sm text-slate-500">Visualiza y analiza el registro inmutable de actividades.</p>
        </div>
        <Button onClick={handleExportDetails} className="bg-slate-800 hover:bg-slate-900 text-white gap-2">
          <Download className="w-4 h-4" />
          Exportar Bitácora
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 justify-between shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por usuario o recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-grow sm:flex-grow-0 sm:justify-end">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-slate-500 font-medium">Desde:</span>
            <Input
              type="date"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              className="w-[130px] bg-slate-50/50 h-9"
            />
            <span className="text-xs text-slate-500 font-medium">Hasta:</span>
            <Input
              type="date"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              className="w-[130px] bg-slate-50/50 h-9"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex h-9 w-[160px] rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <option value="">Todas las acciones</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="flex h-9 w-[160px] rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <option value="">Todos los recursos</option>
            {uniqueResources.map(res => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>

          <Badge variant="outline" className="text-slate-500 font-normal ml-2">
            {filteredLogs.length} reqs
          </Badge>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[160px]">Fecha y Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>IP / Dispositivo</TableHead>
                <TableHead className="text-right">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-DO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {log.userEmail.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-700 text-sm truncate">{log.userEmail}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">{log.userRole?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] px-2 py-0 border font-semibold", getActionColor(log.action))}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 capitalize font-medium">
                      {log.resource}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-slate-500">
                        <span className="font-medium">{log.ipAddress}</span>
                        <span className="truncate max-w-[150px]" title={log.userAgent}>{log.userAgent}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No se encontraron registros de trazabilidad con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] flex flex-col pt-8">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ScrollText className="w-5 h-5 text-[var(--color-primary)]" />
              Detalle del Evento de Auditoría
            </DialogTitle>
            <DialogDescription>
              Información técnica completa del registro {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200 bg-white shrink-0">
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                    {selectedLog?.userEmail?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Usuario</p>
                  <p className="text-sm font-medium leading-none truncate">{selectedLog?.userEmail}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedLog?.userRole}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Contexto</p>
                <p className="text-sm font-medium">{selectedLog?.resource}</p>
                <p className="text-xs font-semibold mt-0.5">
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px]", getActionColor(selectedLog?.action || ''))}>
                    {selectedLog?.action}
                  </span>
                </p>
              </div>
            </div>

            {selectedLog?.details?.old_value && selectedLog?.details?.new_value ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Comparación de Cambios (Diff View)</p>
                </div>
                <div className="text-sm overflow-x-auto min-w-[500px]">
                  <ReactDiffViewer
                    oldValue={JSON.stringify(selectedLog.details.old_value, null, 2)}
                    newValue={JSON.stringify(selectedLog.details.new_value, null, 2)}
                    splitView={true}
                    useDarkTheme={false}
                    leftTitle="Valor Anterior (Rojo)"
                    rightTitle="Valor Nuevo (Verde)"
                    styles={{
                      variables: {
                        light: {
                          diffViewerTitleBackground: '#f8fafc',
                          diffViewerTitleColor: '#475569',
                          diffViewerTitleBorderColor: '#e2e8f0',
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-900 shadow-inner">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-4">Metadatos / Detalles (JSON)</p>
                <div className="bg-slate-950 p-3 rounded-md border border-slate-800">
                  <pre className="text-xs text-[#5EEAD4] overflow-auto max-h-[300px] font-mono leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(selectedLog?.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex gap-4 min-w-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap"><Globe className="w-3.5 h-3.5 text-slate-400" /> {selectedLog?.ipAddress}</span>
                <span className="truncate max-w-[300px] flex items-center gap-1.5" title={selectedLog?.userAgent}><Smartphone className="w-3.5 h-3.5 text-slate-400" /> {selectedLog?.userAgent}</span>
              </div>
              <span className="font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm ml-4 whitespace-nowrap">ID: {selectedLog?.id}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// MAIN SETTINGS PAGE
// ============================================

export function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'PLATFORM_ADMIN';
  const isManager = user?.role === 'SALES_MANAGER';
  const canManageUsers = isAdmin || isManager;

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || (canManageUsers ? 'users' : 'personal');

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('settings.title')}</h1>
        <p className="text-slate-500 mt-1">Gestiona usuarios, tu perfil y configuración del sistema</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-slate-100">
          {canManageUsers && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              {t('settings.tabs.users')}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="billing" className="gap-2">
              <Zap className="w-4 h-4" />
              Suscripción
            </TabsTrigger>
          )}
          <TabsTrigger value="personal" className="gap-2">
            <User className="w-4 h-4" />
            {t('settings.tabs.personal')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="tenant" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t('settings.tabs.tenant')}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Hub de Plantillas
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Correos
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" />
              {t('settings.tabs.audit')}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="import" className="gap-2">
              <Database className="w-4 h-4" />
              Carga de Datos
            </TabsTrigger>
          )}
        </TabsList>

        {canManageUsers && (
          <TabsContent value="users" className="mt-6">
            <UserManagementTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="billing" className="mt-6">
            <SubscriptionTab />
          </TabsContent>
        )}

        <TabsContent value="personal" className="mt-6">
          <PersonalSettingsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="tenant" className="mt-6">
            <TenantSettingsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="documents" className="mt-6">
            <DocumentHubTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="email" className="mt-6">
            <EmailDomainTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="audit" className="mt-6">
            <AuditLogsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="import" className="mt-6">
            <BulkImportTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default SettingsPage;
