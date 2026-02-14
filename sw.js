const cacheName = 'app-v1.0.4'; // HashPlayer ke liye alag version rakhein
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 1. Install: Files ko foran save karna
self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. Activate: Purana cache clear karna
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch: Asli Ilaj yahan hai!
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(response => {
      // Agar cache mein file mil jaye toh foran wahi dikhao
      if (response) return response;

      // Agar cache mein nahi hai toh network se lo
      return fetch(e.request).then(networkRes => {
        // Network se mil jaye toh usay cache mein save kar lo future ke liye
        return caches.open(cacheName).then(cache => {
          cache.put(e.request, networkRes.clone());
          return networkRes;
        });
      }).catch(() => {
        // AGAR NET NAHI HAI (Offline), TOH ERROR DIKHANE KE BAJAYE INDEX KHOLO
        return caches.match('./index.html');
      });
    })
  );
});
