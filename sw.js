const CACHE = "valkor-v1";
const ASSETS = [
  "/", "/index.html", "/app.js", "/style.css",
  "/manifest.webmanifest", "/icons/valkor-192.png", "/icons/valkor-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // **nur eigene Origin offline bedienen**
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
  // **keine** Fremd-CDNs abfangen → Browser macht’s selbst (verhindert CORS-Chaos)
});
