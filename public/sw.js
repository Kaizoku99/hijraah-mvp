// Hijraah Service Worker
// Phase 3: PWA Support with Offline Document Access

const CACHE_NAME = 'hijraah-v1';
const STATIC_CACHE = 'hijraah-static-v1';
const DYNAMIC_CACHE = 'hijraah-dynamic-v1';
const DOCUMENT_CACHE = 'hijraah-documents-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/calculator',
  '/documents',
  '/chat',
  '/profile',
  '/manifest.json',
  '/Hijraah_logo.png',
  '/favicomatic/favicon.ico',
  '/favicomatic/favicon-32x32.png',
  '/favicomatic/favicon-96x96.png',
  '/favicomatic/apple-touch-icon-152x152.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versioned caches
            return name.startsWith('hijraah-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== DOCUMENT_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for CDN assets)
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) {
    return;
  }

  // Handle document files (PDFs, images) - cache first
  if (isDocumentRequest(request)) {
    event.respondWith(cacheFirst(request, DOCUMENT_CACHE));
    return;
  }

  // Handle API requests - network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Handle static assets - cache first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Handle pages - network first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }
  
  return fetchAndCache(request, cache);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

async function networkOnly(request) {
  return fetch(request);
}

async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/favicomatic/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

function isDocumentRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith('.pdf') ||
    url.hostname.includes('supabase') && url.pathname.includes('/storage/')
  );
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || data.message,
    icon: '/Hijraah_logo.png',
    badge: '/favicomatic/favicon-96x96.png',
    tag: data.tag || 'hijraah-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hijraah', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
  if (event.tag === 'sync-deadlines') {
    event.waitUntil(syncDeadlines());
  }
});

async function syncDocuments() {
  // Get pending document uploads from IndexedDB
  // This would be implemented with actual IndexedDB operations
  console.log('[SW] Syncing documents...');
}

async function syncDeadlines() {
  // Sync deadline reminders
  console.log('[SW] Syncing deadlines...');
}

// Periodic background sync for deadline checks (requires permission)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-deadlines') {
    event.waitUntil(checkDeadlines());
  }
});

async function checkDeadlines() {
  // Check for upcoming deadlines and send notifications
  console.log('[SW] Checking deadlines...');
}
