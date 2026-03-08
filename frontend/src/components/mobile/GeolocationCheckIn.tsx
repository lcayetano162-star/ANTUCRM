// ============================================
// GEOLOCATION CHECK-IN - Floating action component
// Quick check-in with GPS verification
// ============================================

import { useState, useCallback, useRef } from 'react';
import { MapPin, X, Check, Navigation, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface GeolocationCheckInProps {
  clientId?: string;
  clientName?: string;
  onCheckInComplete?: () => void;
}

interface NearbyClient {
  id: string;
  name: string;
  address: string;
  distance: number;
}

export function GeolocationCheckIn({ 
  clientId, 
  clientName,
  onCheckInComplete 
}: GeolocationCheckInProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [nearbyClients, setNearbyClients] = useState<NearbyClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<{id: string, name: string} | null>(
    clientId ? { id: clientId, name: clientName || '' } : null
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Get current location
  const getLocation = useCallback(() => {
    setIsLocating(true);
    
    if (!('geolocation' in navigator)) {
      toast({
        title: 'GPS no disponible',
        description: 'Tu dispositivo no soporta geolocalización',
        variant: 'destructive'
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPosition(pos);
        setIsLocating(false);
        
        // Load nearby clients
        try {
          const response = await api.get('/mobile/clients/nearby', {
            params: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              radius: 2000 // 2km radius
            }
          });
          setNearbyClients(response.data);
        } catch (error) {
          console.error('Error loading nearby clients:', error);
        }
      },
      (error) => {
        setIsLocating(false);
        let message = 'No se pudo obtener tu ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado';
            break;
        }
        
        toast({
          title: 'Error de GPS',
          description: message,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [toast]);

  // Open dialog
  const openCheckIn = () => {
    setIsOpen(true);
    getLocation();
  };

  // Submit check-in
  const submitCheckIn = async () => {
    if (!position) {
      toast({
        title: 'Ubicación requerida',
        description: 'Espera a obtener tu ubicación',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const checkInData = {
        clientId: selectedClient?.id,
        clientName: selectedClient?.name,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        notes,
        timestamp: new Date().toISOString(),
        deviceId: getDeviceId()
      };

      await api.post('/mobile/checkin', checkInData);
      
      toast({
        title: '✓ Check-in realizado',
        description: selectedClient?.name 
          ? `Visitaste ${selectedClient.name}`
          : 'Ubicación registrada',
        variant: 'success'
      });
      
      setIsOpen(false);
      resetForm();
      onCheckInComplete?.();
      
    } catch (error) {
      // Save offline
      await saveOffline(checkInData);
      
      toast({
        title: 'Guardado offline',
        description: 'Se sincronizará cuando haya conexión',
        variant: 'default'
      });
      
      setIsOpen(false);
      resetForm();
      onCheckInComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save offline
  const saveOffline = async (data: any) => {
    const queue = JSON.parse(localStorage.getItem('offline-checkins') || '[]');
    queue.push({
      id: generateId(),
      ...data,
      synced: false
    });
    localStorage.setItem('offline-checkins', JSON.stringify(queue));

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-checkins');
    }
  };

  // Helpers
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = generateId();
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  };

  const resetForm = () => {
    setPosition(null);
    setNearbyClients([]);
    setSelectedClient(clientId ? { id: clientId, name: clientName || '' } : null);
    setNotes('');
  };

  const openMapDirections = () => {
    if (!position) return;
    const { latitude, longitude } = position.coords;
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
  };

  return (
    <>
      {/* Floating Action Button */}
      {!clientId && (
        <Button
          onClick={openCheckIn}
          className={cn(
            "fixed bottom-20 right-4 z-50 rounded-full shadow-lg",
            "w-14 h-14 p-0 bg-[#128C7E] hover:bg-[#075E54]",
            "transition-transform active:scale-95"
          )}
        >
          <MapPin className="w-6 h-6" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#128C7E]" />
              Check-in de Visita
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Location Status */}
            <div className={cn(
              "p-4 rounded-lg flex items-center gap-3",
              position ? "bg-green-50" : "bg-gray-50"
            )}>
              {isLocating ? (
                <Loader2 className="w-6 h-6 text-[#128C7E] animate-spin" />
              ) : position ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <MapPin className="w-6 h-6 text-gray-400" />
              )}
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  position ? "text-green-700" : "text-gray-600"
                )}>
                  {isLocating ? 'Obteniendo ubicación...' : 
                   position ? 'Ubicación obtenida' : 'Esperando GPS'}
                </p>
                {position && (
                  <p className="text-sm text-green-600">
                    Precisión: ±{Math.round(position.coords.accuracy)} metros
                  </p>
                )}
              </div>
              {!position && !isLocating && (
                <Button size="sm" onClick={getLocation}>
                  Reintentar
                </Button>
              )}
            </div>

            {/* Nearby Clients */}
            {!clientId && nearbyClients.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Clientes cercanos
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {nearbyClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient({ id: client.id, name: client.name })}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors",
                        selectedClient?.id === client.id
                          ? "border-[#128C7E] bg-[#128C7E]/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{client.name}</span>
                        </div>
                        <span className="text-xs text-[#128C7E]">
                          {client.distance < 1000 
                            ? `${Math.round(client.distance)}m`
                            : `${(client.distance / 1000).toFixed(1)}km`
                          }
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{client.address}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Client */}
            {selectedClient && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <label className="text-xs text-blue-600 font-medium">Cliente seleccionado</label>
                <p className="font-medium text-blue-900">{selectedClient.name}</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notas de la visita
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Qué se discutió? ¿Próximos pasos?"
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {position && (
                <Button
                  variant="outline"
                  onClick={openMapDirections}
                  className="flex-1"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver Mapa
                </Button>
              )}
              <Button
                onClick={submitCheckIn}
                disabled={!position || isSubmitting}
                className={cn(
                  "flex-1 bg-[#128C7E] hover:bg-[#075E54]",
                  (!position || isSubmitting) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Confirmar Check-in
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GeolocationCheckIn;
