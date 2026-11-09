/**
 * Eva OSNews -> MAY relay (Cloudflare Worker, Free plan).
 * Receives one dossier from the public app and forwards it to the Grok Bot
 * routine webhook. The webhook URL and key live only as Worker secrets
 * (EVA_WEBHOOK_URL, EVA_WEBHOOK_KEY); they are never sent to the browser.
 * Nothing is logged: no body, no IP, no headers.
 */
export const ALLOWED_ORIGIN = "https://osnewspedrosg-glitch.github.io";
export const MAX_BYTES = 20 * 1024;
const KINDS = ["hecho", "opinion", "pendiente"];
const STATUSES = ["recibida", "pendiente-contraste", "lista-revision-may"];
const MAX_URLS = 10;

function cors(origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

function reply(origin, status, body) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function line(value, min, max) {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length < min || clean.length > max) return null;
  return clean;
}

function httpUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validate(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["El cuerpo debe ser un objeto JSON."] };
  }
  const id = typeof input.id === "string" && /^eva-[a-z0-9-]{3,60}$/.test(input.id) ? input.id : null;
  if (!id) errors.push("id de expediente no válido.");
  const title = line(input.title, 3, 160);
  if (!title) errors.push("Título no válido (3-160 caracteres).");
  const country = line(input.country, 2, 80);
  if (!country) errors.push("País no válido (2-80 caracteres).");
  const description = line(input.description, 10, 4000);
  if (!description) errors.push("Descripción no válida (10-4000 caracteres).");
  const factDate = typeof input.factDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.factDate)
    && !Number.isNaN(Date.parse(`${input.factDate}T00:00:00Z`)) ? input.factDate : null;
  if (!factDate) errors.push("Fecha no válida (AAAA-MM-DD).");
  const urls = [];
  if (!Array.isArray(input.urls) || input.urls.length < 1 || input.urls.length > MAX_URLS) {
    errors.push(`Hacen falta entre 1 y ${MAX_URLS} URLs.`);
  } else {
    for (const raw of input.urls) {
      const href = httpUrl(raw);
      if (!href) { errors.push("Hay una URL que no es http o https."); break; }
      if (!urls.includes(href)) urls.push(href);
    }
  }
  const kind = KINDS.includes(input.kind) ? input.kind : "pendiente";
  const status = STATUSES.includes(input.status) ? input.status : "recibida";
  if (errors.length) return { ok: false, errors };
  return { ok: true, dossier: { id, title, country, factDate, description, urls, kind, status } };
}

async function readLimited(request) {
  const declared = Number(request.headers.get("Content-Length") || "0");
  if (declared > MAX_BYTES) return { ok: false };
  if (!request.body) return { ok: true, text: "" };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { try { await reader.cancel(); } catch {} return { ok: false }; }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) { all.set(chunk, at); at += chunk.byteLength; }
  return { ok: true, text: new TextDecoder().decode(all) };
}

async function clientKey(request) {
  // Hashed only to use as an in-memory rate-limit key; never stored or logged.
  const ip = request.headers.get("CF-Connecting-IP") || "sin-ip";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`eva-rl:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Second, in-memory layer per Worker instance (the ratelimit binding is approximate).
const memory = new Map();
export function memoryAllow(key, limit, now = Date.now(), windowMs = 60000) {
  const slot = memory.get(key);
  if (!slot || now - slot.start >= windowMs) {
    memory.set(key, { start: now, count: 1 });
    if (memory.size > 5000) memory.clear();
    return true;
  }
  slot.count += 1;
  return slot.count <= limit;
}

async function allowed(env, request) {
  const key = await clientKey(request);
  if (!memoryAllow("global", 20) || !memoryAllow(`c:${key}`, 3)) return false;
  if (env.RL_GLOBAL) {
    const g = await env.RL_GLOBAL.limit({ key: "global" });
    if (!g.success) return false;
  }
  if (env.RL_CLIENT) {
    const c = await env.RL_CLIENT.limit({ key });
    if (!c.success) return false;
  }
  return true;
}

export async function handle(request, env, fetchImpl = fetch) {
  const origin = request.headers.get("Origin") || "";
  const { pathname } = new URL(request.url);

  if (request.method === "GET" && pathname === "/") {
    return reply(origin, 200, {
      ok: true,
      servicio: "eva-osnews-entrega",
      configurado: Boolean(env.EVA_WEBHOOK_URL && env.EVA_WEBHOOK_KEY),
    });
  }
  if (pathname !== "/expediente") return reply(origin, 404, { ok: false, error: "Ruta no encontrada." });
  if (request.method === "OPTIONS") {
    if (origin !== ALLOWED_ORIGIN) return reply(origin, 403, { ok: false, error: "Origen no permitido." });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") return reply(origin, 405, { ok: false, error: "Solo se acepta POST." });
  if (origin !== ALLOWED_ORIGIN) return reply(origin, 403, { ok: false, error: "Origen no permitido." });
  const type = (request.headers.get("Content-Type") || "").toLowerCase();
  if (!type.startsWith("application/json")) return reply(origin, 415, { ok: false, error: "El envío debe ser JSON." });

  if (!(await allowed(env, request))) {
    return reply(origin, 429, { ok: false, error: "Demasiados envíos seguidos. Espera un minuto y vuelve a probar." });
  }

  const body = await readLimited(request);
  if (!body.ok) return reply(origin, 413, { ok: false, error: "El expediente supera 20 KB." });
  let parsed;
  try { parsed = JSON.parse(body.text); } catch { return reply(origin, 400, { ok: false, error: "JSON no válido." }); }
  const checked = validate(parsed);
  if (!checked.ok) return reply(origin, 422, { ok: false, error: checked.errors.join(" ") });

  if (!env.EVA_WEBHOOK_URL || !env.EVA_WEBHOOK_KEY) {
    return reply(origin, 503, { ok: false, error: "La entrega a MAY aún no está configurada. Tu copia local sigue guardada." });
  }

  const payload = {
    fuente: "app-eva-osnews",
    aviso: "Expediente enviado desde la app pública. Fuentes por contrastar. Recibirlo no significa publicarlo; MAY decide tras contrastar.",
    recibidoEn: new Date().toISOString(),
    expediente: checked.dossier,
  };
  let upstream;
  try {
    upstream = await fetchImpl(env.EVA_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.EVA_WEBHOOK_KEY}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return reply(origin, 502, { ok: false, error: "No se pudo contactar con Eva OSNews. Tu copia local sigue guardada." });
  }
  if (upstream.status !== 200) {
    return reply(origin, 502, { ok: false, error: `Eva OSNews no aceptó el envío (código ${upstream.status}). Tu copia local sigue guardada.` });
  }
  return reply(origin, 200, { ok: true, id: checked.dossier.id, mensaje: "Enviado para revisión." });
}

export default {
  fetch(request, env) {
    return handle(request, env);
  },
};
