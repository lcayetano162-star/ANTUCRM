// ============================================
// ANTU CRM - Pricing Admin (SUPER ADMIN ONLY)
// Gestión completa de precios, planes y promociones
// EXCLUSIVO: Solo ANTU CRM staff puede acceder
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Save,
  MoreVertical,
  Users,
  Database,
  HardDrive,
  Sparkles,
  Check,
  X,
  Globe,
  Tag,
  BarChart3,
  Lock,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type Currency = 'USD' | 'DOP' | 'EUR';
type BillingPeriod = 'monthly' | 'yearly';
type PlanVisibility = 'public' | 'hidden';

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  // Costos reales - SOLO SUPER ADMIN
  basePrice: number; // Costo para ANTU
  salePrice: number; // Precio al cliente
  currency: Currency;
  billingPeriod: BillingPeriod;
  yearlyDiscount: number; // %
  // Margen
  marginPercent: number;
  // Límites
  limits: {
    maxUsers: number | null;
    maxContacts: number | null;
    maxStorageGB: number | null;
    maxAIRequests: number | null;
  };
  // Features
  features: {
    modules: string[];
    leadScoring: 'none' | 'basic' | 'advanced' | 'custom';
    forecast: boolean;
    emailGeneration: boolean;
    chatbotAssistant: boolean;
    customModel: boolean;
    byok: boolean;
    sso: boolean;
    sla: string;
    support: 'email' | 'chat' | 'phone' | 'dedicated';
    csm: boolean;
  };
  // Visibilidad
  visibility: PlanVisibility;
  allowSelfServe: boolean;
  availableRegions: string[];
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  discountAmount?: number;
  validUntil: Date;
  maxUses: number;
  usedCount: number;
  applicablePlans: string[];
  isActive: boolean;
}

interface RegionalPricing {
  region: string;
  currency: Currency;
  plans: Record<string, { salePrice: number; enabled: boolean }>;
}

// ============================================
// MOCK DATA - PRICING PLANS
// ============================================

const MOCK_PLANS: PricingPlan[] = [
  {
    id: 'p1',
    name: 'Starter',
    slug: 'starter',
    description: 'Para pequeños equipos comenzando con CRM',
    basePrice: 15,
    salePrice: 29,
    currency: 'USD',
    billingPeriod: 'monthly',
    yearlyDiscount: 15,
    marginPercent: 48.3,
    limits: {
      maxUsers: 5,
      maxContacts: 1000,
      maxStorageGB: 5,
      maxAIRequests: 1000,
    },
    features: {
      modules: ['dashboard', 'contacts', 'opportunities', 'activities'],
      leadScoring: 'basic',
      forecast: false,
      emailGeneration: false,
      chatbotAssistant: false,
      customModel: false,
      byok: false,
      sso: false,
      sla: '99.9%',
      support: 'email',
      csm: false,
    },
    visibility: 'public',
    allowSelfServe: true,
    availableRegions: ['DO', 'LATAM', 'US', 'EU'],
    isActive: true,
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 1),
  },
  {
    id: 'p2',
    name: 'Professional',
    slug: 'professional',
    description: 'Para equipos de ventas en crecimiento',
    basePrice: 45,
    salePrice: 79,
    currency: 'USD',
    billingPeriod: 'monthly',
    yearlyDiscount: 15,
    marginPercent: 43.0,
    limits: {
      maxUsers: null,
      maxContacts: 50000,
      maxStorageGB: 100,
      maxAIRequests: 10000,
    },
    features: {
      modules: ['dashboard', 'contacts', 'opportunities', 'activities', 'quotes', 'reports'],
      leadScoring: 'advanced',
      forecast: true,
      emailGeneration: true,
      chatbotAssistant: false,
      customModel: false,
      byok: false,
      sso: false,
      sla: '99.9%',
      support: 'chat',
      csm: false,
    },
    visibility: 'public',
    allowSelfServe: true,
    availableRegions: ['DO', 'LATAM', 'US', 'EU'],
    isActive: true,
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 6, 15),
  },
  {
    id: 'p3',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Para grandes organizaciones con necesidades avanzadas',
    basePrice: 0, // Custom pricing
    salePrice: 0, // Custom pricing
    currency: 'USD',
    billingPeriod: 'monthly',
    yearlyDiscount: 0,
    marginPercent: 0, // Variable
    limits: {
      maxUsers: null,
      maxContacts: null,
      maxStorageGB: null,
      maxAIRequests: null,
    },
    features: {
      modules: ['dashboard', 'contacts', 'opportunities', 'activities', 'quotes', 'reports', 'inventory'],
      leadScoring: 'custom',
      forecast: true,
      emailGeneration: true,
      chatbotAssistant: true,
      customModel: true,
      byok: true,
      sso: true,
      sla: '99.99%',
      support: 'dedicated',
      csm: true,
    },
    visibility: 'public',
    allowSelfServe: false,
    availableRegions: ['DO', 'LATAM', 'US', 'EU'],
    isActive: true,
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 1),
  },
];

