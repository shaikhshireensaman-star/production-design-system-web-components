const CACHE_PREFIX = "northstar-demo-";
const CACHE = `${CACHE_PREFIX}v4`;

// Use the actual GitHub Pages project scope
const SHELL_URL = self.registration.scope;

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      try {
        const response = await fetch(SHELL_URL);

        if (response.ok) {
          await cache.put(SHELL_URL, response);
        }
      } catch (error) {
        console.warn("Shell caching failed:", error);
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization") ||
    !url.href.startsWith(self.registration.scope)
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
          const cacheControl =
            response.headers.get("cache-control") ?? "";

          if (!/\b(?:no-store|private)\b/i.test(cacheControl)) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
        }

        return response;
      } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          return (await caches.match(SHELL_URL)) ?? Response.error();
        }

        return Response.error();
      }
    })()
  );
});