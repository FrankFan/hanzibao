self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('hanzibao-v1').then((cache) =>
      cache.addAll([
        '/',
        '/index.html',
        '/favicon.svg',
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/apple-touch-icon.png',
      ]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === 'hanzibao-v1' ? undefined : caches.delete(k)))),
    ),
  );
  self.clients.claim();
});

function shouldCache(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/@')) return false;
  if (url.pathname.startsWith('/node_modules')) return false;
  if (url.pathname.startsWith('/src/')) return false;
  return request.method === 'GET';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!shouldCache(req)) return;

  const url = new URL(req.url);
  const isNavigation = req.mode === 'navigate';
  const cacheFirst =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.startsWith('/hw-data/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/icons/');

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open('hanzibao-v1').then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (cacheFirst) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open('hanzibao-v1').then((c) => c.put(req, copy));
          return res;
        });
      }),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open('hanzibao-v1').then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
