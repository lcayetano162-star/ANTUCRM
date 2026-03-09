// ============================================
// ANTU CRM - Pricing Page
// Good-Better-Best pricing tiers
// ============================================

import React from 'react';
// useTranslation not used yet
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, X, HelpCircle, Zap, Building2, Crown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================
// PRICING TIERS CONFIGURATION
// ============================================

interface PricingTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    annually: number;
  };
  description: string;
  icon: React.ElementType;
  color: string;
  popular?: boolean;
  features: {
    included: string[];
    notIncluded?: string[];
  };
  limits: {
    users: string;
    contacts: string;
    storage: string;
    pipelines: string;
  };
  cta: {
    text: string;
    variant: 'default' | 'outline' | 'secondary';
  };
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: {
      monthly: 29,
      annually: 24,
    },
    description: 'Perfecto para equipos pequeños que están comenzando',
    icon: Zap,
    color: 'bg-slate-500',
    features: {
      included: [
        'Hasta 5 usuarios',
        'Pipeline básico',
        '1,000 contactos',
        'Soporte por email',
        '5GB almacenamiento',
        'Reportes básicos',
        'App móvil',
      ],
      notIncluded: [
        'Automatizaciones',
        'API access',
        'Integraciones avanzadas',
        'SSO/SAML',
      ],
    },
    limits: {
      users: '5',
      contacts: '1,000',
      storage: '5GB',
      pipelines: '1',
    },
    cta: {
      text: 'Comenzar gratis',
      variant: 'outline',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: {
      monthly: 79,
      annually: 67,
    },
    description: 'Para equipos en crecimiento que necesitan más poder',
    icon: Building2,
    color: 'bg-[var(--color-primary)]',
    popular: true,
    features: {
      included: [
        'Usuarios ilimitados',
        'Múltiples pipelines',
        '50,000 contactos',
        'Soporte prioritario',
        '100GB almacenamiento',
        'Automatizaciones',
        'Reportes avanzados',
        'API access (10K/mes)',
        'Integraciones nativas',
        'Campos personalizados',
      ],
      notIncluded: ['SSO/SAML', 'CSM dedicado', 'SLA garantizado'],
    },
    limits: {
      users: 'Ilimitados',
      contacts: '50,000',
      storage: '100GB',
      pipelines: 'Ilimitados',
    },
    cta: {
      text: 'Prueba gratis 14 días',
      variant: 'default',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 0,
      annually: 0,
    },
    description: 'Para grandes organizaciones con necesidades específicas',
    icon: Crown,
    color: 'bg-violet-600',
    features: {
      included: [
        'Todo lo de Professional',
        'SSO/SAML',
        'API dedicada (ilimitada)',
        'CSM dedicado',
        'SLA 99.99%',
        'On-premise option',
        'Contratos personalizados',
        'Security audit',
        'Training personalizado',
        'White-label option',
      ],
    },
    limits: {
      users: 'Ilimitados',
      contacts: 'Ilimitados',
      storage: 'Ilimitado',
      pipelines: 'Ilimitados',
    },
    cta: {
      text: 'Contactar ventas',
      variant: 'secondary',
    },
  },
];

// ============================================
// FEATURE ROW COMPONENT
// ============================================

interface FeatureRowProps {
  feature: string;
  tiers: (string | boolean)[];
}