const MOCK_PROMOS: PromoCode[] = [
  {
    id: 'promo1',
    code: 'ONBOARDING20',
    discountPercent: 20,
    validUntil: new Date(2026, 2, 31),
    maxUses: 100,
    usedCount: 45,
    applicablePlans: ['p1', 'p2'],
    isActive: true,
  },
  {
    id: 'promo2',
    code: 'REFERRAL15',
    discountPercent: 15,
    validUntil: new Date(2026, 5, 30),
    maxUses: 50,
    usedCount: 12,
    applicablePlans: ['p1', 'p2', 'p3'],
    isActive: true,
  },
  {
    id: 'promo3',
    code: 'NONPROFIT50',
    discountPercent: 50,
    validUntil: new Date(2030, 0, 1),
    maxUses: 1000,
    usedCount: 8,
    applicablePlans: ['p1', 'p2'],
    isActive: true,
  },
];

const REGIONAL_PRICING: RegionalPricing[] = [
  {
    region: 'República Dominicana',
    currency: 'DOP',
    plans: {
      p1: { salePrice: 1740, enabled: true }, // 29 USD
      p2: { salePrice: 4740, enabled: true }, // 79 USD
      p3: { salePrice: 0, enabled: true },
    },
  },
  {
    region: 'Latinoamérica',
    currency: 'USD',
    plans: {
      p1: { salePrice: 29, enabled: true },
      p2: { salePrice: 79, enabled: true },
      p3: { salePrice: 0, enabled: true },
    },
  },
  {
    region: 'Estados Unidos',
    currency: 'USD',
    plans: {
      p1: { salePrice: 39, enabled: true },
      p2: { salePrice: 99, enabled: true },
      p3: { salePrice: 0, enabled: true },
    },
  },
  {
    region: 'Europa',
    currency: 'EUR',
    plans: {
      p1: { salePrice: 35, enabled: true },
      p2: { salePrice: 89, enabled: true },
      p3: { salePrice: 0, enabled: true },
    },
  },
];

// ============================================
// CONSTANTS
// ============================================

// ============================================
// UTILS
// ============================================

function formatCurrency(amount: number, currency: Currency): string {
  if (amount === 0) return 'Custom';
  const symbols: Record<Currency, string> = { USD: '$', DOP: 'RD$', EUR: '€' };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}

