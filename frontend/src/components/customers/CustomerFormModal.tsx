// ============================================
// ANTU CRM - Customer Form Modal (Horizontal Layout)
// Modal horizontal de 3 columnas para máxima eficiencia
// ============================================

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Users,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  Linkedin,
  MessageCircle,
  Flag,
  CreditCard,
} from 'lucide-react';
import type { Customer, CustomerType, CustomerSize } from '@/types/customer';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  customer?: Customer | null;
}

// ============================================
// COMPONENT
// ============================================

export function CustomerFormModal({ isOpen, onClose, onSave, customer }: CustomerFormModalProps) {
  const isEditing = !!customer;
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    legalName: '',
    rnc: '',
    type: 'COMPANY',
    status: 'ACTIVE',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: 'República Dominicana',
    industry: '',
    size: 'MEDIUM',
    employeeCount: undefined,
    annualRevenue: undefined,
    notes: '',
    tags: [],
    contacts: [],
    creditLine: 0,
    creditLineCurrency: 'DOP',
    creditLineStatus: 'NONE',
  } as any);

  // Separate states for fields not directly in Customer type or managed specifically
  const [extraFields, setExtraFields] = useState({
    idType: 'RNC',
    contactName: '',
    contactPosition: '',
    contactWhatsApp: '',
    linkedin: '',
    province: '',
    postalCode: '',
    isPrimary: true
  });

  // Credit request state
  const [requestCredit, setRequestCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [sendDocuments, setSendDocuments] = useState(true);

  // Reserved state for future features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_tagInput, _setTagInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingContact, _setEditingContact] = useState<Partial<{ firstName: string; lastName: string; email: string; phone: string; position: string; isPrimary: boolean; isDecisionMaker: boolean }> | null>(null);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load customer data when editing
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        legalName: customer.legalName || '',
        rnc: customer.rnc || '',
        type: customer.type,
        status: customer.status,
        email: customer.email,
        phone: customer.phone,
        website: customer.website || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country,
        industry: customer.industry || '',
        size: customer.size || 'MEDIUM',
        employeeCount: customer.employeeCount,
        annualRevenue: customer.annualRevenue,
        notes: customer.notes || '',
        tags: customer.tags || [],
        contacts: customer.contacts || [],
        creditLine: customer.creditLine || 0,
        creditLineCurrency: customer.creditLineCurrency || 'DOP',
        creditLineStatus: customer.creditLineStatus || 'NONE',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        rnc: '',
        type: 'COMPANY',
        status: 'ACTIVE',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        country: 'República Dominicana',
        industry: '',
        size: 'MEDIUM',
        employeeCount: undefined,
        annualRevenue: undefined,
        notes: '',
        tags: [],
        contacts: [],
        creditLine: 0,
        creditLineCurrency: 'DOP',
        creditLineStatus: 'NONE',
      });
    }
    setCurrentStep(1);
  }, [customer, isOpen]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name?.trim()) {
      toast.error('El nombre del cliente es requerido');
      if (isMobile) setCurrentStep(1);
      return;
    }
    if (!formData.email?.trim()) {
      toast.error('El email es requerido');
      if (isMobile) setCurrentStep(3);
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('El teléfono es requerido');
      if (isMobile) setCurrentStep(3);
      return;
    }

    const primaryContact = {
      id: `CON-${Date.now()}`,
      customerId: '', // Will be assigned by backend
      firstName: extraFields.contactName.split(' ')[0] || '',
      lastName: extraFields.contactName.split(' ').slice(1).join(' ') || '',
      email: formData.email || '',
      phone: formData.phone || '',
      position: extraFields.contactPosition,
      isPrimary: extraFields.isPrimary,
      isDecisionMaker: true,
      createdAt: new Date(),
    };

    // Add credit request data if applicable
    const finalData = {
      ...formData,
      contacts: [primaryContact],
      creditLineStatus: (requestCredit ? 'PENDING' : 'NONE') as 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE',
      creditLine: requestCredit ? Number(creditAmount) || 0 : 0,
      creditRequestData: requestCredit ? {
        amount: Number(creditAmount),
        reason: creditReason,
        sendDocuments,
      } : undefined,
    };

    onSave(finalData);

    if (requestCredit) {
      toast.success('Cliente creado y solicitud de crédito enviada a Cuentas por Cobrar');
    } else {
      toast.success('Cliente creado exitosamente');
    }

    onClose();
  };


  // Industries list
  const industries = [
    'Tecnología',
    'Financiero',
    'Salud',
    'Educación',
    'Construcción',
    'Manufactura',
    'Retail',
    'Turismo',
    'Gobierno',
    'Otros',
  ];

  // Cities list (RD)
  const cities = [
    'Santo Domingo',
    'Santiago',
    'Punta Cana',
    'Puerto Plata',
    'La Romana',
    'San Pedro de Macorís',
    'La Vega',
    'San Cristóbal',
    'Barahona',
    'Higüey',
  ];

  // Provinces list
  const provinces = [
    'Distrito Nacional',
    'Santiago',
    'La Altagracia',
    'La Romana',
    'San Pedro de Macorís',
    'Puerto Plata',
    'Duarte',
    'La Vega',
    'María Trinidad Sánchez',
    'Sánchez Ramírez',
  ];

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name?.trim() && formData.rnc?.trim();
      case 2:
        return formData.industry && formData.size;
      case 3:
        return formData.email?.trim() && formData.phone?.trim();
      default:
        return true;
    }
  };

  // Render step indicator for mobile
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <button
            type="button"
            onClick={() => isStepValid(step - 1) && setCurrentStep(step)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              currentStep === step
                ? 'bg-indigo-600 text-white'
                : currentStep > step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
            )}
          >
            {currentStep > step ? <Check className="w-4 h-4" /> : step}
          </button>
          {step < 3 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-1',
                currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Desktop Layout - 3 Columns Side by Side
  const renderDesktopLayout = () => (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
      {/* Column 1: Identity Fiscal */}
      <div className="space-y-4" style={{ minWidth: '320px' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Flag className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">IDENTIDAD FISCAL</h3>
        </div>

        <div className="space-y-4">
          {/* Country */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              País <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
            >
              <SelectTrigger className="h-11">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇩🇴</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="República Dominicana">
                  <div className="flex items-center gap-2">
                    <span>🇩🇴</span>
                    <span>República Dominicana</span>
                  </div>
                </SelectItem>
                <SelectItem value="México">
                  <div className="flex items-center gap-2">
                    <span>🇲🇽</span>
                    <span>México</span>
                  </div>
                </SelectItem>
                <SelectItem value="Colombia">
                  <div className="flex items-center gap-2">
                    <span>🇨🇴</span>
                    <span>Colombia</span>
                  </div>
                </SelectItem>
                <SelectItem value="Estados Unidos">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>Estados Unidos</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ID Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Tipo ID <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={extraFields.idType}
              onValueChange={(value) => setExtraFields(prev => ({ ...prev, idType: value }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RNC">RNC</SelectItem>
                <SelectItem value="Cédula">Cédula</SelectItem>
                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RNC */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Número ID <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                value={formData.rnc}
                onChange={(e) => setFormData(prev => ({ ...prev, rnc: e.target.value }))}
                placeholder="101-12345-6"
                className="h-11"
              />
            </div>
          </div>

          {/* Legal Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Razón Social
            </Label>
            <Input
              value={formData.legalName}
              onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
              placeholder="CORPORACIÓN DOMINICANA SRL"
              className="h-11"
            />
          </div>

          {/* Commercial Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Nombre Comercial <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="CORDOMIMP"
              className="h-11"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CustomerType }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY">Empresa</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Customer['status'] }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="PROSPECT">Prospecto</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Business Data */}
      <div className="space-y-4" style={{ minWidth: '320px' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">DATOS EMPRESARIALES</h3>
        </div>

        <div className="space-y-4">
          {/* Industry */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Industria <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Tamaño <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.size}
              onValueChange={(value) => setFormData(prev => ({ ...prev, size: value as CustomerSize }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMALL">Pequeña (1-50)</SelectItem>
                <SelectItem value="MEDIUM">Mediana (51-250)</SelectItem>
                <SelectItem value="LARGE">Grande (251-1000)</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise (1000+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Count */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Empleados</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="number"
                value={formData.employeeCount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || undefined }))}
                placeholder="75"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* Annual Revenue */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Ingresos Anuales</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="number"
                value={formData.annualRevenue || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, annualRevenue: parseInt(e.target.value) || undefined }))}
                placeholder="45000000"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Sitio Web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="www.empresa.com.do"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={extraFields.linkedin}
                onChange={(e) => setExtraFields(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="linkedin.com/company/empresa"
                className="h-11 pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Contact */}
      <div className="space-y-4" style={{ minWidth: '320px' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <User className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">CONTACTO PRINCIPAL</h3>
        </div>

        <div className="space-y-4">
          {/* Contact Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Nombre Completo <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={extraFields.contactName}
              onChange={(e) => setExtraFields(prev => ({ ...prev, contactName: e.target.value }))}
              placeholder="Juan Pérez"
              className="h-11"
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Cargo <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={extraFields.contactPosition}
              onChange={(e) => setExtraFields(prev => ({ ...prev, contactPosition: e.target.value }))}
              placeholder="Gerente de TI"
              className="h-11"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Email <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="juan.perez@empresa.com"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Teléfono <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (809) 555-0123"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase">WhatsApp</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={extraFields.contactWhatsApp}
                onChange={(e) => setExtraFields(prev => ({ ...prev, contactWhatsApp: e.target.value }))}
                placeholder="+1 (809) 555-0456 (opcional)"
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* Is Primary */}
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={extraFields.isPrimary}
              onChange={(e) => setExtraFields(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Contacto principal</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Mobile Step 1: Identity
  const renderMobileStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Flag className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="font-semibold text-slate-800">Identidad Fiscal</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            País <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
          >
            <SelectTrigger className="h-11">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇩🇴</span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="República Dominicana">
                <div className="flex items-center gap-2">
                  <span>🇩🇴</span>
                  <span>República Dominicana</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Tipo ID <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={extraFields.idType}
            onValueChange={(value) => setExtraFields(prev => ({ ...prev, idType: value }))}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RNC">RNC</SelectItem>
              <SelectItem value="Cédula">Cédula</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Número ID <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              value={formData.rnc}
              onChange={(e) => setFormData(prev => ({ ...prev, rnc: e.target.value }))}
              placeholder="101-12345-6"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Razón Social
          </Label>
          <Input
            value={formData.legalName}
            onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
            placeholder="CORPORACIÓN DOMINICANA SRL"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Nombre Comercial <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="CORDOMIMP"
            className="h-11"
          />
        </div>
      </div>
    </div>
  );

  // Mobile Step 2: Business
  const renderMobileStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-slate-800">Datos Empresariales</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Industria <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Tamaño <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.size}
            onValueChange={(value) => setFormData(prev => ({ ...prev, size: value as CustomerSize }))}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMALL">Pequeña (1-50)</SelectItem>
              <SelectItem value="MEDIUM">Mediana (51-250)</SelectItem>
              <SelectItem value="LARGE">Grande (251-1000)</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise (1000+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Empleados</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="number"
              value={formData.employeeCount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || undefined }))}
              placeholder="75"
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">LinkedIn</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={extraFields.linkedin}
              onChange={(e) => setExtraFields(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="linkedin.com/company/empresa"
              className="h-11 pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Step 3: Contact
  const renderMobileStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <User className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="font-semibold text-slate-800">Contacto Principal</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Nombre Completo <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={extraFields.contactName}
            onChange={(e) => setExtraFields(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Juan Pérez"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Cargo <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={extraFields.contactPosition}
            onChange={(e) => setExtraFields(prev => ({ ...prev, contactPosition: e.target.value }))}
            placeholder="Gerente de TI"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Email <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="juan.perez@empresa.com"
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">
            Teléfono <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (809) 555-0123"
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase">WhatsApp</Label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={extraFields.contactWhatsApp}
              onChange={(e) => setExtraFields(prev => ({ ...prev, contactWhatsApp: e.target.value }))}
              placeholder="+1 (809) 555-0456 (opcional)"
              className="h-11 pl-10"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={extraFields.isPrimary}
            onChange={(e) => setExtraFields(prev => ({ ...prev, isPrimary: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
          />
          <span className="text-sm text-slate-700">Contacto principal</span>
        </label>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1200px] !w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        {/* Header Frictionless */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Gestión de Clientes</p>
              <DialogTitle className="font-bold text-slate-800 text-lg m-0 flex items-center gap-2">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                <span className="text-xs text-slate-400 font-normal">
                  {formData.type === 'COMPANY' ? '| Empresa' : '| Individual'}
                  {formData.rnc && ` | RNC: ${formData.rnc}`}
                </span>
              </DialogTitle>
            </div>
          </div>

          {isMobile && (
            <Badge variant="outline" className="text-xs bg-white shadow-sm border-slate-200">
              Paso {currentStep} de 3
            </Badge>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {isMobile ? (
                <>
                  {renderStepIndicator()}
                  {currentStep === 1 && renderMobileStep1()}
                  {currentStep === 2 && renderMobileStep2()}
                  {currentStep === 3 && renderMobileStep3()}
                </>
              ) : (
                renderDesktopLayout()
              )}

              {/* Credit Request Section - Full Width */}
              {!isMobile && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">SOLICITUD DE CRÉDITO</h3>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="radio"
                        id="credit-yes"
                        name="requestCredit"
                        checked={requestCredit}
                        onChange={() => setRequestCredit(true)}
                        className="mt-1 w-4 h-4 text-indigo-600"
                      />
                      <div className="flex-1">
                        <Label htmlFor="credit-yes" className="font-medium cursor-pointer">
                          SÍ, solicitar evaluación de crédito
                        </Label>
                        {requestCredit && (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-slate-500">Monto estimado necesario (DOP)</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <Input
                                    type="number"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                    placeholder="500000"
                                    className="h-10 pl-10"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500">Motivo estimado</Label>
                                <Select value={creditReason} onValueChange={setCreditReason}>
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="renovacion">Renovación de equipos</SelectItem>
                                    <SelectItem value="expansion">Expansión operaciones</SelectItem>
                                    <SelectItem value="nuevos">Nuevos proyectos</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sendDocuments}
                                onChange={(e) => setSendDocuments(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                              />
                              <span className="text-sm text-slate-600">
                                Enviar solicitud de documentación automáticamente (RNC actualizado, estados financieros)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                      <input
                        type="radio"
                        id="credit-no"
                        name="requestCredit"
                        checked={!requestCredit}
                        onChange={() => setRequestCredit(false)}
                        className="mt-1 w-4 h-4 text-indigo-600"
                      />
                      <Label htmlFor="credit-no" className="cursor-pointer">
                        NO, cliente pagará contado
                        <span className="block text-sm text-slate-500 font-normal">
                          (Puede solicitar crédito más adelante desde la ficha del cliente)
                        </span>
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Section - Full Width */}
              {!isMobile && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">DIRECCIÓN FISCAL</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Calle y Número <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Av. Winston Churchill #456, Torre Empresarial"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Ciudad <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Provincia/Estado <span className="text-rose-500">*</span>
                      </Label>
                      <Select>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map(prov => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Código Postal
                      </Label>
                      <Input placeholder="10104" className="h-11" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mt-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">Misma dirección para envíos y facturación</span>
                  </label>
                </div>
              )}

              {/* Mobile Address */}
              {isMobile && currentStep === 3 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Dirección</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Calle y Número <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Av. Winston Churchill #456"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">
                        Ciudad <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer Frictionless */}
          <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
            {isMobile ? (
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="font-semibold text-slate-500 hover:text-slate-700 h-11 px-6 flex-1"
                >
                  Cancelar
                </Button>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="h-11 px-6 flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!isStepValid(currentStep)}
                    className="bg-teal-400 hover:bg-teal-500 text-white font-bold h-11 px-6 shadow-lg shadow-teal-400/30 transition-all flex-1"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-teal-400 hover:bg-teal-500 text-white font-bold h-11 px-6 shadow-lg shadow-teal-400/30 transition-all flex items-center justify-center gap-2 flex-1"
                  >
                    {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="font-semibold text-slate-500 hover:text-slate-700 h-11 px-8 min-w-[160px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-400 hover:bg-teal-500 text-white font-bold min-w-[160px] shadow-lg shadow-teal-400/30 transition-all flex items-center gap-2 h-11 rounded-lg px-8 py-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CustomerFormModal;
