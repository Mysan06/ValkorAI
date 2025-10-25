// sw.js — nur lokale Dateien cachen
const CACHE_NAME = "valkor-static-v1";
const LOCAL_ASSETS = [
  "/",                // GitHub Pages leitet oft korrekt auf /ValkorAI/
  "/ValkorAI/",
  "/ValkorAI/index.html",
  "/ValkorAI/style.css",
  "/ValkorAI/app.js",
  "/ValkorAI/manifest.webmanifest",
  "/ValkorAI/icons/icon-192.png",
  "/ValkorAI/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Fremd-Domains NICHT anfassen → direkt ins Netz
  if (url.origin !== location.origin) return;

  // Nur gleiche Origin: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request)
    )
  );
});
