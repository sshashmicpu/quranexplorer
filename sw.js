/* Quran Explorer | Service Worker (GitHub Pages Optimized) */

const CACHE_NAME = 'quran-explorer-v2.0'; 
const OFFLINE_URL = 'index.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Nastaliq+Urdu&family=Inter:wght@400;600&display=swap'
];

// 1. Install: Assets ko cache mein save karna
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll ki jagah map istemal kiya taake agar aik file na bhi mile to baki cache ho jayein
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.log('Cache failed for:', url));
        })
      );
    })
  );
});

// 2. Activate: Purane caches saaf karna
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Asli Offline Support
self.addEventListener('fetch', (event) => {
  // Audio files ke liye Network-First strategy (Offline audio sirf tab chalega agar wo cache mein ho)
  if (event.request.url.includes('.mp3')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          return response;
        }).catch(() => null); // Offline audio fail silenty
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Sabse zaruri: Agar page load na ho raha ho to index.html dikhao
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