function formatLimit(value: number | null): string {
  if (value === null) return '∞';
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

// ============================================
// PLAN CARD COMPONENT
// ============================================

interface PlanCardProps {
  plan: PricingPlan;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
}

function PlanCard({ plan, onEdit, onDuplicate, onToggle }: PlanCardProps) {
  const isEnterprise = plan.slug === 'enterprise';

  return (
    <Card className={cn('border-slate-200', !plan.isActive && 'opacity-60')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {!plan.isActive && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                  Inactivo
                </Badge>
              )}
              {plan.visibility === 'hidden' && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-600">
                  <Lock className="w-3 h-3 mr-1" />
                  Oculto
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{plan.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {plan.isActive ? (
                  <><X className="w-4 h-4 mr-2" /> Desactivar</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Activar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800">
            {isEnterprise ? 'Custom' : formatCurrency(plan.salePrice, plan.currency)}
          </span>
          {!isEnterprise && (
            <span className="text-slate-500">/usuario/{plan.billingPeriod === 'monthly' ? 'mes' : 'año'}</span>
          )}
        </div>

        {/* Cost & Margin (SUPER ADMIN ONLY) */}
        {!isEnterprise && (
          <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Costo ANTU:</span>
              <span>{formatCurrency(plan.basePrice, plan.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Margen:</span>
              <span className={cn(
                'font-medium',
                plan.marginPercent >= 40 ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {plan.marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Limits */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Límites:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formatLimit(plan.limits.maxUsers)} usuarios</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formatLimit(plan.limits.maxContacts)} contactos</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formatLimit(plan.limits.maxStorageGB)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formatLimit(plan.limits.maxAIRequests)} IA/mes</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Features IA:</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {plan.features.leadScoring !== 'none' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-slate-300" />
              )}
              <span className={plan.features.leadScoring !== 'none' ? 'text-slate-700' : 'text-slate-400'}>
                Lead scoring {plan.features.leadScoring !== 'none' && `(${plan.features.leadScoring})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.features.forecast ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-slate-300" />
              )}
              <span className={plan.features.forecast ? 'text-slate-700' : 'text-slate-400'}>
                Forecast pipeline
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.features.emailGeneration ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-slate-300" />
              )}
              <span className={plan.features.emailGeneration ? 'text-slate-700' : 'text-slate-400'}>
                Email generation
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.features.chatbotAssistant ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-slate-300" />
              )}
              <span className={plan.features.chatbotAssistant ? 'text-slate-700' : 'text-slate-400'}>
                Chatbot assistant
              </span>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Soporte:</span>
          <Badge variant="secondary" className="text-xs">
            {plan.features.support === 'email' && 'Email'}
            {plan.features.support === 'chat' && 'Chat'}
            {plan.features.support === 'phone' && 'Teléfono'}
            {plan.features.support === 'dedicated' && 'Dedicado'}
          </Badge>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">SLA {plan.features.sla}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-1" />
            Duplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// EDIT PLAN MODAL
// ============================================

interface EditPlanModalProps {
  plan: PricingPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (plan: PricingPlan) => void;
}

function EditPlanModal({ plan, open, onOpenChange, onSave }: EditPlanModalProps) {
  if (!plan) return null;

  const isEnterprise = plan.slug === 'enterprise';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar plan: {plan.name}</DialogTitle>
          <DialogDescription>
            Configura precios, límites y features del plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Información básica</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del plan</Label>
                <Input defaultValue={plan.name} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input defaultValue={plan.slug} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción pública</Label>
              <Textarea defaultValue={plan.description} rows={2} />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          {!isEnterprise && (
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">Pricing</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Costo ANTU (base)</Label>
                  <Input type="number" defaultValue={plan.basePrice} />
                </div>
                <div className="space-y-2">
                  <Label>Precio venta</Label>
                  <Input type="number" defaultValue={plan.salePrice} />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select defaultValue={plan.currency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="DOP">DOP (RD$)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período de facturación</Label>
                  <Select defaultValue={plan.billingPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descuento anual (%)</Label>
                  <Input type="number" defaultValue={plan.yearlyDiscount} />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Limits */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Límites del plan</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máximo usuarios (vacío = ilimitado)</Label>
                <Input type="number" defaultValue={plan.limits.maxUsers || ''} placeholder="Ilimitado" />
              </div>
              <div className="space-y-2">
                <Label>Máximo contactos</Label>
                <Input type="number" defaultValue={plan.limits.maxContacts || ''} placeholder="Ilimitado" />
              </div>
              <div className="space-y-2">
                <Label>Almacenamiento (GB)</Label>
                <Input type="number" defaultValue={plan.limits.maxStorageGB || ''} placeholder="Ilimitado" />
              </div>
              <div className="space-y-2">
                <Label>Requests IA/mes</Label>
                <Input type="number" defaultValue={plan.limits.maxAIRequests || ''} placeholder="Ilimitado" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Features incluidas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead scoring</Label>
                <Select defaultValue={plan.features.leadScoring}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Soporte</Label>
                <Select defaultValue={plan.features.support}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="dedicated">Dedicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.forecast} />
                <Label className="font-normal">Forecast pipeline</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.emailGeneration} />
                <Label className="font-normal">Email generation</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.chatbotAssistant} />
                <Label className="font-normal">Chatbot assistant</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.customModel} />
                <Label className="font-normal">Modelo custom</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.byok} />
                <Label className="font-normal">BYOK (Bring Your Own Key)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.sso} />
                <Label className="font-normal">SSO/SAML</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked={plan.features.csm} />
                <Label className="font-normal">Customer Success Manager</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Visibility */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Visibilidad</h4>
            <div className="flex items-center gap-2">
              <Checkbox defaultChecked={plan.visibility === 'public'} />
              <Label className="font-normal">Visible en pricing page</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox defaultChecked={plan.allowSelfServe} />
              <Label className="font-normal">Permitir self-service upgrade</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="secondary">
            <Copy className="w-4 h-4 mr-2" />
            Duplicar plan
          </Button>
          <Button className="bg-[var(--color-primary)]" onClick={() => onSave(plan)}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// PROMO CODES TAB
// ============================================

function PromoCodesTab() {
  const [promos, setPromos] = useState<PromoCode[]>(MOCK_PROMOS);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const handleToggle = (id: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Descuentos y promociones</h3>
          <p className="text-slate-500">Gestiona códigos de descuento para clientes</p>
        </div>
        <Button className="bg-[var(--color-primary)]" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva promoción
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-semibold uppercase">Código</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Descuento</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Válido hasta</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Usos</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Estado</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                      {promo.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-emerald-600">{promo.discountPercent}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-600">
                      {promo.validUntil.toLocaleDateString('es-DO')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-600">
                      {promo.usedCount}/{promo.maxUses}
                    </span>
                    <Progress value={(promo.usedCount / promo.maxUses) * 100} className="h-1.5 w-20 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.isActive ? 'default' : 'secondary'} className={promo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {promo.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(promo.id)}>
                      {promo.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Promo Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva promoción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input placeholder="EJ: SUMMER20" />
            </div>
            <div className="space-y-2">
              <Label>Descuento (%)</Label>
              <Input type="number" placeholder="20" />
            </div>
            <div className="space-y-2">
              <Label>Válido hasta</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Máximo de usos</Label>
              <Input type="number" placeholder="100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[var(--color-primary)]">Crear promoción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// REGIONAL PRICING TAB
// ============================================

function RegionalPricingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Pricing por región</h3>
        <p className="text-slate-500">Precios adaptados por mercado geográfico</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-semibold uppercase">Región</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Moneda</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Starter</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Professional</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REGIONAL_PRICING.map((region) => (
                <TableRow key={region.region}>
                  <TableCell className="font-medium">{region.region}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{region.currency}</Badge>
                  </TableCell>
                  <TableCell>
                    {region.plans.p1.salePrice > 0
                      ? formatCurrency(region.plans.p1.salePrice, region.currency)
                      : 'Custom'}
                  </TableCell>
                  <TableCell>
                    {region.plans.p2.salePrice > 0
                      ? formatCurrency(region.plans.p2.salePrice, region.currency)
                      : 'Custom'}
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-400">Custom</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline">
          <Edit2 className="w-4 h-4 mr-2" />
          Editar pricing por región
        </Button>
      </div>
    </div>
  );
}

// ============================================
// FEATURES COMPARISON TAB
// ============================================

function FeaturesComparisonTab({ plans }: { plans: PricingPlan[] }) {
  const features = [
    { key: 'maxUsers', label: 'Usuarios', format: (v: number | null) => (v === null ? '∞' : v.toString()) },
    { key: 'maxContacts', label: 'Contactos', format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()) },
    { key: 'maxStorageGB', label: 'Storage', format: (v: number) => `${v}GB` },
    { key: 'maxAIRequests', label: 'IA/mes', format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()) },
    { key: 'leadScoring', label: 'Lead scoring', format: (v: string) => v },
    { key: 'forecast', label: 'Forecast', format: (v: boolean) => (v ? '✓' : '✗') },
    { key: 'emailGeneration', label: 'Email gen', format: (v: boolean) => (v ? '✓' : '✗') },
    { key: 'chatbotAssistant', label: 'Chatbot', format: (v: boolean) => (v ? '✓' : '✗') },
    { key: 'sso', label: 'SSO/SAML', format: (v: boolean) => (v ? '✓' : '✗') },
    { key: 'sla', label: 'SLA', format: (v: string) => v },
    { key: 'support', label: 'Soporte', format: (v: string) => v },
    { key: 'csm', label: 'CSM', format: (v: boolean) => (v ? '✓' : '✗') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Comparador de planes</h3>
        <p className="text-slate-500">Vista interna ANTU de features por plan</p>
      </div>

      <Card className="border-slate-200 overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-semibold uppercase">Feature</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.id} className="text-xs font-semibold uppercase text-center">
                    {plan.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.key}>
                  <TableCell className="font-medium text-slate-700">{feature.label}</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center">
                      <span className={cn(
                        'text-sm',
                        typeof plan.limits[feature.key as keyof typeof plan.limits] === 'boolean' &&
                          plan.limits[feature.key as keyof typeof plan.limits]
                          ? 'text-emerald-600 font-medium'
                          : 'text-slate-600'
                      )}>
                        {feature.key in plan.limits
                          ? feature.format(plan.limits[feature.key as keyof typeof plan.limits] as never)
                          : feature.key in plan.features
                          ? feature.format(plan.features[feature.key as keyof typeof plan.features] as never)
                          : '—'}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline">
          <Edit2 className="w-4 h-4 mr-2" />
          Editar matriz de features
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PRICING ADMIN PAGE
// ============================================

export function PricingAdminPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(MOCK_PLANS);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = (plan: PricingPlan) => {
    const newPlan: PricingPlan = {
      ...plan,
      id: `p${Date.now()}`,
      name: `${plan.name} (Copia)`,
      slug: `${plan.slug}-copy`,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPlans((prev) => [...prev, newPlan]);
  };

  const handleToggle = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Pricing y planes</h1>
            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
              <Lock className="w-3 h-3 mr-1" />
              Super Admin
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">
            Gestión completa de precios, features y límites por plan
          </p>
        </div>
        <Button className="bg-[var(--color-primary)]">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo plan
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Información confidencial</p>
          <p>Esta página contiene costos reales y márgenes de ANTU CRM. No compartir con clientes.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="plans" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Comparador
          </TabsTrigger>
          <TabsTrigger value="promos" className="gap-2">
            <Tag className="w-4 h-4" />
            Promociones
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2">
            <Globe className="w-4 h-4" />
            Por región
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => handleEdit(plan)}
                onDuplicate={() => handleDuplicate(plan)}
                onToggle={() => handleToggle(plan.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <FeaturesComparisonTab plans={activePlans} />
        </TabsContent>

        <TabsContent value="promos" className="mt-6">
          <PromoCodesTab />
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <RegionalPricingTab />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <EditPlanModal
        plan={editingPlan}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}

export default PricingAdminPage;
