const CACHE_NAME = "valkor-v1";
const CACHE_URLS = [
  "/ValkorAI/",
  "/ValkorAI/index.html",
  "/ValkorAI/style.css",
  "/ValkorAI/app.js",
  "/ValkorAI/manifest.webmanifest",
  "/ValkorAI/icons/icon-192.png",
  "/ValkorAI/icons/icon-512.png"
  // WICHTIG: keine /favicon.ico cachen, wenn es sie nicht gibt!
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
