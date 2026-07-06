const BASE = '/wisdom-quotes/';
const CACHE = 'wisdom-quotes-v5';
const PRECACHE = [
  BASE,
  `${BASE}index.html`,
  `${BASE}authors/`,
  `${BASE}authors/index.html`,
  `${BASE}settings/`,
  `${BASE}settings/index.html`,
  `${BASE}focus/`,
  `${BASE}focus/index.html`,
  `${BASE}favicon.svg`,
  `${BASE}icon.svg`,
  `${BASE}apple-touch-icon.png`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  `${BASE}manifest.webmanifest`,
  `${BASE}demo-quotes.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  return (request.headers.get('accept') || '').includes('text/html');
}

function isHashedAsset(pathname) {
  return pathname.includes('/_astro/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;

  // Never cache HTML at runtime — ClientRouter needs fresh shells after deploy.
  // Precache above is only used when offline.
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (url.pathname === BASE || url.pathname === `${BASE}index.html`) {
          return caches.match(`${BASE}index.html`);
        }
        if (url.pathname.endsWith('/')) {
          const named = await caches.match(`${url.pathname}index.html`);
          if (named) return named;
        }
        return caches.match(`${BASE}index.html`);
      }),
    );
    return;
  }

  // Hashed build assets are immutable — cache-first is safe.
  if (isHashedAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response.ok || response.type === 'opaque') return response;
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        });
      }),
    );
    return;
  }

  // Icons, manifest, demo data — network-first with cache fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});