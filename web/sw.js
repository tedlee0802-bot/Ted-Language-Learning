// Lingo Daily service worker: makes the site installable and lets the app shell open offline.
// Learning data (/api/*) is never cached, so scores and lessons always come from the server.
const VERSION = "__BUILD_VERSION__";
const CACHE = "lingo-daily-" + VERSION;
const SHELL = [
  "./",
  "index.html",
  "install.html",
  "style.css",
  "homework.css",
  "family.js",
  "app.js",
  "homework.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("lingo-daily-") && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request,
    url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Network first so updates show up right away; fall back to the cached shell when offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined)),
      )
      .then(
        (res) =>
          res ||
          new Response("오프라인입니다.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }),
      ),
  );
});
