const CACHE = "eva-osnews-shell-v4-lorena";
const FILES = ["./index.html", "./app.js", "./app.css", "./logic.js", "./may-adapter.js", "./manifest.webmanifest", "./lorena.js", "./lorena-eva.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      return fresh;
    } catch {
      return (await caches.match(event.request)) || (await caches.match("./index.html"));
    }
  })());
});
