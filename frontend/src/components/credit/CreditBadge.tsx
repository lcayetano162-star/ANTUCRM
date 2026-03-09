import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type CreditStatus = 
  | 'APPROVED'      // 🟢 Crédito aprobado y activo
  | 'PENDING'       // 🟡 En evaluación
  | 'REJECTED'      // 🔴 Rechazado
  | 'NONE'          // ⚫ Sin solicitud
  | 'EXHAUSTED'     // 🔵 Agotado (límite = utilizado)
  | 'CONDITIONAL'   // 🟠 Aprobado con condiciones
  | 'SUSPENDED';    // 🔴 Suspendido por mora

interface CreditBadgeProps {
  status: CreditStatus;
  limit?: number;
  available?: number;
  used?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CreditBadge({ 
  status, 
  limit = 0, 
  available = 0, 
  used = 0,
  showDetails = true,
  size = 'md' 
}: CreditBadgeProps) {
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const configs: Record<CreditStatus, { 
    bg: string; 
    text: string; 
    icon: string; 
    label: string;
    description: string;
  }> = {
    APPROVED: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      icon: '🟢',
      label: 'Crédito Aprobado',
      description: `Límite: ${formatCurrency(limit)} | Disponible: ${formatCurrency(available)}`,
    },
    PENDING: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: '🟡',
      label: 'Crédito: En Evaluación',
      description: 'Solicitud en proceso de análisis',
    },
    REJECTED: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: '🔴',
      label: 'Crédito Rechazado',
      description: 'No califica para línea de crédito',
    },
    NONE: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      icon: '⚫',
      label: 'Sin Línea de Crédito',
      description: 'No ha solicitado crédito',
    },
    EXHAUSTED: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: '🔵',
      label: 'Crédito Agotado',
      description: `Límite total utilizado: ${formatCurrency(used)}`,
    },
    CONDITIONAL: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      icon: '🟠',
      label: 'Crédito Condicionado',
      description: `Aprobado con restricciones | Disponible: ${formatCurrency(available)}`,
    },
    SUSPENDED: {
      bg: 'bg-red-900',
      text: 'text-white',
      icon: '🔴',
      label: 'Crédito Suspendido',
      description: 'Suspendido por mora o incumplimiento',
    },
  };

  const config = configs[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (!showDetails) {
    return (
      <Badge className={`${config.bg} ${config.text} ${sizeClasses[size]} font-medium`}>
        {config.icon} {config.label}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`${config.bg} ${config.text} ${sizeClasses[size]} font-medium cursor-help`}
          >
            {config.icon} {config.label}
            {(status === 'APPROVED' || status === 'EXHAUSTED' || status === 'CONDITIONAL') && (
              <span className="ml-1.5">
                {formatCurrency(available)}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.label}</p>
            <p className="text-sm text-slate-600">{config.description}</p>
            {(status === 'APPROVED' || status === 'CONDITIONAL') && (
              <div className="mt-2 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span>Límite:</span>
                  <span className="font-medium">{formatCurrency(limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilizado:</span>
                  <span className="font-medium">{formatCurrency(used)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disponible:</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(available)}</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Versión compacta para tablas y listas
export function CreditBadgeCompact({ status, available = 0 }: { status: CreditStatus; available?: number }) {
  const icons: Record<CreditStatus, string> = {
    APPROVED: '🟢',
    PENDING: '🟡',
    REJECTED: '🔴',
    NONE: '⚫',
    EXHAUSTED: '🔵',
    CONDITIONAL: '🟠',
    SUSPENDED: '🔴',
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span>{icons[status]}</span>
      {(status === 'APPROVED' || status === 'CONDITIONAL') && available > 0 && (
        <span className="text-slate-600">{formatCurrency(available)}</span>
      )}
    </span>
  );
}
