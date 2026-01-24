/* Quran Explorer | Service Worker 
  Strategy: Cache-First (Offline Optimized)
*/

const CACHE_NAME = 'quran-explorer-v1.1.0';
const OFFLINE_URL = 'index.html';

// Essential files jo app load hote hi save honi chahiye
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'icon.png',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Nastaliq+Urdu&family=Inter:wght@400;600&display=swap'
];

// 1. Install: Assets ko cache mein save karna
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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

// 3. Fetch: Dynamic Caching (Yehi offline support ka dil hai)
self.addEventListener('fetch', (event) => {
  // Audio files ke liye Network-Only (kyunki wo bari hoti hain)
  if (event.request.url.includes('.mp3')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Agar cache mein mil jaye to wahin se de do (Fastest)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Agar cache mein nahi hai, to network se mangwao
      return fetch(event.request).then((networkResponse) => {
        // Validation: Check if valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 3. Network se milne wala naya data (Surahs/APIs) cache mein save karo
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 4. Agar internet bhi nahi hai aur cache bhi nahi, to offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
