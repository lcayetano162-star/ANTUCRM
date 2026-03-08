// ============================================
// SERVICE WORKER - Antu CRM Mobile PWA
// Offline support, background sync, push notifications
// ============================================

const CACHE_NAME = 'antu-crm-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

const API_CACHE_NAME = 'antu-crm-api-v1';
const OFFLINE_QUEUE_NAME = 'antu-crm-offline-queue';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for API
  if (request.method !== 'GET' && url.pathname.startsWith('/api/')) {
    return;
  }

  // API calls - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Return cached response or offline fallback
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // Return offline JSON for API calls
          if (url.pathname.startsWith('/api/')) {
            return new Response(
              JSON.stringify({ 
                error: 'OFFLINE',
                message: 'Sin conexión a internet. Los cambios se sincronizarán automáticamente.'
              }),
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          }
          
          throw new Error('Network error');
        })
    );
    return;
  }

  // Static assets - Cache first
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          });
      })
  );
});

// Background Sync - Queue and retry failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncCheckins());
  }
  
  if (event.tag === 'sync-voice-notes') {
    event.waitUntil(syncVoiceNotes());
  }
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    data = { title: 'Antu CRM', body: event.data?.text() };
  }
  
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Antu CRM',
      options
    )
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { notification } = event;
  const action = event.action;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            
            // Post message to client
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action,
              data: notification.data
            });
            
            return;
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          const url = notification.data?.url || '/';
          clients.openWindow(url);
        }
      })
  );
});

// ============================================
// SYNC FUNCTIONS
// ============================================

async function syncCheckins() {
  const db = await openDB();
  const checkins = await db.getAll('pending-checkins');
  
  for (const checkin of checkins) {
    try {
      const response = await fetch('/api/mobile/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin.data)
      });
      
      if (response.ok) {
        await db.delete('pending-checkins', checkin.id);
        console.log('[SW] Checkin synced:', checkin.id);
      }
    } catch (error) {
      console.error('[SW] Checkin sync failed:', error);
    }
  }
}

async function syncVoiceNotes() {
  const db = await openDB();
  const notes = await db.getAll('pending-voice-notes');
  
  for (const note of notes) {
    try {
      const formData = new FormData();
      formData.append('audio', note.blob, `voice-${note.id}.webm`);
      formData.append('duration', note.duration);
      formData.append('transcription', note.transcription);
      formData.append('clientId', note.clientId || '');
      formData.append('contactId', note.contactId || '');
      formData.append('opportunityId', note.opportunityId || '');
      formData.append('timestamp', note.timestamp);
      
      const response = await fetch('/api/mobile/voice-note', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await db.delete('pending-voice-notes', note.id);
        console.log('[SW] Voice note synced:', note.id);
      }
    } catch (error) {
      console.error('[SW] Voice note sync failed:', error);
    }
  }
}

async function syncOfflineActions() {
  const db = await openDB();
  const actions = await db.getAll('offline-actions');
  
  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method || 'POST',
        headers: action.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body)
      });
      
      if (response.ok) {
        await db.delete('offline-actions', action.id);
        console.log('[SW] Action synced:', action.id);
      }
    } catch (error) {
      console.error('[SW] Action sync failed:', error);
    }
  }
}

// ============================================
// INDEXEDDB HELPERS
// ============================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('antu-crm-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(createDBWrapper(request.result));
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-checkins')) {
        db.createObjectStore('pending-checkins', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pending-voice-notes')) {
        db.createObjectStore('pending-voice-notes', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offline-actions')) {
        db.createObjectStore('offline-actions', { keyPath: 'id' });
      }
    };
  });
}

function createDBWrapper(db) {
  return {
    getAll: (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    
    delete: (storeName, id) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };
}

// ============================================
// MESSAGE HANDLER (from client)
// ============================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CACHE_OFFLINE_PAGE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.put('/offline.html', new Response(data.html, {
        headers: { 'Content-Type': 'text/html' }
      }));
    });
  }
});

console.log('[SW] Service Worker registered');
