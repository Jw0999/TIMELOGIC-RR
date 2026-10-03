// ============================================================================
// TimeLogic Kiosk Service Worker
// Enables offline boot, asset caching, and zero-downtime kiosk operation.
// ============================================================================

const CACHE_NAME = 'timelogic-station-cache-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/logo.jpg',
        '/icon-192.png',
        '/icon-512.png',
        '/manifest.webmanifest',
        '/fonts/plus-jakarta-sans.woff2',
        '/privacy',
        '/privacy/index.html',
        '/privacy-policy',
        '/terms',
        '/terms/index.html',
        '/terms-of-service',
      ]).catch((err) => console.warn('[SW] Cache addAll warning:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept backend API calls (handled explicitly by api.ts and IndexedDB)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Network-First for HTML navigation so updates load immediately on refresh
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
