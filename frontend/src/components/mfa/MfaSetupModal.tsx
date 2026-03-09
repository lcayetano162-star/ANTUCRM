import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface MfaSetupModalProps {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

type Step = 'setup' | 'verify' | 'done';

export function MfaSetupModal({ open, onClose, onEnabled }: MfaSetupModalProps) {
  const [step, setStep] = useState<Step>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ secret: string; otpauthUrl: string }>('/auth/mfa/setup');
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar configuración de MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/verify-setup', { token });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Código inválido. Verifica que la hora de tu dispositivo sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setStep('setup');
    setToken('');
    setError('');
    onEnabled();
    onClose();
  };

  const qrUrl = otpauthUrl
    ? `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`
    : '';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            Autenticación en Dos Pasos (MFA)
          </DialogTitle>
          <DialogDescription>
            Agrega una capa extra de seguridad con una aplicación autenticadora.
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
              <p className="font-medium text-slate-800">¿Qué necesitas?</p>
              <p>Una aplicación autenticadora como <strong>Google Authenticator</strong>, <strong>Authy</strong>, o <strong>Microsoft Authenticator</strong>.</p>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handleSetup} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
              {loading ? 'Iniciando...' : 'Comenzar configuración'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 space-y-3">
              <p className="font-medium text-slate-800">1. Escanea este código QR</p>
              <p className="text-xs">O abre este enlace en tu aplicación autenticadora:</p>
              <a href={otpauthUrl} className="text-xs text-teal-600 flex items-center gap-1 break-all" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 shrink-0" /> Abrir en autenticadora
              </a>

              {qrUrl && (
                <div className="flex justify-center py-2">
                  <img src={qrUrl} alt="QR Code MFA" className="w-48 h-48 border rounded-lg" />
                </div>
              )}

              <div>
                <p className="font-medium text-slate-800 mb-1">O ingresa la clave manualmente:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-slate-100 px-3 py-2 rounded font-mono break-all">{secret}</code>
                  <Button variant="outline" size="icon" onClick={handleCopySecret} className="shrink-0">
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="font-medium text-slate-800 pt-2">2. Ingresa el código generado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfa-token">Código de 6 dígitos</Label>
              <Input
                id="mfa-token"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">Atrás</Button>
              <Button onClick={handleVerify} disabled={loading || token.length !== 6} className="flex-1 bg-teal-600 hover:bg-teal-700">
                {loading ? 'Verificando...' : 'Activar MFA'}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-slate-800">¡MFA Activado!</p>
              <p className="text-sm text-slate-600 mt-1">Tu cuenta ahora requiere un código de autenticación al iniciar sesión.</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Cuenta protegida con 2FA</Badge>
            <Button onClick={handleDone} className="w-full bg-teal-600 hover:bg-teal-700">Listo</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
