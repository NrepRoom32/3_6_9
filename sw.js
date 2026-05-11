/* ====================================================
   SERVICE WORKER — Offline Support
   Caches all app files on first visit so the game works
   even with no internet connection afterwards.
   ==================================================== */

const CACHE_NAME = 'card-game-v2';

// Files to cache for offline use
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './images/001.jpeg',
  './images/card_2.jpeg',
  './images/card_3.jpeg',
  './images/card_4.jpeg',
  './images/card_5.jpeg',
  './images/card_6.jpeg',
  './images/card_7.jpeg',
  './images/card_8.jpeg',
  './images/card_9.jpeg',
  './images/card_10.jpeg',
  './images/card_J.jpeg',
  './images/card_Q.jpeg',
  './images/card_K.jpeg',
  './images/card_A.jpeg',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;700;900&family=Fredoka:wght@400;600;700&display=swap'
];

// Install: cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache all assets; ignore individual failures so install never fails
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: failed to cache', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Not in cache — try network, then cache the response
      return fetch(event.request)
        .then((response) => {
          // Only cache successful, basic responses (same-origin) and font CDN
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed and nothing in cache — return a basic offline fallback
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
