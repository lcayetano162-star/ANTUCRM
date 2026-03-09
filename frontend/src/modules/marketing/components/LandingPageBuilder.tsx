// ============================================
// Landing Page Builder - Constructor de Páginas de Aterrizaje
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Type,
  Image,
  FormInput,
  CheckCircle,
  Quote,
  Star,
  ArrowRight,
  Save,
  Layout,
  Palette,
  Settings,
  Monitor,
  Smartphone,
} from 'lucide-react';
import type { LandingPageStyling } from '../types';

// ============================================
// Section Types
// ============================================

interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'form' | 'text';
  content: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaUrl?: string;
    features?: string[];
    testimonials?: string[];
    description?: string;
    buttonText?: string;
    formId?: string;
    content?: string;
  };
}

const SECTION_TYPES = [
  { type: 'hero' as const, label: 'Hero', icon: Layout, description: 'Título principal con CTA' },
  { type: 'features' as const, label: 'Características', icon: CheckCircle, description: 'Lista de beneficios' },
  { type: 'testimonials' as const, label: 'Testimonios', icon: Quote, description: 'Opiniones de clientes' },
  { type: 'cta' as const, label: 'CTA', icon: ArrowRight, description: 'Llamado a la acción' },
  { type: 'form' as const, label: 'Formulario', icon: FormInput, description: 'Captura de leads' },
  { type: 'text' as const, label: 'Texto', icon: Type, description: 'Bloque de contenido' },
];

// ============================================
// Section Editor
// ============================================

interface SectionEditorProps {
  section: PageSection;
  onUpdate: (section: PageSection) => void;
  onDelete: () => void;
}

function SectionEditor({ section, onUpdate, onDelete }: SectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderEditor = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título principal</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="Transforma tu negocio hoy"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Textarea
                value={section.content.subtitle || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, subtitle: e.target.value }
                })}
                placeholder="Descripción breve de tu oferta..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Texto del botón CTA</Label>
                <Input
                  value={section.content.ctaText || ''}
                  onChange={(e) => onUpdate({ 
                    ...section, 
                    content: { ...section.content, ctaText: e.target.value }
                  })}
                  placeholder="Comenzar ahora"
                />
              </div>
              <div className="space-y-2">
                <Label>URL del botón</Label>
                <Input
                  value={section.content.ctaUrl || ''}
                  onChange={(e) => onUpdate({ 
                    ...section, 
                    content: { ...section.content, ctaUrl: e.target.value }
                  })}
                  placeholder="#form"
                />
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título de la sección</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="¿Por qué elegirnos?"
              />
            </div>
            <div className="space-y-2">
              <Label>Características (una por línea: icono|título|descripción)</Label>
              <Textarea
                value={(section.content.features || []).join('\n')}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { 
                    ...section.content, 
                    features: e.target.value.split('\n').filter(Boolean)
                  }
                })}
                placeholder="⚡|Rápido|Implementación en minutos&#10;🔒|Seguro|Encriptación de nivel bancario&#10;📊|Analytics|Reportes en tiempo real"
                rows={5}
              />
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título de la sección</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="Lo que dicen nuestros clientes"
              />
            </div>
            <div className="space-y-2">
              <Label>Testimonios (nombre|empresa|texto)</Label>
              <Textarea
                value={(section.content.testimonials || []).join('\n---\n')}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { 
                    ...section.content, 
                    testimonials: e.target.value.split('\n---\n').filter(Boolean)
                  }
                })}
                placeholder="Juan Pérez|Empresa XYZ|Excelente servicio...&#10;---&#10;María García|ABC Corp|Increíble experiencia..."
                rows={6}
              />
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título del CTA</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="¿Listo para comenzar?"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={section.content.description || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, description: e.target.value }
                })}
                placeholder="Únete a miles de empresas que confían en nosotros..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del botón</Label>
              <Input
                value={section.content.buttonText || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, buttonText: e.target.value }
                })}
                placeholder="Crear cuenta gratis"
              />
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título del formulario</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="Solicita información"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={section.content.description || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, description: e.target.value }
                })}
                placeholder="Completa el formulario y te contactaremos..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Formulario vinculado</Label>
              <Select 
                value={section.content.formId || ''} 
                onValueChange={(v) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, formId: v }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formulario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form-1">Formulario de contacto</SelectItem>
                  <SelectItem value="form-2">Solicitar demo</SelectItem>
                  <SelectItem value="form-3">Newsletter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={section.content.title || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, title: e.target.value }
                })}
                placeholder="Título de la sección"
              />
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea
                value={section.content.content || ''}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  content: { ...section.content, content: e.target.value }
                })}
                placeholder="Escribe el contenido aquí..."
                rows={8}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 capitalize">{section.type}</span>
            <Badge variant="secondary" className="text-xs">
              {SECTION_TYPES.find(t => t.type === section.type)?.label}
            </Badge>
          </div>
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
        <div className="p-4 border-t border-slate-200">
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ============================================
// Page Preview
// ============================================

