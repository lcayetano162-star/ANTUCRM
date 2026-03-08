// ============================================
// EMAIL CONVERSATION - Vista de thread completo
// ============================================

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Reply, 
  MoreVertical, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDateTime, formatDistanceToNow } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { EmailComposer } from './EmailComposer';

interface EmailMessage {
  id: string;
  from_email: string;
  from_name: string;
  to_emails: string[];
  subject: string;
  body_text: string;
  body_html: string;
  direction: 'inbound' | 'outbound';
  status: string;
  is_read: boolean;
  open_count: number;
  created_at: string;
  sender_name?: string;
  ai_analysis?: {
    sentiment?: { label: string; score: number };
  };
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  priority: string;
  ai_summary?: string;
  ai_sentiment?: string;
  ai_intent?: string;
  client_name?: string;
  client_email?: string;
  assigned_name?: string;
  unread_count: number;
}

interface EmailConversationProps {
  conversationId: string;
  onBack?: () => void;
}

export function EmailConversation({ conversationId, onBack }: EmailConversationProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [replyingTo, setReplyingTo] = useState<EmailMessage | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    const interval = setInterval(loadConversation, 30000); // Refresh cada 30s
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const response = await api.get(`/email/conversations/${conversationId}`);
      setConversation(response.data.conversation);
      setMessages(response.data.messages);
    } catch (error) {
      toast({ title: 'Error cargando conversación', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.post(`/email/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const closeConversation = async () => {
    try {
      await api.patch(`/email/conversations/${conversationId}/close`);
      toast({ title: 'Conversación cerrada', variant: 'success' });
      onBack?.();
    } catch (error) {
      toast({ title: 'Error cerrando conversación', variant: 'destructive' });
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700';
      case 'negative': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDirectionStyles = (direction: string) => {
    return direction === 'outbound'
      ? 'ml-auto bg-[#128C7E] text-white'
      : 'mr-auto bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128C7E]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>Conversación no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="font-semibold truncate max-w-md">
              {conversation.subject}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{conversation.client_name}</span>
              <span>•</span>
              <span>{conversation.client_email}</span>
              {conversation.assigned_name && (
                <>
                  <span>•</span>
                  <span>Asignado: {conversation.assigned_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI Insights Button */}
          {conversation.ai_summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="text-purple-600"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              IA
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComposer(true)}
          >
            <Reply className="w-4 h-4 mr-1" />
            Responder
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={closeConversation}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Cerrar
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && conversation.ai_summary && (
        <div className="bg-purple-50 p-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Análisis de IA
              </h4>
              <p className="text-sm text-purple-700 mt-1">{conversation.ai_summary}</p>
              <div className="flex items-center gap-2 mt-2">
                {conversation.ai_sentiment && (
                  <Badge className={getSentimentColor(conversation.ai_sentiment)}>
                    Sentimiento: {conversation.ai_sentiment}
                  </Badge>
                )}
                {conversation.ai_intent && (
                  <Badge variant="outline">
                    Intención: {conversation.ai_intent}
                  </Badge>
                )}
              </div>
            </div>
            <button onClick={() => setShowAIInsights(false)}>
              <X className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.direction === 'outbound' ? 'order-2' : 'order-1'}`}>
              {/* Avatar para inbound */}
              {message.direction === 'inbound' && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {message.from_name?.[0] || message.from_email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">{message.from_name || message.from_email}</span>
                </div>
              )}
              
              {/* Message bubble */}
              <Card className={`${getDirectionStyles(message.direction)} border-0`}>
                <CardContent className="p-3">
                  {/* AI Sentiment indicator for inbound */}
                  {message.direction === 'inbound' && message.ai_analysis?.sentiment && (
                    <div className={`inline-block w-2 h-2 rounded-full mb-2 ${
                      message.ai_analysis.sentiment.label === 'positive' ? 'bg-green-400' :
                      message.ai_analysis.sentiment.label === 'negative' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`} />
                  )}
                  
                  <div 
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(message.body_html || message.body_text.replace(/\n/g, '<br>'))
                    }}
                  />
                  
                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <span>{formatDateTime(message.created_at)}</span>
                    {message.direction === 'outbound' && (
                      <>
                        {message.open_count > 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Abierto {message.open_count}x
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Enviado
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Reply button for inbound */}
              {message.direction === 'inbound' && (
                <button
                  onClick={() => {
                    setReplyingTo(message);
                    setShowComposer(true);
                  }}
                  className="text-xs text-[#128C7E] mt-1 hover:underline"
                >
                  Responder
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="border-t p-4 bg-white">
          <EmailComposer
            conversationId={conversationId}
            replyTo={replyingTo ? {
              messageId: replyingTo.id,
              fromEmail: replyingTo.from_email,
              subject: conversation.subject
            } : undefined}
            onSent={() => {
              setShowComposer(false);
              setReplyingTo(null);
              loadConversation();
            }}
            onCancel={() => {
              setShowComposer(false);
              setReplyingTo(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default EmailConversation;
