// sw.js  v3  (nur gleiche Origin cachen, externe CDNs durchlassen)
const CACHE_NAME = 'valkor-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // WICHTIG: Fremd-Domains NICHT anfassen (CDNs wie esm.run, jsDelivr, …)
  if (url.origin !== self.location.origin) return;

  // Nur eigene Ressourcen aus Cache bedienen (Stale-While-Revalidate reicht hier)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

