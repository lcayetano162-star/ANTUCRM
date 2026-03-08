import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Crown, Loader2, BarChart3, Users, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Login() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuth } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authApi.login(email, password)
      const { token, user } = response.data

      setAuth(token, user)
      
      toast({
        title: '¡Bienvenido!',
        description: `Hola ${user.firstName}, has iniciado sesión exitosamente.`,
        variant: 'success'
      })

      // Redirect based on role
      if (user.role === 'superadmin') {
        navigate('/super-admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
      toast({
        title: 'Error de inicio de sesión',
        description: error.response?.data?.error || 'Credenciales inválidas',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-2xl p-4">
              <img 
                src="/logo.png" 
                alt="Antü CRM" 
                className="h-28 mx-auto object-contain"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('Bienvenido de vuelta')}</h2>
                <p className="text-gray-500 mt-1">
                  {t('Ingresa tus credenciales para acceder al CRM')}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">{t('Correo electrónico')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@antucrm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">{t('Contraseña')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="text-right -mt-2">
                  <Link to="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Super Admin Mode Toggle */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSuperAdminMode(!isSuperAdminMode)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isSuperAdminMode
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {isSuperAdminMode ? (
                      <>
                        <Crown className="w-4 h-4" />
                        {t('Modo Super Admin Activado')}
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        {t('Acceso Super Admin')}
                      </>
                    )}
                  </button>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 text-base font-semibold gap-2 rounded-lg",
                    isSuperAdminMode
                      ? "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                      : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isSuperAdminMode ? (
                        <>
                          <Crown className="w-5 h-5" />
                          {t('Acceder como Super Admin')}
                        </>
                      ) : (
                        <>
                          {t('Iniciar sesión')}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              {/* Demo credentials - solo mostrar en entorno de desarrollo */}
              {import.meta.env.DEV && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="font-medium text-gray-700 mb-3 text-sm">Credenciales de demo:</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Admin:</span> admin@antucrm.com / admin123</p>
                    <p><span className="font-medium text-gray-800">Vendedor:</span> vendedor@antucrm.com / vendedor123</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-400">
            © 2024 Antü CRM - Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* Right side - Features Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/4 -translate-x-1/4" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center px-16 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              Gestiona tu negocio
            </h2>
            <p className="text-lg text-cyan-100 mb-10 leading-relaxed">
              El CRM completo para administrar oportunidades, clientes y ventas en un solo lugar.
            </p>

            {/* Features */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Pipeline de Ventas</p>
                  <p className="text-sm text-cyan-200">Seguimiento de oportunidades</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Gestión de Clientes</p>
                  <p className="text-sm text-cyan-200">Base de datos completa</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Tareas y Actividades</p>
                  <p className="text-sm text-cyan-200">Organiza tu día a día</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
