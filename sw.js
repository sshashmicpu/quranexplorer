const CACHE_NAME = 'quran-explorer-final-v1';

// 1. Assets to cache immediately on first load
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  // Yahan agar aapki CSS ya JS files hain toh unka sahi path likhein:
  // './style.css',
  // './app.js'
];

// 2. Install Event - Sab kuch memory mein save karna
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Finalizing Quran Explorer Cache...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 3. Activate Event - Purana kachra saaf karna
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 4. Fetch Event - The "No-Gunjaysh" Strategy
// Ye logic check karta hai: Pehle Cache -> Phir Network -> Phir Save to Cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Agar cache mein hai toh foran dikhao (Super Fast)
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // Network se mil jaye toh cache ko update kar do (Background Update)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Agar net nahi hai aur cache mein bhi nahi, toh home page dikhao
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

      return cachedResponse || networkFetch;
    })
  );
});
