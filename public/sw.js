// Lift Service Worker — app shell cache for offline fallback

const CACHE_VERSION = 'lift-v1'
const APP_SHELL = ['/login', '/workout', '/history', '/exercises', '/profile']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Ignore cache errors during install — network may be unavailable
      })
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only intercept same-origin navigation requests
  if (event.request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/workout').then((cached) => cached ?? Response.error())
      )
    )
    return
  }

  // For everything else, network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
