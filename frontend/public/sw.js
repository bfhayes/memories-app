// Memories service worker — network-first for API + navigations, cache-first for static assets.
const CACHE = 'memories-v8';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses (D1 reads must be fresh).
  if (url.pathname.startsWith('/api/')) {
    // ...except immutable R2 image files, which are safe to cache.
    if (url.pathname.startsWith('/api/files/')) {
      event.respondWith(
        caches.open(CACHE).then(async (cache) => {
          const hit = await cache.match(request);
          if (hit) return hit;
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        }),
      );
    }
    return;
  }

  // SPA navigations → network, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html').then((r) => r || fetch('/'))));
    return;
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      const fetched = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fetched;
    }),
  );
});
