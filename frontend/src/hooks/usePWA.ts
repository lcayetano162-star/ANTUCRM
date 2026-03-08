// ============================================
// PWA HOOK - Custom hook for PWA functionality
// Handles install prompts, connectivity, offline sync
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SyncManager {
  register: (tag: string) => Promise<void>;
}

interface ServiceWorkerWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isSyncing: false,
    deferredPrompt: null
  });

  const { toast } = useToast();
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;
      setState(prev => ({ ...prev, isInstalled: isStandalone }));
    };

    checkInstalled();
    
    window.addEventListener('appinstalled', () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      toast({
        title: '✓ App instalada',
        description: 'Antu CRM ahora funciona como app nativa',
        variant: 'success'
      });
    });

    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
    };
  }, [toast]);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        deferredPrompt: e as BeforeInstallPromptEvent,
        isInstallable: true
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      toast({
        title: 'Conexión restablecida',
        description: 'Sincronizando datos...',
        variant: 'default'
      });
      triggerSync();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: 'Modo offline',
        description: 'Los cambios se guardarán localmente',
        variant: 'default'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] SW registered:', registration.scope);
          swRegistration.current = registration;

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: 'Actualización disponible',
                    description: 'Recarga para obtener la última versión',
                    variant: 'default'
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] SW registration failed:', error);
        });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        if (type === 'NOTIFICATION_CLICK') {
          handleNotificationClick(data);
        }
      });
    }
  }, [toast]);

  // Install app
  const installApp = useCallback(async () => {
    if (!state.deferredPrompt) return;

    setState(prev => ({ ...prev, isInstallable: false }));
    await state.deferredPrompt.prompt();

    const { outcome } = await state.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
      setState(prev => ({ ...prev, isInstallable: true }));
    }

    setState(prev => ({ ...prev, deferredPrompt: null }));
  }, [state.deferredPrompt]);

  // Trigger background sync
  const triggerSync = useCallback(async (tag?: string) => {
    if (!('serviceWorker' in navigator)) return;

    setState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const registration = await navigator.serviceWorker.ready as ServiceWorkerWithSync;
      
      if ('sync' in registration) {
        const syncTag = tag || 'sync-offline-actions';
        await registration.sync.register(syncTag);
        console.log('[PWA] Background sync registered:', syncTag);
      }
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
    } finally {
      setTimeout(() => {
        setState(prev => ({ ...prev, isSyncing: false }));
      }, 2000);
    }
  }, []);

  // Request push notifications permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notificaciones no soportadas',
        variant: 'destructive'
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast({
        title: '✓ Notificaciones activadas',
        variant: 'success'
      });
      return true;
    } else {
      toast({
        title: 'Notificaciones bloqueadas',
        description: 'Habilita las notificaciones en la configuración de tu navegador',
        variant: 'default'
      });
      return false;
    }
  }, [toast]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!swRegistration.current) return null;

    try {
      const subscription = await swRegistration.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      // Send subscription to server
      await fetch('/api/mobile/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }, []);

  // Unsubscribe from push
  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration.current) return;

    try {
      const subscription = await swRegistration.current.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/mobile/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
    } catch (error) {
      console.error('[PWA] Push unsubscription failed:', error);
    }
  }, []);

  // Store data for offline use
  const storeForOffline = useCallback(async (key: string, data: any) => {
    try {
      const db = await openOfflineDB();
      await db.put('offline-data', { key, data, timestamp: Date.now() });
    } catch (error) {
      console.error('[PWA] Store offline failed:', error);
    }
  }, []);

  // Get offline data
  const getOfflineData = useCallback(async (key: string) => {
    try {
      const db = await openOfflineDB();
      const result = await db.get('offline-data', key);
      return result?.data;
    } catch (error) {
      console.error('[PWA] Get offline failed:', error);
      return null;
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = (data: any) => {
    // Navigate to relevant page based on notification data
    if (data?.opportunityId) {
      window.location.href = `/opportunities/${data.opportunityId}`;
    } else if (data?.clientId) {
      window.location.href = `/clients/${data.clientId}`;
    }
  };

  return {
    ...state,
    installApp,
    triggerSync,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    storeForOffline,
    getOfflineData
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function openOfflineDB(): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('antu-crm-pwa', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(createIndexedDBWrapper(request.result));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
  });
}

function createIndexedDBWrapper(db: IDBDatabase) {
  return {
    put: (storeName: string, data: any) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    },
    
    get: (storeName: string, key: string) => {
      return new Promise<any>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  };
}

export default usePWA;
