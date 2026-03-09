// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - ERROR BOUNDARY
// Graceful error handling with user-friendly fallbacks
// ═══════════════════════════════════════════════════════════════════════════════

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logSecurityEvent } from '@/lib/security';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error for monitoring
    logSecurityEvent('REACT_ERROR_BOUNDARY', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    // @ts-ignore - Vite env
    if (import.meta.env?.PROD) {
      // TODO: Integrate with Sentry/Datadog
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Algo salió mal
            </h1>

            {/* Description */}
            <p className="text-slate-600 mb-6">
              Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
            </p>

            {/* Error Details (dev only) */}
            {/* @ts-ignore - Vite env */}
            {import.meta.env?.DEV && error && (
              <div className="mb-6 p-4 bg-slate-100 rounded-lg text-left overflow-auto">
                <p className="text-sm font-mono text-red-600 mb-2">{error.message}</p>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </div>

            {/* Support Link */}
            <p className="mt-6 text-sm text-slate-500">
              ¿El problema persiste?{' '}
              <a 
                href="mailto:support@antu-crm.com" 
                className="text-[var(--color-primary)] hover:underline"
              >
                Contacta a soporte
              </a>
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ERROR BOUNDARY
// For wrapping smaller sections that can fail independently
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps, 
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logSecurityEvent('SECTION_ERROR', {
      section: this.props.sectionName,
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, sectionName } = this.props;

    if (hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Error en {sectionName}
              </h3>
              <p className="text-sm text-red-700 mb-3">
                No se pudo cargar esta sección. Intenta recargar.
              </p>
              <Button 
                onClick={this.handleRetry}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR FUNCTIONAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

interface UseErrorHandlerReturn {
  error: Error | null;
  handleError: (error: Error) => void;
  clearError: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error): void => {
    setError(err);
    logSecurityEvent('HOOK_ERROR', {
      error: err.message,
      stack: err.stack,
    });
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export function handleAsyncError<T>(
  promise: Promise<T>,
  context: string
): Promise<T> {
  return promise.catch((error) => {
    logSecurityEvent('ASYNC_ERROR', {
      context,
      error: error.message,
    });
    throw error;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default ErrorBoundary;
