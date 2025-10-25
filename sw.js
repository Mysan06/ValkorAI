const CACHE = 'valkor-v1';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./manifest.webmanifest'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // WICHTIG: Fremd-Domains NICHT abfangen (CDNs, APIs, Modelle, usw.)
  if (url.origin !== self.location.origin) return;

  // Für eigene Assets normal cachen/liefern
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
