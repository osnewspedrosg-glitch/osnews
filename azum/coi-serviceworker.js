/* Adds the isolation headers the WebAssembly motor needs, and keeps a copy of
   the Azum page plus the jsDelivr runtime. The model weights stay in their own
   cache and are not duplicated here. Chat text is not stored or uploaded. */
const SHELL = "azum-shell-v2";

function isolated(response) {
  if (!response || response.status === 0) return response;
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function shouldStore(url, request) {
  if (request.method !== "GET" || request.headers.has("range")) return false;
  if (url.origin === self.location.origin) return url.pathname.includes("/azum/");
  return url.hostname === "cdn.jsdelivr.net";
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const files = [
      "./index.html",
      "./local-ai.js",
      "./local-ai.css",
      "./local-ai-engine.js",
      "./gemini-bridge.js",
      "./gemini-bridge.css",
      "./coi-serviceworker.js",
    ];
    await Promise.all(files.map(async (file) => {
      try {
        await cache.add(new Request(file, { cache: "reload" }));
      } catch {
        /* a missing optional file must not block installation */
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("azum-shell-") && key !== SHELL).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;
  const url = new URL(event.request.url);
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    try {
      const response = await fetch(event.request);
      if (response && response.ok && shouldStore(url, event.request)) {
        await cache.put(event.request, response.clone());
      }
      return isolated(response);
    } catch (error) {
      const cached = (await cache.match(event.request))
        || (event.request.mode === "navigate" ? await cache.match("./index.html") : undefined);
      if (cached) return isolated(cached);
      throw error;
    }
  })());
});
