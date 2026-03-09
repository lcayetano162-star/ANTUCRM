// ============================================
// Campaign Builder - Editor de Campañas con IA
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Wand2,
  Sparkles,
  Send,
  Eye,
  Smartphone,
  Monitor,
  Save,
  Clock,
  Users,
  Check,
  Copy,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EmailCampaign, CampaignType } from '../types';
import { generateAIContent } from '@/lib/ai';

// ============================================
// AI Subject Generator
// ============================================

interface AISubjectGeneratorProps {
  context: string;
  onSelect: (subject: string) => void;
}

function AISubjectGenerator({ context, onSelect }: AISubjectGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const generateSubjects = async () => {
    setIsGenerating(true);
    const prompt = `Genera 4 diferentes líneas de asunto (subject lines) creativos, persuasivos e irresistibles para una campaña de email marketing que trata sobre: ${context}. Devuelve SOLO una lista simple de texto (uno por línea), sin viñetas, sin números y sin texto adicional.`;
    const response = await generateAIContent(prompt, "Eres un experto copywriter de email marketing orientado a ventas.");

    if (response.error) {
      toast.error(response.error);
      setVariants([
        '🚀 Potencia tus ventas con estas estrategias probadas',
        'Descubre el secreto para cerrar más deals este mes',
        '3 tácticas que los mejores vendedores usan (y tú no)',
        '¿Tu pipeline necesita un boost? Te tenemos la solución',
      ]);
    } else {
      const generatedList = response.text
        .split('\n')
        .map(line => line.replace(/^[\s\-*0-9.)]+/, '').trim())
        .filter(line => line.length > 5)
        .slice(0, 4);

      setVariants(generatedList.length > 0 ? generatedList : [
        '🚀 Potencia tus ventas con estas estrategias probadas',
        'Descubre el secreto para cerrar más deals este mes',
        '3 tácticas que los mejores vendedores usan (y tú no)',
        '¿Tu pipeline necesita un boost? Te tenemos la solución',
      ]);
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <span className="font-medium text-slate-800">Generador de Asuntos con IA</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSubjects}
          disabled={isGenerating || !context}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generar variantes
            </>
          )}
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Selecciona la mejor opción:</p>
          {variants.map((variant, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedVariant(index);
                onSelect(variant);
              }}
              className={cn(
                'w-full p-3 text-left rounded-lg border transition-all',
                selectedVariant === index
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{variant}</span>
                {selectedVariant === index && (
                  <Check className="w-4 h-4 text-violet-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!variants.length && !isGenerating && (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Describe tu campaña y deja que la IA genere asuntos irresistibles
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Email Preview
// ============================================

interface EmailPreviewProps {
  subject: string;
  preheader: string;
  htmlContent: string;
}

function EmailPreview({ subject, preheader, htmlContent }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">Vista previa</span>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all',
              viewMode === 'desktop'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all',
              viewMode === 'mobile'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </button>
        </div>
      </div>

      <div
        className={cn(
          'border border-slate-200 rounded-lg overflow-hidden bg-slate-100',
          viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
        )}
      >
        {/* Email Client Header */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <p className="font-medium text-slate-800">Antü CRM</p>
              <p className="text-sm text-slate-500">hola@antucrm.com</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-slate-800">{subject || '(Sin asunto)'}</p>
            <p className="text-sm text-slate-400">{preheader || '...'}</p>
          </div>
        </div>

        {/* Email Body */}
        <div
          className="bg-white p-4 min-h-[300px]"
          dangerouslySetInnerHTML={{
            __html: htmlContent || '<p style="color: #94a3b8; text-align: center; padding: 40px;">El contenido del email aparecerá aquí...</p>',
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// Segment Selector
// ============================================

interface Segment {
  id: string;
  name: string;
  count: number;
  description: string;
}

const MOCK_SEGMENTS: Segment[] = [
  { id: 'all', name: 'Todos los contactos', count: 2450, description: 'Todos los leads y clientes' },
  { id: 'active', name: 'Contactos activos', count: 1890, description: 'Contactos con actividad en los últimos 90 días' },
  { id: 'customers', name: 'Clientes', count: 567, description: 'Contactos que han comprado' },
  { id: 'hot_leads', name: 'Leads calientes', count: 123, description: 'Score > 70 y actividad reciente' },
  { id: 'inactive', name: 'Inactivos', count: 560, description: 'Sin actividad en los últimos 90 días' },
];

function SegmentSelector({
  selectedSegment,
  onSelect,
}: {
  selectedSegment: string | null;
  onSelect: (segmentId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Selecciona a quién enviarás esta campaña:</p>
      {MOCK_SEGMENTS.map((segment) => (
        <button
          key={segment.id}
          onClick={() => onSelect(segment.id)}
          className={cn(
            'w-full p-4 text-left rounded-lg border transition-all',
            selectedSegment === segment.id
              ? 'border-violet-500 bg-violet-50'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{segment.name}</p>
              <p className="text-sm text-slate-500">{segment.description}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-slate-100">
                <Users className="w-3 h-3 mr-1" />
                {segment.count.toLocaleString()}
              </Badge>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Main Campaign Builder
// ============================================

interface CampaignBuilderProps {
  campaign?: Partial<EmailCampaign>;
  onSave: (campaign: Partial<EmailCampaign>) => void;
  onSend?: (campaign: Partial<EmailCampaign>) => void;
  onSchedule?: (campaign: Partial<EmailCampaign>, date: Date) => void;
}

export function CampaignBuilder({ campaign, onSave, onSend, onSchedule }: CampaignBuilderProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Form state
  const [name, setName] = useState(campaign?.name || '');
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [preheader, setPreheader] = useState(campaign?.preheader || '');
  const [htmlContent, setHtmlContent] = useState(campaign?.htmlContent || '');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType>(campaign?.type || 'newsletter');

  // AI State
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Email Templates Library
  const EMAIL_TEMPLATES = [
    {
      id: 'newsletter',
      name: 'Newsletter Corporativa',
      description: 'Diseño limpio con cabecera, imagen principal y secciones de contenido.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 12px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 20px; text-align: center;">Novedades del Mes</h1>
            <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=300&fit=crop" alt="Hero" style="width: 100%; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">¡Hola! Tenemos noticias emocionantes que compartir contigo este mes. Hemos estado trabajando duro para mejorar nuestros servicios y traer de vuelta lo mejor para ti.</p>
            <div style="margin: 25px 0; border-top: 1px solid #e2e8f0; padding-top: 25px;">
              <h2 style="color: #6366f1; font-size: 18px;">🔥 Lo más destacado</h2>
              <p style="color: #475569; line-height: 1.5;">Explora nuestras nuevas funcionalidades diseñadas para hacer tu vida empresarial mucho más sencilla.</p>
            </div>
            <a href="#" style="display: block; width: 100%; padding: 12px 0; background-color: #6366f1; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold;">Saber más</a>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>© 2026 Antü CRM. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    },
    {
      id: 'promo',
      name: 'Oferta Promocional',
      description: 'Enfoque directo en ventas con secciones de beneficios y CTA llamativo.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #e2e8f0; overflow: hidden; border-radius: 12px;">
          <div style="background-color: #8b5cf6; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡OFERTA EXCLUSIVA! 🚀</h1>
            <p style="color: #ddd6fe; font-size: 18px; margin-top: 10px;">Válido solo por las próximas 48 horas</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #334155;">Aprovecha un <strong>25% de descuento</strong> en todos nuestros planes premium usando el código:</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 2px dashed #8b5cf6; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 24px; font-bold; color: #8b5cf6;">ANTU2026</span>
            </div>
            <ul style="color: #475569; line-height: 2;">
              <li>✅ Acceso a toda la suite de IA</li>
              <li>✅ Soporte prioritario 24/7</li>
              <li>✅ Almacenamiento ilimitado</li>
            </ul>
            <a href="#" style="display: block; margin-top: 25px; background-color: #10b981; color: white; text-align: center; text-decoration: none; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 16px;">CAJEAR MI DESCUENTO</a>
          </div>
        </div>
      `
    },
    {
      id: 'welcome',
      name: 'Bienvenida Cliente',
      description: 'Mensaje cálido para nuevos clientes con pasos iniciales.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #0f172a; font-size: 26px;">¡Bienvenido a la familia! 🌟</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hola 👋,<br><br>Es un placer tenerte con nosotros. Estamos aquí para ayudarte a transformar la forma en que gestionas tu negocio.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Primeros pasos:</h3>
            <ol style="color: #64748b; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Completa tu perfil corporativo.</li>
              <li style="margin-bottom: 10px;">Importa tus primeros contactos.</li>
              <li style="margin-bottom: 10px;">Configura tu primer motor de IA.</li>
            </ol>
          </div>
          <p style="color: #475569;">Si tienes alguna duda, simplemente responde a este correo.</p>
          <p style="margin-top: 30px; font-weight: bold; color: #1e293b;">El equipo de Antü CRM</p>
        </div>
      `
    },
    {
      id: 'reengagement',
      name: 'Re-activación (Te extrañamos)',
      description: 'Diseño emocional para recuperar clientes que no han tenido actividad reciente.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 20px; background-color: #fff9f2;">
          <div style="font-size: 50px; margin-bottom: 20px;">👋</div>
          <h1 style="color: #9a3412; font-size: 28px; margin-bottom: 15px;">¡Te extrañamos por aquí!</h1>
          <p style="color: #7c2d12; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Hace un tiempo que no te vemos en la plataforma y queríamos asegurarnos de que todo esté bien. Hemos añadido muchas mejoras que te encantarán.</p>
          <div style="background-color: white; padding: 25px; border-radius: 16px; border: 1px solid #fed7aa; margin-bottom: 30px;">
            <p style="color: #c2410c; font-weight: bold; margin-bottom: 10px;">Regresa hoy y obtén:</p>
            <p style="color: #9a3412; font-size: 14px;">Actualización gratuita del motor de IA por 1 mes</p>
          </div>
          <a href="#" style="background-color: #ea580c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">VOLVER A MI PANEL</a>
        </div>
      `
    },
    {
      id: 'webinar',
      name: 'Invitación a Webinar',
      description: 'Estructura con fecha, hora clara y speaker destacado.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 30px; text-align: center; color: white;">
            <span style="background-color: #38bdf8; color: #0f172a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Evento en Vivo</span>
            <h1 style="margin-top: 15px; font-size: 24px;">IA Generativa en el CRM: El futuro de las ventas</h1>
          </div>
          <div style="padding: 30px;">
            <div style="display: flex; margin-bottom: 25px; align-items: center; border-left: 4px solid #38bdf8; padding-left: 20px;">
              <div style="margin-right: 40px;">
                <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: uppercase;">Fecha</p>
                <p style="color: #1e293b; font-weight: bold; margin: 0;">25 de Marzo, 2026</p>
              </div>
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: uppercase;">Hora</p>
                <p style="color: #1e293b; font-weight: bold; margin: 0;">10:00 AM (AST)</p>
              </div>
            </div>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">En este webinar exclusivo, aprenderás cómo automatizar tus cierres de ventas usando los nuevos modelos de lenguaje integrados.</p>
            <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <p style="color: #1e293b; font-weight: bold; margin-bottom: 10px;">Speaker Invitado:</p>
              <div style="display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #e2e8f0; margin-right: 12px;"></div>
                <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Alex Rivera</strong> <br> Head of IA en Antü Labs</p>
              </div>
            </div>
            <a href="#" style="display: block; margin-top: 30px; background-color: #38bdf8; color: #0f172a; text-align: center; text-decoration: none; padding: 15px; border-radius: 8px; font-weight: bold;">RESERVAR MI ASIENTO GRATIS</a>
          </div>
        </div>
      `
    },
    {
      id: 'feedback',
      name: 'Encuesta Satisfacción',
      description: 'Solicitud de feedback minimalista y enfocada en la experiencia.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 20px;">
          <h2 style="color: #1e293b; font-size: 22px;">¿Cómo calificarías tu experiencia ayer?</h2>
          <p style="color: #64748b; margin-bottom: 30px;">Tu opinión nos ayuda a ser mejores cada día.</p>
          <div style="margin-bottom: 30px;">
            <span style="font-size: 32px; margin: 0 5px; cursor: pointer;">⭐</span>
            <span style="font-size: 32px; margin: 0 5px; cursor: pointer;">⭐</span>
            <span style="font-size: 32px; margin: 0 5px; cursor: pointer;">⭐</span>
            <span style="font-size: 32px; margin: 0 5px; cursor: pointer;">⭐</span>
            <span style="font-size: 32px; margin: 0 5px; cursor: pointer;">⭐</span>
          </div>
          <p style="color: #475569; font-size: 14px; margin-bottom: 25px;">¿Tienes un minuto para contarnos más detalles?</p>
          <a href="#" style="color: #6366f1; text-decoration: underline; font-weight: bold;">Darnos tu opinión detallada</a>
          <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
            <p style="color: #94a3b8; font-size: 12px;">Enviado con ❤️ por el equipo de Customer Success</p>
          </div>
        </div>
      `
    },
    {
      id: 'seasonal_sale',
      name: 'Venta de Temporada',
      description: 'Diseño vibrante ideal para Black Friday, Navidad o verano.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ef4444; padding: 40px 20px; text-align: center; border-radius: 12px; color: white;">
          <h1 style="font-size: 36px; text-transform: uppercase; margin-bottom: 10px; font-weight: 900; letter-spacing: 2px;">¡GRAN VENTA DE TEMPORADA!</h1>
          <p style="font-size: 20px; font-weight: bold; margin-bottom: 30px;">Hasta 50% de descuento en toda la tienda</p>
          <div style="background-color: white; color: #ef4444; padding: 30px; border-radius: 8px; margin: 0 auto; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">Utiliza el siguiente código al finalizar tu compra:</p>
            <div style="background-color: #fef2f2; border: 2px dashed #ef4444; padding: 15px; font-size: 24px; font-weight: bold; font-family: monospace; border-radius: 6px; margin-bottom: 25px;">
              WINTER2026
            </div>
            <a href="#" style="background-color: #ef4444; color: white; display: inline-block; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">COMPRAR AHORA</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #fca5a5;">Oferta válida hasta agotar existencias. Aplican términos y condiciones.</p>
        </div>
      `
    },
    {
      id: 'product_launch',
      name: 'Lanzamiento de Producto',
      description: 'Genera expectativa y muestra las características clave de un nuevo producto.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="text-align: center; padding: 40px 20px;">
            <span style="color: #6366f1; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Nuevo Lanzamiento</span>
            <h1 style="color: #0f172a; font-size: 32px; margin: 10px 0 20px;">Conoce el nuevo Antü Analytics V2</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; max-width: 450px; margin: 0 auto 30px;">Hemos rediseñado por completo nuestra plataforma de análisis para darte insights más profundos en tiempo real con ayuda de IA.</p>
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop" alt="Dashboard Preview" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 30px;">
          </div>
          <div style="background-color: #f8fafc; padding: 30px 40px;">
            <h2 style="color: #1e293b; font-size: 20px; text-align: center; margin-bottom: 25px;">Lo que encontrarás:</h2>
            <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
              <div style="background-color: #e0e7ff; color: #4f46e5; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 5px; font-size: 16px;">Métricas Predictivas</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Anticípate a las tendencias de tu mercado antes de que sucedan.</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start;">
              <div style="background-color: #e0e7ff; color: #4f46e5; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 5px; font-size: 16px;">Reportes Automáticos</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Recibe análisis detallados directamente en tu bandeja de entrada.</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 35px;">
              <a href="#" style="background-color: #0f172a; color: white; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">EXPLORAR NUEVAS FUNCIONES</a>
            </div>
          </div>
        </div>
      `
    }
  ];

  const handleAIGenerateContent = async () => {
    if (!name && !subject) {
      toast.error('Por favor ingresa un nombre o asunto para que la IA tenga contexto');
      return;
    }

    setIsGeneratingContent(true);
    toast.info('🤖 Antü AI está redactando tu correo...');

    const prompt = `Genera el código HTML (únicamente el HTML, sin markdown ni textos explicativos como \`\`\`html) para un email de campaña de marketing profesional para Antü CRM.
Contexto de la campaña: Nombre de la campaña: "${name}", Asunto: "${subject}".
Instrucciones de diseño HTML:
1. Usa un <div> contenedor que utilice colores elegantes y profesionales.
2. Añade un header claro que resalte el propósito de la campaña.
3. El cuerpo debe usar párrafos bien separados mediante padding/margin.
4. Genera al menos un call to action <a> con background-color (#6366f1) contrastante centrado y bordes redondeados.
5. Incluye un pie de página o footer indicando las opciones para darse de baja (unsubscribe).
6. Usa estilos inline (CSS inline) para asegurar la compatibilidad con clientes de email.`;

    const response = await generateAIContent(prompt, "Eres un desarrollador experto en email marketing HTML y copywriter comercial.");

    if (response.error) {
      toast.error(response.error);
      // Fallback a un template básico en caso de error
      setHtmlContent(`<div style="font-family: Arial, sans-serif; padding: 20px;"><h1 style="color: #6366f1;">${subject || name}</h1><p>Ha ocurrido un problema al generar el contenido, por favor revisa el API key.</p></div>`);
    } else {
      const generatedHtml = response.text.replace(/```html(\n)?/ig, '').replace(/```$/g, '').trim();
      setHtmlContent(generatedHtml);
      toast.success('✨ Contenido generado exitosamente por Antü AI');
    }

    setIsGeneratingContent(false);
  };

  const handleSave = () => {
    onSave({
      name,
      subject,
      preheader,
      htmlContent,
      type: campaignType,
      segmentId: selectedSegment || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {campaign?.id ? 'Editar campaña' : 'Nueva campaña'}
          </h1>
          <p className="text-slate-500 mt-1">
            Crea y envía campañas de email con ayuda de IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar borrador
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowScheduleDialog(true)}
            disabled={!subject || !htmlContent}
          >
            <Clock className="w-4 h-4 mr-2" />
            Programar
          </Button>
          <Button
            className="bg-violet-500 hover:bg-violet-600"
            onClick={() => onSend?.({ name, subject, preheader, htmlContent, type: campaignType })}
            disabled={!subject || !htmlContent || !selectedSegment}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar ahora
          </Button>
        </div>
      </div>

      {/* Campaign Settings */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre interno</Label>
              <Input
                placeholder="Ej: Newsletter Marzo 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de campaña</Label>
              <Select value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="nurture">Nurturing</SelectItem>
                  <SelectItem value="promotional">Promocional</SelectItem>
                  <SelectItem value="transactional">Transaccional</SelectItem>
                  <SelectItem value="reengagement">Re-engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={selectedSegment || ''} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar segmento" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SEGMENTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="content" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Contenido
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-2">
            <Users className="w-4 h-4" />
            Audiencia
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Vista previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Content Editor */}
            <div className="space-y-6">
              {/* Subject Line */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Línea de asunto</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {showAIGenerator ? 'Ocultar IA' : 'Usar IA'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Escribe un asunto atractivo..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <Input
                    placeholder="Preheader (texto que aparece después del asunto)..."
                    value={preheader}
                    onChange={(e) => setPreheader(e.target.value)}
                  />

                  {showAIGenerator && (
                    <>
                      <Separator />
                      <AISubjectGenerator
                        context={name}
                        onSelect={setSubject}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Email Content */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Contenido del email</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Escribe el contenido HTML de tu email..."
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIGenerateContent}
                      disabled={isGeneratingContent}
                    >
                      {isGeneratingContent ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 text-violet-500" />
                          Generar con IA
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateDialog(true)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Plantillas
                    </Button>

                    {/* Image Upload Integration */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="email-image-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result;
                              if (imageUrl) {
                                const imgTag = `\n<img src="${imageUrl}" alt="Imagen de campaña" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />\n`;
                                setHtmlContent(prev => prev + imgTag);
                                toast.success('Imagen insertada correctamente (añadida al final del contenido)');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300"
                      >
                        <label htmlFor="email-image-upload">
                          <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" />
                          Subir Imagen
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview */}
            <div>
              <EmailPreview
                subject={subject}
                preheader={preheader}
                htmlContent={htmlContent}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Seleccionar segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <SegmentSelector
                  selectedSegment={selectedSegment}
                  onSelect={setSelectedSegment}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Resumen de audiencia</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSegment ? (
                  <div className="space-y-4">
                    {(() => {
                      const segment = MOCK_SEGMENTS.find(s => s.id === selectedSegment);
                      return segment ? (
                        <>
                          <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                            <span className="text-violet-800 font-medium">Destinatarios</span>
                            <span className="text-2xl font-bold text-violet-600">
                              {segment.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Segmento</span>
                              <span className="text-slate-800">{segment.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Descripción</span>
                              <span className="text-slate-800">{segment.description}</span>
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Selecciona un segmento para ver el resumen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <EmailPreview
            subject={subject}
            preheader={preheader}
            htmlContent={htmlContent}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar envío</DialogTitle>
            <DialogDescription>
              Selecciona cuándo quieres que se envíe esta campaña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => {
                onSchedule?.({ name, subject, preheader, htmlContent, type: campaignType }, new Date());
                setShowScheduleDialog(false);
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Programar campaña
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-violet-500" />
              Librería de Plantillas Profesionales
            </DialogTitle>
            <DialogDescription>
              Elige una base para tu campaña. Se reemplazará el contenido actual.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {EMAIL_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setHtmlContent(template.html);
                  setShowTemplateDialog(false);
                  toast.success(`Plantilla "${template.name}" cargada`);
                }}
                className="group relative flex flex-col text-left border border-slate-200 rounded-xl overflow-hidden hover:border-violet-500 transition-all bg-white shadow-sm hover:shadow-md"
              >
                <div className="h-24 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded border border-slate-200 flex flex-col p-1 gap-1 shadow-sm opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="h-2 w-3/4 bg-slate-100 rounded" />
                    <div className="h-8 w-full bg-slate-50 rounded" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-slate-800 mb-1">{template.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {template.description}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <Button variant="ghost" onClick={() => setShowTemplateDialog(false)}>
              Cerrar Galería
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CampaignBuilder;
