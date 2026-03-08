import { useEffect, useState } from 'react'
import { Mail, Clock, AlertCircle, ChevronDown, ChevronUp, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { emailsApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatRelativeTime } from '@/lib/utils'

// ============================================================
// Componente: EmailHistory
// Muestra el historial de correos enviados a un contacto
// ============================================================

export interface Email {
  id: string
  toEmail: string
  toName?: string
  fromEmail: string
  fromName?: string
  subject: string
  bodyText: string
  status: 'sent' | 'failed' | 'pending'
  errorMessage?: string
  sentAt: string
  senderFirstName?: string
  senderLastName?: string
}

export interface EmailHistoryProps {
  contactId: string
  refreshTrigger?: number
}

export default function EmailHistory({ contactId, refreshTrigger }: EmailHistoryProps) {
  const { toast } = useToast()
  
  const [emails, setEmails] = useState<Email[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)

  const loadEmails = async () => {
    try {
      setIsLoading(true)
      const response = await emailsApi.getByContact(contactId, { limit: 20 })
      setEmails(Array.isArray(response.data) ? response.data : (response.data?.emails || response.data?.data?.emails || []))
    } catch (error: any) {
      console.error('Error al cargar correos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los correos enviados',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [contactId, refreshTrigger])

  const toggleExpand = (emailId: string) => {
    setExpandedEmail(expandedEmail === emailId ? null : emailId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-rose-50 text-rose-600 border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Fallido
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-3 border-cyan-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 text-sm">No hay correos enviados aún</p>
        <p className="text-slate-400 text-xs mt-1">
          Los correos que envíes aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <div
          key={email.id}
          className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:border-slate-300 transition-colors"
        >
          {/* Header del correo */}
          <div
            className="flex items-center justify-between p-3 cursor-pointer bg-slate-50/50"
            onClick={() => toggleExpand(email.id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {email.subject}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {email.senderFirstName} {email.senderLastName}
                  </span>
                  <span>•</span>
                  <span>{formatRelativeTime(email.sentAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(email.status)}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {expandedEmail === email.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Contenido expandido */}
          {expandedEmail === email.id && (
            <div className="p-4 border-t border-slate-100">
              {/* Metadatos */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="font-medium">Para:</span> {email.toName || email.toEmail}
                </div>
                <div>
                  <span className="font-medium">De:</span> {email.fromName || email.fromEmail}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {formatDate(email.sentAt)}
                </div>
              </div>

              {/* Cuerpo del mensaje */}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                  {email.bodyText}
                </div>
              </div>

              {/* Mensaje de error si falló */}
              {email.status === 'failed' && email.errorMessage && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Error: {email.errorMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
