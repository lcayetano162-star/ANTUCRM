// ============================================
// ANTU CRM - Cotización MFP
// Renta y Venta de Equipos de Impresión Multifuncionales
// República Dominicana - DOP/USD
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { generatePDF } from '@/lib/documentEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  FileText,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  User,
  Briefcase,
  Percent,
  Printer,
  TrendingUp,
  FileOutput,
} from 'lucide-react';

import { SearchAutocomplete } from '@/components/ui/search-autocomplete';
import { useCustomersWithAI } from '@/hooks/useCustomersWithAI';

// ============================================
// TYPES
// ============================================

type BusinessType = 'RENTA' | 'VENTA';
type PriceLevel = 'PRECIO_LISTA' | 'NIVEL_1' | 'NIVEL_2' | 'NIVEL_3';
type Currency = 'DOP' | 'USD';

interface Product {
  id: string;
  code: string;
  description: string;
  priceLevel: PriceLevel;
  equipmentPrice: number;
  bnServiceCost: number;
  colorServiceCost: number;
}

interface QuoteRow {
  id: string;
  productId: string | null;
  code: string;
  description: string;
  priceLevel: PriceLevel;
  equipmentPrice: number;
  bnServiceCost: number;
  bnVolume: number;
  colorServiceCost: number;
  colorVolume: number;
  monthlyBnService: number;
  monthlyColorService: number;
  monthlyHardware: number;
  monthlyBusiness: number;
}

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number;
  customerName: string;
}

interface QuoteConfig {
  businessType: BusinessType;
  priceLevel: PriceLevel;
  rentalPeriodMonths: number;
  annualInterestRate: number;
  currency: Currency;
  exchangeRate: number;
  customerId: string | null;
  opportunityId: string | null;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    code: 'MFP-C300',
    description: 'Multifuncional Color A3 - 30ppm',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 185000,
    bnServiceCost: 2.5,
    colorServiceCost: 8.5,
  },
  {
    id: '2',
    code: 'MFP-C450',
    description: 'Multifuncional Color A3 - 45ppm',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 285000,
    bnServiceCost: 2.3,
    colorServiceCost: 7.8,
  },
  {
    id: '3',
    code: 'MFP-B500',
    description: 'Multifuncional B/N A3 - 50ppm',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 145000,
    bnServiceCost: 1.8,
    colorServiceCost: 0,
  },
  {
    id: '4',
    code: 'MFP-C600',
    description: 'Multifuncional Color Producción - 60ppm',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 485000,
    bnServiceCost: 2.0,
    colorServiceCost: 6.5,
  },
  {
    id: '5',
    code: 'MFP-C250',
    description: 'Multifuncional Color A4 - 25ppm',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 95000,
    bnServiceCost: 2.8,
    colorServiceCost: 9.5,
  },
];

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: '1', name: 'Renovación Equipos Oficina Principal', stage: 'PROPUESTA', amount: 450000, customerName: 'Constructora del Caribe' },
  { id: '2', name: 'Contrato Mensual 3 Años', stage: 'NEGOCIACION', amount: 850000, customerName: 'Clínica Santa María' },
  { id: '3', name: 'Venta Directa 2 Equipos', stage: 'COTIZACION', amount: 320000, customerName: 'Abogados & Asociados' },
  { id: '4', name: 'Renta Flota Completa', stage: 'PROPUESTA', amount: 1200000, customerName: 'Hotel Tropical' },
];

// ============================================
// CONSTANTS
// ============================================

const PRICE_LEVELS: { value: PriceLevel; label: string; discount: number; color: string }[] = [
  { value: 'PRECIO_LISTA', label: 'Precio Lista', discount: 0, color: '#0891B2' },
  { value: 'NIVEL_1', label: 'Precio Estratégico', discount: 5, color: '#0EA5E9' },
  { value: 'NIVEL_2', label: 'Precio Proyecto', discount: 10, color: '#10B981' },
  { value: 'NIVEL_3', label: 'Precio Especial', discount: 15, color: '#F59E0B' },
];

const RENTAL_PERIODS = [6, 12, 18, 24, 30, 36, 42, 48];

// ============================================
// UTILITY FUNCTIONS
// ============================================

// PMT Formula for lease calculations
function calculatePMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const monthlyRate = rate / 12;
  return (pv * monthlyRate * Math.pow(1 + monthlyRate, nper)) / (Math.pow(1 + monthlyRate, nper) - 1);
}

