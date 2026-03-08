// ============================================
// EMAIL COMPOSER - Componente para enviar emails
// ============================================

import { useState, useEffect } from 'react';
import { Send, Paperclip, X, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface EmailComposerProps {
  clientId?: string;
  contactId?: string;
  opportunityId?: string;
  conversationId?: string;
  replyTo?: {
    messageId: string;
    fromEmail: string;
    subject: string;
  };
  defaultTo?: string;
  onSent?: () => void;
  onCancel?: () => void;
}

export function EmailComposer({
  clientId,
  contactId,
  opportunityId,
  conversationId,
  replyTo,
  defaultTo,
  onSent,
  onCancel
}: EmailComposerProps) {
  const [to, setTo] = useState(defaultTo || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCc, setShowCc] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/email/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    // Aquí podrías cargar el body completo del template
  };

  const generateWithAI = async () => {
    if (!body.trim()) {
      toast({ title: 'Escribe algo primero', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post('/ai/generate-email', {
        subject,
        draft: body,
        context: { clientId, opportunityId }
      });
      
      setBody(response.data.generatedText);
      toast({ title: '✓ Texto mejorado con IA', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error generando con IA', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!to.trim()) {
      toast({ title: 'Ingresa un destinatario', variant: 'destructive' });
      return;
    }
    if (!subject.trim()) {
      toast({ title: 'Ingresa un asunto', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/email/send', {
        to: to.split(',').map(e => e.trim()),
        cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
        subject,
        body_text: body,
        body_html: body.replace(/\n/g, '<br>'),
        client_id: clientId,
        contact_id: contactId,
        opportunity_id: opportunityId,
        conversation_id: conversationId,
        reply_to_message_id: replyTo?.messageId,
        track_opens: true
      });

      toast({ 
        title: '✓ Email enviado', 
        description: 'El mensaje ha sido enviado exitosamente',
        variant: 'success' 
      });
      
      onSent?.();
    } catch (error) {
      toast({ title: 'Error enviando email', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {replyTo ? 'Responder email' : 'Nuevo email'}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* To */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Para</label>
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="cliente@ejemplo.com"
          disabled={!!replyTo}
        />
      </div>

      {/* CC */}
      {showCc && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">CC</label>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="copia@ejemplo.com"
          />
        </div>
      )}

      {!showCc && (
        <button
          onClick={() => setShowCc(true)}
          className="text-sm text-[#128C7E] hover:underline"
        >
          + Agregar CC
        </button>
      )}

      {/* Subject */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Asunto</label>
          
          {/* Templates */}
          {templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm text-[#128C7E] flex items-center gap-1">
                  Plantillas <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {templates.map((template) => (
                  <DropdownMenuItem 
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto del email"
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Mensaje</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateWithAI}
            disabled={isGenerating}
            className="text-purple-600"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Mejorar con IA
              </>
            )}
          </Button>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu mensaje..."
          rows={8}
          className="resize-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Adjuntar archivo">
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={sendEmail} 
            disabled={isLoading}
            className="bg-[#128C7E] hover:bg-[#075E54]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailComposer;
