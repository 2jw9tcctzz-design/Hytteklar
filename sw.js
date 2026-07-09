/* HytteKlar service worker
   - Siden hentes altid fra nettet først (så nye versioner slår igennem),
     med cachen som fallback offline.
   - Fonte og øvrige filer caches ved første besøg (cache-first).
   Bump CACHE-navnet hvis du vil tvinge en helt frisk cache. */
const CACHE = "hytteklar-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["./"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Selve appen: netværk først, cache offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }

  // Fonte m.m.: cache først, ellers hent og gem
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
    )
  );
});
