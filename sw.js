// sw.js
const CACHE = 'valkor-v1';

// nur lokale Dateien (relative Pfade!) – KEINE externen URLs
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // robust: jede Datei einzeln cachen, Fehler nur loggen
    for (const url of ASSETS) {
      try { await cache.add(url); }
      catch (e) { console.warn('[SW] cache miss:', url, e); }
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => (n === CACHE ? null : caches.delete(n))));
    self.clients.claim();
  })());
});

// Fetch-Strategie: Cache-First für eigene Origin, Netzwerk für extern
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Extern? → nicht abfangen, direkt weiter
  if (url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      return resp;
    } catch (e) {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
