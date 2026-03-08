import { useState } from 'react'
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { emailsApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

// ============================================================
// Componente: EmailSender
// Formulario para enviar correos directos desde el CRM
// ============================================================

export interface EmailSenderProps {
  contactId: string
  clientId?: string
  toEmail: string
  toName?: string
  onEmailSent?: () => void
}

export default function EmailSender({
  contactId,
  clientId,
  toEmail,
  toName,
  onEmailSent
}: EmailSenderProps) {
  const { toast } = useToast()
  
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!subject.trim()) {
      toast({
        title: 'Asunto requerido',
        description: 'Por favor ingresa el asunto del correo',
        variant: 'destructive'
      })
      return
    }

    if (!body.trim()) {
      toast({
        title: 'Mensaje requerido',
        description: 'Por favor escribe el contenido del correo',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await emailsApi.send({
        contactId,
        clientId,
        toEmail,
        toName,
        subject: subject.trim(),
        bodyText: body.trim()
      })

      if (response.data.success) {
        toast({
          title: 'Correo enviado',
          description: 'El correo se envió y registró correctamente',
          variant: 'success'
        })
        
        // Limpiar formulario
        setSubject('')
        setBody('')
        
        // Notificar al padre
        onEmailSent?.()
      } else {
        toast({
          title: 'Advertencia',
          description: response.data.message || 'El correo no se pudo enviar',
          variant: 'warning'
        })
      }
    } catch (error: any) {
      console.error('Error al enviar correo:', error)
      toast({
        title: 'Error al enviar',
        description: error.response?.data?.error || 'No se pudo enviar el correo',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Destinatario (solo lectura) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Para</Label>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <span className="text-slate-500">{toName ? `${toName} <${toEmail}>` : toEmail}</span>
        </div>
      </div>

      {/* Asunto */}
      <div className="space-y-2">
        <Label htmlFor="email-subject" className="text-sm font-medium text-slate-700">
          Asunto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Escribe el asunto del correo..."
          disabled={isSubmitting}
          className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
        />
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="email-body" className="text-sm font-medium text-slate-700">
          Mensaje <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="email-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          disabled={isSubmitting}
          rows={8}
          className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100 resize-none"
        />
        <p className="text-xs text-slate-400">
          El texto se guardará limpio (sin formato HTML innecesario) para facilitar el análisis con IA.
        </p>
      </div>

      {/* Botón enviar */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !body.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Correo
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
