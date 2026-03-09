import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface MfaChallengeProps {
  userId: string;
  onSuccess: (tokens: { accessToken: string; refreshToken: string; user: any }) => void;
  onBack: () => void;
}

export function MfaChallenge({ userId, onSuccess, onBack }: MfaChallengeProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/mfa-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Código inválido');
      }

      const data = await response.json();
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Código inválido. Intenta nuevamente.');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
            <Shield className="h-7 w-7 text-teal-600" />
          </div>
          <CardTitle className="text-xl">Verificación en Dos Pasos</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu aplicación autenticadora.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Código de autenticación</Label>
              <Input
                id="mfa-code"
                value={token}
                onChange={(e) => {
                  setError('');
                  setToken(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
                className="text-center text-3xl tracking-[0.5em] font-mono h-14"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full bg-teal-600 hover:bg-teal-700 h-11"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full text-slate-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio de sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
