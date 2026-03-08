// ============================================
// CHECK-IN BUTTON - Mobile Component
// GPS-based location tracking with photo evidence
// ============================================

import { useState, useCallback } from 'react'
import { MapPin, Camera, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api';
import { cn } from '@/lib/utils'

interface CheckInButtonProps {
  clientId?: string
  contactId?: string
  opportunityId?: string
  clientName?: string
  onCheckIn?: () => void
}

interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export function CheckInButton({ 
  clientId, 
  contactId, 
  opportunityId, 
  clientName,
  onCheckIn 
}: CheckInButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState<string | null>(null)
  const { toast } = useToast()

  // Obtener ubicación GPS
  const getLocation = useCallback(async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          reject(error)
        },
        options
      )
    })
  }, [])

  // Reverse geocoding para obtener dirección
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      // Usar OpenStreetMap Nominatim (gratis)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await response.json()
      return data.display_name || 'Ubicación desconocida'
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  // Iniciar check-in
  const startCheckIn = async () => {
    setIsLoading(true)
    try {
      // 1. Obtener GPS
      const pos = await getLocation()
      setPosition(pos)

      // 2. Obtener dirección
      const addr = await getAddressFromCoords(pos.latitude, pos.longitude)
      setAddress(addr)

      setIsOpen(true)
    } catch (error: any) {
      toast({
        title: 'Error de ubicación',
        description: error.code === 1 
          ? 'Permiso de ubicación denegado. Activa el GPS.'
          : 'No se pudo obtener la ubicación. Intenta de nuevo.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Tomar foto
  const takePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Usar cámara trasera
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setPhoto(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  // Confirmar check-in
  const confirmCheckIn = async () => {
    if (!position) return

    setIsLoading(true)
    try {
      await api.post('/mobile/checkin', {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        address,
        clientId,
        contactId,
        opportunityId,
        notes,
        photo: photo ? await uploadPhoto(photo) : null,
        checkinType: clientId ? 'visit' : 'checkin',
        deviceId: getDeviceId(),
        timestamp: new Date().toISOString()
      })

      toast({
        title: '✓ Check-in registrado',
        description: address || 'Ubicación guardada',
        variant: 'success'
      })

      setIsOpen(false)
      resetForm()
      onCheckIn?.()
    } catch (error) {
      // Si falla, guardar offline
      await saveOffline({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        address,
        clientId,
        contactId,
        opportunityId,
        notes,
        photo,
        timestamp: new Date().toISOString()
      })

      toast({
        title: 'Check-in guardado offline',
        description: 'Se sincronizará cuando haya conexión',
        variant: 'default'
      })

      setIsOpen(false)
      resetForm()
      onCheckIn?.()
    } finally {
      setIsLoading(false)
    }
  }

  // Subir foto al servidor
  const uploadPhoto = async (base64Photo: string): Promise<string> => {
    // Convertir base64 a file y subir
    const response = await api.post('/upload/base64', {
      image: base64Photo,
      folder: 'checkins'
    })
    return response.data.url
  }

  // Guardar para sync offline
  const saveOffline = async (data: any) => {
    const offlineQueue = JSON.parse(localStorage.getItem('offline-checkins') || '[]')
    offlineQueue.push({
      id: generateId(),
      ...data,
      synced: false
    })
    localStorage.setItem('offline-checkins', JSON.stringify(offlineQueue))

    // Registrar sync para cuando vuelva la conexión
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('sync-checkins')
    }
  }

  // Generar ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Obtener/device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device-id')
    if (!deviceId) {
      deviceId = generateId()
      localStorage.setItem('device-id', deviceId)
    }
    return deviceId
  }

  const resetForm = () => {
    setPosition(null)
    setPhoto(null)
    setNotes('')
    setAddress(null)
  }

  return (
    <>
      <Button
        onClick={startCheckIn}
        disabled={isLoading}
        className={cn(
          "fixed bottom-20 right-4 z-50 rounded-full shadow-lg",
          "w-14 h-14 p-0 bg-[#075E54] hover:bg-[#128C7E]",
          "transition-transform active:scale-95"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <MapPin className="w-6 h-6" />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#075E54]" />
              {clientName ? `Visita: ${clientName}` : 'Registrar Ubicación'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ubicación */}
            {position && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-gray-700">{address}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Precisión: ±{Math.round(position.accuracy)} metros
                </p>
                <p className="text-gray-400 text-xs">
                  {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                </p>
              </div>
            )}

            {/* Foto */}
            <div>
              <label className="text-sm font-medium text-gray-700">Evidencia fotográfica</label>
              <div className="mt-2">
                {photo ? (
                  <div className="relative">
                    <img 
                      src={photo} 
                      alt="Evidencia" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={takePhoto}
                    className="w-full h-20 border-dashed"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Tomar foto
                  </Button>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Qué se conversó? ¿Próximos pasos?"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmCheckIn}
                disabled={isLoading}
                className="flex-1 bg-[#075E54] hover:bg-[#128C7E]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
