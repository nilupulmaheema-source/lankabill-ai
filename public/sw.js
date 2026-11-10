// LankaBill AI Service Worker - Network-First Strategy for Instant Updates
const CACHE_NAME = 'lankabill-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key)) // clear all old caches
      );
    })
  );
  self.clients.claim();
});

// Network first, falling back to cache if offline
self.addEventListener('fetch', (event) => {
  // Never intercept API calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline)
        return caches.match(event.request);
      })
  );
});
