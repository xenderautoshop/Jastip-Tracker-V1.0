// Service worker — Buku Kas Jastip
// Cache-first for the app shell so the app still opens offline.
// Data itself lives in IndexedDB on the device, not in this cache.

const CACHE_NAME = 'buku-kas-jastip-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first for CDN libraries (Chart.js, sql.js, ExcelJS) so they stay up to date when online,
  // falling back to cache when offline (if previously loaded).
  if (req.url.includes('cdnjs.cloudflare.com') || req.url.includes('fonts.googleapis.com') || req.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for the app shell itself.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