// No local formatCurrency needed, using global from utils

function applyPriceLevel(price: number, level: PriceLevel): number {
  const discount = PRICE_LEVELS.find((l) => l.value === level)?.discount || 0;
  return price * (1 - discount / 100);
}

function createEmptyRow(id: string): QuoteRow {
  return {
    id,
    productId: null,
    code: '',
    description: '',
    priceLevel: 'PRECIO_LISTA',
    equipmentPrice: 0,
    bnServiceCost: 0,
    bnVolume: 0,
    colorServiceCost: 0,
    colorVolume: 0,
    monthlyBnService: 0,
    monthlyColorService: 0,
    monthlyHardware: 0,
    monthlyBusiness: 0,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function QuotesPage() {
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

  // Configuration State
  const [config, setConfig] = useState<QuoteConfig>({
    businessType: 'RENTA',
    priceLevel: 'PRECIO_LISTA',
    rentalPeriodMonths: 12,
    annualInterestRate: 18,
    currency: (tenant?.currency as Currency) || 'DOP',
    exchangeRate: 58.5,
    customerId: null,
    opportunityId: null,
  });

  // Rows State - Start with 5 empty rows
  const [rows, setRows] = useState<QuoteRow[]>([
    createEmptyRow('1'),
    createEmptyRow('2'),
    createEmptyRow('3'),
    createEmptyRow('4'),
    createEmptyRow('5'),
  ]);

  // Notes State
  const [notes, setNotes] = useState<string>('');

  // Product Search Dialog State


  // Preview & History States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);

  // Selected Entities
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === config.customerId),
    [config.customerId, customers]
  );

  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === config.opportunityId),
    [config.opportunityId, opportunities]
  );



  // Count products added
  const productsAdded = useMemo(
    () => rows.filter((r) => r.productId !== null).length,
    [rows]
  );

  // Calculate Totals
  const totals = useMemo(() => {
    const equipmentTotal = rows.reduce(
      (sum, row) => sum + (row.equipmentPrice || 0),
      0
    );

    const totalBnService = rows.reduce(
      (sum, row) => sum + (row.monthlyBnService || 0),
      0
    );

    const totalColorService = rows.reduce(
      (sum, row) => sum + (row.monthlyColorService || 0),
      0
    );

    const totalService = totalBnService + totalColorService;

    let monthlyHardware = 0;
    if (config.businessType === 'RENTA' && equipmentTotal > 0) {
      monthlyHardware = calculatePMT(
        config.annualInterestRate / 100,
        config.rentalPeriodMonths,
        equipmentTotal
      );
    }

    const monthlyTotal = monthlyHardware + totalService;

    const totalContract =
      config.businessType === 'RENTA'
        ? monthlyTotal * config.rentalPeriodMonths
        : equipmentTotal;

    return {
      equipmentTotal,
      totalBnService,
      totalColorService,
      totalService,
      monthlyHardware,
      monthlyTotal,
      totalContract,
    };
  }, [rows, config]);

  // Recalculate row amounts if critical config changes (like priceLevel, interest, terms)
  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        if (!row.productId) return row;

        // Find base equipment
        const baseProduct = MOCK_PRODUCTS.find((p) => p.id === row.productId);
        if (!baseProduct) return row;

        const discountedPrice = applyPriceLevel(baseProduct.equipmentPrice, config.priceLevel);
        const discountedBnCost = applyPriceLevel(baseProduct.bnServiceCost, config.priceLevel);
        const discountedColorCost = applyPriceLevel(baseProduct.colorServiceCost, config.priceLevel);

        const monthlyBnService = discountedBnCost * row.bnVolume;
        const monthlyColorService = discountedColorCost * row.colorVolume;
        const totalService = monthlyBnService + monthlyColorService;

        let monthlyHardware = 0;
        if (config.businessType === 'RENTA' && discountedPrice > 0) {
          monthlyHardware = calculatePMT(
            config.annualInterestRate / 100,
            config.rentalPeriodMonths,
            discountedPrice
          );
        }

        return {
          ...row,
          priceLevel: config.priceLevel,
          equipmentPrice: discountedPrice,
          bnServiceCost: discountedBnCost,
          colorServiceCost: discountedColorCost,
          monthlyBnService,
          monthlyColorService,
          monthlyHardware,
          monthlyBusiness: monthlyHardware + totalService,
        };
      })
    );
  }, [config.priceLevel, config.businessType, config.annualInterestRate, config.rentalPeriodMonths]);

  // Select product for a row
  const selectProductForItem = (product: Product, rowId: string) => {
    const discountedPrice = applyPriceLevel(product.equipmentPrice, config.priceLevel);
    const discountedBnCost = applyPriceLevel(product.bnServiceCost, config.priceLevel);
    const discountedColorCost = applyPriceLevel(product.colorServiceCost, config.priceLevel);

    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
            ...row,
            productId: product.id,
            code: product.code,
            description: product.description,
            priceLevel: config.priceLevel,
            equipmentPrice: discountedPrice,
            bnServiceCost: discountedBnCost,
            colorServiceCost: discountedColorCost,
            bnVolume: 0,
            colorVolume: 0,
            monthlyBnService: 0,
            monthlyColorService: 0,
            monthlyHardware: 0,
            monthlyBusiness: 0,
          }
          : row
      )
    );
    toast.success('Producto seleccionado');
  };



  // Update row volume
  const updateVolume = (rowId: string, field: 'bnVolume' | 'colorVolume', value: number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const updatedRow = { ...row, [field]: value };

        // Recalculate monthly services
        updatedRow.monthlyBnService = updatedRow.bnServiceCost * updatedRow.bnVolume;
        updatedRow.monthlyColorService = updatedRow.colorServiceCost * updatedRow.colorVolume;

        // Recalculate monthly business
        const totalService = updatedRow.monthlyBnService + updatedRow.monthlyColorService;
        if (config.businessType === 'RENTA' && updatedRow.equipmentPrice > 0) {
          updatedRow.monthlyHardware = calculatePMT(
            config.annualInterestRate / 100,
            config.rentalPeriodMonths,
            updatedRow.equipmentPrice
          );
        } else {
          updatedRow.monthlyHardware = 0;
        }
        updatedRow.monthlyBusiness = updatedRow.monthlyHardware + totalService;

        return updatedRow;
      })
    );
  };

  const updateRowPriceLevel = (level: PriceLevel) => {
    // Sync the local selection to global config which auto-recalculates all rows via useEffect
    setConfig({ ...config, priceLevel: level });
  };

  // Remove product from row
  const clearRow = (rowId: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? createEmptyRow(rowId) : row))
    );
  };

  // Add new row
  const addRow = () => {
    const newId = (Math.max(...rows.map((r) => parseInt(r.id)), 0) + 1).toString();
    setRows([...rows, createEmptyRow(newId)]);
  };

  // Clear all rows
  const clearAllRows = () => {
    setRows(rows.map((_, index) => createEmptyRow((index + 1).toString())));
    toast.success('Todas las filas han sido limpiadas');
  };

  // Save draft to localStorage and trigger PDF Download + Preview
  const saveDraft = () => {
    const hasProducts = rows.some((r) => r.productId !== null);
    if (!hasProducts) {
      toast.error('Agregue al menos un producto para guardar');
      return;
    }

    const draft = {
      id: `DRAFT-${Date.now()}`,
      date: new Date().toISOString(),
      config,
      rows,
      totals,
      notes,
      customerName: selectedCustomer ? (selectedCustomer.name || selectedCustomer.legalName) : 'Cliente no definido',
      type: 'MFP'
    };

    const existingDrafts = JSON.parse(localStorage.getItem('antu_quotes_history') || '[]');
    localStorage.setItem('antu_quotes_history', JSON.stringify([draft, ...existingDrafts]));

    setSavedQuotes([draft, ...existingDrafts]);
    toast.success('Borrador guardado localmente');

    // Trigger PDF Download and Open Document View
    const items = rows.filter(r => r.productId).map(r => ({
      code: r.code,
      description: r.description,
      priceLevel: PRICE_LEVELS.find((l) => l.value === r.priceLevel)?.label || 'Normal',
      equipmentPrice: r.equipmentPrice,
      bwCostPerCopy: r.bnServiceCost,
      bwVolume: r.bnVolume,
      colorCostPerCopy: r.colorServiceCost,
      colorVolume: r.colorVolume,
      monthlyBnService: r.monthlyBnService,
      monthlyColorService: r.monthlyColorService,
      monthlyHardware: r.monthlyHardware,
      monthlyBusiness: r.monthlyBusiness
    }));

    try {
      const reportData = {
        companyName: tenant?.name || 'Compañía Demo S.R.L.',
        clientName: selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.rnc ? `(${selectedCustomer.rnc})` : ''}` : 'Cliente Genérico',
        opportunityName: selectedOpportunity ? selectedOpportunity.name : undefined,
        items: items,
        subtotal: totals.equipmentTotal,
        tax: totals.equipmentTotal * 0.18,
        total: totals.equipmentTotal * 1.18,
        date: new Date().toLocaleDateString(),
        termsAndConditions: notes || undefined,
        mfpConfig: {
          rentalPeriodMonths: config.rentalPeriodMonths,
          businessType: config.businessType,
          annualInterestRate: config.annualInterestRate
        },
        mfpTotals: {
          equipmentTotal: totals.equipmentTotal,
          totalBnService: totals.totalBnService,
          totalColorService: totals.totalColorService,
          totalService: totals.totalService,
          monthlyHardware: totals.monthlyHardware,
          monthlyTotal: totals.monthlyTotal,
          totalContract: totals.totalContract
        }
      };

      const primaryColor = (tenant?.branding as any)?.primaryColor || '#0891b2';
      const secondaryColor = (tenant?.branding as any)?.secondaryColor || '#334155';

      // isPreview = false -> trigers doc.save() to download locally
      const blobUrl = generatePDF('MFP', reportData, { primaryColor, secondaryColor }, false);
      if (blobUrl) {
        // Open the document for the executive to see
        window.open(blobUrl as string, '_blank');
      }
    } catch (err: any) {
      toast.error('Gurdado localmente, pero ' + (err.message || 'Error al generar PDF'));
    }
  };

  const loadQuote = (quote: any) => {
    setConfig(quote.config);
    setRows(quote.rows);
    setNotes(quote.notes || '');
    setHistoryOpen(false);
    toast.success('Cotización cargada correctamente');
  };

  const handleNativePreview = () => {
    const items = rows.filter(r => r.productId).map(r => ({
      code: r.code,
      description: r.description,
      priceLevel: PRICE_LEVELS.find((l) => l.value === r.priceLevel)?.label || 'Normal',
      equipmentPrice: r.equipmentPrice,
      bwCostPerCopy: r.bnServiceCost,
      bwVolume: r.bnVolume,
      colorCostPerCopy: r.colorServiceCost,
      colorVolume: r.colorVolume,
      monthlyBnService: r.monthlyBnService,
      monthlyColorService: r.monthlyColorService,
      monthlyHardware: r.monthlyHardware,
      monthlyBusiness: r.monthlyBusiness
    }));

    if (items.length === 0) {
      toast.error('Agrega al menos un equipo MFP para generar la vista previa');
      return;
    }

    try {
      const reportData = {
        companyName: tenant?.name || 'Compañía Demo S.R.L.',
        clientName: selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.rnc ? `(${selectedCustomer.rnc})` : ''}` : 'Cliente Genérico',
        opportunityName: selectedOpportunity ? selectedOpportunity.name : undefined,
        items: items,
        subtotal: totals.equipmentTotal,
        tax: totals.equipmentTotal * 0.18,
        total: totals.equipmentTotal * 1.18,
        date: new Date().toLocaleDateString(),
        termsAndConditions: notes || undefined,
        mfpConfig: {
          rentalPeriodMonths: config.rentalPeriodMonths,
          businessType: config.businessType,
          annualInterestRate: config.annualInterestRate
        },
        mfpTotals: {
          equipmentTotal: totals.equipmentTotal,
          totalBnService: totals.totalBnService,
          totalColorService: totals.totalColorService,
          totalService: totals.totalService,
          monthlyHardware: totals.monthlyHardware,
          monthlyTotal: totals.monthlyTotal,
          totalContract: totals.totalContract
        }
      };

      const primaryColor = (tenant?.branding as any)?.primaryColor || '#0891b2';
      const secondaryColor = (tenant?.branding as any)?.secondaryColor || '#334155';

      const blobUrl = generatePDF('MFP', reportData, { primaryColor, secondaryColor }, true);
      if (blobUrl) {
        window.open(blobUrl as string, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al generar vista previa');
    }
  };

  // Generate quote
  const generateQuote = () => {
    const hasProducts = rows.some((r) => r.productId !== null);
    if (!hasProducts) {
      toast.error('Agregue al menos un producto');
      return;
    }
    if (!config.customerId) {
      toast.error('Seleccione un cliente');
      return;
    }

    if (config.opportunityId) {
      let updatedOpportunities = opportunities;

      updatedOpportunities = updatedOpportunities.map((opp: any) =>
        opp.id === config.opportunityId
          ? { ...opp, value: totals.equipmentTotal }
          : opp
      );

      localStorage.setItem('antu_opportunities', JSON.stringify(updatedOpportunities));
      setOpportunities(updatedOpportunities);

      const opp = updatedOpportunities.find(o => o.id === config.opportunityId);
      toast.success(`Cotización MFP generada y vinculada a: ${opp?.name}`);
      toast.info(`Monto de ${formatCurrency(totals.equipmentTotal, config.currency)} (Valor Total Equipos) cargado como valor estimado de la oportunidad.`);
    } else {
      toast.success('Cotización MFP generada exitosamente');
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  COTIZACIÓN MFP
                </h1>
                <p className="text-sm text-slate-500">
                  Renta y Venta de Equipos de Impresión Multifuncionales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const history = JSON.parse(localStorage.getItem('antu_quotes_history') || '[]');
                  setSavedQuotes(history.filter((q: any) => q.type === 'MFP'));
                  setHistoryOpen(true);
                }}
                className="gap-2 border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
                Mis Borradores
              </Button>
              <Separator orientation="vertical" className="h-8 mx-2" />
              {/* Business Type Toggle */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setConfig({ ...config, businessType: 'RENTA' })}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                    config.businessType === 'RENTA'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-600 hover:text-slate-800'
                  )}
                >
                  RENTA
                </button>
                <button
                  onClick={() => setConfig({ ...config, businessType: 'VENTA' })}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                    config.businessType === 'VENTA'
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:text-slate-800'
                  )}
                >
                  VENTA
                </button>
              </div>

              {/* Period Selector */}
              {config.businessType === 'RENTA' && (
                <Select
                  value={config.rentalPeriodMonths.toString()}
                  onValueChange={(value) =>
                    setConfig({ ...config, rentalPeriodMonths: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-32 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RENTAL_PERIODS.map((period) => (
                      <SelectItem key={period} value={period.toString()}>
                        {period} meses
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Currency Selector */}
              <Select
                value={config.currency}
                onValueChange={(value: Currency) =>
                  setConfig({ ...config, currency: value })
                }
              >
                <SelectTrigger className="w-24 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOP">DOP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* SECTION 1: Configuration Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                Configuración de la Cotización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Price Level */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Nivel de Precio
                  </Label>
                  <Select
                    value={config.priceLevel}
                    onValueChange={(value: PriceLevel) =>
                      setConfig({ ...config, priceLevel: value })
                    }
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label} ({level.discount > 0 ? `-${level.discount}%` : 'Sin descuento'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interest Rate */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Tasa de Interés Anual
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={config.annualInterestRate}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          annualInterestRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="border-slate-200 pr-10"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Customer Selection */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Cliente
                  </Label>
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

                {/* Opportunity Selection */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Oportunidad (Opcional)
                  </Label>
                  <SearchAutocomplete
                    options={opportunities
                      .filter(o => !config.customerId || o.customerId === config.customerId)
                      .map(o => ({
                        value: o.id,
                        label: o.name,
                        description: o.company || o.customerName,
                        icon: <Briefcase className="w-4 h-4 text-slate-400" />
                      }))}
                    value={config.opportunityId || undefined}
                    onChange={(val) => setConfig({ ...config, opportunityId: val })}
                    placeholder="Vincular oportunidad..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Business Calculator Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-cyan-600" />
                  Calculadora de Negocio
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    Modalidad: <span className="font-medium text-slate-700">{config.businessType}</span>
                  </span>
                  {config.businessType === 'RENTA' && (
                    <span className="text-slate-500">
                      Tiempo: <span className="font-medium text-slate-700">{config.rentalPeriodMonths} meses</span>
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cyan-700">
                      <th className="px-3 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Código</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white whitespace-nowrap min-w-[200px]">Descripción Item</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-white whitespace-nowrap">Nivel de Precio</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Precio Equipo</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">CxC B/N</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Volumen B/N</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">CxC Color</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Volumen Color</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Servicio B/N</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Servicio Color</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Mensualidad Hardware</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-white whitespace-nowrap">Mensualidad Negocio</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-white whitespace-nowrap w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-b border-slate-100 hover:bg-slate-50',
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        )}
                      >
                        {/* Code - Search Input */}
                        <td className="px-2 py-2">
                          <SearchAutocomplete
                            options={MOCK_PRODUCTS.map(p => ({
                              value: p.id,
                              label: p.code,
                              description: p.description,
                              icon: <Printer className="w-4 h-4 text-slate-400" />
                            }))}
                            value={row.productId || undefined}
                            onChange={(val) => {
                              const product = MOCK_PRODUCTS.find(p => p.id === val);
                              if (product) selectProductForItem(product, row.id);
                            }}
                            placeholder="Cód."
                            triggerClassName="h-8 text-xs font-mono"
                          />
                        </td>

                        {/* Description */}
                        <td className="px-2 py-2">
                          <SearchAutocomplete
                            options={MOCK_PRODUCTS.map(p => ({
                              value: p.id,
                              label: p.description,
                              description: p.code,
                              icon: <Printer className="w-4 h-4 text-slate-400" />
                            }))}
                            value={row.productId || undefined}
                            onChange={(val) => {
                              const product = MOCK_PRODUCTS.find(p => p.id === val);
                              if (product) selectProductForItem(product, row.id);
                            }}
                            placeholder="Buscar producto..."
                            triggerClassName="h-8 text-xs"
                          />
                        </td>

                        {/* Price Level */}
                        <td className="px-2 py-2 text-center">
                          {row.productId ? (
                            <Select
                              value={row.priceLevel}
                              onValueChange={(val: PriceLevel) => updateRowPriceLevel(val)}
                            >
                              <SelectTrigger className="h-8 text-xs font-medium border-slate-200" style={{ color: PRICE_LEVELS.find((l) => l.value === row.priceLevel)?.color }}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRICE_LEVELS.map((level) => (
                                  <SelectItem key={level.value} value={level.value} className="text-xs">
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Equipment Price */}
                        <td className="px-2 py-2 text-right">
                          {row.productId ? (
                            <span className="text-sm font-mono text-slate-700">
                              {formatCurrency(row.equipmentPrice, config.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* CxC B/N */}
                        <td className="px-2 py-2 text-right">
                          {row.productId ? (
                            <span className="text-sm font-mono text-slate-600">
                              {row.bnServiceCost.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Volume B/N */}
                        <td className="px-2 py-2 text-right">
                          {row.productId ? (
                            <Input
                              type="number"
                              value={row.bnVolume || ''}
                              onChange={(e) =>
                                updateVolume(row.id, 'bnVolume', parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8 text-xs border-slate-200 text-right ml-auto"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* CxC Color */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && row.colorServiceCost > 0 ? (
                            <span className="text-sm font-mono text-slate-600">
                              {row.colorServiceCost.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Volume Color */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && row.colorServiceCost > 0 ? (
                            <Input
                              type="number"
                              value={row.colorVolume || ''}
                              onChange={(e) =>
                                updateVolume(row.id, 'colorVolume', parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8 text-xs border-slate-200 text-right ml-auto"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>

                        {/* Service B/N */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && row.monthlyBnService > 0 ? (
                            <span className="text-sm font-mono text-cyan-600 font-medium">
                              {formatCurrency(row.monthlyBnService, config.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Service Color */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && row.monthlyColorService > 0 ? (
                            <span className="text-sm font-mono text-cyan-600 font-medium">
                              {formatCurrency(row.monthlyColorService, config.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Monthly Hardware */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && config.businessType === 'RENTA' && row.monthlyHardware > 0 ? (
                            <span className="text-sm font-mono text-violet-600 font-medium">
                              {formatCurrency(row.monthlyHardware, config.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Monthly Business */}
                        <td className="px-2 py-2 text-right">
                          {row.productId && row.monthlyBusiness > 0 ? (
                            <span className="text-sm font-mono text-emerald-600 font-medium">
                              {formatCurrency(row.monthlyBusiness, config.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="px-2 py-2 text-center">
                          {row.productId && (
                            <button
                              onClick={() => clearRow(row.id)}
                              className="p-1.5 rounded hover:bg-rose-100 text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

          {/* SECTION 3: Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Equipment Total */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Valor Total Equipos</p>
                <p className="text-lg font-bold text-slate-800 font-mono">
                  {formatCurrency(totals.equipmentTotal, config.currency)}
                </p>
              </CardContent>
            </Card>

            {/* B/N Service */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Servicio B/N</p>
                <p className="text-lg font-bold text-cyan-700 font-mono">
                  {formatCurrency(totals.totalBnService, config.currency)}
                </p>
              </CardContent>
            </Card>

            {/* Color Service */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Servicio Color</p>
                <p className="text-lg font-bold text-cyan-700 font-mono">
                  {formatCurrency(totals.totalColorService, config.currency)}
                </p>
              </CardContent>
            </Card>

            {/* Monthly Hardware */}
            <Card className="border-violet-200 bg-violet-50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-violet-600 mb-1">Mensualidad Hardware</p>
                <p className="text-lg font-bold text-violet-700 font-mono">
                  {config.businessType === 'RENTA'
                    ? formatCurrency(totals.monthlyHardware, config.currency)
                    : '-'}
                </p>
              </CardContent>
            </Card>

            {/* Monthly Total */}
            <Card className="border-cyan-200 bg-cyan-50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-cyan-600 mb-1">Pago Mensual Total</p>
                <p className="text-lg font-bold text-cyan-700 font-mono">
                  {formatCurrency(totals.monthlyTotal, config.currency)}
                </p>
              </CardContent>
            </Card>

            {/* Total Contract */}
            <Card className="border-cyan-600 bg-gradient-to-br from-cyan-600 to-cyan-700 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-cyan-100 mb-1">Total del Contrato</p>
                <p className="text-lg font-bold text-white font-mono">
                  {formatCurrency(totals.totalContract, config.currency)}
                </p>
                {config.businessType === 'RENTA' && (
                  <p className="text-xs text-cyan-200 mt-1">{config.rentalPeriodMonths} meses</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION 4: Quote Summary & Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quote Summary */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-600" />
                  Resumen de la Cotización
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">Período:</span>
                    <span className="text-sm font-medium text-slate-800">
                      {config.businessType === 'RENTA'
                        ? `${config.rentalPeriodMonths} meses`
                        : 'Pago único'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">Total Equipos:</span>
                    <span className="text-sm font-medium text-slate-800 font-mono">
                      {formatCurrency(totals.equipmentTotal, config.currency)}
                    </span>
                  </div>

                  <div className="px-4 py-3 bg-slate-50/50">
                    <p className="text-sm text-slate-600 mb-2">Desglose de Costos de Servicio:</p>
                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Costo del Servicio B/N:</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatCurrency(totals.totalBnService, config.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Costo del Servicio Color:</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatCurrency(totals.totalColorService, config.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">Total Servicios:</span>
                    <span className="text-sm font-medium text-cyan-600 font-mono">
                      {formatCurrency(totals.totalService, config.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">Mensualidad Hardware</span>
                    <span className="text-sm font-medium text-cyan-600 font-mono">
                      {config.businessType === 'RENTA'
                        ? formatCurrency(totals.monthlyHardware, config.currency)
                        : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3 bg-cyan-50">
                    <span className="text-sm font-medium text-slate-700">Pago Mensual:</span>
                    <span className="text-sm font-bold text-cyan-700 font-mono">
                      {formatCurrency(totals.monthlyTotal, config.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3 bg-cyan-100">
                    <span className="text-sm font-medium text-cyan-800">Total del Contrato:</span>
                    <span className="text-sm font-bold text-cyan-800 font-mono">
                      {formatCurrency(totals.totalContract, config.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-600" />
                  Notas / Condiciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Añade notas o condiciones especiales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[200px] border-slate-200 resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* SECTION 5: Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
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
                variant="outline"
                onClick={handleNativePreview}
                className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <FileOutput className="w-4 h-4" />
                Vista Previa PDF
              </Button>
              <Button
                onClick={generateQuote}
                className="gap-2 px-6 bg-cyan-600 hover:bg-cyan-700"
              >
                <FileText className="w-4 h-4" />
                Generar Cotización
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* MODALS PERSISTENTES */}
      <QuotePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={rows}
        totals={totals}
        config={config}
        customerName={selectedCustomer?.name || 'Cliente por definir'}
      />

      <QuoteHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        quotes={savedQuotes}
        onLoad={loadQuote}
      />
    </div>
  );
}

// Dummy Components for missing Modals
function QuotePreviewModal(_props: any) {
  return null;
}

function QuoteHistoryModal(_props: any) {
  return null;
}
