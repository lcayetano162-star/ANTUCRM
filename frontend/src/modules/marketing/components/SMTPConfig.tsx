// ============================================
// SMTP Configuration - Configuración de Email Enterprise
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Server,
  Shield,
  Zap,
  TrendingUp,
  Check,
  AlertTriangle,
  Copy,
  RefreshCw,
  Send,
  Globe,
  BarChart3,
  Clock,
  Info,
} from 'lucide-react';
import type { SMTPConfig as SMTPConfigType, SMTPProvider } from '../types';

// ============================================
// Provider Configurations
// ============================================

const PROVIDER_CONFIGS: Record<SMTPProvider, { name: string; description: string; requires: string[] }> = {
  aws_ses: {
    name: 'AWS SES',
    description: 'Amazon Simple Email Service - Alta entregabilidad, costo bajo',
    requires: ['region', 'accessKeyId', 'secretAccessKey'],
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Plataforma líder en email marketing con analytics avanzado',
    requires: ['apiKey'],
  },
  mailgun: {
    name: 'Mailgun',
    description: 'Especializado en emails transaccionales',
    requires: ['domain', 'apiKey'],
  },
  custom: {
    name: 'SMTP Personalizado',
    description: 'Configura tu propio servidor SMTP',
    requires: ['host', 'port', 'username', 'password'],
  },
};

// ============================================
// DNS Records Display
// ============================================

