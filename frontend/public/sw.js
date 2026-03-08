// ============================================
// SERVICE WORKER - ANTU CRM PWA
// Enterprise-grade offline-first architecture
// ============================================

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `antu-static-${CACHE_VERSION}`;
const DATA_CACHE = `antu-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `antu-images-${CACHE_VERSION}`;

// Rutas críticas para precache (shell de la app)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Rutas principales (se cargarán dinámicamente)
];

// APIs que deben ser cached
const API_ROUTES = [
  '/api/dashboard',
  '/api/opportunities',
  '/api/clients',
  '/api/contacts',
  '/api/tasks',
];

// Instalación - Precache shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - Limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('antu-') && !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Estrategia de caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones no GET
  if (request.method !== 'GET') {
    // Pero manejar POST/PUT/DELETE para offline sync
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      event.respondWith(handleOfflineMutation(request));
    }
    return;
  }
  
  // 1. API calls - Network first, fallback to cache
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 2. Imágenes - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
  
  // 3. Assets estáticos (JS/CSS) - Cache first
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // 4. HTML - Stale while revalidate
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // 5. Default - Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// ============================================
// ESTRATEGIAS DE CACHING
// ============================================

// Network First: Para APIs - siempre fresh data
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Guardar en cache si es válida
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Si es API y no hay cache, devolver respuesta offline
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Estás offline. Los datos se sincronizarán cuando haya conexión.' 
        }),
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    throw error;
  }
}

// Cache First: Para assets estáticos
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    // Actualizar en background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => cache.put(request, response));
      }
    }).catch(() => {});
    
    return cached;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Stale While Revalidate: Para HTML
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Network with Cache Fallback
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// ============================================
// OFFLINE MUTATIONS (Background Sync)
// ============================================

const OFFLINE_QUEUE_NAME = 'offline-mutations';

async function handleOfflineMutation(request) {
  try {
    // Intentar enviar normalmente
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Si falla (offline), guardar en queue
    console.log('[SW] Offline mutation queued:', request.url);
    
    const clone = request.clone();
    const body = await clone.text();
    
    const mutation = {
      id: generateId(),
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
      retries: 0,
    };
    
    // Guardar en IndexedDB
    await saveToOfflineQueue(mutation);
    
    // Registrar para background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-mutations');
    }
    
    // Devolver respuesta "accepted" al cliente
    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Sin conexión. La acción se ejecutará cuando haya internet.',
        mutationId: mutation.id,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(processOfflineQueue());
  }
});

// Procesar cola offline
async function processOfflineQueue() {
  const queue = await getOfflineQueue();
  
  for (const mutation of queue) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers.reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {}),
        body: mutation.body,
      });
      
      if (response.ok) {
        console.log('[SW] Offline mutation synced:', mutation.id);
        await removeFromOfflineQueue(mutation.id);
        
        // Notificar a la app
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MUTATION_SYNCED',
            mutationId: mutation.id,
          });
        });
      } else {
        throw new Error('Server returned error');
      }
    } catch (error) {
      console.error('[SW] Failed to sync mutation:', mutation.id, error);
      
      // Incrementar retry count
      mutation.retries++;
      
      if (mutation.retries >= 3) {
        // Eliminar si falló muchas veces
        await removeFromOfflineQueue(mutation.id);
        
        // Notificar error
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MUTATION_FAILED',
            mutationId: mutation.id,
            error: 'Failed to sync after 3 retries',
          });
        });
      } else {
        // Actualizar retry count
        await updateOfflineQueue(mutation);
      }
    }
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nueva notificación de Antü CRM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default',
    renotify: data.renotify || false,
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Antü CRM',
      options
    )
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================
// UTILIDADES
// ============================================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// IndexedDB para offline queue
const DB_NAME = 'antu-pwa-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveToOfflineQueue(mutation) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.add(mutation);
}

async function getOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return store.getAll();
}

async function removeFromOfflineQueue(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.delete(id);
}

async function updateOfflineQueue(mutation) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.put(mutation);
}

// Mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
