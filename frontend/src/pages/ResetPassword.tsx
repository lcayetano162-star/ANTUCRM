import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { authApi } from '@/services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Token inválido. Solicita un nuevo enlace de recuperación.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await authApi.resetPasswordToken(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Token inválido o expirado. Solicita un nuevo enlace.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Débil', 'Moderada', 'Fuerte']
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <span className="text-3xl">🦅</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Antü CRM</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
              <p className="text-gray-500 text-sm mb-4">Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.</p>
              <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium text-sm underline">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nueva contraseña</h2>
                <p className="text-gray-500 text-sm mt-1">Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!token ? (
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-violet-600 hover:underline text-sm font-medium">
                    Solicitar nuevo enlace de recuperación
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${strengthColor[strength]}`} style={{ width: `${(strength / 3) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{strengthLabel[strength]}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repite la contraseña"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm ${confirm && confirm !== password ? 'border-red-400' : 'border-gray-300'}`}
                        required
                      />
                    </div>
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {loading ? 'Actualizando...' : 'Establecer nueva contraseña'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