function FeatureRow({ feature, tiers }: FeatureRowProps) {
  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700">{feature}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Más información sobre {feature}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {tiers.map((tier, index) => (
        <div key={index} className="flex items-center justify-center">
          {typeof tier === 'boolean' ? (
            tier ? (
              <Check className="w-5 h-5 text-emerald-500" />
            ) : (
              <X className="w-5 h-5 text-slate-300" />
            )
          ) : (
            <span className="text-sm text-slate-600">{tier}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// PRICING CARD COMPONENT
// ============================================

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
}

function PricingCard({ tier, isAnnual }: PricingCardProps) {
  const Icon = tier.icon;
  const price = isAnnual ? tier.price.annually : tier.price.monthly;
  const isEnterprise = tier.id === 'enterprise';

  return (
    <Card
      className={cn(
        'relative border-2 transition-all duration-300 hover:shadow-xl',
        tier.popular
          ? 'border-[var(--color-primary)] scale-105 z-10'
          : 'border-slate-100 hover:border-slate-200'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-[var(--color-primary)] text-white px-3 py-1">
            Más popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', tier.color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{tier.name}</h3>
        <p className="text-sm text-slate-500">{tier.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price */}
        <div className="text-center">
          {isEnterprise ? (
            <div className="text-3xl font-bold text-slate-800">Custom</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-slate-800">${price}</span>
                <span className="text-slate-500">/usuario/mes</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-emerald-600 mt-1">
                  Ahorra ${(tier.price.monthly - tier.price.annually) * 12}/año
                </p>
              )}
            </>
          )}
        </div>

        {/* CTA Button */}
        <Button
          className={cn(
            'w-full',
            tier.popular
              ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
              : tier.cta.variant === 'outline'
              ? 'border-slate-300 hover:bg-slate-50'
              : ''
          )}
          variant={tier.cta.variant}
        >
          {tier.cta.text}
        </Button>

        {/* Features */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Incluye:</p>
          <ul className="space-y-2">
            {tier.features.included.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-600">{feature}</span>
              </li>
            ))}
          </ul>

          {tier.features.notIncluded && tier.features.notIncluded.length > 0 && (
            <>
              <p className="text-sm font-medium text-slate-700 pt-2">No incluye:</p>
              <ul className="space-y-2">
                {tier.features.notIncluded.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Limits */}
        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Usuarios</p>
              <p className="text-sm font-medium text-slate-700">{tier.limits.users}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Contactos</p>
              <p className="text-sm font-medium text-slate-700">{tier.limits.contacts}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Storage</p>
              <p className="text-sm font-medium text-slate-700">{tier.limits.storage}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Pipelines</p>
              <p className="text-sm font-medium text-slate-700">{tier.limits.pipelines}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PRICING PAGE
// ============================================

export function PricingPage() {
  const [isAnnual, setIsAnnual] = React.useState(true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="mb-4 bg-[var(--primary-100)] text-[var(--color-primary)]">
          Pricing
        </Badge>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Planes simples y transparentes
        </h1>
        <p className="text-slate-500 mb-6">
          Elige el plan que mejor se adapte a tu equipo. Todos los planes incluyen una prueba gratuita de 14 días.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={cn('text-sm', !isAnnual && 'font-medium text-slate-800')}>
            Mensual
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-[var(--color-primary)]"
          />
          <span className={cn('text-sm', isAnnual && 'font-medium text-slate-800')}>
            Anual
          </span>
          {isAnnual && (
            <Badge className="bg-emerald-100 text-emerald-600">Ahorra 20%</Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <PricingCard key={tier.id} tier={tier} isAnnual={isAnnual} />
        ))}
      </div>

      {/* Feature Comparison */}
      <Card className="border-slate-100 max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-slate-800">Comparación de características</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 pb-3 border-b border-slate-200 font-medium text-sm text-slate-700">
            <div>Característica</div>
            <div className="text-center">Starter</div>
            <div className="text-center">Professional</div>
            <div className="text-center">Enterprise</div>
          </div>

          <FeatureRow
            feature="Usuarios"
            tiers={['Hasta 5', 'Ilimitados', 'Ilimitados']}
          />
          <FeatureRow
            feature="Contactos"
            tiers={['1,000', '50,000', 'Ilimitados']}
          />
          <FeatureRow
            feature="Almacenamiento"
            tiers={['5GB', '100GB', 'Ilimitado']}
          />
          <FeatureRow
            feature="Pipelines"
            tiers={['1', 'Ilimitados', 'Ilimitados']}
          />
          <FeatureRow
            feature="Automatizaciones"
            tiers={[false, true, true]}
          />
          <FeatureRow
            feature="API Access"
            tiers={[false, '10K/mes', 'Ilimitado']}
          />
          <FeatureRow
            feature="SSO/SAML"
            tiers={[false, false, true]}
          />
          <FeatureRow
            feature="Soporte"
            tiers={['Email', 'Prioritario', 'Dedicado']}
          />
          <FeatureRow
            feature="SLA"
            tiers={['99%', '99.9%', '99.99%']}
          />
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          ¿Preguntas frecuentes?
        </h3>
        <p className="text-slate-500">
          Contáctanos en{' '}
          <a href="mailto:sales@antucrm.com" className="text-[var(--color-primary)] hover:underline">
            sales@antucrm.com
          </a>{' '}
          o{' '}
          <a href="tel:+18095550123" className="text-[var(--color-primary)] hover:underline">
            +1 (809) 555-0123
          </a>
        </p>
      </div>
    </div>
  );
}

export default PricingPage;
