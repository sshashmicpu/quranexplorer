/* Quran Explorer | Service Worker 
  Strategy: Cache-First (Offline Optimized)
*/

const CACHE_NAME = 'quran-explorer-v1.2.2'; // Version update kiya hai taake naya cache load ho
const OFFLINE_URL = 'index.html';

// Essential files - Inke shuru se '/' hata diya hai taake GitHub Pages par masla na ho
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Nastaliq+Urdu&family=Inter:wght@400;600&display=swap'
];

// 1. Install: Assets ko cache mein save karna
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets...');
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

// 3. Fetch: Offline Support Logic
self.addEventListener('fetch', (event) => {
  // Audio files (.mp3) ko skip karein kyunki wo bohot bari hoti hain
  if (event.request.url.includes('.mp3')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Agar cache mein file mil jaye to wahi dikhao
      if (cachedResponse) {
        return cachedResponse;
      }

      // Agar cache mein nahi hai, to internet se mangwao
      return fetch(event.request).then((networkResponse) => {
        // Validation: Sirf sahi responses ko cache karein
        // Google Fonts 'cors' type hote hain, isliye basic check ko thora relax kiya hai
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Dynamic caching: Surahs aur baki data ko save karte jao
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Agar internet nahi hai aur navigation request hai (page load ho raha hai)
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
