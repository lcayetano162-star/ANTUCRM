import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authApi } from '@/services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresa tu email'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <span className="text-3xl">🦅</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Antü CRM</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
              <p className="text-gray-500 text-sm mb-6">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un correo con instrucciones para restablecer tu contraseña. El enlace expira en 1 hora.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm">
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
                <p className="text-gray-500 text-sm mt-1">Ingresa tu email y te enviaremos un enlace para restablecerla.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
