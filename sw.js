/* Quran Explorer | Service Worker (Ultimate Offline & Font Fix) */

const CACHE_NAME = 'quran-explorer-v1.6'; // Version update for fresh start
const OFFLINE_URL = './index.html';

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
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.log('Initial cache fail:', url));
        })
      );
    })
  );
});

// 2. Activate: Purana kachra saaf karna
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

// 3. Fetch: Sab kuch offline chalane ke liye
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Agar cache mein mil jaye to foran wahi dikhao
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Agar cache mein nahi hai, to internet se mangwao
      return fetch(event.request).then((networkResponse) => {
        // Validation: Sirf sahi responses ko cache mein dalien
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Font files aur Audio files ko dynamic cache mein save karna
        // 'fonts.gstatic.com' ko handle karna zaruri hai taake Urdu font na bigre
        if (url.includes('.mp3') || url.includes('fonts.gstatic.com') || url.includes('alquran.cloud')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // 3. Bilkul offline hone ki surat mein
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL) || caches.match('./');
        }
      });
    })
  );
});
