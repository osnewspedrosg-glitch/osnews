const c = 'super-may-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(xs => Promise.all(xs.filter(x => x !== c).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(c).then(cache => cache.put(e.request, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
