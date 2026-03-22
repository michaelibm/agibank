const CACHE = 'emgbank-v1';

const STATIC = [
  '/',
  '/index.html',
  '/EMG.png',
  '/manifest.json',
];

// Install: cache assets estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: API → network-first | assets → cache-first
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Ignora extensões de browser e non-GET
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API → network-first (sem cache)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Assets estáticos → cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
