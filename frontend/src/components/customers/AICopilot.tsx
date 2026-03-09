// ============================================
// ANTU CRM - AI Copilot Component
// Chatbot asistente del vendedor con IA
// ============================================

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Mail,
  Phone,
  FileText,
  Search,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CopilotMessage, CopilotContext } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface AICopilotProps {
  messages: CopilotMessage[];
  context?: CopilotContext;
  onSendMessage: (message: string, context?: CopilotContext) => void;
  onClear: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function AICopilot({ messages, context, onSendMessage, onClear }: AICopilotProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input, context);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = [
    { icon: Mail, label: 'Redactar email', prompt: 'Redacta un email de seguimiento' },
    { icon: FileText, label: 'Analizar interacción', prompt: 'Analiza la última interacción' },
    { icon: Phone, label: 'Preparar llamada', prompt: 'Prepara un resumen para llamada de cierre' },
    { icon: Search, label: 'Investigar competencia', prompt: 'Investiga la competencia activa' },
  ];

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[500px] overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-cyan-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Copiloto ANTÜ</h3>
            <p className="text-xs text-slate-500">Asistente IA del Vendedor</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-slate-500">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-violet-600" />
              </div>
              <h4 className="font-medium text-slate-700 mb-2">
                {context?.customerName
                  ? `¿En qué puedo ayudarte con ${context.customerName}?`
                  : '¿En qué puedo ayudarte?'}
              </h4>
              <p className="text-sm text-slate-500">
                Estoy aquí para asistirte con análisis, redacción y estrategias de venta.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Sugerencias rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    onClick={() => {
                      setInput(suggestion.prompt);
                      onSendMessage(suggestion.prompt, context);
                    }}
                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                  >
                    <suggestion.icon className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm text-slate-700">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user'
                      ? 'bg-cyan-100'
                      : 'bg-gradient-to-br from-violet-500 to-cyan-500'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-cyan-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3',
                    message.role === 'user'
                      ? 'bg-cyan-500 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div
                    className={cn(
                      'text-xs mt-1',
                      message.role === 'user' ? 'text-cyan-100' : 'text-slate-400'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </div>

                  {/* Suggestions */}
                  {message.role === 'assistant' && message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => onSendMessage(suggestion, context)}
                          className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-full hover:bg-slate-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {message.role === 'assistant' && message.actions && (
                    <div className="flex gap-2 mt-3">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => toast.success(`${action.label} - Acción ejecutada`)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 shrink-0 bg-white z-10 w-full mt-auto">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          El Copiloto puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}

export default AICopilot;
