// ============================================
// ANTU CRM - FORGOT PASSWORD PAGE
// Recuperación de contraseña con rate limiting
// ============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, ArrowLeft, Shield, AlertTriangle, CheckCircle2, 
  Clock, RefreshCw, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

const RATE_LIMIT = {
  maxAttempts: 3,
  windowMinutes: 15,
  captchaAfterAttempts: 2,
};

// ============================================
// MOCK DATA - SIMULATED BACKEND
// ============================================

interface ResetRequest {
  email: string;
  timestamp: number;
  attempts: number;
}

const resetRequests = new Map<string, ResetRequest>();

// ============================================
// FORGOT PASSWORD PAGE
// ============================================

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  // Check for existing rate limit on mount
  useEffect(() => {
    const saved = localStorage.getItem('antu_reset_attempts');
    if (saved) {
      const data = JSON.parse(saved);
      const now = Date.now();
      if (now < data.cooldownEnd) {
        setCooldownEnd(data.cooldownEnd);
        setAttempts(data.attempts);
      } else {
        localStorage.removeItem('antu_reset_attempts');
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!cooldownEnd) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= cooldownEnd) {
        setCooldownEnd(null);
        setAttempts(0);
        localStorage.removeItem('antu_reset_attempts');
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // Show CAPTCHA after multiple attempts
  useEffect(() => {
    if (attempts >= RATE_LIMIT.captchaAfterAttempts) {
      setShowCaptcha(true);
    }
  }, [attempts]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkRateLimit = (email: string): { allowed: boolean; message?: string; waitSeconds?: number } => {
    const now = Date.now();
    const windowMs = RATE_LIMIT.windowMinutes * 60 * 1000;
    
    // Check global cooldown
    if (cooldownEnd && now < cooldownEnd) {
      const waitSeconds = Math.ceil((cooldownEnd - now) / 1000);
      return { 
        allowed: false, 
        message: `Demasiados intentos. Espera ${Math.ceil(waitSeconds / 60)} minutos.`,
        waitSeconds 
      };
    }
    
    // Check per-email rate limit
    const existing = resetRequests.get(email);
    if (existing) {
      const timeSinceLastAttempt = now - existing.timestamp;
      
      if (timeSinceLastAttempt < windowMs && existing.attempts >= RATE_LIMIT.maxAttempts) {
        const waitSeconds = Math.ceil((windowMs - timeSinceLastAttempt) / 1000);
        return { 
          allowed: false, 
          message: `Demasiados intentos para este email. Espera ${Math.ceil(waitSeconds / 60)} minutos.`,
          waitSeconds 
        };
      }
    }
    
    return { allowed: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email format
    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    // Check CAPTCHA if required
    if (showCaptcha && !captchaVerified) {
      setError('Por favor completa la verificación de seguridad');
      return;
    }
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || 'Demasiados intentos. Por favor espera.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update rate limit tracking
    const now = Date.now();
    const existing = resetRequests.get(email);
    const newAttempts = existing ? existing.attempts + 1 : 1;
    
    resetRequests.set(email, {
      email,
      timestamp: now,
      attempts: newAttempts,
    });
    
    setAttempts(prev => {
      const newTotal = prev + 1;
      
      // Set global cooldown if too many attempts
      if (newTotal >= RATE_LIMIT.maxAttempts) {
        const cooldownEndTime = now + RATE_LIMIT.windowMinutes * 60 * 1000;
        setCooldownEnd(cooldownEndTime);
        localStorage.setItem('antu_reset_attempts', JSON.stringify({
          attempts: newTotal,
          cooldownEnd: cooldownEndTime,
        }));
      }
      
      return newTotal;
    });
    
    // Log attempt (in production, this would go to security logs)
    console.log('[SECURITY] Password reset requested:', {
      email,
      timestamp: new Date().toISOString(),
      ip: '190.167.XX.XX',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
    
    setIsLoading(false);
    setIsSubmitted(true);
  };

  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulated CAPTCHA
  const handleCaptchaClick = () => {
    setCaptchaVerified(true);
  };

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
            <CardTitle className="text-2xl">Recuperar acceso</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico y te enviaremos instrucciones
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {cooldownEnd && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Demasiados intentos. Espera{' '}
                      <strong>{formatCooldown(Math.ceil((cooldownEnd - Date.now()) / 1000))}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading || !!cooldownEnd}
                      required
                    />
                  </div>
                </div>

                {/* Simulated CAPTCHA */}
                {showCaptcha && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Label className="mb-2 block">Verificación de seguridad</Label>
                    <button
                      type="button"
                      onClick={handleCaptchaClick}
                      className={cn(
                        'w-full p-3 rounded-lg border-2 border-dashed transition-all',
                        captchaVerified
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      )}
                    >
                      {captchaVerified ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Verificación completada</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <Shield className="w-5 h-5" />
                          <span>Clic para verificar que no eres un robot</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !!cooldownEnd}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar instrucciones
                </Button>

                <div className="text-center text-sm text-slate-500">
                  <p>¿Recordaste tu contraseña?{' '}</p>
                  <Link to="/login" className="text-[var(--color-primary)] hover:underline">
                    Iniciar sesión
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Revisa tu correo
                  </h3>
                  <p className="text-slate-600">
                    Si el email <strong>{email}</strong> existe en nuestro sistema, 
                    recibirás instrucciones para restablecer tu contraseña en los 
                    próximos minutos.
                  </p>
                </div>

                <Separator />

                <div className="text-sm text-slate-500 space-y-2">
                  <p>El enlace expirará en <strong>15 minutos</strong>.</p>
                  <p>
                    ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
                    <button 
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      intenta de nuevo
                    </button>
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/login'}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </div>
            )}
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
