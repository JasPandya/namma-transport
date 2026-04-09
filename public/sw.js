// Namma Transport – Service Worker
// Plain service worker (no Workbox) for offline-first PWA support.

const STATIC_CACHE = 'nt-static-v1';
const DYNAMIC_CACHE = 'nt-dynamic-v1';
const MAX_DYNAMIC_ENTRIES = 50;

// App shell files to pre-cache on install.
// Vite injects hashed filenames at build time, so we only pre-cache the
// entry HTML here; hashed assets are cache-first on first fetch.
const APP_SHELL = ['/'];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** True for requests to our own API back-end. */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

/** True for static assets we want to cache aggressively. */
function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot)$/i.test(
    url.pathname,
  );
}

/** True for Google Fonts stylesheets or font files. */
function isGoogleFont(url) {
  return (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  );
}

/** True for an HTML navigation request (e.g. browser address-bar navigation). */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Trim the dynamic cache so it never exceeds MAX_DYNAMIC_ENTRIES.
 * Oldest entries (by insertion order) are evicted first.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    // Recurse until we're under the limit.
    return trimCache(cacheName, maxEntries);
  }
}

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !allowedCaches.has(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch strategies ───────────────────────────────────────────────────────

/**
 * Cache-first: return the cached response if available, otherwise fetch from
 * the network, cache the response, and return it.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network-first: attempt the network; on success cache the response in the
 * dynamic cache (with size limit). On failure fall back to the cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Main fetch listener ────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (POST, PUT, etc.)
  if (request.method !== 'GET') return;

  // 1. API calls → network-first
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2. Google Fonts → cache-first (same as static assets)
  if (isGoogleFont(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3. Static assets (JS/CSS/images/fonts) → cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 4. Navigation requests → network-first, offline fallback to cached shell
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/')),
    );
    return;
  }

  // 5. Everything else → network with optional cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