function PagePreview({ 
  page, 
  styling,
  viewMode,
}: { 
  page: { title?: string; slug?: string; sections?: PageSection[] }; 
  styling: LandingPageStyling;
  viewMode: 'desktop' | 'mobile';
}) {
  const renderSection = (section: PageSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="py-16 px-8 text-center" style={{ backgroundColor: styling.primaryColor + '10' }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: styling.primaryColor }}>
              {section.content.title || 'Título principal'}
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              {section.content.subtitle || 'Subtítulo descriptivo'}
            </p>
            <button
              className="px-8 py-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: styling.primaryColor }}
            >
              {section.content.ctaText || 'Comenzar'}
            </button>
          </div>
        );

      case 'features':
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: styling.primaryColor }}>
              {section.content.title || 'Características'}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {(section.content.features || []).map((feature: string, i: number) => {
                const parts = feature.split('|');
                const icon = parts[0] || '✨';
                const title = parts[1] || 'Característica';
                const desc = parts[2] || 'Descripción';
                return (
                  <div key={i} className="text-center">
                    <div className="text-4xl mb-4">{icon}</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: styling.primaryColor }}>
                      {title}
                    </h3>
                    <p className="text-slate-600">{desc}</p>
                  </div>
                );
              })}
              {(section.content.features || []).length === 0 && (
                <div className="text-center text-slate-400 col-span-3">
                  Agrega características en el editor
                </div>
              )}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="py-16 px-8 bg-slate-50">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: styling.primaryColor }}>
              {section.content.title || 'Testimonios'}
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(section.content.testimonials || []).map((testimonial: string, i: number) => {
                const parts = testimonial.split('|');
                const name = parts[0] || 'Cliente';
                const company = parts[1] || 'Empresa';
                const text = parts[2] || 'Testimonio';
                return (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-4">&ldquo;{text}&rdquo;</p>
                    <div>
                      <p className="font-semibold" style={{ color: styling.primaryColor }}>
                        {name}
                      </p>
                      <p className="text-sm text-slate-500">{company}</p>
                    </div>
                  </div>
                );
              })}
              {(section.content.testimonials || []).length === 0 && (
                <div className="text-center text-slate-400 col-span-2">
                  Agrega testimonios en el editor
                </div>
              )}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="py-16 px-8 text-center" style={{ backgroundColor: styling.primaryColor }}>
            <h2 className="text-3xl font-bold text-white mb-4">
              {section.content.title || '¿Listo para comenzar?'}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {section.content.description || 'Descripción del llamado a la acción'}
            </p>
            <button className="px-8 py-4 rounded-lg font-semibold bg-white transition-opacity hover:opacity-90"
              style={{ color: styling.primaryColor }}
            >
              {section.content.buttonText || 'Crear cuenta'}
            </button>
          </div>
        );

      case 'form':
        return (
          <div className="py-16 px-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4" style={{ color: styling.primaryColor }}>
                {section.content.title || 'Formulario'}
              </h2>
              <p className="text-center text-slate-600 mb-8">
                {section.content.description || 'Completa el formulario'}
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  disabled
                />
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  disabled
                />
                <button
                  className="w-full py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: styling.primaryColor }}
                  disabled
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="py-16 px-8 max-w-3xl mx-auto">
            {section.content.title && (
              <h2 className="text-3xl font-bold mb-6" style={{ color: styling.primaryColor }}>
                {section.content.title}
              </h2>
            )}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 whitespace-pre-wrap">
                {section.content.content || 'Contenido de texto...'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "border-2 border-dashed border-slate-200 rounded-lg overflow-hidden bg-white",
        viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
      )}
    >
      {/* Browser Chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400 text-center">
            {page.slug ? `antucrm.com/p/${page.slug}` : 'tudominio.com/landing'}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="min-h-[400px]">
        {(page.sections || []).length === 0 ? (
          <div className="p-12 text-center">
            <Layout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Agrega secciones para construir tu página</p>
          </div>
        ) : (
          (page.sections || []).map((section, index) => (
            <div key={index}>{renderSection(section)}</div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Landing Page Builder
// ============================================

export function LandingPageBuilder() {
  const [activeTab, setActiveTab] = useState('builder');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Page state
  const [pageName, setPageName] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [sections, setSections] = useState<PageSection[]>([]);

  // Styling state
  const [styling, setStyling] = useState<LandingPageStyling>({
    primaryColor: '#8b5cf6',
    secondaryColor: '#ec4899',
    backgroundColor: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
  });

  // Add section
  const addSection = (type: PageSection['type']) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      content: {},
    };
    setSections([...sections, newSection]);
  };

  // Update section
  const updateSection = (index: number, updatedSection: PageSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  // Delete section
  const deleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  // Page data for preview
  const pageData = {
    name: pageName,
    title: pageTitle,
    slug: pageSlug,
    metaDescription,
    sections,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Landing Page Builder</h1>
          <p className="text-slate-500 mt-1">
            Crea páginas de aterrizaje de alta conversión
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Vista previa
          </Button>
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Save className="w-4 h-4 mr-2" />
            Publicar página
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="builder" className="gap-2">
            <Layout className="w-4 h-4" />
            Constructor
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="w-4 h-4" />
            Diseño
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Vista previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section Palette */}
            <div className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Secciones disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SECTION_TYPES.map((sectionType) => (
                      <button
                        key={sectionType.type}
                        onClick={() => addSection(sectionType.type)}
                        className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                      >
                        <sectionType.icon className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800">{sectionType.label}</p>
                          <p className="text-xs text-slate-500">{sectionType.description}</p>
                        </div>
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
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      placeholder="Ej: Landing Demo Marzo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título de la página</Label>
                    <Input
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="Ej: La mejor CRM para tu negocio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">/p/</span>
                      <Input
                        value={pageSlug}
                        onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder="demo-marzo"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Editor */}
            <div className="lg:col-span-2">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Secciones de la página</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <SectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={(updated) => updateSection(index, updated)}
                        onDelete={() => deleteSection(index)}
                      />
                    ))}
                    {sections.length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
                        <Plus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Haz clic en una sección para agregarla</p>
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
                <div className="space-y-2">
                  <Label>Color primario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styling.primaryColor}
                      onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded border border-slate-200"
                    />
                    <Input
                      value={styling.primaryColor}
                      onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color secundario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styling.secondaryColor}
                      onChange={(e) => setStyling({ ...styling, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded border border-slate-200"
                    />
                    <Input
                      value={styling.secondaryColor}
                      onChange={(e) => setStyling({ ...styling, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

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

            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'desktop' ? 'bg-violet-100 text-violet-600' : 'text-slate-400'
                  )}
                >
                  <Monitor className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'mobile' ? 'bg-violet-100 text-violet-600' : 'text-slate-400'
                  )}
                >
                  <Smartphone className="w-5 h-5" />
                </button>
              </div>
              <PagePreview page={pageData} styling={styling} viewMode={viewMode} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">SEO y Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta descripción</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Descripción para motores de búsqueda..."
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    Máximo 160 caracteres recomendado
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>URL canónica (opcional)</Label>
                  <Input placeholder="https://tusitio.com/landing" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Open Graph (Redes sociales)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen OG</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                    <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Arrastra una imagen o haz clic para subir</p>
                    <p className="text-xs text-slate-400 mt-1">Recomendado: 1200x630px</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setViewMode('desktop')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'desktop' ? 'bg-violet-100 text-violet-600' : 'text-slate-400'
                )}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'mobile' ? 'bg-violet-100 text-violet-600' : 'text-slate-400'
                )}
              >
                <Smartphone className="w-5 h-5" />
              </button>
            </div>
            <PagePreview page={pageData} styling={styling} viewMode={viewMode} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LandingPageBuilder;
