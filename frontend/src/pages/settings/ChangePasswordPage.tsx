// ============================================
// ANTU CRM - CHANGE PASSWORD PAGE
// Cambio de contraseña para usuarios autenticados
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, RefreshCw, Shield, History, ShieldCheck, ShieldOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MfaSetupModal } from '@/components/mfa/MfaSetupModal';

// ============================================
// PASSWORD REQUIREMENTS
// ============================================

interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Mínimo 12 caracteres',
    validator: (p) => p.length >= 12,
  },
  {
    id: 'uppercase',
    label: 'Al menos una mayúscula',
    validator: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'Al menos una minúscula',
    validator: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'Al menos un número',
    validator: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'Al menos un carácter especial (!@#$%^&*)',
    validator: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
];

// Common breached passwords
const BREACHED_PASSWORDS = [
  'password123', '123456789', 'qwerty123', 'admin123', 'letmein123',
  'welcome123', 'monkey123', 'dragon123', 'master123', 'sunshine123',
];

// ============================================
// PASSWORD HISTORY (simulated)
// ============================================

const PASSWORD_HISTORY: string[] = [
  // In production, these would be hashed passwords from DB
  'OldPass123!',
  'Previous456@',
];

// ============================================
// PASSWORD STRENGTH CALCULATOR
// ============================================

function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Vacía', color: 'bg-slate-200' };
  
  let score = 0;
  
  if (password.length >= 12) score += 20;
  else if (password.length >= 8) score += 10;
  
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  if (password.length >= 16) score += 15;
  
  if (BREACHED_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 30);
  }
  
  if (score >= 80) return { score, label: 'Muy fuerte', color: 'bg-emerald-500' };
  if (score >= 60) return { score, label: 'Fuerte', color: 'bg-blue-500' };
  if (score >= 40) return { score, label: 'Moderada', color: 'bg-amber-500' };
  if (score >= 20) return { score, label: 'Débil', color: 'bg-orange-500' };
  return { score, label: 'Muy débil', color: 'bg-red-500' };
}

// ============================================
// CHANGE PASSWORD PAGE
// ============================================

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, logAction } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaEnabledLocally, setMfaEnabledLocally] = useState(user?.mfaEnabled ?? false);

  const strength = calculatePasswordStrength(newPassword);
  
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every(req => req.validator(newPassword));
  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';
  const isBreached = BREACHED_PASSWORDS.some(common => 
    newPassword.toLowerCase().includes(common)
  );
  
  // Check if password was used before (simulated)
  const wasUsedBefore = PASSWORD_HISTORY.some(old => 
    newPassword.toLowerCase().includes(old.toLowerCase())
  );
  
  const canSubmit = allRequirementsMet && 
                    passwordsMatch && 
                    !isBreached && 
                    !wasUsedBefore && 
                    strength.score >= 60 &&
                    currentPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    setError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production:
    // - Verify current password
    // - Check password history
    // - Hash and store new password
    // - Invalidate other sessions
    // - Send notification email
    
    // Log the action
    logAction('SETTINGS_CHANGE', 'password', {
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
    
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Cambiar contraseña</h1>
            <p className="text-slate-500">Seguridad de la cuenta</p>
          </div>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              ¡Contraseña actualizada!
            </h3>
            <p className="text-slate-600 mb-6">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            
            <div className="text-sm text-slate-500 space-y-2 mb-6">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Otras sesiones en dispositivos han sido cerradas
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Se ha enviado un email de confirmación
              </p>
            </div>
            
            <Button onClick={() => navigate('/settings')}>
              Volver a configuración
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cambiar contraseña</h1>
          <p className="text-slate-500">Actualiza la contraseña de tu cuenta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Nueva contraseña
              </CardTitle>
              <CardDescription>
                Por seguridad, ingresa tu contraseña actual y luego la nueva
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

                {/* Current password */}
                <div>
                  <Label htmlFor="currentPassword">Contraseña actual *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Separator />

                {/* New password */}
                <div>
                  <Label htmlFor="newPassword">Nueva contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Strength meter */}
                  {newPassword && (
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
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña *</Label>
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

                {/* Breached warning */}
                {isBreached && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      Esta contraseña aparece en bases de datos de filtraciones. Por favor elige una más segura.
                    </AlertDescription>
                  </Alert>
                )}

                {/* History warning */}
                {wasUsedBefore && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <History className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      No puedes reutilizar una contraseña anterior. Elige una contraseña completamente nueva.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/settings')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Requirements */}
        <div>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Requisitos de seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.validator(newPassword);
                  return (
                    <div 
                      key={req.id} 
                      className={cn(
                        'flex items-center gap-2 text-sm transition-colors',
                        met ? 'text-emerald-600' : 'text-slate-500'
                      )}
                    >
                      {met ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  );
                })}
                <div className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  !isBreached ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {!isBreached ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>No puede ser una contraseña común</span>
                </div>
                <div className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  !wasUsedBefore ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {!wasUsedBefore ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <History className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>No puede ser una contraseña anterior</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Historial de cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <p className="font-medium text-slate-700">Último cambio</p>
                    <p className="text-slate-500">Hace 45 días</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="font-medium text-slate-700">Cambios este año</p>
                    <p className="text-slate-500">3 cambios</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MFA Section */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Autenticación de Dos Factores (MFA)
          </CardTitle>
          <CardDescription>
            Protege tu cuenta añadiendo un segundo paso de verificación al iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mfaEnabledLocally ? (
                <>
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-800">MFA Activo</p>
                    <p className="text-sm text-slate-500">Tu cuenta tiene autenticación de dos factores habilitada.</p>
                  </div>
                  <Badge className="ml-2 bg-green-100 text-green-800">Protegido</Badge>
                </>
              ) : (
                <>
                  <ShieldOff className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800">MFA Inactivo</p>
                    <p className="text-sm text-slate-500">Tu cuenta solo usa contraseña para acceder.</p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-amber-700 border-amber-300">Recomendado</Badge>
                </>
              )}
            </div>
            {!mfaEnabledLocally && (
              <Button
                onClick={() => setMfaModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Activar MFA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <MfaSetupModal
        open={mfaModalOpen}
        onClose={() => setMfaModalOpen(false)}
        onEnabled={() => {
          setMfaEnabledLocally(true);
          setMfaModalOpen(false);
        }}
      />
    </div>
  );
}
