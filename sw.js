// OSNews · MAY service worker (MAY_PWA_V3 · MAY_EMOCIONES_V1 · HOLOGRAMA_V1)
const C='osnews-may-v6-holograma';const CORE=['./','./index.html','./manifest.webmanifest','./data.json','./translations.json','./assets/may-avatar.jpg','./assets/may-icon-192.png','./assets/may-icon-512.png','./app/','./holograma.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('osnews-may-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin||new URL(r.url).pathname.includes('/asdrubal/'))return;
 e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))))});
