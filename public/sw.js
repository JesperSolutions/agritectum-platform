const CACHE_NAME = 'taglacket-v3.0.0-CRITICAL-FIX'; // Updated to force cache clear
const OFFLINE_URL = '/offline.html';

// Files to cache
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  OFFLINE_URL
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
  } else {
    // SKIP ALL CACHING - Network only for assets
    // This ensures we always get fresh JavaScript
    event.respondWith(
      fetch(event.request)
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName); // DELETE ALL caches
        })
      );
    })
  );
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
    console.error('Background sync failed:', error);
  }
}