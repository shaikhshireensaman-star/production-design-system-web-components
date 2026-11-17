const CACHE_PREFIX = "northstar-demo-";
const CACHE = `${CACHE_PREFIX}v2`;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add("/")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.has("authorization")) return;
  const cacheable = request.mode === "navigate" || url.pathname.startsWith("/assets/");
  if (!cacheable) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      const cacheControl = response.headers.get("cache-control") ?? "";
      if (response.ok && response.type === "basic" && !/\b(?:no-store|private)\b/i.test(cacheControl)) {
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())).catch(() => undefined));
      }
      return response;
    } catch {
      return (await caches.match(request)) ?? Response.error();
    }
  })());
});
