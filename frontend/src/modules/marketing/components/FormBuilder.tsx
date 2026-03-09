// ============================================
// Form Builder - Constructor de Formularios Web
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code,
  Copy,
  Check,
  Type,
  Mail,
  Phone,
  Building,
  List,
  CheckSquare,
  AlignLeft,
  Settings,
  Palette,
  Save,
} from 'lucide-react';
import type { WebForm, FormField, FormStyling } from '../types';

// ============================================
// Field Types
// ============================================

const FIELD_TYPES = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Teléfono', icon: Phone },
  { type: 'company', label: 'Empresa', icon: Building },
  { type: 'select', label: 'Selección', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'textarea', label: 'Texto largo', icon: AlignLeft },
] as const;

// ============================================
// Form Preview
// ============================================

function FormPreview({ 
  form, 
  styling 
}: { 
  form: Partial<WebForm>; 
  styling: FormStyling;
}) {
  return (
    <div 
      className="p-8 rounded-lg border-2 border-dashed border-slate-200"
      style={{ 
        backgroundColor: styling.backgroundColor,
        fontFamily: styling.fontFamily,
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Form Header */}
        <div className="mb-6 text-center">
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: styling.textColor }}
          >
            {form.title || 'Título del formulario'}
          </h3>
          <p style={{ color: styling.textColor, opacity: 0.7 }}>
            {form.description || 'Descripción del formulario'}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {form.fields?.map((field) => (
            <div key={field.id}>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: styling.textColor }}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={field.placeholder}
                  rows={3}
                  style={{ 
                    borderColor: styling.textColor + '30',
                    color: styling.textColor,
                  }}
                  disabled
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ 
                    borderColor: styling.textColor + '30',
                    color: styling.textColor,
                  }}
                  disabled
                >
                  <option>Seleccionar...</option>
                  {field.options?.map((opt, i) => (
                    <option key={i}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled />
                  <span style={{ color: styling.textColor }}>{field.label}</span>
                </div>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={field.placeholder}
                  style={{ 
                    borderColor: styling.textColor + '30',
                    color: styling.textColor,
                  }}
                  disabled
                />
              )}
            </div>
          ))}
          
          {form.fields?.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <p>Agrega campos para ver la vista previa</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {form.fields && form.fields.length > 0 && (
          <button
            className="w-full mt-6 py-3 px-4 rounded-md font-medium transition-opacity hover:opacity-90"
            style={{ 
              backgroundColor: styling.buttonColor,
              color: styling.buttonTextColor,
              borderRadius: styling.borderRadius,
            }}
            disabled
          >
            {form.submitButtonText || 'Enviar'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Field Editor
// ============================================

interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}

function FieldEditor({ field, onUpdate, onDelete }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{field.label || 'Campo sin nombre'}</span>
            {field.required && <Badge variant="secondary" className="text-xs">Requerido</Badge>}
          </div>
          <p className="text-xs text-slate-500">{FIELD_TYPES.find(t => t.type === field.type)?.label}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                placeholder="Ej: Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          {field.type === 'select' && (
            <div className="space-y-2">
              <Label>Opciones (una por línea)</Label>
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) => onUpdate({ ...field, options: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
              />
              <Label className="cursor-pointer">Campo requerido</Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Embed Code Dialog
// ============================================

function EmbedCodeDialog({ 
  formId, 
  open, 
  onOpenChange 
}: { 
  formId: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- Antü CRM Form Embed -->
<div id="antu-form-${formId}"></div>
<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://api.antucrm.com/forms/${formId}/embed.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;

  const iframeCode = `<iframe 
  src="https://forms.antucrm.com/${formId}" 
  width="100%" 
  height="600" 
  frameborder="0"
></iframe>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insertar en tu sitio web</DialogTitle>
          <DialogDescription>
            Copia el código y pégalo en tu sitio web
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="embed">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="embed">JavaScript Embed</TabsTrigger>
            <TabsTrigger value="iframe">Iframe</TabsTrigger>
          </TabsList>

          <TabsContent value="embed" className="space-y-4">
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm overflow-x-auto">
                {embedCode}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(embedCode)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              Recomendado: El formulario se adapta automáticamente al diseño de tu sitio.
            </p>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-4">
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm overflow-x-auto">
                {iframeCode}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(iframeCode)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              Simple pero menos flexible. El formulario está aislado de tu sitio.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Form Builder
// ============================================

export function FormBuilder() {
  const [activeTab, setActiveTab] = useState('builder');
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('Enviar');
  const [successMessage, setSuccessMessage] = useState('¡Gracias! Tu información ha sido enviada.');
  const [fields, setFields] = useState<FormField[]>([]);

  // Styling state
  const [styling, setStyling] = useState<FormStyling>({
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    buttonColor: '#8b5cf6',
    buttonTextColor: '#ffffff',
    borderRadius: 8,
    fontFamily: 'system-ui, sans-serif',
  });

  // Add field
  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: type === 'email' ? 'Correo electrónico' : 
             type === 'phone' ? 'Teléfono' :
             type === 'company' ? 'Empresa' : 'Nuevo campo',
      placeholder: '',
      required: type === 'email',
      options: type === 'select' ? ['Opción 1', 'Opción 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  // Update field
  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  // Delete field
  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Form data for preview
  const formData: Partial<WebForm> = {
    title: formTitle,
    description: formDescription,
    submitButtonText,
    successMessage,
    fields,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Builder</h1>
          <p className="text-slate-500 mt-1">
            Crea formularios de captura de leads sin código
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEmbedDialog(true)}>
            <Code className="w-4 h-4 mr-2" />
            Insertar
          </Button>
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Save className="w-4 h-4 mr-2" />
            Guardar formulario
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="builder" className="gap-2">
            <Plus className="w-4 h-4" />
            Constructor
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="w-4 h-4" />
            Diseño
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Vista previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Field Palette */}
            <div className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Campos disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPES.map((fieldType) => (
                      <button
                        key={fieldType.type}
                        onClick={() => addField(fieldType.type)}
                        className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all"
                      >
                        <fieldType.icon className="w-5 h-5 text-slate-500" />
                        <span className="text-xs text-slate-600">{fieldType.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Configuración básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre interno</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Formulario de contacto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título público</Label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ej: Contáctanos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe el propósito del formulario..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Field Editor */}
            <div className="lg:col-span-2">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Campos del formulario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        onUpdate={(updated) => updateField(index, updated)}
                        onDelete={() => deleteField(index)}
                      />
                    ))}
                    {fields.length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
                        <Plus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Haz clic en un campo para agregarlo</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Personalización visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color de fondo</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.backgroundColor}
                        onChange={(e) => setStyling({ ...styling, backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-200"
                      />
                      <Input
                        value={styling.backgroundColor}
                        onChange={(e) => setStyling({ ...styling, backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color de texto</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.textColor}
                        onChange={(e) => setStyling({ ...styling, textColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-200"
                      />
                      <Input
                        value={styling.textColor}
                        onChange={(e) => setStyling({ ...styling, textColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color del botón</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.buttonColor}
                        onChange={(e) => setStyling({ ...styling, buttonColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-200"
                      />
                      <Input
                        value={styling.buttonColor}
                        onChange={(e) => setStyling({ ...styling, buttonColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color texto del botón</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.buttonTextColor}
                        onChange={(e) => setStyling({ ...styling, buttonTextColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-200"
                      />
                      <Input
                        value={styling.buttonTextColor}
                        onChange={(e) => setStyling({ ...styling, buttonTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Radio de bordes (px)</Label>
                  <Input
                    type="number"
                    value={styling.borderRadius}
                    onChange={(e) => setStyling({ ...styling, borderRadius: parseInt(e.target.value) })}
                    min={0}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <Select 
                    value={styling.fontFamily} 
                    onValueChange={(v) => setStyling({ ...styling, fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <FormPreview form={formData} styling={styling} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Configuración del formulario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto del botón de envío</Label>
                  <Input
                    value={submitButtonText}
                    onChange={(e) => setSubmitButtonText(e.target.value)}
                    placeholder="Enviar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensaje de éxito</Label>
                  <Textarea
                    value={successMessage}
                    onChange={(e) => setSuccessMessage(e.target.value)}
                    placeholder="Mensaje mostrado después del envío..."
                    rows={3}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">Double opt-in</p>
                      <p className="text-sm text-slate-500">Confirmar email antes de agregar</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">reCAPTCHA</p>
                      <p className="text-sm text-slate-500">Protección contra spam</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">Notificaciones</p>
                      <p className="text-sm text-slate-500">Enviar email al equipo</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Redirección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL de redirección (opcional)</Label>
                  <Input placeholder="https://tusitio.com/gracias" />
                  <p className="text-xs text-slate-500">
                    Si se especifica, el usuario será redirigido después del envío
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <FormPreview form={formData} styling={styling} />
        </TabsContent>
      </Tabs>

      {/* Embed Dialog */}
      <EmbedCodeDialog
        formId="new-form"
        open={showEmbedDialog}
        onOpenChange={setShowEmbedDialog}
      />
    </div>
  );
}

export default FormBuilder;
