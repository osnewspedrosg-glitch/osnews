// OSNews · Asdrúbal service worker (scope /osnews/asdrubal/) · ASDRUBAL_V2 · HOLOGRAMA_V1 · CREADOR_V1 · CHARLA_V1 · MODULO_LORENA_V1
const C='osnews-asdrubal-v7';const CORE=['./','./index.html','./engine.js','./manifest.webmanifest','./asdrubal-avatar.jpg','./icon-192.png','./icon-512.png','./app/','./holograma.js','./creador.js','./charla.js','./lorena.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('osnews-asdrubal-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin||!new URL(r.url).pathname.includes('/asdrubal/'))return;
 e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))))});
