// ============================================
// VOICE RECORDER - Mobile Component
// Audio recording with automatic transcription
// ============================================

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2, Play, Trash2, Send, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api';
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  clientId?: string
  contactId?: string
  opportunityId?: string
  onRecordingComplete?: () => void
}

interface Recording {
  id: string
  blob: Blob
  url: string
  duration: number
}

export function VoiceRecorder({ 
  clientId, 
  contactId, 
  opportunityId,
  onRecordingComplete 
}: VoiceRecorderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartTimeRef = useRef<number>(0)
  const { toast } = useToast()

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      recordingStartTimeRef.current = Date.now()
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        
        setRecording({
          id: generateId(),
          blob: audioBlob,
          url: URL.createObjectURL(audioBlob),
          duration
        })
        
        // Detener todos los tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (error) {
      toast({
        title: 'Error de micrófono',
        description: 'No se pudo acceder al micrófono. Verifica los permisos.',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Reproducir audio
  const playRecording = () => {
    if (!recording) return
    
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(recording.url)
      audioElementRef.current.onended = () => setIsPlaying(false)
    }
    
    if (isPlaying) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioElementRef.current.play()
      setIsPlaying(true)
    }
  }

  // Transcribir con IA
  const transcribeAudio = async () => {
    if (!recording) return
    
    setIsTranscribing(true)
    try {
      // Convertir blob a base64
      const base64Audio = await blobToBase64(recording.blob)
      
      const response = await api.post('/mobile/transcribe', {
        audio: base64Audio,
        language: 'es'
      })
      
      setTranscription(response.data.transcription)
      
      toast({
        title: 'Transcripción completada',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error en transcripción',
        description: 'No se pudo transcribir el audio. Puedes guardarlo igual.',
        variant: 'destructive'
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  // Guardar nota de voz
  const saveRecording = async () => {
    if (!recording) return
    
    setIsUploading(true)
    try {
      // Crear FormData para upload
      const formData = new FormData()
      formData.append('audio', recording.blob, `voice-note-${recording.id}.webm`)
      formData.append('duration', recording.duration.toString())
      formData.append('clientId', clientId || '')
      formData.append('contactId', contactId || '')
      formData.append('opportunityId', opportunityId || '')
      formData.append('transcription', transcription)
      formData.append('deviceId', getDeviceId())
      
      await api.post('/mobile/voice-note', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast({
        title: '✓ Nota de voz guardada',
        description: transcription 
          ? 'Audio y transcripción guardados'
          : 'Audio guardado',
        variant: 'success'
      })
      
      setIsOpen(false)
      resetForm()
      onRecordingComplete?.()
      
    } catch (error) {
      // Guardar offline
      await saveOffline({
        recording,
        transcription,
        clientId,
        contactId,
        opportunityId,
        timestamp: new Date().toISOString()
      })
      
      toast({
        title: 'Guardado offline',
        description: 'Se sincronizará cuando haya conexión',
        variant: 'default'
      })
      
      setIsOpen(false)
      resetForm()
      onRecordingComplete?.()
    } finally {
      setIsUploading(false)
    }
  }

  // Helpers
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device-id')
    if (!deviceId) {
      deviceId = generateId()
      localStorage.setItem('device-id', deviceId)
    }
    return deviceId
  }

  const saveOffline = async (data: any) => {
    const queue = JSON.parse(localStorage.getItem('offline-voice-notes') || '[]')
    queue.push({ id: generateId(), ...data, synced: false })
    localStorage.setItem('offline-voice-notes', JSON.stringify(queue))

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('sync-voice-notes')
    }
  }

  const resetForm = () => {
    setRecording(null)
    setTranscription('')
    setIsRecording(false)
    setIsPlaying(false)
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-36 right-4 z-50 rounded-full shadow-lg",
          "w-14 h-14 p-0 bg-red-500 hover:bg-red-600",
          "transition-transform active:scale-95"
        )}
      >
        <Mic className="w-6 h-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-red-500" />
              Nota de Voz
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Recording Interface */}
            {!recording ? (
              <div className="flex flex-col items-center justify-center py-8">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center",
                    "transition-all duration-300",
                    isRecording 
                      ? "bg-red-500 animate-pulse"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  {isRecording ? (
                    <Square className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-red-500" />
                  )}
                </button>
                
                <p className="mt-4 text-center text-gray-600">
                  {isRecording 
                    ? 'Grabando... Toca para detener'
                    : 'Toca para grabar'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Audio Player */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={playRecording}
                      className="h-12 w-12"
                    >
                      {isPlaying ? (
                        <Square className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </Button>
                    
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-0 transition-all duration-300" 
                          style={{ width: isPlaying ? '100%' : '0%' }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatTime(recording.duration)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRecording(null)
                        setTranscription('')
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Transcribe Button */}
                {!transcription && (
                  <Button
                    variant="outline"
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="w-full"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transcribiendo...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Transcribir con IA
                      </>
                    )}
                  </Button>
                )}

                {/* Transcription */}
                {transcription && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-blue-700">Transcripción</label>
                    <textarea
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      className="mt-2 w-full bg-transparent border-0 resize-none focus:ring-0 text-sm"
                      rows={4}
                    />
                  </div>
                )}

                {/* Save Button */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={saveRecording}
                    disabled={isUploading}
                    className="flex-1 bg-[#075E54] hover:bg-[#128C7E]"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
