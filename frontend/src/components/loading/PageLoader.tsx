// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - PAGE LOADER
// Loading states for code-split routes with premium UX
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PageLoaderProps {
  /** Minimum time to show loader (prevents flash) */
  minDuration?: number;
  /** Show logo animation */
  showLogo?: boolean;
  /** Custom message */
  message?: string;
  /** Full screen or contained */
  fullScreen?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

interface SkeletonCardProps {
  /** Number of skeleton lines */
  lines?: number;
  /** Show avatar */
  showAvatar?: boolean;
  /** Show action buttons */
  showActions?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE LOADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function PageLoader({
  minDuration = 300,
  showLogo = true,
  message = 'Cargando...',
  fullScreen = true,
  size = 'md',
  className,
}: PageLoaderProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [showMinDuration, setShowMinDuration] = useState(true);

  // Prevent flash of loader for fast loads
  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const minDurationTimer = setTimeout(() => setShowMinDuration(false), minDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(minDurationTimer);
    };
  }, [minDuration]);

  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen'
    : 'min-h-[200px]';

  if (!isVisible) {
    return <div className={cn(containerClasses, className)} />;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm',
        containerClasses,
        'transition-opacity duration-200',
        className
      )}
    >
      {/* Logo Animation */}
      {showLogo && (
        <div className="relative mb-6">
          {/* Outer ring */}
          <div 
            className={cn(
              'rounded-full border-[var(--color-primary)] border-t-transparent',
              'animate-spin',
              sizeClasses[size]
            )}
          />
          {/* Inner accent */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full border-[var(--color-secondary)] border-b-transparent',
              'animate-spin',
              'animation-direction-reverse',
              sizeClasses[size]
            )}
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />
        </div>
      )}

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-slate-600 font-medium animate-pulse">
          {message}
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full bg-[var(--color-primary)]',
                'animate-bounce'
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Minimum duration overlay */}
      {showMinDuration && (
        <div className="absolute inset-0 bg-slate-50/50" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function SkeletonCard({
  lines = 3,
  showAvatar = true,
  showActions = true,
}: SkeletonCardProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {showAvatar && (
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 bg-slate-200 rounded',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <div className="h-8 bg-slate-200 rounded w-20" />
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-3 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-300 rounded flex-1" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4 flex gap-4 items-center">
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  'h-3 bg-slate-200 rounded',
                  colIndex === 0 ? 'flex-1' : 'w-24'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-6 bg-slate-200 rounded w-24" />
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({ columns = 4 }: { columns?: number }): React.ReactElement {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div
          key={colIndex}
          className="flex-shrink-0 w-80 bg-slate-100 rounded-xl p-3"
        >
          {/* Column header */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-slate-300 rounded w-24" />
            <div className="h-6 bg-slate-300 rounded-full w-8" />
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-white rounded-lg p-3 space-y-2 animate-pulse"
                style={{ animationDelay: `${(colIndex * 3 + cardIndex) * 100}ms` }}
              >
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="flex gap-2 pt-2">
                  <div className="h-5 bg-slate-200 rounded w-16" />
                  <div className="h-5 bg-slate-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE LOADER (for buttons, small areas)
// ═══════════════════════════════════════════════════════════════════════════════

interface InlineLoaderProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoader({ size = 'sm', className }: InlineLoaderProps): React.ReactElement {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
  };

  return (
    <div
      className={cn(
        'inline-block rounded-full border-current border-t-transparent',
        'animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUSPENSE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

import { Suspense } from 'react';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDuration?: number;
}

export function SuspenseWrapper({
  children,
  fallback,
  minDuration = 300,
}: SuspenseWrapperProps): React.ReactElement {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <PageLoader
            minDuration={minDuration}
            showLogo
            message="Cargando..."
          />
        )
      }
    >
      {children}
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default PageLoader;
