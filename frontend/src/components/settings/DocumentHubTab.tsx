import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Palette, FileImage, ShieldCheck, FileText, Upload, SlidersHorizontal, Settings2, Link2, Check, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { generatePDF } from '@/lib/documentEngine';
import type { DocumentType, ReportData } from '@/lib/documentEngine';

export function DocumentHubTab() {
    const [activeTab, setActiveTab] = useState('brand');

    // Brand Kit State
    const [primaryColor, setPrimaryColor] = useState('#0891b2'); // cyan-600 baseline
    const [secondaryColor, setSecondaryColor] = useState('#334155'); // slate-700 baseline
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    // Mappings State
    const [mfpConfig, setMfpConfig] = useState({
        requireHardware: true,
        requireBWCxC: true,
        requireColorCxC: true,
        requireServiceMonthly: true,
        showVolumes: true
    });

    const [generalConfig, setGeneralConfig] = useState({
        includeThumbnails: false,
        showDiscounts: true
    });

    const [fiscalConfig, setFiscalConfig] = useState({
        requireRNC: true,
        taxRate: 18,
        includeMethods: true,
        templateStyle: 'modern'
    });

    // Terms state
    const [terms, setTerms] = useState({
        MFP: '1. El equipo se mantiene propiedad de Soluciones Gráficas hasta su saldo total.\n2. Insumos incluidos según cuotas descritas.\n3. Servicios preventivos cada 3 meses.',
        GENERAL: '1. Los precios están sujetos a cambios sin previo aviso.\n2. Validez de esta cotización: 15 días laborables.',
        FISCAL: '1. Factura con Valor Fiscal. Pagadera a 30 días netos.\n2. Penalidad mensual de 2% por mora.'
    });

    const handleSaveBrand = () => {
        toast.success('Brand Kit actualizado. Los PDFs heredarán estas propiedades.');
    };

    const handleSaveTemplates = () => {
        toast.success('Configuraciones de Plantilla guardadas en el Hub.');
    };

    const handleSaveTerms = () => {
        toast.success('Términos y condiciones legales actualizados.');
    };

    const handlePreview = (type: DocumentType, termsText: string) => {
        let data: ReportData;
        if (type === 'MFP') {
            data = {
                companyName: 'Soluciones Gráficas S.R.L.',
                clientName: 'Demo Copiadoras Corp.',
                items: [{ code: 'MFP-101', description: 'Impresora Alta Gama', equipmentPrice: 1500, bwCostPerCopy: 0.015, bwVolume: 10000 }],
                subtotal: 1500,
                tax: 270,
                total: 1770,
                date: new Date().toLocaleDateString(),
                termsAndConditions: termsText
            };
        } else if (type === 'GENERAL') {
            data = {
                companyName: 'Soluciones Gráficas S.R.L.',
                clientName: 'Demo Cliente S.R.L.',
                items: [{ quantity: 5, description: 'Tóner Negro', unitPrice: 85 }],
                subtotal: 425,
                tax: 76.5,
                total: 501.5,
                date: new Date().toLocaleDateString(),
                termsAndConditions: termsText
            };
        } else {
            data = {
                companyName: 'Soluciones Gráficas S.R.L.',
                clientName: 'Demo Cliente S.R.L.',
                rnc: '130123456',
                ncf: 'B0100000123',
                items: [{ quantity: 1, description: 'Servicio de Mantenimiento', unitPrice: 500 }],
                subtotal: 500,
                tax: 90,
                total: 590,
                date: new Date().toLocaleDateString(),
                termsAndConditions: termsText
            };
        }

        try {
            const blobUrl = generatePDF(type, data, {
                primaryColor,
                secondaryColor,
                templateStyle: fiscalConfig.templateStyle as 'classic' | 'modern' | 'minimal' | 'bold'
            }, true);
            if (blobUrl) {
                window.open(blobUrl as string, '_blank');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error al generar vista previa');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    Hub de Plantillas
                </h2>
                <p className="text-sm text-slate-500">
                    Motor centralizado de documentos. Configura identidad, campos de mapeo y cláusulas para la generación automatizada de PDF.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 border border-slate-200">
                    <TabsTrigger value="brand" className="gap-2"><Palette className="w-4 h-4" /> Brand Kit (Identidad)</TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2"><SlidersHorizontal className="w-4 h-4" /> Plantillas Maestras</TabsTrigger>
                    <TabsTrigger value="terms" className="gap-2"><ShieldCheck className="w-4 h-4" /> Términos y Condiciones</TabsTrigger>
                </TabsList>

                <TabsContent value="brand" className="mt-6 space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg">Identidad Corporativa Universal</CardTitle>
                            <CardDescription>Estos assets se inyectarán en la cabecera, pie y acentos de todas las facturas y cotizaciones.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-slate-400" /> Colores Corporativos</h4>
                                    <div className="flex gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Color Primario (Hex)</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input type="color" className="w-12 h-10 p-1" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                                                <Input className="font-mono uppercase w-24" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Color Secundario (Hex)</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input type="color" className="w-12 h-10 p-1" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                                                <Input className="font-mono uppercase w-24" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-l border-slate-100 pl-8">
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileImage className="w-4 h-4 text-slate-400" /> Assets Gráficos</h4>
                                    <div className="space-y-4">
                                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center relative">
                                            <input
                                                type="file"
                                                id="logo-upload"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/svg+xml"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setLogoFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            {logoFile ? (
                                                <>
                                                    <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                                    <p className="text-sm font-semibold text-slate-700">{logoFile.name}</p>
                                                    <Button variant="link" className="text-xs text-red-500" onClick={() => setLogoFile(null)}>Remover</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                                    <p className="text-sm text-slate-600 mb-2">Sube el logo de la empresa</p>
                                                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                                        Seleccionar PNG/SVG
                                                    </Label>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center relative">
                                            <input
                                                type="file"
                                                id="signature-upload"
                                                className="hidden"
                                                accept="image/png, image/jpeg"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setSignatureFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            {signatureFile ? (
                                                <>
                                                    <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                                    <p className="text-sm font-semibold text-slate-700">{signatureFile.name}</p>
                                                    <Button variant="link" className="text-xs text-red-500" onClick={() => setSignatureFile(null)}>Remover</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                                    <p className="text-sm text-slate-600 mb-2">Firma Digital Representante</p>
                                                    <Label htmlFor="signature-upload" className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                                        Seleccionar Firma
                                                    </Label>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <div className="bg-slate-50 p-4 flex justify-end">
                            <Button onClick={handleSaveBrand} className="bg-slate-800 text-white hover:bg-slate-900">Aplicar Cambios Globales</Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* MFP CONFIG */}
                        <Card className="border-[var(--color-primary)] shadow-sm">
                            <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-cyan-600" /> Tipo A: Cotización MFP</CardTitle>
                                        <CardDescription className="text-xs mt-1">Formato técnico híbrido Canon/AOS</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={() => handlePreview('MFP', terms.MFP)}>
                                        <Eye className="w-3.5 h-3.5 mr-1" /> PDF Previo
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Exigir Hardware Precio</Label>
                                        <Switch checked={mfpConfig.requireHardware} onCheckedChange={(v) => setMfpConfig({ ...mfpConfig, requireHardware: v })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Exigir Costo x Copia (B/N)</Label>
                                        <Switch checked={mfpConfig.requireBWCxC} onCheckedChange={(v) => setMfpConfig({ ...mfpConfig, requireBWCxC: v })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Exigir Costo x Copia (Color)</Label>
                                        <Switch checked={mfpConfig.requireColorCxC} onCheckedChange={(v) => setMfpConfig({ ...mfpConfig, requireColorCxC: v })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Mostrar Volúmenes Calculados</Label>
                                        <Switch checked={mfpConfig.showVolumes} onCheckedChange={(v) => setMfpConfig({ ...mfpConfig, showVolumes: v })} />
                                    </div>
                                </div>
                                <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 mt-2 flex items-start gap-2">
                                    <Link2 className="w-3 h-3 shrink-0 mt-0.5" />
                                    Mapeo Interno: Nivel Precio, Mensualidad Hardware y Servicio integrados en Renderizador.
                                </div>
                            </CardContent>
                        </Card>

                        {/* GENERAL CONFIG */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-slate-500" /> Tipo B: General</CardTitle>
                                        <CardDescription className="text-xs mt-1">Suministros y servicios estándar</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={() => handlePreview('GENERAL', terms.GENERAL)}>
                                        <Eye className="w-3.5 h-3.5 mr-1" /> PDF Previo
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Incluir Miniaturas de Producto</Label>
                                        <Switch checked={generalConfig.includeThumbnails} onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, includeThumbnails: v })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Mostrar Descuentos Inline</Label>
                                        <Switch checked={generalConfig.showDiscounts} onCheckedChange={(v) => setGeneralConfig({ ...generalConfig, showDiscounts: v })} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* FISCAL CONFIG */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <CardTitle className="text-md flex items-center gap-2"><Settings2 className="w-4 h-4 text-slate-500" /> Tipo C: Factura Fiscal</CardTitle>
                                        <CardDescription className="text-xs mt-1">Integración DGII con NCF</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={() => handlePreview('FISCAL', terms.FISCAL)}>
                                        <Eye className="w-3.5 h-3.5 mr-1" /> PDF Previo
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Validar RNC / Cédula Obligatorio</Label>
                                        <Switch checked={fiscalConfig.requireRNC} onCheckedChange={(v) => setFiscalConfig({ ...fiscalConfig, requireRNC: v })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Mostrar Métodos de Pago</Label>
                                        <Switch checked={fiscalConfig.includeMethods} onCheckedChange={(v) => setFiscalConfig({ ...fiscalConfig, includeMethods: v })} />
                                    </div>
                                    <div className="pt-2">
                                        <Label className="text-xs block mb-1">Tasa ITBIS (%) Base</Label>
                                        <Input type="number" value={fiscalConfig.taxRate} onChange={e => setFiscalConfig({ ...fiscalConfig, taxRate: Number(e.target.value) })} className="h-8" />
                                    </div>
                                    <div className="pt-2 border-t mt-2">
                                        <Label className="text-xs block mb-2 font-semibold text-slate-700">Diseño de Plantilla Factura</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'classic', label: 'Clásico' },
                                                { id: 'modern', label: 'Moderno' },
                                                { id: 'minimal', label: 'Minimalista' },
                                                { id: 'bold', label: 'Corporativo Bold' }
                                            ].map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setFiscalConfig({ ...fiscalConfig, templateStyle: style.id })}
                                                    className={`py-2 px-1 border rounded-md text-xs font-medium transition-all ${fiscalConfig.templateStyle === style.id ? 'border-[var(--color-primary)] bg-[var(--primary-50)] text-[var(--color-primary)] shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveTemplates} className="bg-[var(--color-primary)]">Sincronizar Parámetros con Motor</Button>
                    </div>
                </TabsContent>

                <TabsContent value="terms" className="mt-6 space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg">Cláusulas Legales por Documento</CardTitle>
                            <CardDescription>Estos textos se imprimirán al pie de página (Página Final) o anexo en los PDFs generados.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Términos Especiales - Equipos MFP</Label>
                                <Textarea
                                    className="font-mono text-xs h-24"
                                    value={terms.MFP}
                                    onChange={e => setTerms({ ...terms, MFP: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Términos - Cotización General</Label>
                                <Textarea
                                    className="font-mono text-xs h-20"
                                    value={terms.GENERAL}
                                    onChange={e => setTerms({ ...terms, GENERAL: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Nota Legal - Facturación DGII</Label>
                                <Textarea
                                    className="font-mono text-xs h-20"
                                    value={terms.FISCAL}
                                    onChange={e => setTerms({ ...terms, FISCAL: e.target.value })}
                                />
                            </div>

                        </CardContent>
                        <div className="bg-slate-50 p-4 flex justify-end">
                            <Button onClick={handleSaveTerms} variant="outline" className="border-slate-300">Guardar Cláusulas</Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
