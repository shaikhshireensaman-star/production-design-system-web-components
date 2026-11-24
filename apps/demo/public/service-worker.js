const CACHE_PREFIX = "northstar-demo-";
const CACHE = `${CACHE_PREFIX}v3`;

const BASE_URL = self.location.pathname.replace(/service-worker\.js$/, "");
const SHELL_URL = new URL("./", self.location).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.add(SHELL_URL);
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization")
  ) {
    return;
  }

  const cacheable =
    request.mode === "navigate" ||
    url.pathname.includes("/assets/");

  if (!cacheable) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          const cacheControl = response.headers.get("cache-control") ?? "";

          if (!/\b(?:no-store|private)\b/i.test(cacheControl)) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
        }

        return response;
      } catch {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) return cachedResponse;

        if (request.mode === "navigate") {
          return (await caches.match(SHELL_URL)) ?? Response.error();
        }

        return Response.error();
      }
    })()
  );
});