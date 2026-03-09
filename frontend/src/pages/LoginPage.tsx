// ============================================
// ANTU CRM - LOGIN PAGE
// Autenticación con selección de usuario demo
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_PERMISSIONS } from '@/types/auth';
import type { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock, Mail, Eye, EyeOff,
  Shield, ArrowRight, BarChart3, Users2, ClipboardList
} from 'lucide-react';
import { MfaChallenge } from '@/components/mfa/MfaChallenge';

// ============================================
// MAIN COMPONENT
// ============================================

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, mfaPendingUserId, clearMfaPending } = useAuth() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'PLATFORM_ADMIN' ? '/admin/platform' : '/';
    navigate(redirectPath, { replace: true });
    return null;
  }

  // Show MFA challenge if required
  if (mfaPendingUserId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
        <MfaChallenge
          userId={mfaPendingUserId}
          onSuccess={(data: any) => {
            // Store tokens
            sessionStorage.setItem('antu_access_token', data.accessToken);
            sessionStorage.setItem('antu_refresh_token', data.refreshToken);

            // Build and store the authenticated user for session recovery
            if (data.user) {
              const roleMap: Record<string, UserRole> = {
                SUPER_ADMIN: 'PLATFORM_ADMIN',
                ADMIN: 'TENANT_ADMIN',
                MANAGER: 'SALES_MANAGER',
                USER: 'SALES_REP',
                VIEWER: 'SALES_REP',
              };
              const frontendRole: UserRole = roleMap[data.user.role] || 'SALES_REP';
              const authenticatedUser = {
                id: data.user.id,
                email: data.user.email,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                fullName: `${data.user.firstName} ${data.user.lastName}`.trim(),
                role: frontendRole,
                tenantId: data.user.tenantId,
                tenantName: 'ANTÜ CRM',
                plan: 'BUSINESS',
                isActive: true,
                lastLoginAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                permissions: ROLE_PERMISSIONS[frontendRole] || [],
                attributes: {
                  department: 'General',
                  canApproveDiscounts:
                    frontendRole === 'TENANT_ADMIN' || frontendRole === 'SALES_MANAGER',
                  maxDiscountPercent:
                    frontendRole === 'TENANT_ADMIN'
                      ? 100
                      : frontendRole === 'SALES_MANAGER'
                        ? 15
                        : 0,
                },
                mfaEnabled: true,
              };
              sessionStorage.setItem('antu_current_user', JSON.stringify(authenticatedUser));
              sessionStorage.setItem('antu_tenant_id', authenticatedUser.tenantId);
            }

            clearMfaPending();
            // Reload to re-initialize auth state from sessionStorage
            window.location.href = '/';
          }}
          onBack={() => clearMfaPending()}
        />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      const normalizedEmail = email.trim().toLowerCase();
      const redirectPath = normalizedEmail.includes('super@antu.com') ? '/admin/platform' : '/';
      navigate(redirectPath, { replace: true });
    } else {
      setError('Email o contraseña incorrectos');
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (demoRole: string) => {
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';
    switch (demoRole) {
      case 'super':
        setEmail('superadmin@antu.crm');
        setPassword(demoPassword);
        break;
      case 'admin':
        setEmail('admin@antu.crm');
        setPassword(demoPassword);
        break;
      case 'vendedor':
        setEmail('user@antu.crm');
        setPassword(demoPassword);
        break;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 h-full overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="w-full max-w-md flex flex-col py-2 mt-auto mb-auto">
          {/* Logo Horizontal Centrado */}
          <div className="flex flex-row items-center justify-center gap-4 mb-4 lg:mb-8">
            <div className="h-20 lg:h-24 xl:h-28 w-20 lg:w-24 xl:w-28 overflow-hidden flex items-center justify-center">
              <img
                src="/antu-logo.png"
                alt="Antü Icon"
                className="h-[200%] w-auto object-contain object-top scale-110"
              />
            </div>
            <div className="h-10 lg:h-12 xl:h-14 w-32 lg:w-40 xl:w-48 overflow-hidden flex items-center justify-center">
              <img
                src="/antu-logo.png"
                alt="Antü Text"
                className="h-[200%] w-auto object-contain object-bottom scale-125 translate-y-[5%]"
              />
            </div>
          </div>

          <Card className="border-slate-100 shadow-xl rounded-2xl lg:rounded-3xl overflow-hidden border-t-4 border-t-[rgb(94,217,207)]">
            <CardHeader className="text-center pt-4 lg:pt-6 pb-1 lg:pb-2">
              <CardTitle className="text-xl lg:text-2xl font-bold text-slate-800">Bienvenido de vuelta</CardTitle>
              <CardDescription className="text-slate-500 text-xs lg:text-sm">
                Ingresa tus credenciales para acceder al CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 lg:px-8 pb-4 lg:pb-8">
              <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200 py-1.5">
                    <AlertDescription className="text-red-700 text-xs text-center font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-600 font-medium ml-1 text-sm">Correo electrónico</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                      <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@antucrm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-11 lg:h-12 bg-slate-50 border-slate-100 rounded-xl lg:rounded-2xl focus-visible:ring-teal-600 focus-visible:border-teal-600 transition-all text-sm lg:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" title="Contraseña" className="text-slate-600 font-medium text-sm">Contraseña</Label>
                    <Link
                      to="/forgot-password"
                      className="text-[10px] lg:text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                      <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-11 lg:h-12 bg-slate-50 border-slate-100 rounded-xl lg:rounded-2xl focus-visible:ring-teal-600 focus-visible:border-teal-600 transition-all text-sm lg:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center py-1">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('super')}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-teal-600 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Acceso Super Admin</span>
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 lg:h-13 bg-[rgb(94,217,207)] hover:bg-[rgb(75,201,191)] text-white rounded-xl lg:rounded-2xl text-base lg:text-lg font-bold shadow-lg shadow-[rgba(94,217,207,0.2)] transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      Iniciar sesión
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-4 lg:mt-8 pt-4 lg:pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Credenciales de demo:</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    className="w-full text-left text-xs text-slate-500 hover:text-teal-600 transition-colors py-1 group"
                  >
                    <span className="font-bold whitespace-nowrap">Admin:</span> <span className="text-slate-400">admin@antu.crm</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 lg:mt-8 text-center text-slate-400 text-[10px]">
            © 2024 Antü CRM - Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* Right Side: Gradient and Content */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#5ED9CF] via-[#4BC9BF] to-[#1E3A8A] items-center justify-center p-12 h-full relative overflow-hidden">
        {/* Decorative Circles / Bubbles */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-3xl" />

        {/* Transparent Static Bubbles */}
        <div className="absolute top-[10%] left-[15%] w-16 h-16 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />
        <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />
        <div className="absolute bottom-[25%] left-[30%] w-12 h-12 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />
        <div className="absolute bottom-[10%] right-[10%] w-32 h-32 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />
        <div className="absolute top-[60%] left-[10%] w-8 h-8 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />
        <div className="absolute top-[20%] right-[30%] w-20 h-20 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" />

        <div className="relative z-10 max-w-xl text-white">

          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">Gestiona tu negocio</h2>
          <p className="text-lg lg:text-xl text-teal-50/80 mb-10 lg:mb-12 leading-relaxed max-w-lg">
            El CRM completo para administrar oportunidades, clientes y ventas en un solo lugar.
          </p>

          <div className="space-y-8 lg:space-y-10">
            <div className="flex items-center gap-6 group">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg lg:text-xl font-bold mb-0.5 lg:mb-1">Pipeline de Ventas</h4>
                <p className="text-teal-100/70 text-sm lg:text-base">Seguimiento de oportunidades</p>
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <Users2 className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg lg:text-xl font-bold mb-0.5 lg:mb-1">Gestión de Clientes</h4>
                <p className="text-teal-100/70 text-sm lg:text-base">Base de datos completa</p>
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <ClipboardList className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg lg:text-xl font-bold mb-0.5 lg:mb-1">Tareas y Actividades</h4>
                <p className="text-teal-100/70 text-sm lg:text-base">Organiza tu día a día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
