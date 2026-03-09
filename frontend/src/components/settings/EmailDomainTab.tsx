import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Mail,
    ShieldCheck,
    ShieldAlert,
    Copy,
    CheckCircle2,
    RefreshCw,
    Send,
    HelpCircle
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DnsRecord {
    type: string;
    name: string;
    value: string;
}

const INITIAL_RECORDS: DnsRecord[] = [
    { type: 'TXT', name: 'antu._domainkey.miempresa.com', value: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...' },
    { type: 'TXT', name: 'miempresa.com', value: 'v=spf1 include:spf.antucrm.com ~all' },
    { type: 'TXT', name: '_dmarc.miempresa.com', value: 'v=DMARC1; p=none; rua=mailto:dmarc@antucrm.com' },
];

export function EmailDomainTab() {
    const [domain, setDomain] = useState('');
    const [senderName, setSenderName] = useState('Equipo de Ventas');
    const [replyTo, setReplyTo] = useState('');

    const [isDomainVerified, setIsDomainVerified] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRecords, setShowRecords] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [testing, setTesting] = useState(false);

    // States to handle copy feedback
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleGenerateRecords = () => {
        if (!domain) {
            toast.error('Por favor ingresa un dominio válido');
            return;
        }

        // Check basic domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            toast.error('Formato de dominio inválido (ej. miempresa.com)');
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setShowRecords(true);
            setIsDomainVerified(false);
        }, 1500);
    };

    const handleVerifyDomain = () => {
        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            setIsDomainVerified(true);
            toast.success('Dominio verificado correctamente');
        }, 2000);
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast.success('Copiado al portapapeles');
    };

    const handleTestEmail = () => {
        setTesting(true);
        setTimeout(() => {
            setTesting(false);
            toast.success('Correo de prueba enviado a tu bandeja de entrada');
        }, 1500);
    };

    const handleSaveProfile = () => {
        toast.success('Perfil de remitente guardado');
    };

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Introduction Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800">Autenticación de Correo y Dominio</h2>
                <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                    Configura tu dominio para que Antü CRM pueda enviar correos de cotizaciones y facturas en tu nombre.
                    Esto mejora drásticamente la tasa de entrega y evita que tus correos terminen en la bandeja de Spam.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Settings */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Sender Profile */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-slate-500" />
                                <CardTitle className="text-lg">Perfil del Remitente</CardTitle>
                            </div>
                            <CardDescription>
                                Cómo se mostrarán tus correos a los clientes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre del Remitente</Label>
                                <Input
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder="Ej. Equipo de Ventas"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Correo de Respuesta (Reply-To)</Label>
                                <Input
                                    type="email"
                                    value={replyTo}
                                    onChange={(e) => setReplyTo(e.target.value)}
                                    placeholder="ej. ventas@empresa.com"
                                />
                                <p className="text-xs text-slate-500">
                                    Las respuestas de tus clientes llegarán a esta dirección.
                                </p>
                            </div>
                            <Button onClick={handleSaveProfile} className="w-full bg-slate-800 hover:bg-slate-900">
                                Guardar Perfil
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Test Deliverability */}
                    <Card className={cn(
                        "border-slate-200 transition-opacity",
                        !isDomainVerified && "opacity-60 pointer-events-none"
                    )}>
                        <CardHeader>
                            <CardTitle className="text-lg">Prueba de Entrega</CardTitle>
                            <CardDescription>
                                Verifica que todo funcione enviando un correo de prueba.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleTestEmail}
                                disabled={testing || !isDomainVerified}
                                variant="outline"
                                className="w-full"
                            >
                                {testing ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Enviar correo de prueba
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Domain Authentication */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Verificación de Dominio</CardTitle>
                                    <CardDescription className="mt-1">
                                        Autoriza a Antü CRM a enviar correos desde tu dominio.
                                    </CardDescription>
                                </div>
                                {domain && showRecords && (
                                    <Badge className={cn(
                                        "px-3 py-1 text-sm font-medium border-0 gap-1.5",
                                        isDomainVerified
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                            : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                    )}>
                                        {isDomainVerified ? (
                                            <><ShieldCheck className="w-4 h-4" /> Verificado y Seguro</>
                                        ) : (
                                            <><ShieldAlert className="w-4 h-4" /> Pendiente de Verificación</>
                                        )}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {!showRecords ? (
                                <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="domain-input" className="text-slate-700 font-semibold">
                                            Ingresa el dominio de tu empresa
                                        </Label>
                                        <div className="flex gap-3">
                                            <Input
                                                id="domain-input"
                                                placeholder="ej. miempresa.com"
                                                value={domain}
                                                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                                                className="bg-white max-w-sm font-mono text-sm"
                                            />
                                            <Button
                                                onClick={handleGenerateRecords}
                                                disabled={!domain || isGenerating}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {isGenerating ? (
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                ) : null}
                                                Generar Registros DNS
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            No incluyas http:// ni www. Solo el nombre del dominio raíz.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">Dominio configurado:</span>
                                            <span className="font-mono text-sm font-semibold text-slate-800">{domain}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowRecords(false)}
                                            className="text-xs h-8 text-slate-500 hover:text-slate-800"
                                        >
                                            Cambiar Dominio
                                        </Button>
                                    </div>

                                    {!isDomainVerified && (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm mb-1">Configuración en tu proveedor de dominio</h4>
                                                <p className="text-sm text-slate-500">
                                                    Agrega los siguientes registros TXT en la configuración DNS de tu proveedor (GoDaddy, Cloudflare, Namecheap, etc.).
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                {/* DNS Records */}
                                                <TooltipProvider>
                                                    {INITIAL_RECORDS.map((record, index) => {
                                                        // Helper to customize record name based on inputted domain if needed
                                                        let recordName = record.name;
                                                        let recordLabel = 'Registro';
                                                        let tooltipInfo = '';

                                                        if (index === 0) {
                                                            recordName = `antu._domainkey.${domain}`;
                                                            recordLabel = 'DKIM';
                                                            tooltipInfo = 'DomainKeys Identified Mail: Añade una firma criptográfica a los correos, verificando que fueron enviados por el propietario del dominio.';
                                                        } else if (index === 1) {
                                                            recordName = domain;
                                                            recordLabel = 'SPF';
                                                            tooltipInfo = 'Sender Policy Framework: Especifica qué servidores de correo (IPs) están autorizados a enviar correos en nombre de tu dominio.';
                                                        } else if (index === 2) {
                                                            recordName = `_dmarc.${domain}`;
                                                            recordLabel = 'DMARC';
                                                            tooltipInfo = 'Domain-based Message Authentication: Usa SPF y DKIM para proveer instrucciones sobre cómo manejar correos no autorizados.';
                                                        }

                                                        return (
                                                            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
                                                                <div className="bg-slate-50 p-4 sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col justify-center">
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <span className="font-bold text-slate-700 text-sm">{recordLabel}</span>
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="max-w-xs text-xs">
                                                                                <p>{tooltipInfo}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <Badge variant="outline" className="w-fit text-[10px] font-mono text-slate-500 bg-white">
                                                                        TIPO: {record.type}
                                                                    </Badge>
                                                                </div>

                                                                <div className="p-4 flex-1 space-y-3 bg-white">
                                                                    {/* Name/Host */}
                                                                    <div>
                                                                        <Label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Nombre / Host</Label>
                                                                        <div className="flex items-center gap-2 group">
                                                                            <code className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex-1 truncate">
                                                                                {recordName}
                                                                            </code>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => handleCopy(recordName, index * 2)}
                                                                            >
                                                                                {copiedIndex === index * 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Value */}
                                                                    <div>
                                                                        <Label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Valor / Datos</Label>
                                                                        <div className="flex items-center gap-2 group">
                                                                            <code className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex-1 break-all">
                                                                                {record.value}
                                                                            </code>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => handleCopy(record.value, index * 2 + 1)}
                                                                            >
                                                                                {copiedIndex === index * 2 + 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </TooltipProvider>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                                                <p className="text-xs text-slate-500 max-w-md">
                                                    Los cambios de DNS pueden tardar hasta 24 horas en propagarse. Puedes intentar verificar en cualquier momento.
                                                </p>
                                                <Button
                                                    onClick={handleVerifyDomain}
                                                    disabled={verifying}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {verifying ? (
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                    )}
                                                    Verificar DNS
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {isDomainVerified && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-xl text-center flex flex-col items-center">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                                <ShieldCheck className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-emerald-800 mb-2">¡Dominio Autenticado!</h3>
                                            <p className="text-sm text-emerald-600 max-w-md">
                                                Antü CRM está autorizado para enviar correos en nombre de <span className="font-semibold">{domain}</span> de forma segura.
                                            </p>
                                        </div>
                                    )}

                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
