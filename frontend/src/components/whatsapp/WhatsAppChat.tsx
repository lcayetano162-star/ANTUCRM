// ============================================
// WHATSAPP CHAT COMPONENT
// Enterprise-grade chat interface
// ============================================

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Phone, MoreVertical, Check, CheckCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api';
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface WhatsAppMessage {
  id: string
  wa_message_id?: string
  phone_number: string
  direction: 'inbound' | 'outbound'
  message_type: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
  sender_name?: string
  media_url?: string
}

interface WhatsAppChatProps {
  phoneNumber: string
  contactId?: string
  contactName?: string
  onClose?: () => void
}

export function WhatsAppChat({ phoneNumber, contactId, contactName, onClose }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Cargar mensajes
  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 5000) // Poll cada 5 segundos
    return () => clearInterval(interval)
  }, [phoneNumber])

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      const response = await api.get('/whatsapp/messages', {
        params: { contactId, limit: 50 }
      })
      
      // Filtrar solo mensajes de este número
      const filtered = response.data.data.filter(
        (m: WhatsAppMessage) => m.phone_number === phoneNumber.replace(/\D/g, '')
      )
      
      setMessages(filtered)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await api.post('/whatsapp/send', {
        phoneNumber,
        message: newMessage,
        contactId,
      })

      setNewMessage('')
      await loadMessages()
      
      toast({
        title: 'Mensaje enviado',
        variant: 'success'
      })
    } catch (error: any) {
      toast({
        title: 'Error al enviar',
        description: error.response?.data?.error || 'Intente nuevamente',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm')
  }

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: es 
    })
  }

  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd')
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarFallback className="bg-gray-600 text-white">
              {contactName?.charAt(0) || phoneNumber.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">{contactName || phoneNumber}</h3>
            <p className="text-xs text-white/70">
              {messages.length > 0 ? 'En línea' : '...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                {format(new Date(date), 'EEEE, d MMMM', { locale: es })}
              </span>
            </div>
            
            {msgs.map((message: WhatsAppMessage, idx: number) => (
              <div
                key={message.id}
                className={cn(
                  "flex mb-2",
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] px-3 py-2 rounded-lg relative",
                    message.direction === 'outbound'
                      ? 'bg-[#DCF8C6] text-gray-800'
                      : 'bg-white text-gray-800 shadow-sm'
                  )}
                >
                  {message.direction === 'inbound' && (
                    <p className="text-xs font-medium text-[#075E54] mb-1">
                      {message.sender_name}
                    </p>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                    {message.direction === 'outbound' && (
                      getStatusIcon(message.status)
                    )}
                  </div>
                  
                  {message.status === 'failed' && (
                    <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        Error al enviar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs">Envía un mensaje para iniciar la conversación</p>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-[#F0F2F5] border-t">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
          
          <Button
            onClick={sendMessage}
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className={cn(
              "rounded-full transition-all",
              newMessage.trim() 
                ? 'bg-[#075E54] hover:bg-[#128C7E] text-white' 
                : 'bg-gray-300 text-gray-500'
            )}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
