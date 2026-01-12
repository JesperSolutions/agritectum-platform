// Version should match package.json version to force updates
// Update this when deploying to ensure users get fresh code
const CACHE_NAME = 'agritectum-v4.0.0-REACT-FIX'; 
const OFFLINE_URL = '/offline.html';

// Files to cache (minimal - only HTML for offline)
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// Install event - cache resources and skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, version:', CACHE_NAME);
  // Skip waiting so new SW activates immediately (bypasses waiting state)
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache:', CACHE_NAME);
        // Only cache essential HTML files, not JS/CSS
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('[SW] Cache addAll failed:', err);
      })
  );
});

// Fetch event - network first for all requests to ensure fresh code
self.addEventListener('fetch', (event) => {
  // Skip caching for API calls and external resources
  if (
    event.request.url.startsWith('http') && 
    !event.request.url.startsWith(self.location.origin)
  ) {
    return; // Let browser handle external requests
  }

  // Network first strategy - always try network first for fresh code
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If request is HTML and we got a response, clone it for cache
        if (event.request.mode === 'navigate' && response) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Only serve from cache if offline and it's a navigation request
        if (event.request.mode === 'navigate') {
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request) || cache.match(OFFLINE_URL);
          });
        }
        // For non-navigation requests, fail gracefully
        return new Response('Network error', { status: 408 });
      })
  );
});

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, version:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately (bypasses waiting)
      return self.clients.claim();
    })
  );
  
  // Notify clients that SW is ready
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_NAME });
    });
  });
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline reports
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-reports') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // This would trigger the sync in your React app
    // You can use postMessage to communicate with the main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_OFFLINE_REPORTS' });
      });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}