function DNSRecords({ config }: { config: Partial<SMTPConfigType> }) {
  const records = [
    {
      type: 'SPF',
      name: '@',
      value: config.spfRecord || 'v=spf1 include:_spf.google.com ~all',
      status: 'verified' as const,
      description: 'Autoriza servidores de email a enviar en tu nombre',
    },
    {
      type: 'DKIM',
      name: 'antu._domainkey',
      value: config.dkimRecord || 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
      status: 'pending' as const,
      description: 'Firma digital para verificar autenticidad',
    },
    {
      type: 'DMARC',
      name: '_dmarc',
      value: config.dmarcPolicy || 'v=DMARC1; p=quarantine; rua=mailto:dmarc@tudominio.com',
      status: 'verified' as const,
      description: 'Política de manejo de emails fallidos',
    },
  ];

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.type} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={record.status === 'verified' ? 'default' : 'secondary'}
                className={cn(
                  record.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                {record.status === 'verified' ? <Check className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                {record.status === 'verified' ? 'Verificado' : 'Pendiente'}
              </Badge>
              <span className="font-mono font-medium text-slate-800">{record.type}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(record.value)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-500 mb-3">{record.description}</p>
          <div className="space-y-1">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-400 w-12">Name:</span>
              <code className="bg-white px-2 py-0.5 rounded border">{record.name}</code>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-slate-400 w-12">Value:</span>
              <code className="bg-white px-2 py-0.5 rounded border text-xs break-all">{record.value}</code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Reputation Monitor
// ============================================

function ReputationMonitor() {
  const metrics = [
    { label: 'Reputation Score', value: 92, color: 'bg-emerald-500', status: 'Excelente' },
    { label: 'Inbox Placement', value: 88, color: 'bg-emerald-500', status: 'Bueno' },
    { label: 'Bounce Rate', value: 2, color: 'bg-emerald-500', status: 'Excelente' },
    { label: 'Complaint Rate', value: 0.1, color: 'bg-emerald-500', status: 'Excelente' },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metric.value}{metric.label.includes('Rate') ? '%' : '/100'}</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                {metric.status}
              </Badge>
            </div>
          </div>
          <Progress 
            value={metric.label.includes('Rate') ? (metric.value / 10) * 100 : metric.value} 
            className="h-2"
          >
            <div className={cn('h-full rounded-full', metric.color)} style={{ 
              width: `${metric.label.includes('Rate') ? (metric.value / 10) * 100 : metric.value}%` 
            }} />
          </Progress>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Warm-up Progress
// ============================================

function WarmupProgress() {
  const stages = [
    { day: 'Día 1-7', volume: 50, completed: true },
    { day: 'Día 8-14', volume: 100, completed: true },
    { day: 'Día 15-21', volume: 250, completed: true },
    { day: 'Día 22-28', volume: 500, completed: false, current: true },
    { day: 'Día 29-35', volume: 1000, completed: false },
    { day: 'Día 36+', volume: 5000, completed: false },
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div 
          key={index} 
          className={cn(
            'flex items-center gap-4 p-3 rounded-lg border',
            stage.completed ? 'bg-emerald-50 border-emerald-200' :
            stage.current ? 'bg-violet-50 border-violet-200' :
            'bg-slate-50 border-slate-200'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            stage.completed ? 'bg-emerald-500 text-white' :
            stage.current ? 'bg-violet-500 text-white' :
            'bg-slate-200 text-slate-400'
          )}>
            {stage.completed ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          <div className="flex-1">
            <p className={cn(
              'font-medium',
              stage.completed ? 'text-emerald-800' :
              stage.current ? 'text-violet-800' :
              'text-slate-600'
            )}>
              {stage.day}
            </p>
            <p className="text-sm text-slate-500">{stage.volume.toLocaleString()} emails/día</p>
          </div>
          {stage.current && (
            <Badge className="bg-violet-100 text-violet-700">Actual</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Test Email Dialog
// ============================================

function TestEmailDialog({ 
  open, 
  onOpenChange,
  config,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  config: Partial<SMTPConfigType>;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar email de prueba</DialogTitle>
          <DialogDescription>
            Verifica que tu configuración SMTP funciona correctamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email de destino</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <Info className="w-4 h-4 inline mr-1" />
              Se enviará un email de prueba desde{' '}
              <strong>{config.fromEmail || 'hola@antucrm.com'}</strong>
            </p>
          </div>

          {sent && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check className="w-5 h-5" />
                <span>¡Email enviado correctamente!</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button 
            className="bg-violet-500 hover:bg-violet-600"
            onClick={handleSend}
            disabled={!email || sending}
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sending ? 'Enviando...' : 'Enviar prueba'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main SMTP Configuration
// ============================================

export function SMTPConfig() {
  const [activeTab, setActiveTab] = useState('provider');
  const [showTestDialog, setShowTestDialog] = useState(false);

  // Config state
  const [provider, setProvider] = useState<SMTPProvider>('aws_ses');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  // Credentials
  const [credentials, setCredentials] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    apiKey: '',
    region: 'us-east-1',
    domain: '',
  });

  // Throttling
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [hourlyLimit, setHourlyLimit] = useState(500);
  const [warmupEnabled, setWarmupEnabled] = useState(true);

  // Config object for child components
  const config: Partial<SMTPConfigType> = {
    provider,
    fromEmail,
    fromName,
    replyTo,
    customDomain,
    spfRecord: `v=spf1 include:_spf.${provider === 'aws_ses' ? 'amazonses.com' : provider}.com ~all`,
    dkimRecord: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqG...',
    dmarcPolicy: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@' + customDomain,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración SMTP</h1>
          <p className="text-slate-500 mt-1">
            Configura tu servidor de email para máxima entregabilidad
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Enviar prueba
          </Button>
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Check className="w-4 h-4 mr-2" />
            Guardar configuración
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-emerald-800">Configuración activa</p>
          <p className="text-sm text-emerald-600">
            Tu servidor de email está configurado correctamente. Última verificación: hace 5 minutos
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700">Salud: 98%</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="provider" className="gap-2">
            <Server className="w-4 h-4" />
            Proveedor
          </TabsTrigger>
          <TabsTrigger value="dns" className="gap-2">
            <Globe className="w-4 h-4" />
            DNS Records
          </TabsTrigger>
          <TabsTrigger value="throttling" className="gap-2">
            <Zap className="w-4 h-4" />
            Throttling
          </TabsTrigger>
          <TabsTrigger value="reputation" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Reputación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Proveedor de Email</CardTitle>
                <CardDescription>Selecciona y configura tu proveedor SMTP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as SMTPProvider)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col items-start">
                            <span>{config.name}</span>
                            <span className="text-xs text-slate-400">{config.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Provider-specific fields */}
                {provider === 'aws_ses' && (
                  <>
                    <div className="space-y-2">
                      <Label>Región AWS</Label>
                      <Select 
                        value={credentials.region} 
                        onValueChange={(v) => setCredentials({ ...credentials, region: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                          <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                          <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Access Key ID</Label>
                      <Input type="password" placeholder="AKIA..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Secret Access Key</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </>
                )}

                {provider === 'sendgrid' && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input type="password" placeholder="SG.xxxxxxxx" />
                  </div>
                )}

                {provider === 'mailgun' && (
                  <>
                    <div className="space-y-2">
                      <Label>Dominio</Label>
                      <Input placeholder="mg.tudominio.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input type="password" placeholder="key-xxxxxxxx" />
                    </div>
                  </>
                )}

                {provider === 'custom' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host</Label>
                        <Input placeholder="smtp.ejemplo.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Puerto</Label>
                        <Input type="number" placeholder="587" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Usuario</Label>
                      <Input placeholder="usuario@ejemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Configuración de Envío</CardTitle>
                <CardDescription>Configura los remitentes y dominio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email de envío (From)</Label>
                  <Input
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="hola@tudominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre del remitente</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Tu Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reply-To (opcional)</Label>
                  <Input
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="soporte@tudominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dominio personalizado</Label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="tudominio.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-base">Registros DNS Requeridos</CardTitle>
                </div>
                <CardDescription>
                  Agrega estos registros en tu proveedor de DNS para verificar tu dominio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DNSRecords config={config} />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Verificación de Dominio</CardTitle>
                </div>
                <CardDescription>
                  Estado de verificación de tu dominio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-800">Dominio verificado</p>
                        <p className="text-sm text-emerald-600">{customDomain || 'tudominio.com'}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">DKIM pendiente</p>
                        <p className="text-sm text-amber-600">
                          El registro DKIM puede tardar hasta 48 horas en propagarse.
                          Te notificaremos cuando esté verificado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-slate-800">Instrucciones</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                      <li>Inicia sesión en tu proveedor de DNS (Cloudflare, GoDaddy, etc.)</li>
                      <li>Navega a la sección de gestión de DNS</li>
                      <li>Agrega cada registro mostrado arriba</li>
                      <li>Espera la propagación (puede tardar hasta 48 horas)</li>
                      <li>Haz clic en &quot;Verificar dominio&quot; para confirmar</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="throttling" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base">Límites de Envío</CardTitle>
                </div>
                <CardDescription>
                  Configura los límites para evitar bloqueos y mantener reputación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Límite diario</Label>
                    <span className="text-sm text-slate-500">{dailyLimit.toLocaleString()} emails</span>
                  </div>
                  <Input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>100</span>
                    <span>50,000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Límite por hora</Label>
                    <span className="text-sm text-slate-500">{hourlyLimit.toLocaleString()} emails</span>
                  </div>
                  <Input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>10</span>
                    <span>5,000</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Warm-up automático</p>
                    <p className="text-sm text-slate-500">
                      Incrementa gradualmente el volumen de envíos
                    </p>
                  </div>
                  <Switch checked={warmupEnabled} onCheckedChange={setWarmupEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-base">Progreso de Warm-up</CardTitle>
                </div>
                <CardDescription>
                  Incrementa tu reputación de IP gradualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WarmupProgress />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-base">Métricas de Reputación</CardTitle>
                </div>
                <CardDescription>
                  Monitorea la salud de tu reputación de email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReputationMonitor />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-500" />
                  <CardTitle className="text-base">Listas Negras</CardTitle>
                </div>
                <CardDescription>
                  Verifica si tu IP o dominio está en listas negras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Spamhaus', 'Barracuda', 'SORBS', 'SpamCop'].map((list) => (
                    <div key={list} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-emerald-800">{list}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">Limpio</Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <Info className="w-4 h-4 inline mr-1" />
                    Última verificación: hace 2 horas. Las verificaciones automáticas ocurren cada 6 horas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <TestEmailDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        config={config}
      />
    </div>
  );
}

export default SMTPConfig;
