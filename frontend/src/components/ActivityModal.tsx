"use client"

import { useState } from 'react'
import { 
  Phone, 
  MapPin, 
  Mail, 
  MessageCircle, 
  FileText,
  Clock,
  Send,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  HorizontalDialog, 
  HorizontalDialogContent, 
  HorizontalDialogHeader, 
  HorizontalDialogTitle, 
  HorizontalDialogDescription,
  HorizontalDialogFooter,
  HorizontalDialogBody
} from '@/components/ui/horizontal-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'

export type ActivityType = 'call' | 'visit' | 'email' | 'whatsapp' | 'note'

export interface ActivityData {
  type: ActivityType
  description: string
  duration?: number
  outcome?: string
  related_type: 'client' | 'opportunity' | 'contact'
  related_id: string
  related_name: string
}

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (activity: ActivityData) => void
  relatedType: 'client' | 'opportunity' | 'contact'
  relatedId: string
  relatedName: string
}

const ACTIVITY_TYPES: Record<ActivityType, { 
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  placeholder: string
}> = {
  call: { 
    label: 'Llamada', 
    icon: Phone, 
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    placeholder: 'Describe la llamada realizada...'
  },
  visit: { 
    label: 'Visita', 
    icon: MapPin, 
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    placeholder: 'Describe la visita realizada...'
  },
  email: { 
    label: 'Correo', 
    icon: Mail, 
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    placeholder: 'Describe el correo enviado...'
  },
  whatsapp: { 
    label: 'WhatsApp', 
    icon: MessageCircle, 
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    placeholder: 'Describe el mensaje enviado...'
  },
  note: { 
    label: 'Nota', 
    icon: FileText, 
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    placeholder: 'Escribe una nota o comentario...'
  },
}

export default function ActivityModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  relatedType,
  relatedId,
  relatedName
}: ActivityModalProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  
  const [activityType, setActivityType] = useState<ActivityType>('call')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [outcome, setOutcome] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor describe la actividad',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const activityData: ActivityData = {
        type: activityType,
        description: description.trim(),
        duration: duration ? parseInt(duration) : undefined,
        outcome: outcome.trim() || undefined,
        related_type: relatedType,
        related_id: relatedId,
        related_name: relatedName,
      }
      
      onSubmit(activityData)
      
      // Reset form
      setDescription('')
      setDuration('')
      setOutcome('')
      setActivityType('call')
      
      toast({
        title: 'Éxito',
        description: 'Actividad registrada correctamente',
        variant: 'success',
      })
      
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la actividad',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRelatedTypeLabel = () => {
    switch (relatedType) {
      case 'client': return 'Cliente'
      case 'opportunity': return 'Oportunidad'
      case 'contact': return 'Contacto'
      default: return 'Registro'
    }
  }

  const currentActivity = ACTIVITY_TYPES[activityType]
  const ActivityIcon = currentActivity.icon

  return (
    <HorizontalDialog open={isOpen} onOpenChange={onClose}>
      <HorizontalDialogContent>
        <HorizontalDialogHeader>
          <HorizontalDialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 ${currentActivity.bgColor} rounded-lg flex items-center justify-center`}>
              <ActivityIcon className={`w-4 h-4 ${currentActivity.color}`} />
            </div>
            Registrar Actividad
          </HorizontalDialogTitle>
          <HorizontalDialogDescription>
            {getRelatedTypeLabel()}: <span className="font-medium text-slate-700">{relatedName}</span>
          </HorizontalDialogDescription>
        </HorizontalDialogHeader>

        <HorizontalDialogBody>
          <div className="space-y-6">
            {/* Selector de tipo de actividad */}
            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Tipo de Actividad</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(ACTIVITY_TYPES) as ActivityType[]).map((type) => {
                  const config = ACTIVITY_TYPES[type]
                  const Icon = config.icon
                  const isSelected = activityType === type
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? `${config.bgColor} ${config.borderColor}` 
                          : 'bg-white border-slate-200 hover:border-slate-300'}
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? config.color : 'text-slate-400'}`} />
                      <span className={`text-xs font-medium ${isSelected ? config.color : 'text-slate-500'}`}>
                        {config.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <Label className="text-slate-700 font-medium mb-2 block">
                Descripción de la {currentActivity.label}
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={currentActivity.placeholder}
                rows={4}
                className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100 resize-none"
              />
            </div>

            {/* Campos adicionales según el tipo */}
            <div className="grid grid-cols-2 gap-4">
              {activityType === 'call' && (
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Duración (minutos)
                  </Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ej: 15"
                    className="bg-white border-slate-200"
                  />
                </div>
              )}
              
              <div className={activityType === 'call' ? '' : 'col-span-2'}>
                <Label className="text-slate-700 font-medium mb-2 block">
                  Resultado / Desenlace
                </Label>
                <Input
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Ej: Cliente interesado, solicita propuesta..."
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Información del registro */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Registrado por:</span>
                  <span className="ml-2 font-medium text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="text-slate-300">|</div>
                <div>
                  <span className="text-slate-500">Fecha:</span>
                  <span className="ml-2 font-medium text-slate-700">
                    {new Date().toLocaleDateString('es-DO', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HorizontalDialogBody>

        <HorizontalDialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Registrar Actividad'}
          </Button>
        </HorizontalDialogFooter>
      </HorizontalDialogContent>
    </HorizontalDialog>
  )
}
