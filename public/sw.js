/**
 * Koino service worker.
 *
 * Koino needs no network once it has loaded — every devotion, theme, and plan ships in the bundle
 * and all personal data lives in localStorage — so a quiet moment on a phone should not depend on
 * signal. This keeps the app openable on a plane, a subway, or a dead spot.
 *
 * Deliberately conservative, because a service worker that pins stale content is worse than none:
 *   - Navigations are network-first, so a deploy is picked up as soon as the network allows and
 *     the cache is only ever a fallback.
 *   - Build assets under /_next/static are content-hashed and therefore immutable, so those are
 *     cache-first.
 *   - Anything else (including cross-origin requests) is left entirely alone.
 * Bumping CACHE drops every older cache on activate.
 */

const CACHE = "koino-v1";
const SHELL = "/app";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      // A failed precache must not block installation; the shell gets cached on first visit.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Store a copy of a good response without letting a cache error fail the request. */
function put(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => (response.ok ? put(request, response) : response))
        .catch(async () => (await caches.match(request)) ?? (await caches.match(SHELL)) ?? Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request).then((response) => (response.ok ? put(request, response) : response))),
    );
  }
});
