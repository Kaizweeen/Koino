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
 *   - Anything else (including every cross-origin request) is left entirely alone.
 * Bumping CACHE drops every older cache on activate.
 *
 * The very first page load happens before this worker controls the page, so its stylesheet and
 * fonts never pass through the fetch handler and would otherwise be missing offline. Rather than
 * precache a hard-coded asset list — which would go stale every build, since the filenames are
 * content-hashed — the page reports what it actually loaded (see ServiceWorker.tsx) and the
 * PRECACHE message below stores exactly that.
 */

// v3 moved the Bible under a per-translation path (/bible/web/… rather than /bible/…), so the
// older entries name chapters that no longer exist and the bump is what drops them.
const CACHE = "koino-v3";
const SHELL = "/app";

/**
 * Cache-first paths.
 *
 * /_next/static is content-hashed and therefore immutable. /bible holds the bundled translations,
 * one JSON file per chapter per version: those filenames are not hashed, but the text of a chapter
 * does not change, and caching them is what lets the reader work in the same dead spots the rest
 * of the app already survives. Only the chapters actually opened, in the versions actually read,
 * are ever stored — so the cache grows by the few kilobytes a reader asks for rather than the
 * ~7 MB of any one translation, let alone all of them. Bumping CACHE clears both, which is the
 * escape hatch if the text is ever regenerated.
 */
const isCacheable = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/bible/"));

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

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "PRECACHE" || !Array.isArray(data.urls)) return;

  const urls = data.urls.filter((u) => {
    try {
      return isCacheable(new URL(u, self.location.origin));
    } catch {
      return false;
    }
  });

  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Individually, so one unavailable asset cannot discard the whole batch the way addAll would.
      Promise.all(urls.map((url) => cache.match(url).then((hit) => (hit ? undefined : cache.add(url).catch(() => undefined))))),
    ),
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

  if (isCacheable(url)) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request).then((response) => (response.ok ? put(request, response) : response))),
    );
  }
});
