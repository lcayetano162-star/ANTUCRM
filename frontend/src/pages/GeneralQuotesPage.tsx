// ============================================
// ANTU CRM - Cotización General
// Cotizador Multi-Propósito (Hardware, Servicios, Otros)
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { generatePDF } from '@/lib/documentEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Calculator,
    User,
    Plus,
    Save,
    Trash2,
    FileText,
    PackageCheck,
    Zap,
    RotateCcw,
    Briefcase,
} from 'lucide-react';

import { SearchAutocomplete } from '@/components/ui/search-autocomplete';
import { useCustomersWithAI } from '@/hooks/useCustomersWithAI';

// ============================================
// TYPES
// ============================================

type Currency = 'DOP' | 'USD';

interface GenericProduct {
    id: string;
    code: string;
    description: string;
    unitPrice: number;
    taxRate: number; // e.g. 18 for ITBIS
}

interface QuoteRow {
    id: string;
    productId: string | null;
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    taxRate: number; // usually 18 for ITBIS in DO
}



interface QuoteConfig {
    currency: Currency;
    customerId: string | null;
    opportunityId: string | null;
    validityDays: number;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_GENERIC_PRODUCTS: GenericProduct[] = [
    { id: 'p1', code: 'HW-LPT-01', description: 'Laptop Profesional 14" i7 16GB', unitPrice: 1200, taxRate: 18 },
    { id: 'p2', code: 'HW-SRV-02', description: 'Servidor Rack 1U Xeon 64GB', unitPrice: 3500, taxRate: 18 },
    { id: 'p3', code: 'HW-UPS-01', description: 'UPS Interactivo 1500VA', unitPrice: 180, taxRate: 18 },
    { id: 'p4', code: 'AC-CAB-01', description: 'Bobina de Cable UTP Cat6', unitPrice: 120, taxRate: 18 },
    { id: 'p5', code: 'SV-INS-01', description: 'Servicio de Instalación (Día)', unitPrice: 200, taxRate: 18 },
];

const MOCK_OPPORTUNITIES: any[] = [];

// ============================================
// UTILS
// ============================================

import { formatCurrency } from '@/lib/utils';

function createEmptyRow(id: string): QuoteRow {
    return {
        id,
        productId: null,
        code: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercentage: 0,
        taxRate: 18,
    };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GeneralQuotesPage() {
    const { tenant } = useTenant();
    const { customers } = useCustomersWithAI();
    const [opportunities, setOpportunities] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('antu_opportunities');
        if (saved) {
            setOpportunities(JSON.parse(saved));
        } else {
            setOpportunities(MOCK_OPPORTUNITIES);
        }
    }, []);

    const [config, setConfig] = useState<QuoteConfig>({
        currency: (tenant?.currency as Currency) || 'USD',
        customerId: null,
        opportunityId: null,
        validityDays: 15,
    });

    const [rows, setRows] = useState<QuoteRow[]>([
        createEmptyRow('1'),
        createEmptyRow('2'),
        createEmptyRow('3'),
    ]);

    const [notes, setNotes] = useState('');




    const selectedCustomer = useMemo(
        () => customers.find((c) => c.id === config.customerId),
        [config.customerId, customers]
    );

    const filteredOpportunities = useMemo(() => {
        let list = opportunities;
        if (config.customerId) {
            const cust = customers.find(c => c.id === config.customerId);
            if (cust) {
                list = list.filter(o => o.customerName === cust.name || o.customerName === cust.legalName);
            }
        }
        return list;
    }, [config.customerId, opportunities, customers]);



    // Count products added
    const productsAdded = useMemo(
        () => rows.filter((r) => r.code || r.description || r.unitPrice > 0).length,
        [rows]
    );

    // Totals calculations
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        rows.forEach((row) => {
            const rowSubtotal = row.quantity * row.unitPrice;
            const rowDiscount = rowSubtotal * (row.discountPercentage / 100);
            const rowTaxable = rowSubtotal - rowDiscount;
            const rowTax = rowTaxable * (row.taxRate / 100);

            subtotal += rowSubtotal;
            totalDiscount += rowDiscount;
            totalTax += rowTax;
        });

        const netTotal = subtotal - totalDiscount;
        const grandTotal = netTotal + totalTax;

