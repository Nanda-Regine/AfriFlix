// AfriFlix Service Worker
// Strategy: Cache-first for static assets, network-first for pages/API

const CACHE_VERSION = 'afriflix-v2-1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGES_CACHE  = `${CACHE_VERSION}-pages`

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/explore',
  '/collabs',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ─── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('afriflix-') && key !== STATIC_CACHE && key !== PAGES_CACHE)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return

  // Skip Next.js internals
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Static public assets: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?|mp3|m3u8)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Pages: stale-while-revalidate for speed on low bandwidth
  event.respondWith(staleWhileRevalidate(request, PAGES_CACHE))
})

// ─── Audio: background play ─────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_AUDIO') {
    const { url } = event.data
    caches.open(STATIC_CACHE).then(cache => cache.add(url).catch(() => {}))
  }
})

// ─── Strategies ──────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached ?? await fetchPromise ?? offlineFallback()
}

function offlineFallback() {
  return caches.match('/offline') ?? new Response(
    '<!doctype html><html><body><h1>You are offline</h1><p>Please reconnect to browse AfriFlix.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
