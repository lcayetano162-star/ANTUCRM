// ============================================
// BUSINESS CARD SCANNER - Mobile Component
// OCR-based business card capture
// ============================================

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Check, Loader2, User, Building, Mail, Phone, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api';
import { cn } from '@/lib/utils'

interface ExtractedData {
  name?: string
  company?: string
  jobTitle?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
}

export function BusinessCardScanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Cámara trasera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      toast({
        title: 'Error de cámara',
        description: 'No se pudo acceder a la cámara. Verifica los permisos.',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Capturar imagen
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    stopCamera()
  }

  // Procesar OCR
  const processOCR = async () => {
    if (!capturedImage) return
    
    setIsProcessing(true)
    try {
      const response = await api.post('/mobile/scan-card', {
        image: capturedImage
      })
      
      setExtractedData(response.data.extractedData)
      
      toast({
        title: 'Tarjeta escaneada',
        description: 'Revisa los datos extraídos',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error en OCR',
        description: 'No se pudo leer la tarjeta. Intenta con mejor iluminación.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Crear contacto
  const createContact = async () => {
    if (!extractedData) return
    
    setIsCreating(true)
    try {
      await api.post('/contacts', {
        firstName: extractedData.name?.split(' ')[0] || '',
        lastName: extractedData.name?.split(' ').slice(1).join(' ') || '',
        company: extractedData.company,
        jobTitle: extractedData.jobTitle,
        email: extractedData.email,
        phone: extractedData.phone,
        mobile: extractedData.mobile,
        website: extractedData.website,
        source: 'business_card_scanner'
      })
      
      toast({
        title: '✓ Contacto creado',
        description: `${extractedData.name} agregado al CRM`,
        variant: 'success'
      })
      
      setIsOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error al crear contacto',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Reset
  const resetForm = () => {
    setCapturedImage(null)
    setExtractedData(null)
    stopCamera()
  }

  // Abrir scanner
  const openScanner = () => {
    setIsOpen(true)
    startCamera()
  }

  // Cerrar
  const closeScanner = () => {
    setIsOpen(false)
    resetForm()
  }

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={openScanner}
        className={cn(
          "fixed bottom-52 right-4 z-50 rounded-full shadow-lg",
          "w-14 h-14 p-0 bg-blue-500 hover:bg-blue-600",
          "transition-transform active:scale-95"
        )}
      >
        <Camera className="w-6 h-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={closeScanner}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              Escanear Tarjeta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!capturedImage ? (
              // Vista de cámara
              <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay guía */}
                <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1" />
                </div>
                
                {/* Botón capturar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-400" />
                  </button>
                </div>
              </div>
            ) : !extractedData ? (
              // Vista de preview
              <div className="space-y-4">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <img 
                    src={capturedImage} 
                    alt="Captured card" 
                    className="w-full h-full object-contain bg-gray-100"
                  />
                  <button
                    onClick={() => {
                      setCapturedImage(null)
                      startCamera()
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <Button
                  onClick={processOCR}
                  disabled={isProcessing}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Leyendo tarjeta...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Procesar Tarjeta
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Vista de datos extraídos
              <div className="space-y-4">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <img 
                    src={capturedImage} 
                    alt="Captured card" 
                    className="w-full h-full object-contain bg-gray-100"
                  />
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Datos extraídos:</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <Input
                        value={extractedData.name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                        placeholder="Nombre"
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <Input
                        value={extractedData.company || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, company: e.target.value })}
                        placeholder="Empresa"
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <Input
                        value={extractedData.jobTitle || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, jobTitle: e.target.value })}
                        placeholder="Cargo"
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <Input
                        value={extractedData.email || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                        placeholder="Email"
                        type="email"
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <Input
                        value={extractedData.phone || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, phone: e.target.value })}
                        placeholder="Teléfono"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExtractedData(null)
                      setCapturedImage(null)
                      startCamera()
                    }}
                    className="flex-1"
                  >
                    Reintentar
                  </Button>
                  <Button
                    onClick={createContact}
                    disabled={isCreating || !extractedData.name}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Crear Contacto
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