        return { subtotal, totalDiscount, netTotal, totalTax, grandTotal };
    }, [rows]);

    // Handlers
    const addRow = () => {
        const newId = (Math.max(...rows.map((r) => parseInt(r.id)), 0) + 1).toString();
        setRows([...rows, createEmptyRow(newId)]);
    };

    const removeRow = (rowId: string) => {
        if (rows.length === 1) {
            setRows([createEmptyRow(rows[0].id)]);
            return;
        }
        setRows(rows.filter((r) => r.id !== rowId));
    };

    const updateRow = (rowId: string, field: keyof QuoteRow, value: any) => {
        setRows((prev) =>
            prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
        );
    };

    const selectProductForItem = (product: GenericProduct, rowId: string) => {
        setRows(prev => prev.map(row =>
            row.id === rowId
                ? {
                    ...row,
                    productId: product.id,
                    code: product.code,
                    description: product.description,
                    unitPrice: product.unitPrice,
                    taxRate: product.taxRate
                }
                : row
        ));
        toast.success('Producto seleccionado');
    };



    const clearAllRows = () => {
        setRows([
            createEmptyRow('1'),
            createEmptyRow('2'),
            createEmptyRow('3'),
        ]);
        toast.success('Todas las filas han sido limpiadas');
    };

    const saveDraft = () => {
        const hasProducts = rows.some((r) => r.code || r.description || r.unitPrice > 0);
        if (!hasProducts) {
            toast.error('La cotización debe tener al menos un producto válido para guardar');
            return;
        }

        const draft = {
            id: `DRAFT-GRAL-${Date.now()}`,
            date: new Date().toISOString(),
            config,
            rows,
            totals,
            notes,
            customerName: selectedCustomer?.name || 'Cliente no definido',
            type: 'GENERAL'
        };

        const existingDrafts = JSON.parse(localStorage.getItem('antu_quotes_history') || '[]');
        localStorage.setItem('antu_quotes_history', JSON.stringify([draft, ...existingDrafts]));

        toast.success('Borrador guardado localmente');

        // Trigger PDF Download and Open Document View
        const items = rows.filter((r) => r.code || r.description || r.unitPrice > 0).map(r => ({
            quantity: r.quantity,
            description: r.description || r.code,
            unitPrice: r.unitPrice,
        }));

        try {
            const selectedOpp = opportunities.find(o => o.id === config.opportunityId);
            const reportData = {
                companyName: tenant?.name || 'Compañía Demo S.R.L.',
                clientName: selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.rnc ? `(${selectedCustomer.rnc})` : ''}` : 'Cliente Genérico',
                opportunityName: selectedOpp ? selectedOpp.name : undefined,
                items: items,
                subtotal: totals.subtotal,
                tax: totals.totalTax,
                total: totals.grandTotal,
                date: new Date().toLocaleDateString(),
                termsAndConditions: notes || undefined
            };

            const primaryColor = (tenant?.branding as any)?.primaryColor || '#0891b2';
            const secondaryColor = (tenant?.branding as any)?.secondaryColor || '#334155';

            const blobUrl = generatePDF('GENERAL', reportData, { primaryColor, secondaryColor }, false);
            if (blobUrl) {
                // Open the document for the executive to see
                window.open(blobUrl as string, '_blank');
            }
        } catch (err: any) {
            toast.error('Guardado localmente, pero ' + (err.message || 'Error al generar PDF'));
        }
    };

    const generateQuote = () => {
        const hasProducts = rows.some((r) => r.code || r.description || r.unitPrice > 0);
        if (!hasProducts) {
            toast.error('La cotización debe tener al menos un producto o servicio válido');
            return;
        }

        if (config.opportunityId) {
            let updatedOpportunities = opportunities;

            updatedOpportunities = updatedOpportunities.map((opp: any) =>
                opp.id === config.opportunityId
                    ? { ...opp, value: totals.subtotal }
                    : opp
            );

            localStorage.setItem('antu_opportunities', JSON.stringify(updatedOpportunities));
            setOpportunities(updatedOpportunities);

            const opp = updatedOpportunities.find(o => o.id === config.opportunityId);
            toast.success(`Cotización Gral generada y vinculada a: ${opp?.name}`);
            toast.info(`Monto de ${formatCurrency(totals.subtotal, config.currency)} (Subtotal) cargado como valor estimado de la oportunidad.`);
        } else {
            toast.success('Cotización General generada exitosamente');
        }
    };

    const loadToOpportunity = () => {
        if (!config.opportunityId) {
            toast.error('Seleccione una oportunidad primero');
            return;
        }
        const opp = opportunities.find(o => o.id === config.opportunityId);
        toast.success(`Sincronizado: ${formatCurrency(totals.subtotal, config.currency)} cargado a ${opp?.name}`);
    };

    const handleNativePreview = () => {
        const items = rows.filter((r) => r.code || r.description || r.unitPrice > 0).map(r => ({
            quantity: r.quantity,
            description: r.description || r.code,
            unitPrice: r.unitPrice,
        }));

        if (items.length === 0) {
            toast.error('Agregue al menos un producto para generar la vista previa');
            return;
        }

        try {
            const selectedOpp = opportunities.find(o => o.id === config.opportunityId);
            const reportData = {
                companyName: tenant?.name || 'Compañía Demo S.R.L.',
                clientName: selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.rnc ? `(${selectedCustomer.rnc})` : ''}` : 'Cliente Genérico',
                opportunityName: selectedOpp ? selectedOpp.name : undefined,
                items: items,
                subtotal: totals.subtotal,
                tax: totals.totalTax,
                total: totals.grandTotal,
                date: new Date().toLocaleDateString(),
                termsAndConditions: notes || undefined
            };

            const primaryColor = (tenant?.branding as any)?.primaryColor || '#0891b2';
            const secondaryColor = (tenant?.branding as any)?.secondaryColor || '#334155';

            const blobUrl = generatePDF('GENERAL', reportData, { primaryColor, secondaryColor }, true);
            if (blobUrl) {
                window.open(blobUrl as string, '_blank');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error al generar vista previa');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">COTIZACIÓN GRAL</h1>
                            <p className="text-sm text-slate-500">Cotizador estándar multipropósito</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            value={config.currency}
                            onValueChange={(value: Currency) => setConfig({ ...config, currency: value })}
                        >
                            <SelectTrigger className="w-24 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DOP">DOP</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={generateQuote} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Generar Cotización
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* CONFIGURATION */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <PackageCheck className="w-5 h-5 text-indigo-600" />
                                Datos Referenciales
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Cliente</Label>
                                    <SearchAutocomplete
                                        options={customers.map(c => ({
                                            value: c.id,
                                            label: c.name,
                                            description: c.rnc || c.legalName,
                                            icon: <User className="w-4 h-4 text-slate-400" />
                                        }))}
                                        value={config.customerId || undefined}
                                        onChange={(val) => setConfig({ ...config, customerId: val, opportunityId: null })}
                                        placeholder="Buscar cliente..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Oportunidad</Label>
                                    <div className="flex gap-2 w-full">
                                        <div className="flex-1">
                                            <SearchAutocomplete
                                                options={filteredOpportunities.map(o => ({
                                                    value: o.id,
                                                    label: o.name,
                                                    description: o.customerName,
                                                    icon: <Briefcase className="w-4 h-4 text-slate-400" />
                                                }))}
                                                value={config.opportunityId || undefined}
                                                onChange={(val) => setConfig({ ...config, opportunityId: val })}
                                                placeholder="Seleccionar oportunidad (Opcional)"
                                            />
                                        </div>
                                        {config.opportunityId && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={loadToOpportunity}
                                                className="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 shrink-0 h-10 w-10"
                                                title="Cargar subtotal a la oportunidad"
                                            >
                                                <Zap className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Validez (Días)</Label>
                                    <Input
                                        type="number"
                                        value={config.validityDays}
                                        onChange={(e) => setConfig({ ...config, validityDays: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BUILDER */}
                    <Card className="border-slate-200 shadow-sm overflow-visible">
                        <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-indigo-600" />
                                    Líneas de Detalle
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-indigo-700 text-white leading-normal">
                                        <th className="py-3 px-4 text-left font-medium w-32">Código</th>
                                        <th className="py-3 px-4 text-left font-medium">Descripción</th>
                                        <th className="py-3 px-4 text-right font-medium w-24">Cant.</th>
                                        <th className="py-3 px-4 text-right font-medium w-32">Precio Unit.</th>
                                        <th className="py-3 px-4 text-right font-medium w-24">Desc. %</th>
                                        <th className="py-3 px-4 text-right font-medium w-24">ITBIS %</th>
                                        <th className="py-3 px-4 text-right font-medium w-36">Total Línea</th>
                                        <th className="py-3 px-4 text-center font-medium w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {rows.map((row) => {
                                        const rowSubtotal = row.quantity * row.unitPrice;
                                        const rowDiscount = rowSubtotal * (row.discountPercentage / 100);
                                        const rowTaxable = rowSubtotal - rowDiscount;
                                        const rowTax = rowTaxable * (row.taxRate / 100);
                                        const rowTotal = rowTaxable + rowTax;

                                        return (
                                            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="py-2 px-3">
                                                    <SearchAutocomplete
                                                        options={MOCK_GENERIC_PRODUCTS.map(p => ({
                                                            value: p.id,
                                                            label: p.code,
                                                            description: p.description,
                                                            icon: <PackageCheck className="w-4 h-4 text-slate-400" />
                                                        }))}
                                                        value={row.productId || undefined}
                                                        onChange={(val) => {
                                                            const prod = MOCK_GENERIC_PRODUCTS.find(p => p.id === val);
                                                            if (prod) selectProductForItem(prod, row.id);
                                                            else updateRow(row.id, 'code', val);
                                                        }}
                                                        placeholder="Cód."
                                                        triggerClassName="h-9 font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <SearchAutocomplete
                                                        options={MOCK_GENERIC_PRODUCTS.map(p => ({
                                                            value: p.id,
                                                            label: p.description,
                                                            description: p.code,
                                                            icon: <PackageCheck className="w-4 h-4 text-slate-400" />
                                                        }))}
                                                        value={row.productId || undefined}
                                                        onChange={(val) => {
                                                            const prod = MOCK_GENERIC_PRODUCTS.find(p => p.id === val);
                                                            if (prod) selectProductForItem(prod, row.id);
                                                            else updateRow(row.id, 'description', val);
                                                        }}
                                                        placeholder="Descripción del concepto"
                                                        triggerClassName="h-9 text-xs"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <Input
                                                        type="number"
                                                        value={row.quantity || ''}
                                                        className="h-9 text-right"
                                                        min="1"
                                                        onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <Input
                                                        type="number"
                                                        value={row.unitPrice || ''}
                                                        className="h-9 text-right"
                                                        min="0"
                                                        onChange={(e) => updateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <Input
                                                        type="number"
                                                        value={row.discountPercentage || ''}
                                                        className="h-9 text-right"
                                                        min="0"
                                                        max="100"
                                                        onChange={(e) => updateRow(row.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <Input
                                                        type="number"
                                                        value={row.taxRate ?? 18}
                                                        className="h-9 text-right"
                                                        min="0"
                                                        onChange={(e) => updateRow(row.id, 'taxRate', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                                                    {formatCurrency(rowTotal, config.currency)}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeRow(row.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Add Row Button & Counter */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                <Button
                                    variant="outline"
                                    onClick={addRow}
                                    className="gap-2 border-slate-300 text-slate-600 hover:bg-white"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Fila
                                </Button>
                                <span className="text-sm text-slate-500">
                                    <span className="font-medium text-slate-700">{productsAdded}</span> producto(s) agregado(s)
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* TOTALS & SUMMARY */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <Card className="h-full border-slate-200">
                                <CardHeader className="py-4 border-b border-slate-100">
                                    <CardTitle className="text-base text-slate-700">Notas y Condiciones</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Incluye términos de pago, garantías, plazos de entrega, etc..."
                                        className="min-h-[160px] resize-none border-slate-200"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="w-full lg:w-[400px]">
                            <Card className="border-indigo-100 shadow-md">
                                <CardHeader className="bg-indigo-50 border-b border-indigo-100 py-4">
                                    <CardTitle className="text-lg text-indigo-900">Resumen Financiero</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{formatCurrency(totals.subtotal, config.currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Descuento</span>
                                        <span className="font-mono text-emerald-600">-{formatCurrency(totals.totalDiscount, config.currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600 pt-3 border-t border-slate-100">
                                        <span>Base Imponible</span>
                                        <span className="font-mono">{formatCurrency(totals.netTotal, config.currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>ITBIS Estimado</span>
                                        <span className="font-mono">{formatCurrency(totals.totalTax, config.currency)}</span>
                                    </div>

                                    <div className="pt-4 mt-2 border-t-2 border-dashed border-indigo-200">
                                        <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                            <span className="font-bold text-indigo-900 text-lg">TOTAL</span>
                                            <span className="font-bold font-mono text-xl text-indigo-700">
                                                {formatCurrency(totals.grandTotal, config.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </div>
            </div>

            {/* ACTION BUTTONS FOOTER */}
            < div className="max-w-[1600px] mx-auto mt-8 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200" >
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={clearAllRows}
                        className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Limpiar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={saveDraft}
                        className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                        <Save className="w-4 h-4" />
                        Guardar Borrador
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleNativePreview}
                        variant="outline"
                        className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                        <FileText className="w-4 h-4" />
                        Vista Previa PDF
                    </Button>
                    <Button
                        onClick={generateQuote}
                        className="gap-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <FileText className="w-4 h-4" />
                        Generar Cotización
                    </Button>
                </div>
            </div >
        </div >
    );
}

export default GeneralQuotesPage;
