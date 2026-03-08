// ============================================
// MOBILE CHECK-IN - Detailed check-in page
// Full check-in history and manual entry
// ============================================

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Building2,
  CheckCircle2,
  Navigation,
  Calendar,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDate, formatDistanceToNow } from '@/lib/utils';

interface CheckIn {
  id: string;
  clientName: string;
  address?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes?: string;
  visitPurpose?: string;
}

interface NearbyClient {
  id: string;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export function MobileCheckIn() {
  const { toast } = useToast();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [nearbyClients, setNearbyClients] = useState<NearbyClient[]>([]);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    loadCheckIns();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentPosition) {
      loadNearbyClients();
    }
  }, [currentPosition]);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentPosition(position),
        (error) => {
          toast({
            title: 'Error de ubicación',
            description: 'Activa el GPS para ver clientes cercanos',
            variant: 'destructive'
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const loadCheckIns = async () => {
    try {
      const response = await api.get('/mobile/checkins/history');
      setCheckIns(response.data);
    } catch (error) {
      toast({ title: 'Error cargando historial', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadNearbyClients = async () => {
    if (!currentPosition) return;
    
    try {
      const response = await api.get('/mobile/clients/nearby', {
        params: {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
          radius: 5000 // 5km
        }
      });
      setNearbyClients(response.data);
    } catch (error) {
      console.error('Error loading nearby clients:', error);
    }
  };

  const performCheckIn = async (clientId?: string, clientName?: string) => {
    if (!currentPosition) {
      toast({
        title: 'Ubicación requerida',
        description: 'Activa el GPS para hacer check-in',
        variant: 'destructive'
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      const checkInData = {
        clientId,
        clientName,
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        accuracy: currentPosition.coords.accuracy,
        timestamp: new Date().toISOString(),
        deviceId: getDeviceId()
      };

      await api.post('/mobile/checkin', checkInData);
      
      toast({
        title: '✓ Check-in realizado',
        description: clientName || 'Ubicación registrada',
        variant: 'success'
      });

      loadCheckIns();
    } catch (error) {
      // Guardar offline
      saveOfflineCheckIn({
        ...checkInData,
        synced: false
      });
      
      toast({
        title: 'Check-in guardado offline',
        description: 'Se sincronizará cuando haya conexión',
        variant: 'default'
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const openDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2);
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  };

  const saveOfflineCheckIn = (data: any) => {
    const queue = JSON.parse(localStorage.getItem('offline-checkins') || '[]');
    queue.push({ id: Date.now(), ...data });
    localStorage.setItem('offline-checkins', JSON.stringify(queue));

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration: any) => {
        registration.sync.register('sync-checkins');
      });
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
    <div className="space-y-6 p-4">
      {/* Current Location Card */}
      <Card className="bg-gradient-to-br from-[#075E54] to-[#128C7E] text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Tu ubicación
              </p>
              <p className="text-lg font-semibold mt-1">
                {currentPosition ? 'GPS Activo' : 'Buscando GPS...'}
              </p>
              {currentPosition && (
                <p className="text-xs text-white/70">
                  Precisión: {Math.round(currentPosition.coords.accuracy)}m
                </p>
              )}
            </div>
            <Button
              onClick={() => performCheckIn()}
              disabled={isCheckingIn || !currentPosition}
              className="bg-white text-[#128C7E] hover:bg-white/90 rounded-full px-6"
            >
              {isCheckingIn ? (
                <div className="w-5 h-5 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Check-in
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Clients */}
      {nearbyClients.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Clientes Cercanos
          </h3>
          <div className="space-y-3">
            {nearbyClients.map((client) => (
              <Card key={client.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{client.name}</h4>
                      <p className="text-sm text-gray-500">{client.address}</p>
                      <p className="text-xs text-[#128C7E] mt-1">
                        {client.distance < 1000 
                          ? `${Math.round(client.distance)}m` 
                          : `${(client.distance / 1000).toFixed(1)}km`
                        } de distancia
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDirections(client.latitude, client.longitude)}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => performCheckIn(client.id, client.name)}
                        disabled={isCheckingIn}
                        className="bg-[#128C7E] hover:bg-[#075E54]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Historial de Visitas
        </h3>
        
        <div className="space-y-3">
          {checkIns.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay check-ins registrados</p>
              </CardContent>
            </Card>
          ) : (
            checkIns.map((checkIn) => (
              <Card key={checkIn.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#128C7E]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#128C7E]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{checkIn.clientName}</h4>
                      <p className="text-xs text-gray-500">
                        {formatDate(checkIn.timestamp)} • {formatDistanceToNow(new Date(checkIn.timestamp))}
                      </p>
                      {checkIn.visitPurpose && (
                        <p className="text-sm text-gray-600 mt-1">{checkIn.visitPurpose}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDirections(checkIn.latitude, checkIn.longitude)}
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileCheckIn;
