// ============================================
// ANTU CRM - RESET PASSWORD PAGE
// Validación de token y nueva contraseña
// ============================================

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, RefreshCw, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPasswordBreached, passwordSchema } from '@/lib/security';

// ============================================
// PASSWORD REQUIREMENTS
// ============================================



// Password validation via security module

// ============================================
// PASSWORD STRENGTH CALCULATOR
// ============================================

function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Vacía', color: 'bg-slate-200' };

  let score = 0;

  // Length
  if (password.length >= 12) score += 20;
  else if (password.length >= 8) score += 10;

  // Character variety
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  // Bonus for extra length
  if (password.length >= 16) score += 15;

  // Penalty for common patterns
  if (isPasswordBreached(password)) {
    score = Math.max(0, score - 30);
  }

  // Determine label and color
  if (score >= 80) return { score, label: 'Muy fuerte', color: 'bg-emerald-500' };
  if (score >= 60) return { score, label: 'Fuerte', color: 'bg-blue-500' };
  if (score >= 40) return { score, label: 'Moderada', color: 'bg-amber-500' };
  if (score >= 20) return { score, label: 'Débil', color: 'bg-orange-500' };
  return { score, label: 'Muy débil', color: 'bg-red-500' };
}

// ============================================
// RESET PASSWORD PAGE
// ============================================

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [userEmail] = useState('usuario@empresa.com');

  // Validate token on mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token no proporcionado. Solicita un nuevo enlace de recuperación.');
      setIsValidating(false);
      return;
    }

    // Simulate token validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check token format (should be 64 hex chars)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setError('Token inválido. El enlace puede haber sido alterado.');
      setIsValidating(false);
      return;
    }

    // In production, this would validate against the database
    // - Check if token exists and hash matches
    // - Check if token is not used
    // - Check if token is not expired

    // For demo, we'll accept any valid format token
    setIsValid(true);
    setIsValidating(false);
  };

  const strength = calculatePasswordStrength(password);

  const validation = passwordSchema.safeParse(password);
  const allRequirementsMet = validation.success;
  const passwordsMatch = password === confirmPassword && password !== '';
  const isBreached = isPasswordBreached(password);

  const canSubmit = allRequirementsMet && passwordsMatch && !isBreached && strength.score >= 60;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production:
    // - Hash new password with bcrypt
    // - Mark token as used
    // - Invalidate all sessions
    // - Send confirmation email

    setIsSubmitting(false);
    setIsSuccess(true);

    // Log success
    console.log('[SECURITY] Password reset successful:', {
      email: userEmail,
      timestamp: new Date().toISOString(),
      ip: '190.167.XX.XX',
    });
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verificando enlace de recuperación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Enlace inválido</CardTitle>
              <CardDescription>
                El enlace de recuperación no es válido o ha expirado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>

              <Button
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Solicitar nuevo enlace
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-slate-500 hover:text-[var(--color-primary)]"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">¡Contraseña actualizada!</CardTitle>
              <CardDescription>
                Tu contraseña ha sido restablecida exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-center">
                Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>

              <Separator />

              <div className="text-sm text-slate-500 space-y-2">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Todas tus sesiones anteriores han sido cerradas
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Se ha enviado un email de confirmación
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to login */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-slate-500 hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al inicio de sesión
          </Link>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--primary-100)] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <CardTitle className="text-2xl">Crear nueva contraseña</CardTitle>
            <CardDescription>
              Ingresa una contraseña segura para tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* User info */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Usuario:</p>
                <p className="font-medium text-slate-800">{userEmail}</p>
              </div>

              {/* New password */}
              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Fortaleza:</span>
                      <span className={cn(
                        'font-medium',
                        strength.score >= 80 ? 'text-emerald-600' :
                          strength.score >= 60 ? 'text-blue-600' :
                            strength.score >= 40 ? 'text-amber-600' :
                              'text-red-600'
                      )}>
                        {strength.label}
                      </span>
                    </div>
                    <Progress
                      value={strength.score}
                      className="h-2"
                    />
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      'pl-10 pr-10',
                      confirmPassword && !passwordsMatch && 'border-red-300 focus:border-red-500'
                    )}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500 mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Requirements */}
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700">Requisitos:</p>
                <div className="space-y-1">
                  {[
                    { id: 'length', label: 'Mínimo 12 caracteres', met: password.length >= 12 },
                    { id: 'uppercase', label: 'Mayúsculas y minúsculas', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
                    { id: 'number', label: 'Números y símbolos', met: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) },
                  ].map((req) => (
                    <div
                      key={req.id}
                      className={cn(
                        'flex items-center gap-2 text-sm transition-colors',
                        req.met ? 'text-emerald-600' : 'text-slate-500'
                      )}
                    >
                      {req.met ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  ))}
                  <div className={cn(
                    'flex items-center gap-2 text-sm transition-colors',
                    !isBreached ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {!isBreached ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>No puede ser una contraseña común</span>
                  </div>
                </div>
              </div>

              {/* Breached warning */}
              {isBreached && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    Esta contraseña aparece en bases de datos de filtraciones. Por favor elige una más segura.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Restablecer contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security info */}
        <div className="mt-6 text-center">
          <div className="flex justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Conexión segura</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Encriptación AES-256</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
