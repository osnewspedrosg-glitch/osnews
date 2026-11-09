# eva-osnews-entrega (Cloudflare Worker, plan Free)

Intermediario entre la app pública `eva-osnews/` y la rutina de Grok Bot
«Eva OSNews · Entregar expedientes a MAY».

- URL: `https://eva-osnews-entrega.osnews-may.workers.dev/expediente` (POST JSON).
- `GET /` responde `{ ok, configurado }` sin revelar nada.
- Solo acepta el origen `https://osnewspedrosg-glitch.github.io` (CORS), `Content-Type: application/json`, máximo 20 KB.
- Valida id (`eva-…`), título, país, fecha AAAA-MM-DD, descripción, 1–10 URLs http/https.
- Reenvía con `Authorization: Bearer <EVA_WEBHOOK_KEY>` a `EVA_WEBHOOK_URL`. Ambos son **secretos del Worker**; nunca están en el repositorio ni en la página.
- Sin secretos responde 503 controlado («aún no está configurada»).
- Límite antispam (binding gratuito `ratelimit`): 3 envíos/min por cliente y 20/min en total, por ubicación de Cloudflare (aproximado). La rutina admite además 200 ejecuciones/hora.
- No escribe logs (`observability` desactivado, sin `console.log`). La IP solo se usa, con hash, como clave en memoria del limitador; no se guarda.

Pruebas: `node --test workers/eva-osnews-entrega/worker.test.mjs`.

Secretos: `wrangler secret put EVA_WEBHOOK_URL` y `wrangler secret put EVA_WEBHOOK_KEY` (o la API de Cloudflare).
