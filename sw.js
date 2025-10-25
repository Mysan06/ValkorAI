// sw.js — nur lokale Dateien cachen (robust, pages-sicher)
const CACHE = "valkor-static-v1";

// relative Pfade ab der SW-Scope
const REL_ASSETS = [
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// Hilfsfunktion: baut aus REL_ASSETS gültige Pfade unter der SW-Scope
function scopePath(p) {
  // Beispiel: scope = /ValkorAI/  →  /ValkorAI/index.html
  const u = new URL(p, self.registration.scope);
  return u.pathname;
}

self.addEventListener("install", (event) => {
  const urls = REL_ASSETS.map(scopePath);
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(urls))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Fremddomains nie abfangen → CORS-Probleme vermeiden
  if (url.origin !== location.origin) return;

  // Gleich-Origin: Cache-first
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
