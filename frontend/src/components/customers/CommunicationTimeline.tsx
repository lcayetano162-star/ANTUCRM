// ============================================
// ANTU CRM - Communication Timeline Component
// Timeline de comunicaciones con análisis de sentimiento IA
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Mail,
  Users,
  MessageCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Smile,
  Meh,
  Frown,
  Target,
  Lightbulb,
  Calendar,
  Plus,
} from 'lucide-react';
import type { CommunicationEvent } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface CommunicationTimelineProps {
  events: CommunicationEvent[];
}

// ============================================
// COMPONENT
// ============================================

export function CommunicationTimeline({ events }: CommunicationTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getEventIcon = (type: CommunicationEvent['type']) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-4 h-4" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'MEETING':
        return <Users className="w-4 h-4" />;
      case 'WHATSAPP':
        return <MessageCircle className="w-4 h-4" />;
      case 'NOTE':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: CommunicationEvent['type']) => {
    switch (type) {
      case 'CALL':
        return 'bg-blue-500';
      case 'EMAIL':
        return 'bg-emerald-500';
      case 'MEETING':
        return 'bg-violet-500';
      case 'WHATSAPP':
        return 'bg-green-500';
      case 'NOTE':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getSentimentIcon = (sentiment?: CommunicationEvent['sentiment']) => {
    if (!sentiment) return null;
    switch (sentiment.overall) {
      case 'POSITIVE':
        return <Smile className="w-4 h-4 text-emerald-500" />;
      case 'NEUTRAL':
        return <Meh className="w-4 h-4 text-amber-500" />;
      case 'NEGATIVE':
        return <Frown className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment?: CommunicationEvent['sentiment']) => {
    if (!sentiment) return '';
    switch (sentiment.overall) {
      case 'POSITIVE':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'NEUTRAL':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'NEGATIVE':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No hay comunicaciones registradas</p>
        <Button size="sm" variant="outline" className="mt-3">
          <Plus className="w-4 h-4 mr-1" />
          Registrar actividad
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline Line */}
          {index < events.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-full bg-slate-200" />
          )}

          {/* Event Card */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white z-10',
              getEventColor(event.type)
            )}>
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{event.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {event.type === 'CALL' && 'Llamada'}
                    {event.type === 'EMAIL' && 'Email'}
                    {event.type === 'MEETING' && 'Reunión'}
                    {event.type === 'WHATSAPP' && 'WhatsApp'}
                    {event.type === 'NOTE' && 'Nota'}
                  </Badge>
                  {event.direction && (
                    <Badge variant="secondary" className="text-xs">
                      {event.direction === 'INBOUND' ? 'Entrante' : 'Saliente'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(event.timestamp)}, {formatTime(event.timestamp)}</span>
                </div>
              </div>

              {/* Duration */}
              {event.duration && (
                <p className="text-sm text-slate-500 mb-2">
                  Duración: {event.duration} min
                </p>
              )}

              {/* AI Analysis */}
              {event.sentiment && (
                <div className={cn(
                  'rounded-lg p-3 mb-2 border',
                  getSentimentColor(event.sentiment)
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {getSentimentIcon(event.sentiment)}
                    <span className="font-medium">
                      Análisis IA: Sentimiento {event.sentiment.overall === 'POSITIVE' ? 'POSITIVO' : event.sentiment.overall === 'NEUTRAL' ? 'NEUTRO' : 'NEGATIVO'}
                    </span>
                    <span className="text-sm opacity-70">({event.sentiment.score}%)</span>
                  </div>

                  {/* Intent */}
                  {event.sentiment.intent && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Target className="w-4 h-4" />
                      <span>Intención detectada: <strong>{event.sentiment.intent}</strong></span>
                    </div>
                  )}

                  {/* Keywords */}
                  {event.sentiment.keywords.length > 0 && (
                    <div className="flex items-start gap-2 text-sm mb-2">
                      <Lightbulb className="w-4 h-4 mt-0.5" />
                      <div>
                        <span>Palabras clave: </span>
                        <span className="font-medium">
                          {event.sentiment.keywords.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {event.sentiment.nextSteps.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <p className="text-sm font-medium mb-1">Próximo paso recomendado:</p>
                      <p className="text-sm">{event.sentiment.nextSteps[0]}</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {event.aiSummary && (
                <div className="bg-slate-50 rounded-lg p-3 mb-2">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">🤖 Resumen IA: </span>
                    {event.aiSummary}
                  </p>
                </div>
              )}

              {/* AI Insights */}
              {event.aiInsights && event.aiInsights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.aiInsights.map((insight, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {insight}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expand/Collapse */}
              {event.content && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    {expandedEvent === event.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ocultar detalles
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ver transcripción
                      </>
                    )}
                  </button>

                  {expandedEvent === event.id && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                      {event.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CommunicationTimeline;
