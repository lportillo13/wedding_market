const CACHE_VERSION = "wm-pwa-v2-aae8324d30fa";
const OFFLINE_CACHE = `${CACHE_VERSION}-offline`;
const OFFLINE_ASSETS = ["/offline.html", "/icon.svg"];

// Only two fixed public files. Browser HTTP caching already handles versioned JS/CSS.
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.addAll(OFFLINE_ASSETS.map(path => new Request(path, { credentials: "omit", cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("wm-pwa-") && key !== OFFLINE_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    // Never store rendered pages, accounts, conversation data or navigation responses.
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match("/offline.html", { cacheName: OFFLINE_CACHE })) ?? Response.error()));
  } else if (!url.search && OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname, { cacheName: OFFLINE_CACHE }).then(cached => cached ?? fetch(request)));
  }
});
