// ============================================
// ANTU CRM - Mi Plan (Admin Tenant)
// Vista limitada del plan actual y opciones de upgrade
// NO muestra precios de otros planes ni costos de ANTU
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Check,
  Sparkles,
  Users,
  Database,
  HardDrive,
  Calendar,
  CreditCard,
  ArrowRight,
  Lock,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Award,
  Info,
} from 'lucide-react';

// ============================================
// MOCK DATA - CURRENT PLAN
// ============================================

interface CurrentPlan {
  id: string;
  name: string;
  description: string;
  renewalDate: Date;
  nextPayment: number;
  currency: string;
  usage: {
    users: { used: number; limit: number };
    contacts: { used: number; limit: number };
    storage: { used: number; limit: number };
    aiRequests: { used: number; limit: number };
  };
  features: string[];
  support: string;
  sla: string;
}

const CURRENT_PLAN: CurrentPlan = {
  id: 'p2',
  name: 'Professional',
  description: 'Para equipos de ventas en crecimiento',
  renewalDate: new Date(2026, 2, 15),
  nextPayment: 55300,
  currency: 'RD$',
  usage: {
    users: { used: 7, limit: 10 },
    contacts: { used: 12450, limit: 50000 },
    storage: { used: 45, limit: 100 },
    aiRequests: { used: 2340, limit: 10000 },
  },
  features: [
    'Dashboard avanzado',
    'Contactos y empresas ilimitados',
    'Oportunidades y pipeline',
    'Cotizaciones',
    'Actividades y tareas',
    'Reportes personalizados',
    'Lead scoring avanzado',
    'Forecast de pipeline',
    'Generación de emails',
    'Automatizaciones',
    'Pipelines múltiples',
    'Campos personalizados',
  ],
  support: 'Chat',
  sla: '99.9%',
};

// ============================================
// UPGRADE OPTIONS (Limited info)
// ============================================

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  cta: string;
  popular?: boolean;
}

const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes organizaciones con necesidades avanzadas',
    highlights: [
      'Usuarios ilimitados',
      'Contactos ilimitados',
      'IA ilimitada',
      'SLA 99.99% garantizado',
      'Customer Success Manager dedicado',
      'Integraciones personalizadas',
      'Soporte telefónico 24/7',
    ],
    cta: 'Solicitar cotización personalizada',
    popular: true,
  },
];

// ============================================
// UTILS
// ============================================

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('es-DO')}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// ============================================
// USAGE BAR COMPONENT
// ============================================

interface UsageBarProps {
  icon: React.ElementType;
  label: string;
  used: number;
  limit: number;
  unit: string;
}

function UsageBar({ icon: Icon, label, used, limit, unit }: UsageBarProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isHigh = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className={cn('text-sm font-medium', isHigh ? 'text-amber-600' : 'text-slate-700')}>
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          'h-2',
          isHigh ? 'bg-amber-100 [&>div]:bg-amber-500' : ''
        )}
      />
    </div>
  );
}

// ============================================
// MAIN MY PLAN PAGE
// ============================================

export function MyPlanPage() {
  const { user } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const plan = CURRENT_PLAN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Plan</h1>
        <p className="text-slate-500 mt-1">Gestiona tu suscripción y uso</p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Plan actual: {plan.name}</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
              </div>
              <CardDescription className="mt-1">{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Renovación</p>
              <p className="font-medium text-slate-800">{formatDate(plan.renewalDate)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Section */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-4">Uso incluido en tu plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UsageBar
                icon={Users}
                label="Usuarios"
                used={plan.usage.users.used}
                limit={plan.usage.users.limit}
                unit=""
              />
              <UsageBar
                icon={Database}
                label="Contactos"
                used={plan.usage.contacts.used}
                limit={plan.usage.contacts.limit}
                unit=""
              />
              <UsageBar
                icon={HardDrive}
                label="Almacenamiento"
                used={plan.usage.storage.used}
                limit={plan.usage.storage.limit}
                unit="GB"
              />
              <UsageBar
                icon={Sparkles}
                label="Consultas IA"
                used={plan.usage.aiRequests.used}
                limit={plan.usage.aiRequests.limit}
                unit="/mes"
              />
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-4">Features activas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Support & SLA */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Soporte: </span>
              <Badge variant="secondary" className="text-xs">{plan.support}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">SLA: </span>
              <Badge variant="secondary" className="text-xs">{plan.sla}</Badge>
            </div>
          </div>

          <Separator />

          {/* Billing Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Próximo pago</p>
              <p className="text-xl font-bold text-slate-800">
                {formatCurrency(plan.nextPayment, plan.currency)}
              </p>
              <p className="text-xs text-slate-400">Facturación mensual</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Método de pago
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Historial de facturas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">¿Necesitas más?</h3>
        <p className="text-slate-500 mb-6">
          Tu equipo está creciendo. Considera upgrade para desbloquear más capacidad.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UPGRADE_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(
                'border-slate-200 relative',
                option.popular && 'border-violet-300 shadow-lg'
              )}
            >
              {option.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-500 text-white">
                    <Award className="w-3 h-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{option.name}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {option.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Precio personalizado según necesidades</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-violet-500 hover:bg-violet-600"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  {option.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Contact Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">¿Tienes preguntas?</CardTitle>
              <CardDescription>Nuestro equipo está aquí para ayudarte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-sm text-slate-500">soporte@antucrm.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Teléfono</p>
                  <p className="text-sm text-slate-500">+1 809 555 0100</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Chat</p>
                  <p className="text-sm text-slate-500">Disponible en horario laboral</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-500">
            <p className="font-medium text-slate-700">¿Necesitas cambiar de plan?</p>
            <p className="mt-1">
              Los cambios de plan se aplican en el próximo ciclo de facturación.
              Para cambios inmediatos o planes personalizados, contacta a nuestro equipo de ventas.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar upgrade a Enterprise</DialogTitle>
            <DialogDescription>
              Completa el formulario y nuestro equipo de ventas se pondrá en contacto contigo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
              <h4 className="font-medium text-violet-800 mb-2">Enterprise incluye:</h4>
              <ul className="space-y-1 text-sm text-violet-700">
                <li>• Usuarios ilimitados</li>
                <li>• Contactos ilimitados</li>
                <li>• IA ilimitada</li>
                <li>• SLA 99.99% garantizado</li>
                <li>• Customer Success Manager dedicado</li>
                <li>• Integraciones personalizadas</li>
                <li>• Soporte telefónico 24/7</li>
              </ul>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Tu nombre" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="tu@empresa.com" defaultValue={user?.email} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="+1 809 555 0123" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje (opcional)</label>
              <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Cuéntanos sobre tus necesidades..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-violet-500 hover:bg-violet-600">
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyPlanPage;
