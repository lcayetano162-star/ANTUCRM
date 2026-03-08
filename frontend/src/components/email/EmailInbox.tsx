// ============================================
// EMAIL INBOX - Lista de conversaciones
// ============================================

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  MailOpen,
  Sparkles,
  AlertCircle,
  Clock,
  User,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDistanceToNow, formatDate } from '@/lib/utils';

interface Conversation {
  id: string;
  subject: string;
  status: string;
  priority: string;
  ai_summary?: string;
  ai_sentiment?: string;
  ai_priority_score?: number;
  client_name?: string;
  client_email?: string;
  client_company?: string;
  assigned_name?: string;
  message_count: number;
  unread_count: number;
  last_message_at: string;
  last_message_preview?: string;
}

interface EmailInboxProps {
  onSelectConversation?: (conversation: Conversation) => void;
  onCompose?: () => void;
}

export function EmailInbox({ onSelectConversation, onCompose }: EmailInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 60000); // Refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = conversations;

    // Filtro por tab
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(c => c.unread_count > 0);
        break;
      case 'ai-priority':
        filtered = filtered.filter(c => (c.ai_priority_score || 0) > 70);
        break;
      case 'closed':
        filtered = filtered.filter(c => c.status === 'closed');
        break;
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(query) ||
        c.client_name?.toLowerCase().includes(query) ||
        c.client_email?.toLowerCase().includes(query) ||
        c.ai_summary?.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  }, [conversations, activeTab, searchQuery]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/email/conversations', {
        params: { status: activeTab === 'closed' ? 'closed' : 'active' }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-red-100 text-red-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😠';
      default: return '😐';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128C7E]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Bandeja de Entrada</h2>
          <Button onClick={onCompose} className="bg-[#128C7E] hover:bg-[#075E54]">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todas
              {conversations.length > 0 && (
                <span className="ml-1 text-xs">({conversations.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Sin leer
              {conversations.filter(c => c.unread_count > 0).length > 0 && (
                <span className="ml-1 text-xs">
                  ({conversations.filter(c => c.unread_count > 0).length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai-priority">
              <Sparkles className="w-3 h-3 mr-1" />
              Prioridad IA
            </TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Mail className="w-12 h-12 mb-4 opacity-50" />
            <p>No hay conversaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation?.(conversation)}
                className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Avatar */}
                  <div className="relative">
                    {conversation.unread_count > 0 ? (
                      <Mail className="w-5 h-5 text-[#128C7E]" />
                    ) : (
                      <MailOpen className="w-5 h-5 text-gray-400" />
                    )}
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`truncate ${conversation.unread_count > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {conversation.client_name || conversation.client_email}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {conversation.last_message_at && formatDistanceToNow(new Date(conversation.last_message_at))}
                      </span>
                    </div>

                    <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {conversation.subject}
                    </p>

                    {/* AI Summary or Preview */}
                    {conversation.ai_summary ? (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {conversation.ai_summary.substring(0, 80)}...
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {conversation.last_message_preview}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      {conversation.ai_priority_score && conversation.ai_priority_score >= 70 && (
                        <Badge className={getPriorityColor(conversation.ai_priority_score)}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Prioridad {conversation.ai_priority_score}
                        </Badge>
                      )}
                      
                      {conversation.ai_sentiment && (
                        <Badge variant="outline" className="text-xs">
                          {getSentimentEmoji(conversation.ai_sentiment)} {conversation.ai_sentiment}
                        </Badge>
                      )}
                      
                      <Badge variant="secondary" className="text-xs">
                        {conversation.message_count} mensajes
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailInbox;
